import React, { useState } from "react";
import EditorialRejoindreHero from "@/components/EditorialRejoindreHero";
import FormShell from "@/components/FormShell";
import { Reveal, EditorialMarquee } from "@/components/motion";
import TiltCard from "@/components/TiltCard";
import { PARTNER_TYPES, PARTNER_TYPES_FR, PARTNER_TYPES_AR } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { ArrowUpRight, ArrowRight, CheckCircle2, Download, Handshake, Globe2, Building2, Check, ChevronDown, ChevronUp } from "lucide-react";

// Curated editorial assets matching the reference fashion/lifestyle design
const EDITORIAL_PARTNER_ASSETS = {
  mainTallPortrait: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
  floatingPortrait: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
  card1BlackDress: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
  card2WhiteDress: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
  card3MintDress: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
  card4ColorblockDress: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80",
};

const Partners = () => {
  const { lang, t } = useLang();
  const currentPartnerTypes = lang === "fr" ? PARTNER_TYPES_FR : lang === "ar" ? PARTNER_TYPES_AR : PARTNER_TYPES;
  const [showAllOffers, setShowAllOffers] = useState(false);

  const pillars = [
    {
      title: "Paris & Nairobi 2027",
      tag: lang === "fr" ? "VISIBILITÉ MONDIALE" : lang === "ar" ? "حضور عالمي" : "GLOBAL VISIBILITY",
      desc: lang === "fr"
        ? "Brunch Pré-Festival & Global Festival pour la tech inclusive et durable."
        : lang === "ar"
        ? "حفل ما قبل المهرجان والمهرجان العالمي للتكنولوجيا الشاملة والمستدامة."
        : "Pre-Festival Brunch & Global Festival for inclusive and sustainable tech.",
      image: EDITORIAL_PARTNER_ASSETS.card1BlackDress,
    },
    {
      title: "Marrakech 2027",
      tag: lang === "fr" ? "SOURCING INTERNATIONAL" : lang === "ar" ? "توريد دولي" : "INTERNATIONAL SOURCING",
      desc: lang === "fr"
        ? "Programme de sourcing créatif africain, acheteurs internationaux et délégations."
        : lang === "ar"
        ? "برنامج التوريد الإبداعي الأفريقي والمشترين الدوليين والوفود الرسمية."
        : "African creative sourcing programme, global buyers, and delegations.",
      image: EDITORIAL_PARTNER_ASSETS.card2WhiteDress,
    },
    {
      title: lang === "fr" ? "Comités & Programmes" : lang === "ar" ? "اللجان والبرامج" : "Committees & Programs",
      tag: lang === "fr" ? "GOUVERNANCE PARTAGÉE" : lang === "ar" ? "حوكمة تشاركية" : "SHARED GOVERNANCE",
      desc: lang === "fr"
        ? "Participation directe aux comités d'orientation et association stratégique."
        : lang === "ar"
        ? "المشاركة المباشرة في لجان التوجيه والتحالف الاستراتيجي."
        : "Direct involvement in steering committees and strategic co-design.",
      image: EDITORIAL_PARTNER_ASSETS.card3MintDress,
    },
    {
      title: lang === "fr" ? "Soutien & Mécénat" : lang === "ar" ? "الدعم والرعاية" : "Support & Patronage",
      tag: lang === "fr" ? "CO-CONSTRUCTION" : lang === "ar" ? "بناء مشترك" : "CO-CREATION",
      desc: lang === "fr"
        ? "Accords sur mesure, contributions en nature et co-financement d'impact social."
        : lang === "ar"
        ? "شراكات مخصصة ومساهمات عينية وتمويل مشترك للأثر الاجتماعي."
        : "Custom partnership tracks, in-kind contributions, and social impact co-funding.",
      image: EDITORIAL_PARTNER_ASSETS.card4ColorblockDress,
    },
  ];

  return (
    <div data-testid="partners-page" className="bg-[#FAF9F6] text-[#0D0E0D] font-sans selection:bg-maple selection:text-white">
      <EditorialRejoindreHero
        testId="partners-hero"
        brandName="Cap-Entrepreneurs"
        categoryKicker={lang === "fr" ? "ALLIANCES & IMPACT STRATÉGIQUE" : lang === "ar" ? "الشراكات والأثر" : "ALLIANCES & STRATEGIC IMPACT"}
        verticalKicker={lang === "fr" ? "P A R T E N A I R E S" : lang === "ar" ? "ش ر ك ا ء" : "P A R T N E R S"}
        titleLines={lang === "fr" ? ["Vision", "Partagée,", "Impact", "Mesurable."] : lang === "ar" ? ["رؤية", "مشتركة،", "وأثر", "ملموس."] : ["Shared", "Vision.", "Collective", "Impact."]}
        subtitle={t.partners.intro}
        ctaLabel={lang === "fr" ? "Collaborer avec nous" : lang === "ar" ? "تعاون معنا" : "Partner With Us"}
        ctaTarget="#partner-types-section"
        bgImage="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80"
        fgImage="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80"
      />

      {/* WHO DO WE PARTNER WITH? (5 PARTNER TYPES) */}
      <section className="mx-auto max-w-[1600px] px-5 py-24 md:py-32" data-testid="partner-types-section">
        <Reveal>
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-maple font-montserrat">{lang === "fr" ? "CADRE DE COLLABORATION" : lang === "ar" ? "إطار التعاون والشراكة" : "COLLABORATION FRAMEWORK"}</p>
            <h2 className="mt-4 font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
              {t.partners.typesTitle}
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {currentPartnerTypes.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <TiltCard className="h-full">
                <div
                  className="flex h-full flex-col justify-between border border-forest/15 bg-white p-8 rounded-2xl shadow-sm hover:border-maple transition-colors"
                  data-testid={`partner-type-${p.name.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                >
                  <div>
                    <span className="font-serif text-4xl italic text-maple">0{i + 1}</span>
                    <h3 className="mt-4 font-heading text-xl font-bold tracking-tight text-forest md:text-2xl">
                      {p.name}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-sage md:text-base">{p.detail}</p>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SECTION-BECOME A FOUNDING PARTNER (Redesigned to match the chic pastel editorial layout) */}
      <section
        className="border-t border-[#0D0E0D]/10 bg-white py-24 md:py-32"
        data-testid="founding-partner-section"
      >
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 md:px-12">

          {/* TOP EDITORIAL HERO COMPOSITION (Matching Image 2) */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 items-center">

            {/* LEFT: VERTICAL KICKER + MAIN TALL PORTRAIT PHOTO (5 cols) */}
            <div className="lg:col-span-5 flex items-start gap-4 sm:gap-6">
              {/* Vertical Rotated Kicker (Like "LOOKS" in reference) */}
              <div className="hidden sm:flex [writing-mode:vertical-rl] rotate-180 pt-6 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.45em] text-[#0D0E0D]/70 font-montserrat select-none">
                {lang === "fr" ? "P A R T E N A I R E S" : lang === "ar" ? "ش ر ك ا ء" : "P A R T N E R S"}</div>

              {/* Main Tall Portrait Image (Woman in pastel/peach minimalist look) */}
              <div className="flex-1 overflow-hidden bg-[#FAF9F6] border border-[#0D0E0D]/10 shadow-sm">
                <img
                  src={EDITORIAL_PARTNER_ASSETS.mainTallPortrait}
                  alt="Partenaire Fondateur Cap Entrepreneurs"
                  className="aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                />
              </div>
            </div>

            {/* MIDDLE: EDITORIAL NARRATIVE & ACTION LINKS (4 cols) */}
            <div className="lg:col-span-4 lg:pl-2">
              <Reveal>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-maple block mb-2 font-montserrat">
                  {lang === "fr" ? "ALLIANCES FONDATEURS" : lang === "ar" ? "تحالفات المؤسسين" : "FOUNDING ALLIANCES"}
                </span>

                <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal leading-[1.14] text-[#0D0E0D] tracking-tight">
                  {t.partners.foundingWhyTitle || "Pourquoi devenir partenaire fondateur ?"}
                </h2>

                <p className="mt-5 text-xs sm:text-sm md:text-[15px] leading-relaxed text-sage font-sans">
                  {t.partners.foundingWhy || "En soutenant Cap Entrepreneurs dès ses premières années, vous contribuez à bâtir un écosystème durable et inclusif. Vous bénéficiez d'une visibilité privilégiée et d'une association forte à l'innovation sociale et aux meilleures pratiques canadiennes."}
                </p>

                {/* Elegant Textual Links (Like "Shop the look →" in reference) */}
                <div className="mt-7 space-y-3.5">
                  <div>
                    <button
                      onClick={() => {
                        document.getElementById("partner-form-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="group inline-flex items-center gap-2 text-sm sm:text-base font-serif italic text-[#0D0E0D] hover:text-maple transition-colors"
                    >
                      <span className="not-italic font-sans text-xs font-bold uppercase tracking-[0.2em]">
                        {lang === "fr" ? "Devenir partenaire fondateur" : lang === "ar" ? "كن شريكاً مؤسساً" : "Become a founding partner"}
                      </span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                    </button>
                  </div>
                  <div>
                    <a
                      href="mailto:contact@capentrepreneurs.org?subject=Partnership%20Package%20Request"
                      className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-sage hover:text-[#0D0E0D] transition-colors"
                    >
                      <span>{t.partners.ctaPackage || "Télécharger notre dossier"}</span>
                      <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* RIGHT: FLOATING SECONDARY PORTRAIT PHOTO (3 cols) */}
            <div className="hidden lg:block lg:col-span-3 self-start justify-self-end w-full max-w-[240px]">
              <Reveal delay={0.15}>
                <div className="overflow-hidden bg-[#FAF9F6] border border-[#0D0E0D]/10 shadow-sm">
                  <img
                    src={EDITORIAL_PARTNER_ASSETS.floatingPortrait}
                    alt="Vision Partenaire"
                    className="aspect-[3/4] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                  />
                </div>
                <p className="mt-2 text-right text-[10px] uppercase font-bold tracking-widest text-sage font-serif italic">
                  {lang === "fr" ? "Édition Fondateurs 2026-2027" : lang === "ar" ? "نسخة المؤسسين 2026-2027" : "Founders Edition 2026-2027"}
                </p>
              </Reveal>
            </div>

          </div>

          {/* BOTTOM ROW: 4 VERTICAL PRODUCT/PILLAR CARDS (Matching Image 2) */}
          <div className="mt-20 pt-16 border-t border-[#0D0E0D]/10">
            <Reveal>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {pillars.map((pillar, idx) => (
                  <div
                    key={idx}
                    className="group cursor-pointer flex flex-col justify-between"
                    onClick={() => setShowAllOffers(true)}
                  >
                    {/* Tall Vertical Photo (Like the 4 dress cards in reference) */}
                    <div className="overflow-hidden bg-[#FAF9F6] border border-[#0D0E0D]/10 transition-shadow duration-500 group-hover:shadow-md">
                      <img
                        src={pillar.image}
                        alt={pillar.title}
                        className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    {/* Card Captions matching the reference fashion product typography */}
                    <div className="mt-4 text-center">
                      <h4 className="font-serif text-sm sm:text-base font-bold text-[#0D0E0D] group-hover:text-maple transition-colors">
                        {pillar.title}
                      </h4>
                      <p className="mt-1 text-[11px] font-bold tracking-wider uppercase text-sage">
                        {pillar.tag}
                      </p>
                      <p className="mt-1 text-xs text-sage/80 line-clamp-2">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expandable / Full Offers Trigger */}
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllOffers(!showAllOffers)}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#0D0E0D] hover:text-maple transition-colors border-b border-[#0D0E0D] pb-1 hover:border-maple"
                >
                  <span>{showAllOffers ? (lang === "fr" ? "Masquer les détails" : lang === "ar" ? "إخفاء التفاصيل" : "Hide details") : (lang === "fr" ? "Explorer les 9 opportunités de partenariat" : lang === "ar" ? "استكشف 9 فرص شراكة" : "Explore all 9 partnership opportunities")}</span>
                  {showAllOffers ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              {/* Full 9 Offers Breakdown */}
              {showAllOffers && (
                <div className="mt-10 rounded-none border border-[#0D0E0D]/10 bg-[#FAF9F6] p-8 md:p-12 transition-all">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-center text-[#0D0E0D] mb-8">
                    {t.partners.whatWeOfferTitle || "CE QUE NOUS OFFRONS :"}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {t.partners.offers.map((offer, idx) => (
                      <div key={idx} className="flex items-start gap-3 border border-[#0D0E0D]/10 bg-white p-4">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-maple text-white shrink-0 mt-0.5">
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-xs sm:text-sm font-medium leading-relaxed text-[#0D0E0D]">{offer}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-6 border-t border-[#0D0E0D]/10 flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => {
                        document.getElementById("partner-form-section")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="bg-[#232724] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-maple transition-colors"
                    >
                      {t.partners.ctaFounding} →
                    </button>
                    <a
                      href="mailto:contact@capentrepreneurs.org?subject=Partnership%20Package%20Request"
                      className="border border-[#0D0E0D] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:bg-white transition-colors"
                    >
                      {t.partners.ctaPackage}
                    </a>
                  </div>
                </div>
              )}
            </Reveal>
          </div>

        </div>
      </section>

      <EditorialMarquee
        testId="partners-marquee"
        items={t.partners.marquee}
      />

      {/* PARTNER FORM */}
      <section id="partner-form-section" className="bg-white py-24 md:py-32" data-testid="partner-form-section">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-5 md:px-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-maple">
              <span className="inline-block h-px w-10 bg-maple" />
              {t.partners.formEyebrow}
            </p>
            <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
              {t.partners.formTitle}
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-sage md:text-lg">
              {t.partners.formCopy}
            </p>
          </Reveal>
          <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
            <FormShell
              type="partner"
              testId="partner-form"
              submitLabel={t.partners.formSubmit}
              successMessage={t.partners.formSuccess}
              fields={[
                { name: "name", label: t.form.name, placeholder: t.form.namePh, required: true },
                { name: "email", label: t.form.email, kind: "email", placeholder: t.form.emailPh, required: true },
                { name: "organization", label: t.partners.orgLabel, placeholder: t.partners.orgPh, required: true },
                {
                  name: "partnerType",
                  label: t.partners.typeLabel,
                  kind: "select",
                  placeholder: t.partners.typePh,
                  options: currentPartnerTypes.map((p) => p.name),
                  required: true,
                },
                {
                  name: "message",
                  label: t.partners.ideaLabel,
                  kind: "textarea",
                  placeholder: t.partners.ideaPh,
                },
              ]}
            />
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Partners;
