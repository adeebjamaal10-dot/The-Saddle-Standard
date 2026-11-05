import { useState, createContext, useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Menu, X, Globe } from "lucide-react";
import { UI, LANGS } from "../i18n";

const LangContext = createContext({ lang: "en", setLang: () => {}, t: UI.en });
export const useLang = () => useContext(LangContext);
export const LangProvider = LangContext.Provider;

export function Header() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const links = [
    { to: "/library", label: t.library, id: "nav-library" },
    { to: "/inside-the-saddle", label: t.inside, id: "nav-inside" },
    { to: "/buyers-handbook", label: t.handbook, id: "nav-handbook" },
    { to: "/saddle-quality-explained", label: t.quality, id: "nav-quality" },
    { to: "/partners/sorenta-saddlery", label: t.partner, id: "nav-partner" },
    { to: "/about", label: t.about, id: "nav-about" },
  ];

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/library?q=${encodeURIComponent(q.trim())}` : "/library");
    setOpen(false);
  };

  return (
    <header className="bg-[#10272B] text-[#F3EFE6] sticky top-0 z-50 border-b border-[#AC8B59]/30" data-testid="site-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <Link to="/" className="flex flex-col leading-none shrink-0" data-testid="brand-logo">
            <span className="font-title text-xl sm:text-2xl font-semibold tracking-wide text-[#F3EFE6]">
              THE SADDLE <span className="text-[#AC8B59]">STANDARD</span>
            </span>
            <span className="font-ui text-[10px] tracking-[0.22em] uppercase text-[#AC8B59]/90 mt-1 hidden sm:block">
              The International Guide to Saddle Quality, Fitting & Craftsmanship
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" data-testid="main-nav">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                data-testid={l.id}
                className={({ isActive }) =>
                  `font-ui text-[13px] font-medium px-3 py-2 tracking-wide transition-colors ${
                    isActive ? "text-[#AC8B59]" : "text-[#F3EFE6]/80 hover:text-[#F3EFE6]"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <form onSubmit={submitSearch} className="hidden md:flex items-center" data-testid="header-search-form">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.searchPlaceholder}
                data-testid="header-search-input"
                className="font-ui text-xs bg-[#F3EFE6]/10 border border-[#AC8B59]/30 text-[#F3EFE6] placeholder:text-[#F3EFE6]/40 px-3 py-2 w-44 lg:w-56 focus:outline-none focus:border-[#AC8B59]"
              />
              <button type="submit" data-testid="header-search-button" className="p-2 text-[#AC8B59] hover:text-[#F3EFE6] transition-colors" aria-label="Search">
                <Search size={16} />
              </button>
            </form>

            <div className="hidden sm:flex items-center gap-1 border border-[#AC8B59]/30 px-1 py-1" data-testid="language-switcher">
              <Globe size={13} className="text-[#AC8B59] mx-1" />
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  data-testid={`lang-${l.code}`}
                  className={`font-ui text-[11px] font-semibold px-2 py-1 transition-colors ${
                    lang === l.code ? "bg-[#AC8B59] text-[#10272B]" : "text-[#F3EFE6]/60 hover:text-[#F3EFE6]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button className="lg:hidden p-2 text-[#F3EFE6]" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle" aria-label="Menu">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden pb-5 border-t border-[#AC8B59]/20 pt-3" data-testid="mobile-menu">
            <form onSubmit={submitSearch} className="flex items-center mb-3 md:hidden">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.searchPlaceholder}
                data-testid="mobile-search-input"
                className="font-ui text-sm flex-1 bg-[#F3EFE6]/10 border border-[#AC8B59]/30 text-[#F3EFE6] placeholder:text-[#F3EFE6]/40 px-3 py-2 focus:outline-none"
              />
              <button type="submit" data-testid="mobile-search-button" className="p-2 text-[#AC8B59]" aria-label="Search">
                <Search size={18} />
              </button>
            </form>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                data-testid={`mobile-${l.id}`}
                className="block font-ui text-sm py-2.5 text-[#F3EFE6]/85 border-b border-[#F3EFE6]/10"
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex items-center gap-1 mt-3">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  data-testid={`mobile-lang-${l.code}`}
                  className={`font-ui text-xs font-semibold px-3 py-1.5 border ${
                    lang === l.code ? "bg-[#AC8B59] text-[#10272B] border-[#AC8B59]" : "text-[#F3EFE6]/70 border-[#AC8B59]/30"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
