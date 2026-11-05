import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/App.css";
import { Header, LangProvider } from "./components/Header";
import { Footer as SiteFooter } from "./components/Footer";
import { UI } from "./i18n";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Library from "./pages/Library";
import ArticlePage from "./pages/ArticlePage";
import InsideTheSaddle from "./pages/InsideTheSaddle";
import BuyersHandbook from "./pages/BuyersHandbook";
import QualityExplained from "./pages/QualityExplained";
import SorentaPartner from "./pages/SorentaPartner";
import { About, EditorialStandards, Contact, PrivacyPolicy, TermsOfUse, NotFound } from "./pages/StaticPages";

function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("ss-lang") || "en");
  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem("ss-lang", l);
  };

  return (
    <LangProvider value={{ lang, setLang: changeLang, t: UI[lang] || UI.en }}>
      <BrowserRouter>
        <div className="App min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<Library />} />
              <Route path="/articles/:slug" element={<ArticlePage />} />
              <Route path="/inside-the-saddle" element={<InsideTheSaddle />} />
              <Route path="/buyers-handbook" element={<BuyersHandbook />} />
              <Route path="/saddle-quality-explained" element={<QualityExplained />} />
              <Route path="/partners/sorenta-saddlery" element={<SorentaPartner />} />
              <Route path="/about" element={<About />} />
              <Route path="/editorial-standards" element={<EditorialStandards />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <SiteFooter />
          <Toaster position="bottom-right" />
        </div>
      </BrowserRouter>
    </LangProvider>
  );
}

export default App;
