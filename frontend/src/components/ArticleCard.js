import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { LEVEL_LABELS } from "../api";
import { useLang } from "./Header";

export function ArticleCard({ article, dark = false }) {
  const { t } = useLang();
  const base = dark
    ? "bg-[#10272B] text-[#F3EFE6] border-[#AC8B59]/25 hover:border-[#AC8B59]"
    : "bg-[#FAF9F6] text-[#252B2D] border-[#252B2D]/12 hover:border-[#AC8B59]";
  return (
    <Link
      to={`/articles/${article.slug}`}
      data-testid={`article-card-${article.slug}`}
      className={`group border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md ${base}`}
    >
      <div>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="font-ui text-[10px] uppercase tracking-[0.18em] font-semibold text-[#AC8B59]">
            {article.category_name}
          </span>
          <span className={`font-ui text-[10px] uppercase tracking-wider ${dark ? "text-[#F3EFE6]/50" : "text-[#252B2D]/45"}`}>
            {LEVEL_LABELS[article.level] || article.level}
          </span>
        </div>
        <h3 className={`font-editorial text-lg leading-snug font-semibold group-hover:text-[#AC8B59] transition-colors ${dark ? "text-[#F3EFE6]" : "text-[#10272B]"}`}>
          {article.title}
        </h3>
        <p className={`mt-3 text-sm leading-relaxed ${dark ? "text-[#F3EFE6]/65" : "text-[#252B2D]/65"}`}>
          {article.excerpt}
        </p>
      </div>
      <div className="flex items-center justify-between mt-5">
        <span className={`font-ui text-xs inline-flex items-center gap-1.5 ${dark ? "text-[#F3EFE6]/50" : "text-[#252B2D]/45"}`}>
          <Clock size={12} /> {article.read_minutes} {t.minRead}
        </span>
        <span className="font-ui text-xs font-semibold tracking-wide text-[#AC8B59] group-hover:underline">
          {t.readGuide} →
        </span>
      </div>
    </Link>
  );
}

export function SectionHeader({ eyebrow, title, text, dark = false }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className={`font-title text-3xl sm:text-4xl font-semibold tracking-tight ${dark ? "text-[#F3EFE6]" : "text-[#10272B]"}`}>
        {title}
      </h2>
      {text && <p className={`mt-4 leading-relaxed ${dark ? "text-[#F3EFE6]/70" : "text-[#252B2D]/70"}`}>{text}</p>}
      <div className="gold-rule mt-5" />
    </div>
  );
}
