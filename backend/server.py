import asyncio
import json
import os
import re
import logging
from contextlib import suppress
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from pymongo import ASCENDING, DESCENDING, IndexModel
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

CONTENT_DIR = ROOT_DIR / "content"
ARTICLES_DIR = CONTENT_DIR / "articles"
CATALOG = json.loads((CONTENT_DIR / "catalog.json").read_text())
CATEGORIES = {c["id"]: c["name"] for c in CATALOG["categories"]}
CATALOG_META = {a["slug"]: a for a in CATALOG["articles"]}

INDEXES = {
    "contact_messages": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("created_at", DESCENDING)], name="created_at_desc"),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:
                logging.getLogger(__name__).error("ensure_indexes(%s): %s", collection, exc)


app = FastAPI()
api_router = APIRouter(prefix="/api")


def load_article(slug: str) -> dict | None:
    path = ARTICLES_DIR / f"{slug}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text())


def summary(article: dict) -> dict:
    return {
        "slug": article["slug"],
        "title": article["title"],
        "category": article["category"],
        "category_name": CATEGORIES.get(article["category"], article["category"]),
        "level": article["level"],
        "major": article.get("major", False),
        "excerpt": article["excerpt"],
        "tags": article["tags"],
        "word_count": article["word_count"],
        "read_minutes": max(3, round(article["word_count"] / 200)),
    }


def all_article_files() -> list[dict]:
    out = []
    for path in sorted(ARTICLES_DIR.glob("*.json")):
        try:
            out.append(json.loads(path.read_text()))
        except Exception:
            continue
    return out


@api_router.get("/")
async def root():
    return {"message": "The Saddle Standard API"}


@api_router.get("/categories")
async def get_categories():
    counts = {}
    for a in all_article_files():
        counts[a["category"]] = counts.get(a["category"], 0) + 1
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "target": c["target"],
            "article_count": counts.get(c["id"], 0),
        }
        for c in CATALOG["categories"]
    ]


@api_router.get("/articles")
async def list_articles(
    q: str = Query("", max_length=120),
    category: str = Query("", max_length=60),
    level: str = Query("", max_length=20),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    articles = all_article_files()
    results = []
    query = q.strip().lower()
    for a in articles:
        if category and a["category"] != category:
            continue
        if level and a["level"] != level:
            continue
        if query:
            hay = " ".join(
                [a["title"], a["excerpt"], " ".join(a["tags"]), CATEGORIES.get(a["category"], "")]
            ).lower()
            if query not in hay:
                continue
        results.append(summary(a))
    results.sort(key=lambda x: (x["category"], x["title"]))
    return {"total": len(results), "articles": results[offset : offset + limit]}


@api_router.get("/articles/featured")
async def featured_articles():
    articles = all_article_files()
    majors = [a for a in articles if a.get("major")]
    picked = majors[:6] if len(majors) >= 6 else articles[:6]
    return [summary(a) for a in picked]


@api_router.get("/articles/{slug}")
async def get_article(slug: str):
    if not re.fullmatch(r"[a-z0-9-]+", slug):
        raise HTTPException(status_code=404, detail="Article not found")
    article = load_article(slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    related = [
        summary(a)
        for a in all_article_files()
        if a["category"] == article["category"] and a["slug"] != slug
    ][:4]
    out = dict(article)
    out["category_name"] = CATEGORIES.get(article["category"], article["category"])
    out["read_minutes"] = max(3, round(article["word_count"] / 200))
    out["related"] = related
    return out


@api_router.get("/manifest")
async def get_manifest():
    manifest_path = CONTENT_DIR / "manifest.json"
    if manifest_path.exists():
        return json.loads(manifest_path.read_text())
    counts = {}
    for a in all_article_files():
        counts[a["category"]] = counts.get(a["category"], 0) + 1
    return {
        "total": sum(counts.values()),
        "categories": {
            c["id"]: {"name": c["name"], "target": c["target"], "completed": counts.get(c["id"], 0)}
            for c in CATALOG["categories"]
        },
    }


class ContactMessage(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=200)
    subject: str = Field(min_length=1, max_length=80)
    message: str = Field(min_length=10, max_length=4000)


@api_router.post("/contact")
async def submit_contact(msg: ContactMessage):
    doc = msg.model_dump()
    doc["id"] = f"msg-{datetime.now(timezone.utc).timestamp()}"
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.contact_messages.insert_one(doc)
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def start_index_build():
    app.state.index_task = asyncio.create_task(ensure_indexes())


@app.on_event("shutdown")
async def shutdown_db_client():
    app.state.index_task.cancel()
    with suppress(asyncio.CancelledError):
        await app.state.index_task
    client.close()
