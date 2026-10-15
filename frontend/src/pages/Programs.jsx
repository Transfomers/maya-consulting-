import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ArrowRight,
  Sparkles,
  Globe2,
  Calendar,
  Share2,
  Twitter,
  Linkedin,
  Mail,
  CheckCircle2
} from "lucide-react";
import { Reveal } from "@/components/motion";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { toast } from "sonner";

// Photo assets matching the reference magazine editorial
const PROGRAM_ASSETS = {
  // Dramatic high-contrast black turtleneck portrait for header right
  heroPortrait: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80",

  // Triad of 3 vertical photos matching reference image
  triad1: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
  triad2: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
  triad3: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
};

const Programs = () => {
  const { lang, t } = useLang();
  const formRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    program: "Cap Green Lab",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const scrollToApply = (programName) => {
    if (programName) {
      setFormData(prev => ({ ...prev, program: programName }));
    }
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.program) {
      toast.error("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/submissions", {
        type: "program",
        payload: formData
      });
      toast.success("Votre candidature a bien été transmise ! Notre équipe prendra contact avec vous.");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div data-testid="programs-page" className="min-h-screen bg-white text-[#0D0E0D] font-sans selection:bg-maple selection:text-white">

      {/* 1. EDITORIAL HEADER (Matching reference image: la- script, multiline serif title, dramatic B&W portrait) */}
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
                    {t.programs.eyebrow || (lang === "fr" ? "PROGRAMMES STRUCTURANTS" : lang === "ar" ? "البرامج الهيكلية" : "STRUCTURING PROGRAMS")}
                  </span>
                </div>

                {/* Massive Multiline Serif Headline */}
                <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[84px] font-normal leading-[1.02] text-[#0D0E0D] tracking-tight">
                  {t.programs.h1a}<br />
                  {t.programs.h1accent}
                </h1>

                {/* Edition tag / date matching reference */}
                <div className="mt-6 flex items-center gap-4 text-xs font-montserrat tracking-[0.2em] uppercase text-sage">
                  <span>{t.programs.editionTag || "ÉDITION 2026-2027 • CAP ENTREPRENEURS"}</span>
                </div>

                {/* Quick Anchor Link */}
                <div className="mt-8">
                  <button
                    onClick={() => scrollToSection("sommaire-section")}
                    className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:text-maple transition-colors"
                  >
                    <span>{t.programs.exploreCta || (lang === "fr" ? "Explorer les programmes" : "Explore Programs")}</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </Reveal>
            </div>

            {/* RIGHT: DRAMATIC HIGH-CONTRAST TURTLENECK PORTRAIT (5 cols) */}
            <div className="lg:col-span-5">
              <Reveal delay={0.2}>
                <div className="relative mx-auto max-w-[440px] lg:max-w-none overflow-hidden bg-black shadow-lg">
                  <img
                    src={PROGRAM_ASSETS.heroPortrait}
                    alt="Cap Entrepreneurs - Vision & Impact"
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
                    {t.programs.tocTitle || (lang === "fr" ? "DANS CET ARTICLE" : lang === "ar" ? "محتويات الصفحة" : "IN THIS ARTICLE")}
                  </span>
                  <span className="text-xs font-mono text-sage">-</span>
                </div>

                <ol className="space-y-2.5 text-xs">
                  {[
                    { num: "1", title: "Cap Green Lab", id: "cap-green-lab" },
                    { num: "2", title: "AgriConnect", id: "agriconnect" },
                    { num: "3", title: "Safe Vibe", id: "safe-vibe" },
                    { num: "4", title: "Créatif & Social", id: "creatif-social" },
                    { num: "5", title: "Global Festival", id: "global-festival" },
                    { num: "6", title: "Notre Calendrier", id: "calendrier" },
                    { num: "7", title: "Candidature", id: "apply" }
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
                  {t.programs.shareTitle || (lang === "fr" ? "PARTAGER" : lang === "ar" ? "مشاركة" : "SHARE")}
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href="https://twitter.com/intent/tweet?text=Découvrez%20les%20programmes%20de%20Cap%20Entrepreneurs"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center border border-[#0D0E0D]/10 text-sage hover:text-maple hover:border-maple transition-colors"
                  >
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="https://www.linkedin.com/sharing/share-offsite/?url=https://capentrepreneurs.org/programs"
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center border border-[#0D0E0D]/10 text-sage hover:text-maple hover:border-maple transition-colors"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="mailto:?subject=Programmes%20Cap%20Entrepreneurs&body=https://capentrepreneurs.org/programs"
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

            {/* DROP CAP INTRODUCTORY PARAGRAPH (Matching giant 'Y' in reference image) */}
            <div className="border-b border-[#0D0E0D]/10 pb-12">
              <Reveal>
                <div className="text-base sm:text-lg leading-[1.85] text-[#2D312E] font-serif">
                  <span className="drop-cap-editorial select-none">
                    {t.programs.intro ? t.programs.intro.charAt(0) : "C"}
                  </span>
                  {t.programs.intro ? t.programs.intro.slice(1) : "ap Entrepreneurs déploie quatre programmes structurants qui répondent aux besoins des individus, des organisations et des territoires. Chaque programme combine apprentissage, accompagnement, expérimentation et déploiement solidaire."}
                </div>
              </Reveal>
            </div>

            {/* PROGRAMME 01 : CAP GREEN LAB */}
            <article id="cap-green-lab" className="scroll-mt-28 space-y-6">
              <Reveal>
                <div className="border-b border-[#0D0E0D]/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block mb-1">
                    01 • TECHNOLOGIE INCLUSIVE & ÉCONOMIE CIRCULAIRE
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#0D0E0D]">
                    Cap Green Lab
                  </h2>
                </div>

                <p className="font-serif italic text-base sm:text-lg text-sage leading-relaxed">
                  Cap Green Lab est notre laboratoire dédié à la convergence de la transition numérique, de l'accessibilité, des compétences techniques et de l'économie circulaire.
                </p>

                {/* Ce que nous faisons */}
                <div className="pt-2">
                  <h3 className="font-serif text-lg font-bold text-[#0D0E0D] mb-3">
                    {lang === "fr" ? "Ce que nous faisons :" : lang === "ar" ? "ما نقوم به:" : "What We Do:"}
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-sage leading-relaxed font-sans">
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Reconditionnement et réemploi des équipements numériques" : lang === "ar" ? "تجديد وإعادة استخدام المعدات الرقمية" : "Refurbishing and reuse of digital hardware"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Accessibilité technologique pour les personnes en situation de handicap" : lang === "ar" ? "إتاحة التكنولوجيا للأشخاص ذوي الإعاقة" : "Assistive tech accessibility for persons with disabilities"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Formation au diagnostic, à la maintenance et au reconditionnement" : lang === "ar" ? "تدريب على التشخيص والصيانة والتجديد" : "Diagnostics, maintenance and hardware refurbishment training"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Ingénierie informatique et gestion responsable de parcs" : lang === "ar" ? "هندسة الحاسوب والإدارة المسؤولة للأجهزة" : "IT engineering and sustainable hardware fleet management"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Réduction durable de la fracture numérique" : lang === "ar" ? "الحد المستدام من الفجوة الرقمية" : "Sustainable digital divide reduction"}</span>
                    </li>
                  </ul>
                </div>

                {/* Pour qui */}
                <div className="pt-2">
                  <h4 className="font-serif text-sm font-bold text-[#0D0E0D] mb-1">
                    {lang === "fr" ? "Pour qui ?" : lang === "ar" ? "الفئات المستهدفة:" : "Who Is This For?"}
                  </h4>
                  <p className="text-xs sm:text-sm text-sage font-sans">
                    {lang === "fr"
                      ? "Personnes en transition professionnelle, techniciens, bénévoles, OBNL et collectivités."
                      : lang === "ar"
                      ? "الأفراد في مسارات التحول المهني، والتقنيون، والمتطوعون، والمنظمات غير الربحية."
                      : "Career switchers, technicians, volunteers, non-profits, and community partners."}
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => scrollToApply("Cap Green Lab")}
                    className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:text-maple transition-colors"
                  >
                    <span>{lang === "fr" ? "Postuler à ce programme" : lang === "ar" ? "التقديم لهذا البرنامج" : "Apply to this program"}</span>
                    <span className="transition-transform group-hover:translate-x-1.5">→</span>
                  </button>
                </div>
              </Reveal>
            </article>

            {/* PROGRAMME 02 : AGRICONNECT */}
            <article id="agriconnect" className="scroll-mt-28 space-y-6 pt-10 border-t border-[#0D0E0D]/10">
              <Reveal>
                <div className="border-b border-[#0D0E0D]/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block mb-1">
                    {lang === "fr" ? "02 • ENTREPRENEURIAT RURAL & AGRICULTURE NUMÉRIQUE" : lang === "ar" ? "02 • ريادة الأعمال الريفية والزراعة الرقمية" : "02 • RURAL ENTREPRENEURSHIP & DIGITAL AGRICULTURE"}
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#0D0E0D]">
                    AgriConnect
                  </h2>
                </div>

                <p className="font-serif italic text-base sm:text-lg text-sage leading-relaxed">
                  {lang === "fr"
                    ? "AgriConnect soutient l'entrepreneuriat rural et l'agriculture numérique en connectant coopératives, femmes entrepreneures et jeunes agriculteurs aux outils et aux marchés."
                    : lang === "ar"
                    ? "يدعم أجري كونكت ريادة الأعمال الريفية والزراعة الرقمية من خلال ربط التعاونيات والنساء الرياديات والشباب بالأدوات والأسواق."
                    : "AgriConnect empowers rural entrepreneurship and smart agriculture by linking cooperatives, women entrepreneurs and young growers with modern tools and markets."}
                </p>

                {/* Ce que nous faisons */}
                <div className="pt-2">
                  <h3 className="font-serif text-lg font-bold text-[#0D0E0D] mb-3">
                    {lang === "fr" ? "Ce que nous faisons :" : lang === "ar" ? "ما نقوم به:" : "What We Do:"}
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-sage leading-relaxed font-sans">
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Formation aux outils agricoles numériques" : lang === "ar" ? "التدريب على أدوات الزراعة الرقمية" : "Smart agriculture digital tools training"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Accompagnement des coopératives et des femmes rurales" : lang === "ar" ? "مرافقة التعاونيات والنساء في المناطق الريفية" : "Guidance for cooperatives and rural women leaders"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Accès aux marchés équitables et aux financements solidaires" : lang === "ar" ? "تسهيل الوصول للأسواق العادلة والتمويل التضامني" : "Access to fair-trade markets and ethical finance"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Développement de solutions numériques adaptées aux contextes ruraux" : lang === "ar" ? "تطوير حلول رقمية مخصصة للسياقات الريفية" : "Developing custom digital solutions for rural contexts"}</span>
                    </li>
                  </ul>
                </div>

                {/* Pour qui */}
                <div className="pt-2">
                  <h4 className="font-serif text-sm font-bold text-[#0D0E0D] mb-1">
                    {lang === "fr" ? "Pour qui ?" : lang === "ar" ? "الفئات المستهدفة:" : "Who Is This For?"}
                  </h4>
                  <p className="text-xs sm:text-sm text-sage font-sans">
                    {lang === "fr"
                      ? "Coopératives, agriculteurs, femmes rurales, entrepreneurs agricoles."
                      : lang === "ar"
                      ? "التعاونيات، والمزارعون، والنساء الريفيات، ورواد الأعمال الزراعيون."
                      : "Cooperatives, smallholders, rural women entrepreneurs, agricultural innovators."}
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => scrollToApply("AgriConnect")}
                    className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:text-maple transition-colors"
                  >
                    <span>{lang === "fr" ? "Postuler à ce programme" : lang === "ar" ? "التقديم لهذا البرنامج" : "Apply to this program"}</span>
                    <span className="transition-transform group-hover:translate-x-1.5">→</span>
                  </button>
                </div>
              </Reveal>
            </article>

            {/* 3. PHOTO TRIAD (Matching the 3 vertical photo cards in reference image) */}
            <div className="my-14 py-8 border-y border-[#0D0E0D]/10">
              <Reveal>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Photo 1 */}
                  <div>
                    <div className="overflow-hidden bg-[#FAF9F6] border border-[#0D0E0D]/10">
                      <img
                        src={PROGRAM_ASSETS.triad1}
                        alt="Cap Green Lab - Reconditionnement"
                        className="aspect-[3/4] w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-sage font-serif italic text-center">
                      © Cap Green Lab- Atelier & Reconditionnement
                    </p>
                  </div>

                  {/* Photo 2 */}
                  <div>
                    <div className="overflow-hidden bg-[#FAF9F6] border border-[#0D0E0D]/10">
                      <img
                        src={PROGRAM_ASSETS.triad2}
                        alt="AgriConnect - Terroirs Connectés"
                        className="aspect-[3/4] w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-sage font-serif italic text-center">
                      AgriConnect- Terroirs & Marchés Connectés
                    </p>
                  </div>

                  {/* Photo 3 */}
                  <div>
                    <div className="overflow-hidden bg-[#FAF9F6] border border-[#0D0E0D]/10">
                      <img
                        src={PROGRAM_ASSETS.triad3}
                        alt="Safe Vibe - Studio Média"
                        className="aspect-[3/4] w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                    <p className="mt-2 text-[10px] text-sage font-serif italic text-center">
                      Safe Vibe- Studio Média & Création
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* PROGRAMME 03 : SAFE VIBE */}
            <article id="safe-vibe" className="scroll-mt-28 space-y-6 pt-10 border-t border-[#0D0E0D]/10">
              <Reveal>
                <div className="border-b border-[#0D0E0D]/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block mb-1">
                    {lang === "fr" ? "03 • CITOYENNETÉ & MÉDIAS NUMÉRIQUES" : lang === "ar" ? "03 • المواطنة والإعلام الرقمي" : "03 • CITIZENSHIP & DIGITAL MEDIA"}
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#0D0E0D]">
                    Safe Vibe
                  </h2>
                </div>

                <p className="font-serif italic text-base sm:text-lg text-sage leading-relaxed">
                  {lang === "fr"
                    ? "Safe Vibe est notre programme d'éducation numérique et de production médiatique. Il outille les jeunes et les communautés pour devenir des créateurs de contenu responsables et des citoyens numériques éclairés."
                    : lang === "ar"
                    ? "سيف فايب هو برنامجنا للتربية الرقمية والإنتاج الإعلامي، حيث يزود الشباب والمجتمعات بالمهارات ليكونوا صناع محتوى مسؤولين ومواطنين رقميين واعين."
                    : "Safe Vibe is our digital media literacy and creative production program, equipping young voices and communities to become responsible creators and informed digital citizens."}
                </p>

                {/* Ce que nous faisons */}
                <div className="pt-2">
                  <h3 className="font-serif text-lg font-bold text-[#0D0E0D] mb-3">
                    {lang === "fr" ? "Ce que nous faisons :" : lang === "ar" ? "ما نقوم به:" : "What We Do:"}
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-sage leading-relaxed font-sans">
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Éducation aux médias et à l'information citoyenne" : lang === "ar" ? "التربية على وسائل الإعلام والمعلومات" : "Media and digital information literacy"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Création de contenu éthique (vidéo, podcast, réseaux sociaux)" : lang === "ar" ? "إنتاج محتوى مسؤول (فيديو، بودكاست، شبكات)" : "Ethical content creation (video, podcast, digital)"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Compétences numériques fondamentales et avancées" : lang === "ar" ? "مهارات رقمية أساسية ومتقدمة" : "Foundational and advanced digital skills"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>{lang === "fr" ? "Sensibilisation à la sécurité et bienveillance en ligne" : lang === "ar" ? "التوعية بالأمان الرقمي والسلامة على الإنترنت" : "Online safety and digital well-being advocacy"}</span>
                    </li>
                  </ul>
                </div>

                {/* Pour qui */}
                <div className="pt-2">
                  <h4 className="font-serif text-sm font-bold text-[#0D0E0D] mb-1">
                    {lang === "fr" ? "Pour qui ?" : lang === "ar" ? "الفئات المستهدفة:" : "Who Is This For?"}
                  </h4>
                  <p className="text-xs sm:text-sm text-sage font-sans">
                    {lang === "fr"
                      ? "Jeunes, écoles, associations communautaires, créateurs de contenu émergents."
                      : lang === "ar"
                      ? "الشباب، والمدارس، والجمعيات الأهلية، وصناع المحتوى الصاعدون."
                      : "Youth, schools, community associations, emerging content creators."}
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => scrollToApply("Safe Vibe")}
                    className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:text-maple transition-colors"
                  >
                    <span>{lang === "fr" ? "Postuler à ce programme" : lang === "ar" ? "التقديم لهذا البرنامج" : "Apply to this program"}</span>
                    <span className="transition-transform group-hover:translate-x-1.5">→</span>
                  </button>
                </div>
              </Reveal>
            </article>

            {/* PROGRAMME 04 : ENTREPRENEURIAT CRÉATIF & SOCIAL */}
            <article id="creatif-social" className="scroll-mt-28 space-y-6 pt-10 border-t border-[#0D0E0D]/10">
              <Reveal>
                <div className="border-b border-[#0D0E0D]/10 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat block mb-1">
                    04 • FEMMES, ARTS & INNOVATION SOCIALE
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#0D0E0D]">
                    Entrepreneuriat Créatif & Social
                  </h2>
                </div>

                <p className="font-serif italic text-base sm:text-lg text-sage leading-relaxed">
                  Ce programme soutient l'entrepreneuriat féminin, les arts et l'innovation sociale. Il accompagne les femmes et les créatifs dans la structuration de leurs projets et la création de modèles économiques durables.
                </p>

                {/* Ce que nous faisons */}
                <div className="pt-2">
                  <h3 className="font-serif text-lg font-bold text-[#0D0E0D] mb-3">
                    Ce que nous faisons :
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm text-sage leading-relaxed font-sans">
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>Soutien à l'entrepreneuriat féminin</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>Développement de l'économie créative</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>Formation en gestion et développement de projets</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-maple font-bold mt-0.5">•</span>
                      <span>Réseautage et accès aux opportunités</span>
                    </li>
                  </ul>
                </div>

                {/* Pour qui */}
                <div className="pt-2">
                  <h4 className="font-serif text-sm font-bold text-[#0D0E0D] mb-1">
                    Pour qui ?
                  </h4>
                  <p className="text-xs sm:text-sm text-sage font-sans">
                    Femmes entrepreneures, artistes, créatifs, porteurs de projets sociaux.
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => scrollToApply("Entrepreneuriat Créatif & Social")}
                    className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:text-maple transition-colors"
                  >
                    <span>Postuler à ce programme</span>
                    <span className="transition-transform group-hover:translate-x-1.5">→</span>
                  </button>
                </div>
              </Reveal>
            </article>

            {/* SECTION : LE GLOBAL FESTIVAL NAIROBI 2027 */}
            <section id="global-festival" className="scroll-mt-28 bg-[#FAF9F6] border border-[#0D0E0D]/10 p-8 sm:p-12 shadow-sm">
              <Reveal>
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-maple font-montserrat block mb-1">
                    {t.programs.festivalTitle || "LE GLOBAL FESTIVAL"}
                  </span>
                  <h3 className="font-serif text-3xl sm:text-4xl font-medium text-[#0D0E0D]">
                    {lang === "fr" ? "Nairobi 2027" : lang === "ar" ? "نيروبي 2027" : "Nairobi 2027"}
                  </h3>
                  <div className="mx-auto mt-3 mb-4 h-[2px] w-12 bg-maple" />
                  <p className="font-serif italic text-sm sm:text-base text-sage leading-relaxed">
                    {t.programs.festivalIntro || "Un rassemblement mondial pour une tech inclusive, accessible et durable. Le Global Festival Nairobi 2027 réunit innovateurs, entrepreneurs, institutions et communautés autour de quatre espaces :"}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { num: "01", title: "Tech Inclusive", desc: "Accessibilité, handicap, design universel." },
                    { num: "02", title: "Tech Circulaire", desc: "Réemploi, réparation, économie circulaire." },
                    { num: "03", title: "Compétences Numériques", desc: "Compétences, employabilité, formation." },
                    { num: "04", title: "Innovation Sociale", desc: "Solutions numériques pour les communautés." }
                  ].map((space) => (
                    <div key={space.num} className="border border-[#0D0E0D]/10 bg-white p-5">
                      <span className="font-serif text-2xl italic text-maple block mb-1">{space.num}</span>
                      <h4 className="font-serif text-lg font-bold text-[#0D0E0D]">{space.title}</h4>
                      <p className="mt-1 text-xs text-sage leading-relaxed font-sans">{space.desc}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </section>

            {/* SECTION : NOTRE CALENDRIER */}
            <section id="calendrier" className="scroll-mt-28 space-y-6 pt-10 border-t border-[#0D0E0D]/10">
              <Reveal>
                <div className="text-center max-w-xl mx-auto mb-10">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-maple font-montserrat block mb-1">
                    FEUILLE DE ROUTE
                  </span>
                  <h3 className="font-serif text-3xl sm:text-4xl font-medium text-[#0D0E0D]">
                    Notre Calendrier
                  </h3>
                  <div className="mx-auto mt-3 mb-3 h-[2px] w-12 bg-maple" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { year: "2026", city: "Bâtir", desc: "Structuration des programmes et comités" },
                    { year: "2027", city: "Connecter", desc: "Déploiement des programmes et mobilisation" },
                    { year: "2027", city: "Paris", desc: "Brunch Pré-Festival" },
                    { year: "2027", city: "Nairobi", desc: "Global Festival" },
                    { year: "2027", city: "Marrakech", desc: "Sourcing Créatif Africain" },
                    { year: "2028", city: "Martinique", desc: "Expansion internationale" }
                  ].map((cal, idx) => (
                    <div key={idx} className="border border-[#0D0E0D]/10 bg-[#FAF9F6] p-4 text-center">
                      <span className="font-serif text-xl italic text-maple block">{cal.year}</span>
                      <span className="font-montserrat text-xs font-bold uppercase tracking-wider text-[#0D0E0D] block mt-1">{cal.city}</span>
                      <p className="mt-1 text-[11px] text-sage leading-relaxed font-sans">{cal.desc}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </section>

            {/* SECTION : CANDIDATURE AU PROGRAMME (Form at the end) */}
            <section
              ref={formRef}
              id="apply"
              className="scroll-mt-28 bg-[#FAF9F6] border border-[#0D0E0D]/10 p-8 sm:p-12 shadow-sm"
            >
              <Reveal>
                <div className="text-center max-w-xl mx-auto mb-10">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-maple font-montserrat block mb-1">
                    {t.programs.formEyebrow || (lang === "fr" ? "CANDIDATURE" : "APPLICATION")}
                  </span>
                  <h3 className="font-serif text-3xl sm:text-4xl font-medium text-[#0D0E0D]">
                    {t.programs.formTitle || (lang === "fr" ? "Candidature au Programme" : "Program Application")}
                  </h3>
                  <div className="mx-auto mt-3 mb-3 h-[2px] w-12 bg-maple" />
                  <p className="font-serif italic text-sm text-sage leading-relaxed">
                    {t.programs.formCopy || (lang === "fr" ? "Commencer votre parcours. Parlez-nous de vous, de votre projet et du programme qui vous intéresse." : "Begin your journey. Tell us about yourself, your organization and which program interests you.")}
                  </p>
                </div>

                {submitted ? (
                  <div className="border border-maple bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-maple text-white">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <h4 className="font-serif text-2xl font-bold text-[#0D0E0D]">
                      {lang === "fr" ? "Candidature transmise avec succès !" : lang === "ar" ? "تم استلام طلبك بنجاح!" : "Application Submitted Successfully!"}
                    </h4>
                    <p className="mt-2 text-xs sm:text-sm text-sage max-w-md mx-auto">
                      {lang === "fr"
                        ? "Merci pour votre intérêt envers nos programmes. Un coordonnateur de projet communiquera avec vous prochainement."
                        : lang === "ar"
                        ? "شكراً لاهتمامك ببرامجنا. سيتواصل معك منسق المشاريع في أقرب وقت."
                        : "Thank you for your interest in our programs. A project coordinator will contact you shortly."}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: "",
                          email: "",
                          organization: "",
                          program: "Cap Green Lab",
                          message: ""
                        });
                      }}
                      className="mt-6 border border-[#0D0E0D] px-6 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-[#0D0E0D] hover:bg-[#FAF9F6]"
                    >
                      {lang === "fr" ? "Soumettre une autre candidature" : lang === "ar" ? "تقديم طلب آخر" : "Submit Another Application"}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-5 max-w-2xl mx-auto">

                    {/* Nom & Email */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                          {lang === "fr" ? "NOM COMPLET *" : lang === "ar" ? "الاسم الكامل *" : "FULL NAME *"}
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder={lang === "fr" ? "Votre nom complet" : lang === "ar" ? "اسمك الكامل" : "Your full name"}
                          value={formData.name}
                          onChange={handleFormChange}
                          className="w-full border border-[#0D0E0D]/20 bg-white px-3.5 py-2.5 text-sm text-[#0D0E0D] placeholder:text-sage/50 focus:border-maple focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                          {lang === "fr" ? "COURRIEL *" : lang === "ar" ? "البريد الإلكتروني *" : "EMAIL ADDRESS *"}
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          placeholder={lang === "fr" ? "nom@exemple.com" : lang === "ar" ? "name@example.com" : "you@example.com"}
                          value={formData.email}
                          onChange={handleFormChange}
                          className="w-full border border-[#0D0E0D]/20 bg-white px-3.5 py-2.5 text-sm text-[#0D0E0D] placeholder:text-sage/50 focus:border-maple focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Organisation */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                        {lang === "fr" ? "ORGANISATION / INITIATIVE" : lang === "ar" ? "المنظمة أو المبادرة" : "ORGANIZATION / INITIATIVE"}
                      </label>
                      <input
                        type="text"
                        name="organization"
                        placeholder={lang === "fr" ? "Nom de votre organisme, coopérative ou démarche" : lang === "ar" ? "اسم منظمتك أو تعاونيتك أو صفتك الفردية" : "Name of your organization, cooperative or individual status"}
                        value={formData.organization}
                        onChange={handleFormChange}
                        className="w-full border border-[#0D0E0D]/20 bg-white px-3.5 py-2.5 text-sm text-[#0D0E0D] placeholder:text-sage/50 focus:border-maple focus:outline-none"
                      />
                    </div>

                    {/* Programme selector */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                        {lang === "fr" ? "PROGRAMME SOLLICITÉ *" : lang === "ar" ? "البرنامج المطلوب *" : "PROGRAM OF INTEREST *"}
                      </label>
                      <select
                        name="program"
                        required
                        value={formData.program}
                        onChange={handleFormChange}
                        className="w-full border border-[#0D0E0D]/20 bg-white px-3.5 py-2.5 text-sm text-[#0D0E0D] focus:border-maple focus:outline-none"
                      >
                        <option value="Cap Green Lab">Cap Green Lab- Technologie inclusive & économie circulaire</option>
                        <option value="AgriConnect">AgriConnect- Entrepreneuriat rural & agriculture numérique</option>
                        <option value="Safe Vibe">Safe Vibe- Médias numériques & éducation</option>
                        <option value="Entrepreneuriat Créatif & Social">Entrepreneuriat Créatif & Social- Femmes, arts & innovation sociale</option>
                      </select>
                    </div>

                    {/* Vos objectifs */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                        {lang === "fr" ? "VOS OBJECTIFS & MOTIVATION *" : lang === "ar" ? "أهدافك ودوافعك *" : "YOUR GOALS & MOTIVATION *"}
                      </label>
                      <textarea
                        name="message"
                        required
                        rows={4}
                        placeholder={lang === "fr" ? "Présentez brièvement votre profil, vos attentes et ce que vous souhaitez accomplir à travers ce programme..." : lang === "ar" ? "أخبرنا بإيجاز عن خلفيتك وأهدافك وتطلعاتك من البرنامج..." : "Briefly describe your background, expectations, and goals for this program..."}
                        value={formData.message}
                        onChange={handleFormChange}
                        className="w-full border border-[#0D0E0D]/20 bg-white px-3.5 py-2.5 text-sm text-[#0D0E0D] placeholder:text-sage/50 focus:border-maple focus:outline-none"
                      />
                    </div>

                    {/* Submit button */}
                    <div className="pt-2 text-center sm:text-left">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto bg-[#232724] px-10 py-3.5 text-xs font-bold uppercase tracking-[0.25em] text-white hover:bg-maple transition-colors disabled:opacity-50"
                      >
                        {submitting ? (lang === "fr" ? "ENVOI EN COURS..." : lang === "ar" ? "جاري الإرسال..." : "SENDING...") : (t.programs.submit || (lang === "fr" ? "SOUMETTRE MA CANDIDATURE" : lang === "ar" ? "إرسال طلب الترشح" : "SUBMIT APPLICATION"))}
                      </button>
                    </div>

                  </form>
                )}
              </Reveal>
            </section>

          </div>

        </div>
      </main>

    </div>
  );
};

export default Programs;
