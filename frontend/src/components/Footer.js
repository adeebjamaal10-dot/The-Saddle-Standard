import { Link } from "react-router-dom";
import { useLang } from "./Header";
import { SORENTA_URL } from "../images";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-[#10272B] text-[#F3EFE6] mt-24" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <p className="font-title text-2xl font-semibold">
              THE SADDLE <span className="text-[#AC8B59]">STANDARD</span>
            </p>
            <p className="font-ui text-xs tracking-[0.2em] uppercase text-[#AC8B59]/80 mt-2">
              "A Better Saddle Begins With Better Understanding."
            </p>
            <p className="mt-5 text-sm leading-relaxed text-[#F3EFE6]/70 max-w-md">
              {t.sponsorDisclosure} Educational content on saddle quality, fitting, craftsmanship and equine biomechanics —
              understanding the craft, exploring the science, protecting the horse.
            </p>
            <a
              href={SORENTA_URL}
              target="_blank"
              rel="noopener noreferrer sponsored"
              data-testid="footer-sorenta-link"
              className="inline-flex items-center gap-2 mt-5 font-ui text-xs font-semibold tracking-wide text-[#AC8B59] border border-[#AC8B59]/40 px-4 py-2.5 hover:bg-[#AC8B59]/10 transition-colors"
            >
              {t.exploreSorenta} →
            </a>
          </div>
          <div>
            <p className="eyebrow mb-4">Library</p>
            <ul className="space-y-2.5 font-ui text-sm text-[#F3EFE6]/70">
              <li><Link to="/library" className="hover:text-[#AC8B59] transition-colors" data-testid="footer-library">Knowledge Library</Link></li>
              <li><Link to="/inside-the-saddle" className="hover:text-[#AC8B59] transition-colors" data-testid="footer-inside">Inside the Saddle</Link></li>
              <li><Link to="/buyers-handbook" className="hover:text-[#AC8B59] transition-colors" data-testid="footer-handbook">Saddle Buyer's Handbook</Link></li>
              <li><Link to="/saddle-quality-explained" className="hover:text-[#AC8B59] transition-colors" data-testid="footer-quality">Saddle Quality Explained</Link></li>
              <li><Link to="/partners/sorenta-saddlery" className="hover:text-[#AC8B59] transition-colors" data-testid="footer-partner">Sorenta Saddlery Partnership</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4">Publication</p>
            <ul className="space-y-2.5 font-ui text-sm text-[#F3EFE6]/70">
              <li><Link to="/about" className="hover:text-[#AC8B59] transition-colors" data-testid="footer-about">About The Saddle Standard</Link></li>
              <li><Link to="/editorial-standards" className="hover:text-[#AC8B59] transition-colors" data-testid="footer-editorial">Editorial Standards</Link></li>
              <li><Link to="/contact" className="hover:text-[#AC8B59] transition-colors" data-testid="footer-contact">Contact</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-[#AC8B59] transition-colors" data-testid="footer-privacy">Privacy Policy</Link></li>
              <li><Link to="/terms-of-use" className="hover:text-[#AC8B59] transition-colors" data-testid="footer-terms">Terms of Use</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#AC8B59]/20 mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-3">
          <p className="font-ui text-xs text-[#F3EFE6]/50">© {new Date().getFullYear()} The Saddle Standard. Educational content; not veterinary advice.</p>
          <p className="font-ui text-xs text-[#F3EFE6]/50">
            Founding Sponsor & Saddlery Knowledge Partner:{" "}
            <a href={SORENTA_URL} target="_blank" rel="noopener noreferrer sponsored" className="text-[#AC8B59] hover:underline" data-testid="footer-sponsor-disclosure">
              Sorenta Saddlery
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
