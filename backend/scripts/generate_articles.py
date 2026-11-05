import asyncio
import json
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

KEY = os.environ["EMERGENT_LLM_KEY"]
CONTENT = ROOT / "content"
ARTICLES_DIR = CONTENT / "articles"
ARTICLES_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = CONTENT / "generation.log"

CATALOG = json.loads((CONTENT / "catalog.json").read_text())
CATEGORIES = {c["id"]: c["name"] for c in CATALOG["categories"]}

MODEL = ("openai", "gpt-5.4-mini")
CONCURRENCY = 2
REQUEST_SPACING = 3.0

SYSTEM = """You are a senior technical writer for The Saddle Standard, a serious European saddlery education publication. You write precise, trustworthy, educational long-form articles about English saddles for horse owners, riders, saddle fitters and saddlery students.

Editorial rules you must follow:
- Tone: professional, technically informed, approachable. No marketing language, no hype.
- Accuracy: never invent research findings, statistics, DOIs, study results, brand claims or veterinary conclusions. Where evidence is limited or contested, say so plainly. Distinguish published research from industry practice and tradition.
- Welfare: make clear where relevant that saddle fit cannot be guaranteed from an article, and that signs of pain, lameness or back problems require a qualified veterinarian or professional saddle fitter.
- Terminology: use correct saddlery and anatomical terminology, and explain each technical term simply the first time it appears.
- British English spelling.
- Do not mention any specific saddle brand. Do not mention The Saddle Standard or its sponsor inside the article body.
- Practical value: include concrete examples, checkpoints and recommendations a rider can act on.
"""

PROMPT = """Write the complete article below for The Saddle Standard knowledge library.

TITLE: {title}
DEPARTMENT: {category}
READER LEVEL: {level}
TARGET LENGTH: {words}

Return ONLY valid JSON (no markdown fences, no commentary) with exactly this shape:
{{
  "excerpt": "2-3 sentence summary of the article, max 60 words",
  "sections": [
    {{"heading": "Section heading", "paragraphs": ["paragraph text", "..."]}}
  ],
  "key_takeaways": ["4-6 short bullet takeaways"],
  "further_reading": [
    {{"label": "Name of a real, verifiable resource (organisation, book or guidance body, e.g. Society of Master Saddlers guidance, a well-known equine veterinary textbook, FEI or national federation guidance)", "note": "One sentence on what it covers"}}
  ],
  "tags": ["4-7 lowercase topical tags"]
}}

Article requirements:
- Begin with an "Introduction" section (no heading text other than "Introduction") of 2 paragraphs.
- Then 5-8 further sections with meaningful, non-generic headings covering: beginner-friendly explanation of the core concepts, technical detail and terminology, practical assessment or application steps, common mistakes or misconceptions, limitations and safety considerations.
- Plain text paragraphs only: no markdown, no bullet lists inside paragraphs, no headings inside paragraphs.
- Total body length (all paragraphs combined) must be at least {min_words} words. This is mandatory.
- further_reading: 3-5 entries. Only name resources you are confident genuinely exist. Do not fabricate specific paper titles, authors, years, DOIs or URLs.
"""


def extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text.strip())
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no JSON object found")
    return json.loads(text[start : end + 1])


def body_word_count(data: dict) -> int:
    return sum(
        len(p.split())
        for s in data.get("sections", [])
        for p in s.get("paragraphs", [])
    )


def validate(data: dict, min_words: int) -> None:
    assert isinstance(data.get("excerpt"), str) and len(data["excerpt"]) > 40
    sections = data.get("sections")
    assert isinstance(sections, list) and len(sections) >= 5
    for s in sections:
        assert isinstance(s.get("heading"), str)
        assert isinstance(s.get("paragraphs"), list) and len(s["paragraphs"]) >= 1
        assert all(isinstance(p, str) and len(p) > 60 for p in s["paragraphs"])
    assert isinstance(data.get("key_takeaways"), list) and len(data["key_takeaways"]) >= 3
    assert isinstance(data.get("further_reading"), list) and len(data["further_reading"]) >= 2
    assert isinstance(data.get("tags"), list) and len(data["tags"]) >= 3
    wc = body_word_count(data)
    assert wc >= min_words, f"body too short: {wc} < {min_words}"


def log(msg: str) -> None:
    line = f"{time.strftime('%H:%M:%S')} {msg}"
    print(line, flush=True)
    with LOG_FILE.open("a") as f:
        f.write(line + "\n")


async def generate(sem: asyncio.Semaphore, entry: dict) -> str:
    slug = entry["slug"]
    out = ARTICLES_DIR / f"{slug}.json"
    if out.exists():
        return "skip"
    major = entry.get("major", False)
    words = "1,500-2,200 words" if major else "950-1,350 words"
    min_words = 1350 if major else 850
    prompt = PROMPT.format(
        title=entry["title"],
        category=CATEGORIES[entry["category"]],
        level=entry["level"],
        words=words,
        min_words=min_words,
    )
    async with sem:
        await asyncio.sleep(REQUEST_SPACING)
        for attempt in range(10):
            try:
                chat = LlmChat(
                    api_key=KEY,
                    session_id=f"saddle-{slug}-{attempt}",
                    system_message=SYSTEM,
                ).with_model(*MODEL)
                resp = await chat.send_message(UserMessage(text=prompt))
                data = extract_json(resp)
                validate(data, min_words)
                article = {
                    "slug": slug,
                    "title": entry["title"],
                    "category": entry["category"],
                    "level": entry["level"],
                    "major": major,
                    "excerpt": data["excerpt"].strip(),
                    "sections": [
                        {"heading": s["heading"].strip(), "paragraphs": [p.strip() for p in s["paragraphs"]]}
                        for s in data["sections"]
                    ],
                    "key_takeaways": [t.strip() for t in data["key_takeaways"]],
                    "further_reading": [
                        {"label": r["label"].strip(), "note": r["note"].strip()}
                        for r in data["further_reading"]
                    ],
                    "tags": [t.strip().lower() for t in data["tags"]],
                    "word_count": body_word_count(data),
                }
                out.write_text(json.dumps(article, ensure_ascii=False, indent=1))
                log(f"OK {slug} words={article['word_count']}")
                return "ok"
            except Exception as exc:  # noqa: BLE001
                log(f"RETRY {slug} attempt={attempt + 1} err={type(exc).__name__}: {str(exc)[:160]}")
                await asyncio.sleep(min(90, 15 * (attempt + 1)))
        log(f"FAIL {slug}")
        return "fail"


async def main() -> None:
    sem = asyncio.Semaphore(CONCURRENCY)
    results = await asyncio.gather(*(generate(sem, e) for e in CATALOG["articles"]))
    ok = results.count("ok")
    skip = results.count("skip")
    fail = results.count("fail")
    manifest = {}
    for c in CATALOG["categories"]:
        cid = c["id"]
        done = sum(1 for e in CATALOG["articles"] if e["category"] == cid and (ARTICLES_DIR / f"{e['slug']}.json").exists())
        manifest[cid] = {"name": c["name"], "target": c["target"], "completed": done}
    total = sum(m["completed"] for m in manifest.values())
    (CONTENT / "manifest.json").write_text(json.dumps({"total": total, "categories": manifest}, indent=1))
    log(f"DONE ok={ok} skip={skip} fail={fail} total_files={total}")


if __name__ == "__main__":
    asyncio.run(main())
