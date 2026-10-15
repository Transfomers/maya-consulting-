import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, ArrowUpRight, ArrowRight, Globe2, Mail } from "lucide-react";
import { Reveal } from "@/components/motion";
import TiltCard from "@/components/TiltCard";
import { IMAGES } from "@/lib/content";
import { useLang } from "@/lib/i18n";

const About = () => {
  const { lang, t } = useLang();
  const [activeVision, setActiveVision] = useState(0);

  return (
    <div data-testid="about-page">
      {/* BESPOKE EDITORIAL MAGAZINE HEADER */}
      <section className="relative overflow-hidden border-b border-[#0D0E0D]/10 bg-[#FAF9F5]/40 pt-32 pb-16 md:pt-40 md:pb-20" data-testid="about-hero">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 items-center">

            {/* LEFT: TEXT & EDITORIAL REFINEMENT (7 cols) */}
            <div className="lg:col-span-7">
              <Reveal>
                {/* Script cursive eyebrow + category tag */}
                <div className="mb-4">
                  <span className="font-serif italic text-2xl sm:text-3xl text-maple block leading-tight font-normal">
                    À propos
                  </span>
                  <div className="mt-1 flex items-center gap-2.5">
                    <span className="h-px w-7 bg-maple" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#0D0E0D] font-montserrat" data-testid="about-hero-eyebrow">
                      {t.about.eyebrow || "À propos de Cap Entrepreneurs"}
                    </p>
                  </div>
                </div>

                {/* Main Headline in elegant editorial serif */}
                <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-normal leading-[1.08] text-[#0D0E0D] tracking-tight" data-testid="about-hero-heading">
                  {t.about.h1a}
                  <span className="italic font-normal text-maple">
                    {t.about.h1accent}
                  </span>
                </h1>

                {/* Small gold/green accent bar */}
                <div className="w-12 h-[2px] bg-maple mt-5 mb-5" />

                {/* Editorial Intro Paragraph */}
                <p className="text-base md:text-[18px] leading-[1.85] text-sage max-w-2xl font-sans" data-testid="about-hero-intro">
                  {t.about.intro || "Cap Entrepreneurs est né d'une conviction fondamentale : la transition numérique ne doit laisser personne de côté. Nous bâtissons des écosystèmes d'opportunités, d'apprentissage et de collaboration pour propulser les personnes et les organisations vers un impact durable au Canada et à travers le monde."}
                </p>

                {/* Minimalist Highlights */}
                <div className="mt-8 pt-6 border-t border-[#0D0E0D]/10 flex flex-wrap items-center gap-y-3 gap-x-6 text-xs text-sage">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-maple" />
                    <span className="font-medium text-[#0D0E0D]">{lang === "fr" ? "Organisme à but non lucratif canadien" : lang === "ar" ? "منظمة كندية غير ربحية" : "Canadian Non-Profit Organization"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-maple" />
                    <span className="font-medium text-[#0D0E0D]">{lang === "fr" ? "Inclusion & Transition Durable" : lang === "ar" ? "الشمول والتحول المستدام" : "Inclusion & Sustainable Transition"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-maple" />
                    <span className="font-medium text-[#0D0E0D]">{lang === "fr" ? "Rayonnement International" : lang === "ar" ? "حضور دولي وتأثير عالمي" : "International Outreach"}</span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* RIGHT: EDITORIAL PHOTO (5 cols) */}
            <div className="lg:col-span-5">
              <Reveal delay={0.2}>
                <div className="relative">
                  <div className="overflow-hidden border border-[#0D0E0D]/15 bg-white shadow-sm">
                    <img
                      src={IMAGES.collaboration}
                      alt="Cap Entrepreneurs - Vision & Impact"
                      className="aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                    />
                  </div>
                  <figcaption className="mt-3 flex items-center justify-between text-xs text-sage font-serif italic px-0.5">
                    <span>{lang === "fr" ? "L'intelligence collective au service du bien commun" : lang === "ar" ? "الذكاء الجماعي في خدمة الصالح العام" : "Collective intelligence in service of the common good"}</span>
                    <span className="text-[10px] font-sans not-italic font-bold tracking-widest text-maple uppercase">EST. CANADA</span>
                  </figcaption>
                </div>
              </Reveal>
            </div>

          </div>
        </div>
      </section>

      {/* EDITORIAL MAGAZINE SECTION: QUI SOMMES-NOUS & NOTRE MISSION */}
      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-24 bg-white" data-testid="about-who-section">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">

          {/* MAIN ARTICLE COLUMN (8 cols) */}
          <article className="lg:col-span-8">
            <Reveal>
              {/* Category Kicker */}
              <div className="text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-maple font-montserrat">
                  {t.about.whoTitle || "QUI SOMMES-NOUS"}
                </p>
                {/* Main Headline */}
                <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-normal leading-[1.15] text-[#0D0E0D] tracking-tight">
                  {t.about.whoHeading || (lang === "fr" ? "Bâtir des économies numériques inclusives, accessibles et durables" : "Building inclusive & sustainable futures")}
                </h2>
                {/* Horizontal Accent Line & Sub-label */}
                <div className="mx-auto mt-4 mb-2.5 h-[2px] w-12 bg-maple" />
                <p className="text-[12px] italic tracking-wider text-sage font-serif">
                  Organisme à but non lucratif canadien dédié à l'impact durable
                </p>
              </div>

              {/* First Paragraph */}
              <div className="mt-8 space-y-5 text-base md:text-[17px] leading-[1.85] text-[#2D312E]">
                <p>
                  {t.about.whoText || "Cap Entrepreneurs est un organisme à but non lucratif canadien dédié à la transition numérique inclusive et durable. Nous accompagnons les individus, les organisations à impact social et les communautés sous-représentées dans l'accès aux compétences numériques, aux outils et aux opportunités. Nous exportons également les meilleures pratiques canadiennes-gouvernance transparente, inclusion, durabilité-à travers nos initiatives internationales."}
                </p>
              </div>

              {/* Editorial Pull Quote */}
              <div className="my-10 border-y border-[#0D0E0D]/15 py-8 text-center">
                <span className="block font-serif text-3xl italic text-maple mb-2 leading-none">“</span>
                <blockquote className="font-serif italic text-xl sm:text-2xl md:text-3xl font-medium text-[#0D0E0D] leading-snug px-4 md:px-10">
                  {lang === "fr" ? (
                    <>
                      Connecter les personnes, les compétences, la technologie et les opportunités.<br className="hidden md:inline" />
                      Faire de la transition numérique un modèle d'excellence inclusive et durable.
                    </>
                  ) : (
                    <>
                      Connecting people, skills, technology and opportunities.<br className="hidden md:inline" />
                      Making the digital transition a model of inclusive excellence worldwide.
                    </>
                  )}
                </blockquote>
              </div>

              {/* Second / Transition Paragraph */}
              <div className="space-y-5 text-base md:text-[17px] leading-[1.85] text-[#2D312E]">
                <p>
                  {lang === "fr"
                    ? "Face aux mutations technologiques accélérées, nous croyons qu'une transformation numérique réussie ne se mesure pas uniquement à la performance technique, mais à sa capacité d'émancipation humaine. En unissant expertise locale et partenariats transatlantiques, nous concevons des passerelles concrètes pour que chaque talent puisse s'épanouir et contribuer activement au bien commun."
                    : "Faced with accelerating technological change, we believe that a successful digital transformation is not measured solely by technical performance, but by its capacity for human empowerment. By uniting local expertise and transatlantic partnerships, we build concrete pathways for every talent to thrive and contribute to the common good."}
                </p>
              </div>

              {/* Full-bleed Landscape Photo with Caption */}
              <figure className="my-10">
                <div className="overflow-hidden border border-[#0D0E0D]/10 shadow-sm">
                  <img
                    src={IMAGES.hero}
                    alt="Cap Entrepreneurs - Impact et Inclusion"
                    className="aspect-[16/9] w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                  />
                </div>
                <figcaption className="mt-3 text-center text-xs italic tracking-wider text-sage font-serif">
                  A Journey Begins Here- L'impact collectif et durable en action
                </figcaption>
              </figure>

              {/* NOTRE MISSION Section */}
              <div className="mt-12 pt-10 border-t border-[#0D0E0D]/15">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-maple font-montserrat">
                  {t.about.missionTitle || "NOTRE MISSION"}
                </p>
                <h3 className="mt-3 font-serif text-2xl sm:text-3xl md:text-4xl font-medium text-[#0D0E0D] leading-snug">
                  {t.about.missionHeading || "Connecter les personnes, les compétences, la technologie et les opportunités."}
                </h3>
                <p className="mt-5 text-base md:text-[17px] leading-[1.85] text-[#2D312E]">
                  {t.about.missionText || "Nous croyons que la transformation numérique doit être un levier d'inclusion, d'employabilité et de développement durable. Notre mission est de rendre cette transition accessible à tous, en particulier à ceux qui en sont les plus éloignés-et de promouvoir les pratiques canadiennes comme modèle d'excellence à travers le monde."}
                </p>

                {/* 3 Pillars / Highlights in clean editorial style */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#0D0E0D]/10">
                  <div className="p-4 bg-[#FDFCFD] border border-[#0D0E0D]/10">
                    <span className="font-serif text-xs font-bold text-maple block">01 / INCLUSION</span>
                    <h4 className="mt-1 font-heading text-sm font-bold text-[#0D0E0D]">
                      {lang === "fr" ? "Accessibilité Universelle" : lang === "ar" ? "إتاحة رقمية شاملة" : "Universal Accessibility"}
                    </h4>
                    <p className="mt-1 text-xs text-sage leading-relaxed">
                      {lang === "fr"
                        ? "Démocratiser les compétences et outils numériques pour les populations sous-représentées."
                        : lang === "ar"
                        ? "إتاحة المهارات والأدوات الرقمية للفئات المجتمعية الأقل تمثيلاً."
                        : "Democratizing digital tools and practical skills for underrepresented communities."}
                    </p>
                  </div>
                  <div className="p-4 bg-[#FDFCFD] border border-[#0D0E0D]/10">
                    <span className="font-serif text-xs font-bold text-maple block">02 / EXCELLENCE</span>
                    <h4 className="mt-1 font-heading text-sm font-bold text-[#0D0E0D]">
                      {lang === "fr" ? "Gouvernance Canadienne" : lang === "ar" ? "حوكمة كندية مسؤولة" : "Canadian Governance"}
                    </h4>
                    <p className="mt-1 text-xs text-sage leading-relaxed">
                      {lang === "fr"
                        ? "Exporter des pratiques éthiques, transparentes et pérennes fondées sur la confiance."
                        : lang === "ar"
                        ? "تصدير ممارسات أخلاقية وشفافة ومستدامة قائمة على الثقة والمسؤولية المجتمعية."
                        : "Exporting ethical, transparent, and sustainable practices rooted in community trust."}
                    </p>
                  </div>
                  <div className="p-4 bg-[#FDFCFD] border border-[#0D0E0D]/10">
                    <span className="font-serif text-xs font-bold text-maple block">03 / RAYONNEMENT</span>
                    <h4 className="mt-1 font-heading text-sm font-bold text-[#0D0E0D]">
                      {lang === "fr" ? "Passerelles Mondiales" : lang === "ar" ? "جسور عالمية" : "Global Bridges"}
                    </h4>
                    <p className="mt-1 text-xs text-sage leading-relaxed">
                      {lang === "fr"
                        ? "Créer des connexions stratégiques entre le Canada, l'Europe, l'Afrique et les Caraïbes."
                        : lang === "ar"
                        ? "بناء روابط استراتيجية متينة بين كندا وأوروبا وإفريقيا ومنطقة الكاريبي."
                        : "Forging high-trust strategic bridges across Canada, Europe, Africa, and the Caribbean."}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </article>

          {/* SIDEBAR COLUMN (4 cols) */}
          <aside className="lg:col-span-4 space-y-10 lg:pl-2">

            {/* WIDGET 1: ABOUT CAP */}
            <div className="bg-white">
              <div className="border-y border-[#0D0E0D]/80 py-2.5 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#0D0E0D] font-montserrat">
                  {lang === "fr" ? "À PROPOS DE CAP" : lang === "ar" ? "عن كاب" : "ABOUT CAP"}
                </span>
              </div>

              <div className="mt-5 overflow-hidden border border-[#0D0E0D]/10">
                <img
                  src={IMAGES.portraitF}
                  alt="Cap Entrepreneurs Community"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-sage text-center">
                Organisme à but non lucratif canadien dédié à l'émancipation par le numérique, accompagnant les individus et les organisations vers un impact durable.
              </p>

              {/* Signature Graphic */}
              <div className="mt-4 flex flex-col items-center justify-center">
                <svg viewBox="0 0 240 60" className="h-12 w-auto max-w-[170px] text-[#0D0E0D] opacity-85" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 25 45 C 20 32, 28 14, 48 16 C 68 20, 52 46, 42 46 C 36 46, 40 36, 56 34 C 68 32, 82 34, 88 38" />
                  <path d="M 92 40 C 96 34, 104 30, 112 34 C 116 36, 118 43, 120 46" />
                  <path d="M 122 30 L 126 52 M 124 36 C 129 32, 136 32, 142 36 C 146 40, 147 48, 149 50" />
                  <path d="M 154 36 C 162 34, 172 36, 179 38 M 166 28 L 164 50" />
                  <path d="M 182 43 C 189 33, 199 30, 212 33 C 222 36, 219 48, 229 50" />
                </svg>
                <span className="font-serif italic text-sm text-[#0D0E0D]/75 -mt-1 tracking-wider">
                  Cap Entrepreneurs
                </span>
              </div>
            </div>

            {/* WIDGET 2: FOLLOW US ON */}
            <div>
              <div className="border-y border-[#0D0E0D]/80 py-2.5 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#0D0E0D] font-montserrat">
                  {lang === "fr" ? "SUIVEZ-NOUS" : lang === "ar" ? "تابعنا على" : "FOLLOW US ON"}
                </span>
              </div>
              <div className="mt-5 flex items-center justify-center gap-3">
                {[
                  { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
                  { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
                  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="flex h-10 w-10 items-center justify-center border border-[#0D0E0D]/20 text-[#0D0E0D] transition-colors hover:border-maple hover:bg-maple hover:text-white"
                  >
                    <item.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* WIDGET 3: PROGRAMMES PHARES (POPULAR POSTS STYLE) */}
            <div>
              <div className="border-y border-[#0D0E0D]/80 py-2.5 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#0D0E0D] font-montserrat">
                  {lang === "fr" ? "PROGRAMMES STRUCTURANTS" : lang === "ar" ? "البرامج الهيكلية" : "STRUCTURING PROGRAMS"}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  {
                    title: "Cap Green Lab",
                    category: "Tech Inclusive & Économie Circulaire",
                    image: IMAGES.workshop,
                    href: "/programs#cap-green-lab",
                  },
                  {
                    title: "AgriConnect",
                    category: "Entrepreneuriat Rural & Tech",
                    image: IMAGES.building,
                    href: "/programs#agriconnect",
                  },
                  {
                    title: "Safe Vibe",
                    category: "Médias Numériques & Éducation",
                    image: IMAGES.board,
                    href: "/programs#safe-vibe",
                  },
                  {
                    title: "Créatif & Social",
                    category: "Innovation Sociale & Féminine",
                    image: IMAGES.collaboration,
                    href: "/programs#creative-social",
                  },
                ].map((post, idx) => (
                  <Link
                    key={idx}
                    to={post.href}
                    className="group flex items-center gap-4 transition-colors"
                  >
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden border border-[#0D0E0D]/10 bg-forest/5">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading text-sm font-bold text-[#0D0E0D] transition-colors group-hover:text-maple truncate">
                        {post.title}
                      </h4>
                      <p className="text-[11px] text-sage truncate mt-0.5">
                        {post.category}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* WIDGET 4: BANNER CALLOUT (BANNER ADS 300 X 250 STYLE) */}
            <div>
              <div className="border-y border-[#0D0E0D]/80 py-2.5 text-center mb-5">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#0D0E0D] font-montserrat">
                  {lang === "fr" ? "REJOINDRE LA MISSION" : lang === "ar" ? "شارك في الأثر" : "JOIN THE IMPACT"}
                </span>
              </div>
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-[#0D0E0D]/15 group">
                <img
                  src={IMAGES.collaborating}
                  alt="Rejoindre Cap Entrepreneurs"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#0D0E0D]/30 flex items-center justify-center p-5">
                  <div className="bg-white/95 backdrop-blur-sm border border-[#0D0E0D]/15 p-5 text-center w-full max-w-[260px] shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                      AGIR AVEC NOUS
                    </p>
                    <h4 className="mt-1 font-serif text-lg font-bold text-[#0D0E0D] leading-tight">
                      {lang === "fr" ? "Rejoindre l'écosystème" : lang === "ar" ? "انضم للمنظومة" : "Join the Ecosystem"}
                    </h4>
                    <p className="mt-1 text-[11px] text-sage">
                      {lang === "fr" ? "Bénévolat • Partenariat • Formation" : lang === "ar" ? "تطوع • شراكة • تدريب" : "Volunteering • Partnership • Learning"}
                    </p>
                    <Link
                      to="/join"
                      className="mt-3 inline-flex items-center justify-center px-4 py-1.5 bg-maple hover:bg-purple-700 text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
                    >
                      {lang === "fr" ? "Commencer" : lang === "ar" ? "ابدأ الآن" : "Get Started"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </section>

      {/* EDITORIAL HOW WE WORK (NOTRE FONCTIONNEMENT) */}
      <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-32 border-t border-[#0D0E0D]/10 bg-white" data-testid="about-how-section">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <span className="font-serif italic text-2xl sm:text-3xl text-maple block mb-1">
              Gouvernance & Modèle
            </span>
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="h-px w-7 bg-maple" />
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#0D0E0D] font-montserrat">
                {t.about.howTitle || "NOTRE FONCTIONNEMENT"}
              </p>
              <span className="h-px w-7 bg-maple" />
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal tracking-tight text-[#0D0E0D] leading-[1.12]">
              {t.about.howHeading || (lang === "fr" ? "Une gouvernance collaborative et transparente" : "Collaborative & Transparent Governance")}
            </h2>

            <p className="mt-4 text-base md:text-lg text-sage font-sans max-w-2xl mx-auto leading-relaxed">
              {t.about.howIntro || "Notre modèle repose sur une gouvernance collaborative et transparente :"}
            </p>

            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 bg-[#FDFCFD] border border-[#0D0E0D]/15 px-6 py-2.5 text-xs font-semibold tracking-wider text-[#0D0E0D] uppercase shadow-sm">
              <span>{lang === "fr" ? "Comités" : lang === "ar" ? "اللجان" : "Committees"}</span> <span className="text-maple">→</span>
              <span>{lang === "fr" ? "Programmes" : lang === "ar" ? "البرامج" : "Programs"}</span> <span className="text-maple">→</span>
              <span>{lang === "fr" ? "Bénévoles" : lang === "ar" ? "المتطوعون" : "Volunteers"}</span> <span className="text-maple">→</span>
              <span>{lang === "fr" ? "Partenaires" : lang === "ar" ? "الشركاء" : "Partners"}</span> <span className="text-maple">→</span>
              <span className="text-maple font-bold">{lang === "fr" ? "Impact" : lang === "ar" ? "الأثر" : "Impact"}</span>
            </div>
          </div>
        </Reveal>

        {/* 3-COLUMN EDITORIAL MAGAZINE GRID (MATCHING REFERENCE IMAGE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12 lg:gap-14">

          {/* COLUMN 1 */}
          <div className="space-y-12 md:space-y-16">
            {/* 01 COMITÉS (LANDSCAPE) */}
            <Reveal delay={0.05}>
              <div className="group text-center">
                <div className="overflow-hidden border border-[#0D0E0D]/10 bg-forest/5 shadow-sm">
                  <img
                    src={IMAGES.board}
                    alt="Comités Thématiques"
                    className="aspect-[16/11] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-normal text-[#0D0E0D] group-hover:text-maple transition-colors leading-snug">
                  {lang === "fr" ? "Comités Thématiques" : lang === "ar" ? "اللجان التخصصية" : "Thematic Committees"}
                </h3>
                <div className="my-2 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                    {lang === "fr" ? "01 • GOUVERNANCE" : lang === "ar" ? "01 • حوكمة" : "01 • GOVERNANCE"}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-sage max-w-[320px] mx-auto font-sans">
                  {lang === "fr"
                    ? "Groupes de travail thématiques (Conseil Cap Green Lab, Conseil Inclusion Numérique & Accessibilité, Conseil Partenaires Internationaux) qui définissent les orientations."
                    : lang === "ar"
                    ? "مجموعات عمل متخصصة تحدد التوجهات الاستراتيجية للبرامج والمبادرات المجتمعية."
                    : "Thematic advisory working groups (Cap Green Lab Council, Digital Inclusion Council, International Council) guiding strategic priorities."}
                </p>
              </div>
            </Reveal>

            {/* 04 PARTENAIRES (TALL PORTRAIT) */}
            <Reveal delay={0.2}>
              <div className="group text-center">
                <div className="overflow-hidden border border-[#0D0E0D]/10 bg-forest/5 shadow-sm">
                  <img
                    src={IMAGES.building}
                    alt="Partenaires Stratégiques"
                    className="aspect-[3/4] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-normal text-[#0D0E0D] group-hover:text-maple transition-colors leading-snug">
                  {lang === "fr" ? "Partenariats Stratégiques" : lang === "ar" ? "شراكات استراتيجية" : "Strategic Partnerships"}
                </h3>
                <div className="my-2 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                    {lang === "fr" ? "04 • ALLIANCES" : lang === "ar" ? "04 • تحالفات" : "04 • ALLIANCES"}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-sage max-w-[320px] mx-auto font-sans">
                  {lang === "fr"
                    ? "Organisations, institutions et bailleurs qui soutiennent notre mission financièrement, techniquement ou stratégiquement pour démultiplier l'impact."
                    : lang === "ar"
                    ? "منظمات ومؤسسات ومانحون يدعمون مهمتنا مادياً وتقنياً واستراتيجياً لمضاعفة الأثر."
                    : "Organizations, institutions, and funders supporting our mission with capital, expertise, and operational resources."}
                </p>
              </div>
            </Reveal>
          </div>

          {/* COLUMN 2 */}
          <div className="space-y-12 md:space-y-16">
            {/* 02 PROGRAMMES (TALL PORTRAIT) */}
            <Reveal delay={0.1}>
              <div className="group text-center">
                <div className="overflow-hidden border border-[#0D0E0D]/10 bg-forest/5 shadow-sm">
                  <img
                    src={IMAGES.workshop}
                    alt="Programmes Structurants"
                    className="aspect-[3/4] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-normal text-[#0D0E0D] group-hover:text-maple transition-colors leading-snug">
                  {lang === "fr" ? "Programmes Structurants" : lang === "ar" ? "برامج هيكلية" : "Structuring Programs"}
                </h3>
                <div className="my-2 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                    {lang === "fr" ? "02 • ACTION" : lang === "ar" ? "02 • عمل ومبادرة" : "02 • ACTION"}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-sage max-w-[320px] mx-auto font-sans">
                  {lang === "fr"
                    ? "Quatre programmes structurants qui répondent à des besoins concrets : Cap Green Lab, AgriConnect, Safe Vibe et Créatif & Social."
                    : lang === "ar"
                    ? "أربعة برامج هيكلية تلبي احتياجات ملموسة: مختبر كاب الأخضر، أجري كونكت، سيف فايب، وريادة الأعمال الإبداعية والاجتماعية."
                    : "Four pillar programs serving concrete needs: Cap Green Lab, AgriConnect, Safe Vibe, and Creative & Social."}
                </p>
              </div>
            </Reveal>

            {/* 05 IMPACT (LANDSCAPE) */}
            <Reveal delay={0.25}>
              <div className="group text-center">
                <div className="overflow-hidden border border-[#0D0E0D]/10 bg-forest/5 shadow-sm">
                  <img
                    src={IMAGES.collaborating}
                    alt="Impact Mesurable"
                    className="aspect-[16/11] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-normal text-[#0D0E0D] group-hover:text-maple transition-colors leading-snug">
                  {lang === "fr" ? "Impact Mesurable & Durable" : lang === "ar" ? "أثر ملموس ومستدام" : "Measurable & Lasting Impact"}
                </h3>
                <div className="my-2 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                    {lang === "fr" ? "05 • TRANSFORMATION" : lang === "ar" ? "05 • تحول مجتمعي" : "05 • TRANSFORMATION"}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-sage max-w-[320px] mx-auto font-sans">
                  {lang === "fr"
                    ? "Résultats concrets et mesurables qui transforment durablement les communautés, au Canada et à travers le monde."
                    : lang === "ar"
                    ? "نتائج ملموسة وقابلة للقياس تحدث تحولاً إيجابياً ومستداماً في المجتمعات المحلية والدولية."
                    : "Tangible, verifiable social outcomes that create lasting improvements for communities in Canada and abroad."}
                </p>
              </div>
            </Reveal>
          </div>

          {/* COLUMN 3 */}
          <div className="space-y-12 md:space-y-16">
            {/* 03 BÉNÉVOLES (PORTRAIT) */}
            <Reveal delay={0.15}>
              <div className="group text-center">
                <div className="overflow-hidden border border-[#0D0E0D]/10 bg-forest/5 shadow-sm">
                  <img
                    src={IMAGES.hero}
                    alt="Engagement Citoyen & Bénévoles"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-normal text-[#0D0E0D] group-hover:text-maple transition-colors leading-snug">
                  {lang === "fr" ? "Bénévoles & Citoyens Engagés" : lang === "ar" ? "متطوعون ومواطنون فاعلون" : "Volunteers & Engaged Citizens"}
                </h3>
                <div className="my-2 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                    {lang === "fr" ? "03 • COMMUNAUTÉ" : lang === "ar" ? "03 • مجتمع" : "03 • COMMUNITY"}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-sage max-w-[320px] mx-auto font-sans">
                  {lang === "fr"
                    ? "Membres engagés qui contribuent quotidiennement à la mise en œuvre des projets, au mentorat et au partage des compétences."
                    : lang === "ar"
                    ? "أعضاء ملتزمون يشاركون يومياً في تنفيذ المشاريع والإرشاد وتبادل المعرفة والمهارات."
                    : "Committed community members contributing daily to program operations, peer mentoring, and knowledge exchange."}
                </p>
              </div>
            </Reveal>

            {/* 06 RAYONNEMENT & STANDARD CANADIEN (LANDSCAPE) */}
            <Reveal delay={0.3}>
              <div className="group text-center">
                <div className="overflow-hidden border border-[#0D0E0D]/10 bg-forest/5 shadow-sm">
                  <img
                    src={IMAGES.collaboration}
                    alt="Rayonnement International"
                    className="aspect-[16/11] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-normal text-[#0D0E0D] group-hover:text-maple transition-colors leading-snug">
                  {lang === "fr" ? "Rayonnement International" : lang === "ar" ? "حضور وتأثير دولي" : "International Reach"}
                </h3>
                <div className="my-2 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                    {lang === "fr" ? "06 • HORIZON MONDIAL" : lang === "ar" ? "06 • أفق دولي" : "06 • GLOBAL HORIZON"}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-sage max-w-[320px] mx-auto font-sans">
                  {lang === "fr"
                    ? "Exportation des meilleures pratiques canadiennes — gouvernance éthique, inclusion et durabilité — à travers nos initiatives internationales."
                    : lang === "ar"
                    ? "مشاركة أفضل الممارسات الكندية — الحوكمة الأخلاقية، والشمول، والاستدامة — عبر مبادراتنا الدولية."
                    : "Sharing Canadian best practices — ethical governance, accessibility, and environmental responsibility — globally."}
                </p>
              </div>
            </Reveal>
          </div>

        </div>
      </section>


      {/* OUR VISION (Architectural dusk layout with glassmorphic hoverable cards panel) */}
      <section className="relative overflow-hidden bg-[#0A0D0A] text-white py-24 md:py-32" data-testid="about-vision-section">
        {/* Architectural dusk background photo with warm interior lighting */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80"
            alt="Cap Entrepreneurs Architecture & Vision"
            className="h-full w-full object-cover opacity-35 filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D0A] via-[#0A0D0A]/85 to-transparent lg:to-black/45" />
        </div>

        <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 md:px-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 items-center">

            {/* LEFT: RAIL DOCK + HEADLINE & FLOW (6 cols) */}
            <div className="lg:col-span-6 flex gap-6 sm:gap-8 items-start">
              {/* Vertical rail dock matching reference (H A W C / 2 0 2 7) */}
              <div className="hidden sm:flex flex-col items-center gap-3 pt-2 text-white/40 font-mono text-xs select-none">
                <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-white/10 text-white font-bold text-[11px]">C</span>
                <span className="h-6 w-px bg-white/20" />
                <span className="text-[10px] tracking-widest text-white/60">27</span>
                <span className="text-[10px] tracking-widest text-white/60">28</span>
                <span className="h-6 w-px bg-white/20" />
                <Globe2 className="h-3.5 w-3.5 text-maple" />
              </div>

              <div>
                <Reveal>
                  <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-maple font-montserrat block mb-3">
                    {t.about.visionTitle || "NOTRE VISION"}
                  </span>

                  <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                    {lang === "fr" ? (
                      <>
                        Bâtir un écosystème<br className="hidden sm:inline" /> international.
                      </>
                    ) : lang === "ar" ? (
                      <>
                        بناء منظومة<br className="hidden sm:inline" /> دولية مستدامة.
                      </>
                    ) : (
                      <>
                        Building an inclusive<br className="hidden sm:inline" /> global ecosystem.
                      </>
                    )}
                  </h2>

                  <p className="mt-5 text-sm sm:text-base leading-relaxed text-white/80 max-w-xl font-sans">
                    {t.about.visionHeading || "Bâtir un écosystème numérique international, inclusif et durable qui valorise les meilleures pratiques canadiennes."}
                  </p>

                  {/* Flow Route Pill */}
                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md text-[11px] font-semibold text-white/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-maple animate-pulse" />
                    <span>{t.about.visionFlow || "Paris 2027 → Nairobi 2027 → Marrakech 2027 → Martinique 2028 → Un réseau mondial d'innovateurs sociaux."}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link
                      to="/global-festival"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#0D0E0D] hover:bg-maple hover:text-white transition-colors shadow-sm"
                    >
                      <span>{lang === "fr" ? "Le Festival 2027" : lang === "ar" ? "المهرجان 2027" : "Global Festival 2027"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/15 transition-colors backdrop-blur-sm"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>{lang === "fr" ? "Nous contacter" : lang === "ar" ? "اتصل بنا" : "Contact Us"}</span>
                    </Link>
                  </div>
                </Reveal>
              </div>
            </div>

            {/* RIGHT: FROSTED GLASS PANEL WITH HOVERABLE CARDS (6 cols) */}
            <div className="lg:col-span-6">
              <Reveal delay={0.15}>
                <div className="rounded-none sm:rounded-2xl border border-white/20 bg-white/10 p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-3.5">
                  {[
                    {
                      code: "PA",
                      num: "01",
                      title: "Paris 2027",
                      text: lang === "fr" ? "Brunch pré-festival & partenariats européens" : lang === "ar" ? "حفل ما قبل المهرجان والشراكات الأوروبية" : "Pre-festival brunch & European partnerships",
                      badge: "EUROPE"
                    },
                    {
                      code: "NA",
                      num: "02",
                      title: "Nairobi 2027",
                      text: lang === "fr" ? "Global Festival pour la tech inclusive, accessible et durable" : lang === "ar" ? "المهرجان العالمي للتكنولوجيا الشاملة والمستدامة" : "Global Festival for inclusive and sustainable tech",
                      badge: "FESTIVAL"
                    },
                    {
                      code: "MA",
                      num: "03",
                      title: "Marrakech 2027",
                      text: lang === "fr" ? "Programme de sourcing créatif africain & acheteurs internationaux" : lang === "ar" ? "برنامج التوريد الإبداعي الأفريقي والمشترين الدوليين" : "African creative sourcing & international buyers",
                      badge: "SOURCING"
                    },
                    {
                      code: "MQ",
                      num: "04",
                      title: "Martinique 2028",
                      text: lang === "fr" ? "Déploiement caribéen et coopération internationale" : lang === "ar" ? "التوسع الكاريبي والتعاون الدولي" : "Caribbean expansion & international cooperation",
                      badge: lang === "fr" ? "CARAÏBES" : lang === "ar" ? "الكاريبي" : "CARIBBEAN"
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      onMouseEnter={() => setActiveVision(idx)}
                      className={`group relative cursor-pointer border p-4 sm:p-5 transition-all duration-300 ${activeVision === idx
                          ? "border-maple bg-white/20 shadow-lg translate-x-1"
                          : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/15"
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Monogram code */}
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center font-mono text-sm font-bold transition-colors ${activeVision === idx ? "bg-maple text-white" : "bg-white/10 text-white/70 group-hover:text-white"
                          }`}>
                          {item.num}
                        </div>

                        {/* Title and details */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-heading text-lg sm:text-xl font-bold text-white group-hover:text-white">
                              {item.title}
                            </h3>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-maple">
                              {item.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Bottom widget: Contact us */}
                  <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-maple" />
                      <span>{lang === "fr" ? "Une question sur la tournée ?" : lang === "ar" ? "لديك استفسار حول الجولة؟" : "Questions about the tour?"}</span>
                    </div>
                    <a
                      href="mailto:contact@capentrepreneurs.org"
                      className="font-bold text-white hover:text-maple transition-colors"
                    >
                      contact@capentrepreneurs.org
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
