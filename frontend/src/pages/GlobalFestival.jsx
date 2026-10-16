import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Globe2,
  Calendar,
  Share2,
  Twitter,
  Linkedin,
  Mail,
  ChevronDown,
  ChevronUp,
  MapPin,
 
  Compass,
  KeyRound,
  Eye,
  Rocket
} from "lucide-react";
import { Reveal } from "@/components/motion";
import { useLang } from "@/lib/i18n";
import { toast } from "sonner";

// Photo assets matching the reference magazine editorial
const FESTIVAL_ASSETS = {
  // Dramatic high-contrast portrait for header right
  heroPortrait: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
  // Wide landscape photo matching the reference image 2 (red sweater landscape block)
  landscapePhoto: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
  // Event card 1 (Nairobi)
  nairobiCard: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80",
  // Event card 2 (Paris)
  parisCard: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80"
};

const GlobalFestival = () => {
  const { lang, t } = useLang();
  const isEn = lang === "en";
  const isAr = lang === "ar";
  const isFr = lang === "fr";

  // Accordion state for "Article Sources / Spaces & Roadmap" (matching reference image 2)
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleShareQuote = () => {
    const text = isEn
      ? "« CAP Entrepreneurs connects people, skills, technology and opportunities to build inclusive, accessible and sustainable digital economies. » - CAP Entrepreneurs"
      : isAr
        ? "« تربط كاب رواد الأعمال بين الأفراد والمهارات والتكنولوجيا والفرص لبناء اقتصادات رقمية شاملة ومستدامة. » - كاب رواد الأعمال"
        : "« CAP Entrepreneurs connecte les individus, les compétences, les technologies et les opportunités pour bâtir des économies numériques inclusives, accessibles et durables. » - CAP Entrepreneurs";

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(isEn ? "Quote copied to clipboard!" : isAr ? "تم نسخ الاقتباس إلى الحافظة!" : "Citation copiée dans le presse-papiers !");
    }
  };

  return (
    <div data-testid="festival-page" className="min-h-screen bg-white text-[#0D0E0D] font-sans selection:bg-maple selection:text-white">

      {/* 1. EDITORIAL HEADER (Matching reference image: la- script, multiline serif title, high-contrast portrait) */}
      <header className="border-b border-[#0D0E0D]/10 bg-white pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 md:px-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 items-center">

            {/* LEFT: SCRIPT WATERMARK + MULTILINE SERIF TITLE + EDITION (7 cols) */}
            <div className="lg:col-span-7">
              <Reveal>
                {/* Script watermark logo & category tag (matching 'la- FASHION' in reference) */}
                <div className="mb-4">
                  <span className="font-script text-4xl sm:text-5xl text-[#0D0E0D] block leading-none font-normal">
                    la-
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.35em] text-maple font-montserrat block mt-1">
                    {isEn ? "GLOBAL FESTIVAL & BRAND MANIFESTO" : isAr ? "المهرجان العالمي وبيان المهمة" : "FESTIVAL MONDIAL & MANIFESTE DE MARQUE"}
                  </span>
                </div>

                {/* Massive Multiline Serif Headline */}
                <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[84px] font-normal leading-[1.02] text-[#0D0E0D] tracking-tight">
                  {isEn ? (
                    <>
                      Opening New<br />
                      Horizons.<br />
                      Global Ambition
                    </>
                  ) : (
                    <>
                      Ouvrir de<br />
                      Nouveaux<br />
                      Horizons
                    </>
                  )}
                </h1>

                {/* Edition tag / date matching reference */}
                <div className="mt-6 flex items-center gap-4 text-xs font-montserrat tracking-[0.2em] uppercase text-sage">
                  <span>{isEn ? "EDITION 2026-2027" : isAr ? "نسخة 2026-2027" : "ÉDITION 2026-2027"}</span>
                  <span className="h-1 w-1 rounded-full bg-sage" />
                  <span>NAIROBI 2027</span>
                  <span className="h-1 w-1 rounded-full bg-sage" />
                  <span>CAP ENTREPRENEURS</span>
                </div>

                {/* Quick Anchor Link */}
                <div className="mt-8">
                  <button
                    onClick={() => scrollToSection("sommaire-section")}
                    className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:text-maple transition-colors"
                  >
                    <span>{isEn ? "Explore the manifesto" : isAr ? "استكشف البيان" : "Découvrir le manifeste"}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </Reveal>
            </div>

            {/* RIGHT: DRAMATIC HIGH-CONTRAST PORTRAIT (5 cols) */}
            <div className="lg:col-span-5">
              <Reveal delay={0.2}>
                <div className="relative mx-auto max-w-[440px] lg:max-w-none overflow-hidden bg-black shadow-lg">
                  <img
                    src={FESTIVAL_ASSETS.heroPortrait}
                    alt="CAP Entrepreneurs - Opening New Horizons"
                    className="aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] w-full object-cover filter grayscale contrast-125 transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </Reveal>
            </div>

          </div>
        </div>
      </header>

      {/* 2. MAIN READING FLOW WITH STICKY TABLE OF CONTENTS (Matching reference image) */}
      <main id="sommaire-section" className="mx-auto max-w-[1360px] px-5 sm:px-8 md:px-12 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">

          {/* LEFT: "IN THIS ARTICLE-" / SOMMAIRE FLOATING CARD (3 cols) */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-28 space-y-6">

              {/* Sommaire Card */}
              <div className="bg-[#FAF9F6] border border-[#0D0E0D]/10 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#0D0E0D]/10 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#0D0E0D] font-montserrat">
                    {isFr ? "DANS CET ARTICLE" : isAr ? "في هذا المقال" : "IN THIS ARTICLE"}
                  </span>
                  <span className="text-xs font-mono text-sage">-</span>
                </div>

                <ol className="space-y-2.5 text-xs">
                  {[
                    { num: "1", title: isEn ? "Brand Promise" : "Promesse de Marque", id: "brand-promise" },
                    { num: "2", title: isEn ? "Signal Seekers (North)" : "Capteurs de Signaux (Nord)", id: "signal-seekers" },
                    { num: "3", title: isEn ? "Door Openers (South)" : "Ouvreurs de Portes (Sud)", id: "door-openers" },
                    { num: "4", title: isEn ? "Core Message" : "Message Fondateur", id: "core-message" },
                    { num: "5", title: isEn ? "Windows of CAP" : "Les Fenêtres de CAP", id: "windows-of-cap" },
                    { num: "6", title: isEn ? "The Next CAP" : "Le Prochain CAP", id: "next-cap" },
                    { num: "7", title: isEn ? "Our Voice" : "Notre Voix", id: "our-voice" },
                    { num: "8", title: isEn ? "Our Signature" : "Notre Signature", id: "our-signature" },
                    { num: "9", title: isEn ? "Festival Spaces" : "Espaces du Festival", id: "article-sources" },
                    { num: "10", title: isEn ? "Initiatives" : "Initiatives Clés", id: "recommended-gatherings" }
                  ].map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollToSection(item.id)}
                        className="text-left font-serif text-[13px] text-sage hover:text-maple hover:underline transition-colors block leading-snug"
                      >
                        <span className="font-sans font-bold text-[11px] text-[#0D0E0D] mr-2">
                          {item.num}.
                        </span>
                        {item.title}
                      </button>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Share links matching reference */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-sage/80 font-montserrat block mb-2">
                  SHARE
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href="https://twitter.com/intent/tweet?text=CAP%20Entrepreneurs%20-%20Opening%20New%20Horizons.%20Our%20roots%20are%20Canadian.%20Our%20ambition%20is%20global."
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center border border-[#0D0E0D]/10 text-sage hover:text-maple hover:border-maple transition-colors"
                  >
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="https://www.linkedin.com/sharing/share-offsite/?url=https://capentrepreneurs.org/global-festival"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center border border-[#0D0E0D]/10 text-sage hover:text-maple hover:border-maple transition-colors"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="mailto:?subject=CAP%20Entrepreneurs%20-%20Global%20Festival&body=https://capentrepreneurs.org/global-festival"
                    className="flex h-8 w-8 items-center justify-center border border-[#0D0E0D]/10 text-sage hover:text-maple hover:border-maple transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

            </div>
          </aside>

          {/* RIGHT: EDITORIAL READING FLOW WITH DROP CAP (9 cols) */}
          <div className="lg:col-span-9 space-y-16">

            {/* DROP CAP INTRODUCTORY PARAGRAPH: OUR BRAND PROMISE */}
            <article id="brand-promise" className="scroll-mt-28 border-b border-[#0D0E0D]/10 pb-12">
              <Reveal>
                <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block mb-1">
                    {isEn ? "OUR BRAND PROMISE" : "NOTRE PROMESSE DE MARQUE"}
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#0D0E0D]">
                    {isEn ? "Opening New Horizons." : "Ouvrir de Nouveaux Horizons."}
                  </h2>
                </div>

                <div className="text-base sm:text-lg leading-[1.85] text-[#2D312E] font-serif">
                  <span className="drop-cap-editorial select-none">
                    C
                  </span>
                  {isEn ? (
                    <>
                      <strong>AP Entrepreneurs- Opening New Horizons.</strong> Our roots are Canadian. Our ambition is global. We bring together individuals, communities and organizations to build inclusive, accessible and sustainable digital economies. From grassroots experimentation in Montreal to high-level international mobilization in Nairobi, we build bridges between foresight and impactful action.
                    </>
                  ) : (
                    <>
                      <strong>AP Entrepreneurs- Ouvrir de Nouveaux Horizons.</strong> Nos racines sont canadiennes. Notre ambition est mondiale. Nous rassemblons individus, communautés et organisations pour bâtir des économies numériques inclusives, accessibles et durables. De l'expérimentation de terrain à Montréal jusqu'à la mobilisation internationale à Nairobi, nous créons des passerelles entre vision et action concrète.
                    </>
                  )}
                </div>
              </Reveal>
            </article>

            {/* HORIZONTAL LANDSCAPE PHOTO BLOCK (Matching reference image 2: tomato soup sweatshirt photo) */}
            <div className="overflow-hidden bg-[#FAF9F6] border border-[#0D0E0D]/10 shadow-sm">
              <Reveal>
                <img
                  src={FESTIVAL_ASSETS.landscapePhoto}
                  alt="CAP Global Community & Festival"
                  className="aspect-[16/9] w-full object-cover transition-transform duration-700 hover:scale-102"
                />
                <div className="p-4 bg-white border-t border-[#0D0E0D]/10 text-center">
                  <p className="font-serif italic text-xs sm:text-sm text-sage">
                    {isEn
                      ? "© CAP Global Festival- Connecting thinkers, creators, and community builders across borders."
                      : "© CAP Global Festival- Connecter penseurs, créateurs et bâtisseurs par-delà les frontières."}
                  </p>
                </div>
              </Reveal>
            </div>

            {/* SECTION: OUR COMMUNITY- THE SIGNAL SEEKERS | NORTH */}
            <article id="signal-seekers" className="scroll-mt-28 space-y-5">
              <Reveal>
                <div className="border-b border-[#0D0E0D]/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block mb-1">
                    {isEn ? "OUR COMMUNITY • ROLE 01" : "NOTRE COMMUNAUTÉ • RÔLE 01"}
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#0D0E0D]">
                    {isEn ? "The Signal Seekers | North" : "Les Capteurs de Signaux | Nord"}
                  </h2>
                  <p className="mt-2 font-serif italic text-lg sm:text-xl text-[#0D0E0D]">
                    {isEn ? "Spot the signals. See what's next." : "Capter les signaux. Anticiper l'avenir."}
                  </p>
                </div>

                <p className="font-sans text-sm sm:text-base text-sage leading-relaxed">
                  {isEn
                    ? "The observers, researchers, technologists and entrepreneurs who identify trends, emerging needs and new possibilities. They explore territories, monitor technological shifts, identify systemic challenges, and formulate early questions that illuminate the path ahead."
                    : "Les observateurs, chercheurs, technologues et entrepreneurs qui identifient les tendances, les besoins émergents et les nouvelles possibilités. Ils arpentent les territoires, décryptent les mutations technologiques et posent les premières questions qui éclairent la route."}
                </p>

                <div className="bg-[#FAF9F6] border border-[#0D0E0D]/10 p-5 mt-4">
                  <div className="flex items-center gap-3 text-xs font-montserrat font-bold uppercase tracking-wider text-[#0D0E0D] mb-2">
                    <Compass className="h-4 w-4 text-maple" />
                    <span>{isEn ? "Key Capabilities" : "Forces & Contributions"}</span>
                  </div>
                  <ul className="grid sm:grid-cols-2 gap-2 text-xs text-sage font-sans">
                    <li className="flex items-center gap-2">• {isEn ? "Trend forecasting & sensing" : "Veille prospective & tendances"}</li>
                    <li className="flex items-center gap-2">• {isEn ? "Tech exploration & open labs" : "Exploration technologique & labos ouverts"}</li>
                    <li className="flex items-center gap-2">• {isEn ? "Ecosystem diagnostics" : "Diagnostics d'écosystèmes"}</li>
                    <li className="flex items-center gap-2">• {isEn ? "Academic & research bridges" : "Passerelles recherche & terrain"}</li>
                  </ul>
                </div>
              </Reveal>
            </article>

            {/* SECTION: THE DOOR OPENERS | SOUTH */}
            <article id="door-openers" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#0D0E0D]/10">
              <Reveal>
                <div className="border-b border-[#0D0E0D]/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block mb-1">
                    {isEn ? "OUR COMMUNITY • ROLE 02" : "NOTRE COMMUNAUTÉ • RÔLE 02"}
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#0D0E0D]">
                    {isEn ? "The Door Openers | South" : "Les Ouvreurs de Portes | Sud"}
                  </h2>
                  <p className="mt-2 font-serif italic text-lg sm:text-xl text-[#0D0E0D]">
                    {isEn ? "Build connections. Create possibilities." : "Tisser des liens. Créer des possibilités."}
                  </p>
                </div>

                <p className="font-sans text-sm sm:text-base text-sage leading-relaxed">
                  {isEn
                    ? "The connectors, community builders, entrepreneurs and partners who turn insights into relationships and opportunities. They open institutional doors, foster trust, anchor projects in local realities, and translate conceptual visions into viable economic models."
                    : "Les connecteurs, bâtisseurs de communautés, entrepreneurs et partenaires qui transforment les intuitions en relations et en opportunités. Ils ouvrent des portes institutionnelles, créent la confiance, ancrent les initiatives dans le réel et pérennisent les modèles économiques."}
                </p>

                {/* Important Clarification Callout Box */}
                <div className="border-l-2 border-maple bg-[#FAF9F6] p-5 my-4">
                  <p className="font-serif italic text-sm sm:text-base text-[#0D0E0D] leading-relaxed">
                    {isEn
                      ? "« North and South describe complementary community roles within the CAP ecosystem. They are not geographic restrictions on who can participate. »"
                      : "« Nord et Sud décrivent des rôles communautaires complémentaires au sein de l'écosystème CAP. Ce ne sont pas des restrictions géographiques sur la participation. »"}
                  </p>
                </div>
              </Reveal>
            </article>

            {/* GIANT PULL QUOTE BLOCK (Identical to reference image 2: giant black quote mark, breakout font) */}
            <div id="core-message" className="scroll-mt-28 bg-[#FAF9F6] border border-[#0D0E0D]/10 p-8 sm:p-14 my-10 shadow-sm relative">
              <Reveal>
                {/* Giant quotation mark */}
                <span className="font-serif text-7xl sm:text-8xl leading-none text-[#0D0E0D] block font-normal -mt-4 mb-2 select-none">
                  “
                </span>

                <blockquote className="font-serif text-xl sm:text-2xl md:text-3xl font-normal text-[#0D0E0D] leading-[1.4] mb-8">
                  {isEn ? (
                    <>
                      CAP Entrepreneurs connects people, skills, technology and opportunities to build inclusive, accessible and sustainable digital economies. We help people discover possibilities, develop capabilities and create meaningful connections- in Canada and internationally.
                    </>
                  ) : (
                    <>
                      CAP Entrepreneurs connecte les individus, les compétences, les technologies et les opportunités pour bâtir des économies numériques inclusives, accessibles et durables. Nous aidons chacun à découvrir des possibilités, développer ses capacités et créer des connexions significatives- au Canada et à l'international.
                    </>
                  )}
                </blockquote>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#0D0E0D]/10">
                  <div className="text-xs font-montserrat tracking-[0.2em] uppercase text-sage">
                    <span>{isEn ? "OUR CORE MESSAGE" : "NOTRE MESSAGE FONDATEUR"}</span>
                    <span className="mx-2">•</span>
                    <span>CAP ENTREPRENEURS</span>
                  </div>

                  <button
                    onClick={handleShareQuote}
                    className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:text-maple transition-colors"
                  >
                    <Twitter className="h-3.5 w-3.5" />
                    <span>{isEn ? "Share this quote" : "Partager cette citation"}</span>
                  </button>
                </div>
              </Reveal>
            </div>

            {/* SECTION: THE WINDOWS OF CAP */}
            <article id="windows-of-cap" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#0D0E0D]/10">
              <Reveal>
                <div className="border-b border-[#0D0E0D]/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block mb-1">
                    {isEn ? "EDITORIAL PLATFORM" : "PLATEFORME ÉDITORIALE"}
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#0D0E0D]">
                    {isEn ? "The Windows of CAP" : "Les Fenêtres de CAP"}
                  </h2>
                  <p className="mt-2 font-serif italic text-lg sm:text-xl text-[#0D0E0D]">
                    {isEn ? "Discover what's possible." : "Découvrir ce qui est possible."}
                  </p>
                </div>

                <p className="font-sans text-sm sm:text-base text-sage leading-relaxed">
                  {isEn
                    ? "Our editorial platform for stories, events, knowledge, trends and opportunities. A living curation of global insights, community spotlights, and practical research bridging Canadian tech expertise with emerging economies."
                    : "Notre plateforme éditoriale pour les récits, événements, connaissances, tendances et opportunités. Une curation vivante de perspectives mondiales, de coups de projecteur sur nos membres et de recherches appliquées reliant l'expertise canadienne aux économies émergentes."}
                </p>

                <div className="pt-2">
                  <Link
                    to="/blog"
                    className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:text-maple transition-colors"
                  >
                    <span>{isEn ? "Read our latest publications" : "Lire nos dernières publications"}</span>
                    <span className="transition-transform group-hover:translate-x-1.5">→</span>
                  </Link>
                </div>
              </Reveal>
            </article>

            {/* SECTION: THE NEXT CAP */}
            <article id="next-cap" className="scroll-mt-28 space-y-5 pt-8 border-t border-[#0D0E0D]/10">
              <Reveal>
                <div className="border-b border-[#0D0E0D]/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block mb-1">
                    {isEn ? "STORYTELLING & AMBITIONS" : "ESPACE RÉCITS & AMBITIONS"}
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#0D0E0D]">
                    {isEn ? "The Next CAP" : "Le Prochain CAP"}
                  </h2>
                  <p className="mt-2 font-serif italic text-lg sm:text-xl text-[#0D0E0D]">
                    {isEn ? "What's your next move?" : "Quelle est votre prochaine étape ?"}
                  </p>
                </div>

                <p className="font-sans text-sm sm:text-base text-sage leading-relaxed">
                  {isEn
                    ? "Our storytelling space for personal journeys, entrepreneurial ambitions and new directions. We chronicle the transformations of students, founders, researchers and community leaders who found their next breakthrough through the CAP network."
                    : "Notre espace de narration dédié aux parcours personnels, aux ambitions entrepreneuriales et aux nouvelles orientations. Nous mettons en lumière les trajectoires d'étudiants, de fondateurs, de chercheurs et de leaders communautaires qui ont franchi un cap décisif grâce au réseau CAP."}
                </p>

                <div className="pt-2">
                  <Link
                    to="/impact-stories"
                    className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:text-maple transition-colors"
                  >
                    <span>{isEn ? "Explore community stories" : "Explorer les récits d'impact"}</span>
                    <span className="transition-transform group-hover:translate-x-1.5">→</span>
                  </Link>
                </div>
              </Reveal>
            </article>

            {/* SECTION: OUR VOICE (6 Attributes matching brief) */}
            <article id="our-voice" className="scroll-mt-28 space-y-6 pt-8 border-t border-[#0D0E0D]/10">
              <Reveal>
                <div className="border-b border-[#0D0E0D]/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block mb-1">
                    {isEn ? "TONE & STYLE GUIDELINE" : "CHARTE DE TON & DE STYLE"}
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#0D0E0D]">
                    {isEn ? "Our Voice" : "Notre Voix"}
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      name: isEn ? "Curious" : "Curieuse",
                      desc: isEn ? "We explore, ask questions and look beyond the obvious." : "Nous explorons, posons des questions et regardons au-delà des évidences."
                    },
                    {
                      name: isEn ? "Human" : "Humaine",
                      desc: isEn ? "We speak to people, not institutions." : "Nous nous adressons à des personnes, pas à des institutions."
                    },
                    {
                      name: isEn ? "Action-oriented" : "Orientée action",
                      desc: isEn ? "We turn ideas into next steps." : "Nous transformons les idées en prochaines étapes concrètes."
                    },
                    {
                      name: isEn ? "Inclusive" : "Inclusive",
                      desc: isEn ? "We make space for different backgrounds, abilities and perspectives." : "Nous valorisons la diversité des parcours, des capacités et des points de vue."
                    },
                    {
                      name: isEn ? "International" : "Internationale",
                      desc: isEn ? "We communicate across cultures without losing our Canadian roots." : "Nous dialoguons entre les cultures sans perdre nos racines canadiennes."
                    },
                    {
                      name: isEn ? "Optimistic, but grounded" : "Optimiste & ancrée",
                      desc: isEn ? "We believe in possibility and focus on practical impact." : "Nous croyons aux opportunités tout en restant focalisés sur l'impact tangible."
                    }
                  ].map((voice, idx) => (
                    <div key={idx} className="border border-[#0D0E0D]/10 bg-[#FAF9F6] p-5">
                      <span className="font-serif text-xl italic text-maple block mb-1">0{idx + 1}</span>
                      <h3 className="font-serif text-lg font-bold text-[#0D0E0D]">{voice.name}</h3>
                      <p className="mt-1 text-xs text-sage leading-relaxed font-sans">{voice.desc}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </article>

            {/* SECTION: OUR SIGNATURE */}
            <article id="our-signature" className="scroll-mt-28 space-y-4 pt-8 border-t border-[#0D0E0D]/10">
              <Reveal>
                <div className="border-b border-[#0D0E0D]/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block mb-1">
                    {isEn ? "BRAND SIGNATURE" : "SIGNATURE DE MARQUE"}
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#0D0E0D]">
                    {isEn ? "Our Signature" : "Notre Signature"}
                  </h2>
                </div>

                <div className="bg-white border border-[#0D0E0D]/15 p-6 sm:p-8">
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#0D0E0D]">
                    CAP Entrepreneurs- {isEn ? "Opening New Horizons." : "Ouvrir de Nouveaux Horizons."}
                  </h3>
                  <p className="mt-3 font-serif italic text-base sm:text-lg text-sage leading-relaxed">
                    {isEn
                      ? "From discovering signals to opening doors, we help people turn possibilities into impact."
                      : "De la détection des signaux à l'ouverture des portes, nous aidons chacun à transformer les opportunités en impact durable."}
                  </p>
                </div>
              </Reveal>
            </article>

            {/* ACCORDION: ARTICLE SOURCES / FESTIVAL SPACES & ROADMAP (Matching reference image 2: 'ARTICLE SOURCES +') */}
            <section id="article-sources" className="scroll-mt-28 border-t border-[#0D0E0D]/10 pt-8">
              <Reveal>
                <button
                  type="button"
                  onClick={() => setSourcesOpen(!sourcesOpen)}
                  className="flex w-full items-center justify-between border-b border-[#0D0E0D]/20 pb-4 text-left transition-colors hover:text-maple"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#0D0E0D] font-montserrat">
                    {isEn
                      ? "ARTICLE SOURCES & FESTIVAL NAIROBI 2027 DETAILS"
                      : "SOURCES DE L'ARTICLE & DÉTAILS DU FESTIVAL NAIROBI 2027"}
                  </span>
                  <span className="font-serif text-lg font-bold">
                    {sourcesOpen ? "-" : "+"}
                  </span>
                </button>

                {sourcesOpen && (
                  <div className="mt-6 space-y-8 bg-[#FAF9F6] border border-[#0D0E0D]/10 p-6 sm:p-8 text-xs text-sage leading-relaxed font-sans animate-in fade-in duration-300">

                    {/* 4 Spaces */}
                    <div>
                      <h4 className="font-serif text-base font-bold text-[#0D0E0D] mb-3">
                        {isEn ? "The 4 Festival Hubs (Nairobi 2027):" : "Les 4 Espaces du Global Festival (Nairobi 2027) :"}
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="bg-white p-3 border border-[#0D0E0D]/10">
                          <strong className="text-[#0D0E0D] block font-serif">01 • Tech Inclusive</strong>
                          <span>{isEn ? "Accessibility, disability inclusion, universal design." : "Accessibilité, handicap, design universel."}</span>
                        </div>
                        <div className="bg-white p-3 border border-[#0D0E0D]/10">
                          <strong className="text-[#0D0E0D] block font-serif">02 • Tech Circulaire</strong>
                          <span>{isEn ? "Refurbishing, repair, circular digital economy." : "Réemploi, réparation, économie circulaire."}</span>
                        </div>
                        <div className="bg-white p-3 border border-[#0D0E0D]/10">
                          <strong className="text-[#0D0E0D] block font-serif">03 • Compétences Numériques</strong>
                          <span>{isEn ? "Digital skills, youth employability, workforce transition." : "Compétences numériques, employabilité, formation."}</span>
                        </div>
                        <div className="bg-white p-3 border border-[#0D0E0D]/10">
                          <strong className="text-[#0D0E0D] block font-serif">04 • Innovation Sociale</strong>
                          <span>{isEn ? "Civic tech, rural digital solutions, community welfare." : "Solutions numériques adaptées aux communautés."}</span>
                        </div>
                      </div>
                    </div>

                    {/* Roadmap Timeline */}
                    <div className="pt-4 border-t border-[#0D0E0D]/10">
                      <h4 className="font-serif text-base font-bold text-[#0D0E0D] mb-3">
                        {isEn ? "International Roadmap (2026-2028):" : "Feuille de Route Internationale (2026-2028) :"}
                      </h4>
                      <ul className="space-y-1.5 font-mono text-[11px]">
                        <li>• <strong>{isFr ? "2026 Bâtir" : isAr ? "2026 البناء" : "2026 Build"}</strong> - {isFr ? "Structuration des programmes et comités de travail" : isAr ? "هيكلة البرامج ولجان العمل المتخصصة" : "Structuring programs and advisory working committees"}</li>
                        <li>• <strong>{isFr ? "2027 Connecter" : isAr ? "2027 التواصل" : "2027 Connect"}</strong> - {isFr ? "Déploiement des programmes et mobilisation communautaire" : isAr ? "إطلاق البرامج وتعبئة المبادرات المجتمعية" : "Program deployment and community mobilization"}</li>
                        <li>• <strong>2027 Paris</strong> - {isFr ? "Brunch Pré-Festival & partenariats européens" : isAr ? "حفل ما قبل المهرجان والشراكات الأوروبية" : "Pre-Festival Brunch & European institutional partnerships"}</li>
                        <li>• <strong>2027 Nairobi</strong> - {isFr ? "Le Global Festival pour la tech inclusive & durable" : isAr ? "المهرجان العالمي للتكنولوجيا الشاملة والمستدامة" : "The Global Festival for inclusive & sustainable tech"}</li>
                        <li>• <strong>2027 Marrakech</strong> - {isFr ? "Sourcing Créatif Africain & acheteurs internationaux" : isAr ? "التوريد الإبداعي الأفريقي والمشترون الدوليون" : "African Creative Sourcing & international buyers market"}</li>
                        <li>• <strong>2028 Martinique</strong> - {isFr ? "Expansion internationale & coopération caribéenne" : isAr ? "التوسع الدولي والتعاون في منطقة الكاريبي" : "International expansion & Caribbean regional cooperation"}</li>
                      </ul>
                    </div>

                  </div>
                )}
              </Reveal>
            </section>

            {/* BOTTOM SHOWCASE: RECOMMENDED GATHERINGS (Matching reference image 2: 'Recommended from Shop' with 2 cards) */}
            <section id="recommended-gatherings" className="scroll-mt-28 pt-10 border-t border-[#0D0E0D]/10">
              <Reveal>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                  {/* Left Column Text (Matching reference image: "Recommended from Shop") */}
                  <div className="lg:col-span-4 space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block">
                      {isEn ? "KEY HIGHLIGHTS" : "RENDEZ-VOUS MAJEURS"}
                    </span>
                    <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#0D0E0D] leading-tight">
                      {isEn ? "Recommended Gatherings" : "Rassemblements Recommandés"}
                    </h3>
                    <p className="font-serif italic text-sm text-sage leading-relaxed">
                      {isEn
                        ? "Opening New Horizons through gatherings, workshops, and international partnerships. Reserve your presence at our upcoming milestones."
                        : "Ouvrir de Nouveaux Horizons à travers des sommets, des ateliers et des partenariats internationaux. Réservez votre place pour nos prochains jalons."}
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/contact"
                        className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:text-maple transition-colors"
                      >
                        <span>{isEn ? "Join waitlist" : "Rejoindre la liste d'attente"}</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: 2 Product / Event Cards with Badge (Matching reference image SALE! cards) */}
                  <div className="lg:col-span-8 grid sm:grid-cols-2 gap-6">

                    {/* Card 1: Nairobi */}
                    <div className="group border border-[#0D0E0D]/10 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative overflow-hidden bg-black">
                        <span className="absolute top-3 left-3 z-10 bg-maple text-white text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 font-montserrat">
                          NAIROBI 2027
                        </span>
                        <img
                          src={FESTIVAL_ASSETS.nairobiCard}
                          alt="Global Festival Nairobi 2027"
                          className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-5 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sage font-montserrat block mb-1">
                          KENYA • SUMMIT
                        </span>
                        <h4 className="font-serif text-lg font-bold text-[#0D0E0D]">
                          Global Festival Nairobi
                        </h4>
                        <p className="mt-1 font-sans text-xs text-sage">
                          {isEn ? "Inclusive & Sustainable Tech" : "Tech Inclusive & Durable"}
                        </p>
                        <div className="mt-4 pt-3 border-t border-[#0D0E0D]/10 flex items-center justify-between text-xs font-montserrat">
                          <span className="text-maple font-bold uppercase tracking-wider text-[10px]">
                            {isEn ? "Community Pass" : "Accès Ouvert"}
                          </span>
                          <Link
                            to="/contact"
                            className="font-bold uppercase tracking-wider text-[#0D0E0D] hover:text-maple"
                          >
                            {isEn ? "Pre-register →" : "Pré-inscription →"}
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Paris */}
                    <div className="group border border-[#0D0E0D]/10 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative overflow-hidden bg-black">
                        <span className="absolute top-3 left-3 z-10 bg-[#0D0E0D] text-white text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 font-montserrat">
                          PARIS 2027
                        </span>
                        <img
                          src={FESTIVAL_ASSETS.parisCard}
                          alt="Pre-Festival Brunch Paris 2027"
                          className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-5 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sage font-montserrat block mb-1">
                          FRANCE • NETWORKING
                        </span>
                        <h4 className="font-serif text-lg font-bold text-[#0D0E0D]">
                          Brunch Pré-Festival Paris
                        </h4>
                        <p className="mt-1 font-sans text-xs text-sage">
                          {isEn ? "European Partnerships & Launch" : "Partenariats Européens & Lancement"}
                        </p>
                        <div className="mt-4 pt-3 border-t border-[#0D0E0D]/10 flex items-center justify-between text-xs font-montserrat">
                          <span className="text-sage font-bold uppercase tracking-wider text-[10px]">
                            {isEn ? "By Invitation" : "Sur Invitation"}
                          </span>
                          <Link
                            to="/contact"
                            className="font-bold uppercase tracking-wider text-[#0D0E0D] hover:text-maple"
                          >
                            {isEn ? "Inquire →" : "S'informer →"}
                          </Link>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              </Reveal>
            </section>

          </div>

        </div>
      </main>

    </div>
  );
};

export default GlobalFestival;
