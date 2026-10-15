import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
  CheckCircle2,
  Download,
  BookOpen,
  FileText,
  X,
  ExternalLink,
  Layers,
  HelpCircle,
  FileCheck,
  Send,
  Clock,
  Tag
} from "lucide-react";
import { Reveal } from "@/components/motion";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { toast } from "sonner";

// Photo assets matching the reference magazine editorial
const PROGRAM_ASSETS = {
  heroPortrait: "/assets/images/women_social_innovators.webp",
  triad1: "/assets/images/cap_green_lab.webp",
  triad2: "/assets/images/agriconnect_farming.webp",
  triad3: "/assets/images/safe_vibe_media.webp",
};

const FALLBACK_RESOURCES = [
  {
    id: "res-1",
    title: "Manuel de Reconditionnement Circulaire & Éco-Conception Numérique",
    slug: "manuel-reconditionnement-circulaire-eco-conception",
    program: "Cap Green Lab",
    category: { name: "Cap Green Lab", slug: "cap-green-lab" },
    resource_type: "course",
    description: "Guide technique et pédagogique pour la mise en place d'ateliers de réemploi informatique, le diagnostic matériel, le cycle de vie des équipements et les filières solidaires.",
    author: "Équipe Pédagogique Cap Green Lab",
    tags: "Économie Circulaire, Reconditionnement, Matériel, Tech Inclusive",
    file_size: "4.2 Mo",
    mime_type: "application/pdf",
    file_url: "/assets/guides/cap-green-lab-reconditionnement.pdf",
    is_featured: true,
  },
  {
    id: "res-2",
    title: "Guide Pratique AgriConnect : Solutions Mobiles & Circuits Courts Ruraux",
    slug: "guide-pratique-agriconnect-solutions-mobiles-circuits-courts",
    program: "AgriConnect",
    category: { name: "AgriConnect", slug: "agriconnect" },
    resource_type: "guide",
    description: "Méthodologie de terrain pour les coopératives agricoles et entrepreneurs ruraux : intégration d'outils numériques simples, logistique de proximité et valorisation locale.",
    author: "Pôle Agro-Innovation & Ruralité",
    tags: "Agriculture Numérique, Circuits Courts, Ruralité, Outils Mobiles",
    file_size: "3.8 Mo",
    mime_type: "application/pdf",
    file_url: "/assets/guides/agriconnect-solutions-mobiles.pdf",
    is_featured: true,
  },
  {
    id: "res-3",
    title: "Toolkit Pédagogique Safe Vibe : Éducation aux Médias & Citoyenneté Numérique",
    slug: "toolkit-pedagogique-safe-vibe-education-medias",
    program: "Safe Vibe",
    category: { name: "Safe Vibe", slug: "safe-vibe" },
    resource_type: "toolkit",
    description: "Boîte à outils complète pour enseignants et médiateurs jeunesse : 12 fiches d'ateliers interactifs sur la lutte contre la désinformation, l'esprit critique et la sécurité en ligne.",
    author: "Département Médias & Éducation Numérique",
    tags: "Médias, Cybersécurité, Éducation, Jeunesse, Esprit Critique",
    file_size: "5.1 Mo",
    mime_type: "application/pdf",
    file_url: "/assets/guides/safe-vibe-kit-pedagogique.pdf",
    is_featured: true,
  },
  {
    id: "res-4",
    title: "Guide d'Incubation : Femmes, Artisanat & Entrepreneuriat Créatif Durable",
    slug: "guide-incubation-femmes-artisanat-entrepreneuriat-creatif",
    program: "Créatif & Social",
    category: { name: "Créatif & Social", slug: "creatif-social" },
    resource_type: "course",
    description: "Module de formation structurant pour transformer un savoir-faire artisanal ou artistique en marque durable, de la formalisation financière au marketing digital éthique.",
    author: "Collectif Femmes & Innovation Sociale",
    tags: "Femmes Entrepreneures, Artisanat, Modèle Économique, Économie Sociale",
    file_size: "3.4 Mo",
    mime_type: "application/pdf",
    file_url: "/assets/guides/femmes-entrepreneuriat-creatif.pdf",
    is_featured: true,
  },
  {
    id: "res-5",
    title: "Livre Blanc & Guide de Coopération : Global Festival Nairobi 2027",
    slug: "livre-blanc-cooperation-internationale-nairobi-2027",
    program: "Global Festival",
    category: { name: "Global Festival", slug: "global-festival" },
    resource_type: "report",
    description: "Cadre d'orientation et opportunités de partenariats transfrontaliers : cartographie des écosystèmes d'innovation inclusive Canada-Afrique et préparation des délégations.",
    author: "Comité de Pilotage International",
    tags: "Nairobi 2027, Coopération Internationale, Partenariats, Sourcing",
    file_size: "2.9 Mo",
    mime_type: "application/pdf",
    file_url: "/assets/guides/nairobi-2027-guide-cooperation.pdf",
    is_featured: false,
  },
];

const Programs = () => {
  const { lang, t } = useLang();
  const location = useLocation();
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

  // Resources State
  const [resources, setResources] = useState(FALLBACK_RESOURCES);
  const [resourceFilter, setResourceFilter] = useState("all");

  // Download Lead Modal State
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [downloadForm, setDownloadForm] = useState({
    name: "",
    email: "",
    organization: "",
    aim: "",
    feedback: "",
    requestCompleteGuide: true,
  });
  const [submittingDownload, setSubmittingDownload] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Hash anchor scrolling listener
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  // Fetch Public Resources from CMS backend
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await api.get("/resources");
        if (Array.isArray(res.data) && res.data.length > 0) {
          setResources(res.data);
        }
      } catch (err) {
        console.warn("Using fallback resources:", err);
      }
    };
    fetchResources();
  }, []);

  const openDownloadModal = (res) => {
    setSelectedResource(res);
    setDownloadSuccess(false);
    setDownloadModalOpen(true);
  };

  const handleDownloadChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDownloadForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDownloadSubmit = async (e) => {
    e.preventDefault();
    if (!downloadForm.name || !downloadForm.email || !downloadForm.aim) {
      toast.error("Veuillez renseigner votre nom, courriel et objectif d'utilisation (*)");
      return;
    }

    setSubmittingDownload(true);
    try {
      await api.post("/submissions", {
        type: "resource_download",
        payload: {
          name: downloadForm.name,
          email: downloadForm.email,
          organization: downloadForm.organization || "Particulier / Non précisé",
          aim: downloadForm.aim,
          feedback: downloadForm.feedback || "Aucun commentaire spécifique",
          request_complete_guide: downloadForm.requestCompleteGuide ? "Oui" : "Non",
          resource_id: selectedResource?.id,
          resource_title: selectedResource?.title,
          resource_type: selectedResource?.resource_type || "Guide / Cours",
          program: selectedResource?.category?.name || selectedResource?.program || "Cap Entrepreneurs",
          downloaded_at: new Date().toISOString(),
        },
      });

      setDownloadSuccess(true);
      toast.success("Demande enregistrée avec succès ! Le téléchargement a démarré.");

      // Initiate download
      const targetUrl =
        selectedResource?.file_url ||
        selectedResource?.external_url ||
        "/assets/guides/cap-green-lab-reconditionnement.pdf";
      const a = document.createElement("a");
      a.href = targetUrl;
      a.download = `${selectedResource?.slug || "guide-cap-entrepreneurs"}.pdf`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue lors de l'enregistrement de votre demande.");
    } finally {
      setSubmittingDownload(false);
    }
  };

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
                    { num: "6", title: lang === "fr" ? "Guides & Cours à télécharger" : "Downloadable Guides & Courses", id: "resources" },
                    { num: "7", title: "Notre Calendrier", id: "calendrier" },
                    { num: "8", title: "Candidature", id: "apply" }
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

            {/* SECTION : GUIDES & COURS À TÉLÉCHARGER */}
            <section id="resources" className="scroll-mt-28 space-y-8 pt-12 border-t border-[#0D0E0D]/10">
              <Reveal>
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-maple font-montserrat block mb-1">
                    {lang === "fr"
                      ? "RESSOURCES PÉDAGOGIQUES & GUIDES PRATIQUES"
                      : lang === "ar"
                      ? "موارد تعليمية وأدلة عملية"
                      : "EDUCATIONAL RESOURCES & PRACTICAL GUIDES"}
                  </span>
                  <h3 className="font-serif text-3xl sm:text-4xl font-medium text-[#0D0E0D]">
                    {lang === "fr"
                      ? "Guides & Cours à télécharger"
                      : lang === "ar"
                      ? "أدلة ودورات تدريبية قابلة للتحميل"
                      : "Downloadable Guides & Courses"}
                  </h3>
                  <div className="mx-auto mt-3 mb-4 h-[2px] w-12 bg-maple" />
                  <p className="font-serif italic text-sm text-sage leading-relaxed">
                    {lang === "fr"
                      ? "Accédez librement aux modules de formation, fiches d'action et manuels de nos programmes structurants conçus pour accélérer l'impact de vos initiatives sur le terrain."
                      : lang === "ar"
                      ? "احصل على المواد التدريبية والكتيبات المنهجية لبرامجنا المصممة لتسريع أثر مبادراتك."
                      : "Free access to training modules, action toolkits, and practical manuals from our programs designed to accelerate grassroots impact."}
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                  {[
                    { id: "all", label: lang === "fr" ? "Tous les programmes" : lang === "ar" ? "جميع البرامج" : "All Programs" },
                    { id: "cap-green-lab", label: "Cap Green Lab" },
                    { id: "agriconnect", label: "AgriConnect" },
                    { id: "safe-vibe", label: "Safe Vibe" },
                    { id: "creatif-social", label: lang === "fr" ? "Créatif & Social" : "Creative & Social" },
                    { id: "global-festival", label: "Global Festival" },
                  ].map((filter) => {
                    const active = resourceFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setResourceFilter(filter.id)}
                        className={`px-3.5 py-1.5 font-montserrat text-[11px] font-bold uppercase tracking-[0.1em] border transition-all ${
                          active
                            ? "bg-[#0D0E0D] text-white border-[#0D0E0D] shadow-sm"
                            : "bg-[#FAF9F6] text-sage hover:text-[#0D0E0D] border-[#0D0E0D]/10 hover:border-[#0D0E0D]/30"
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>

                {/* Cards Grid */}
                {(() => {
                  const filtered = resources.filter((r) => {
                    if (resourceFilter === "all") return true;
                    const catSlug = r.category?.slug || "";
                    const catName = (r.category?.name || r.program || "").toLowerCase();
                    if (resourceFilter === "cap-green-lab") return catSlug.includes("green") || catName.includes("green");
                    if (resourceFilter === "agriconnect") return catSlug.includes("agri") || catName.includes("agri");
                    if (resourceFilter === "safe-vibe") return catSlug.includes("safe") || catName.includes("safe") || catName.includes("vibe");
                    if (resourceFilter === "creatif-social") return catSlug.includes("creatif") || catName.includes("créatif") || catName.includes("femme");
                    if (resourceFilter === "global-festival") return catSlug.includes("festival") || catName.includes("festival");
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="border border-[#0D0E0D]/10 bg-[#FAF9F6] p-8 text-center text-sage text-sm italic">
                        {lang === "fr"
                          ? "Aucune ressource disponible pour cette sélection pour l'instant."
                          : "No resources found in this category yet."}
                      </div>
                    );
                  }

                  return (
                    <div className="grid gap-6 md:grid-cols-2">
                      {filtered.map((res) => {
                        const typeLabel =
                          res.resource_type === "course"
                            ? lang === "fr" ? "COURS COMPLET" : "COURSE"
                            : res.resource_type === "toolkit"
                            ? lang === "fr" ? "BOÎTE À OUTILS" : "TOOLKIT"
                            : res.resource_type === "report"
                            ? lang === "fr" ? "LIVRE BLANC" : "REPORT"
                            : lang === "fr" ? "GUIDE PRATIQUE" : "PRACTICAL GUIDE";

                        const programBadge = res.category?.name || res.program || "Cap Entrepreneurs";

                        return (
                          <div
                            key={res.id || res.slug}
                            className="group flex flex-col justify-between border border-[#0D0E0D]/15 bg-white p-6 sm:p-7 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-maple hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                          >
                            <div>
                              {/* Top badges bar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0D0E0D]/10 pb-3 mb-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-montserrat text-[10px] font-bold uppercase tracking-[0.15em] bg-stone-100 text-[#0D0E0D] px-2 py-0.5 border border-[#0D0E0D]/10">
                                    {typeLabel}
                                  </span>
                                  <span className="font-montserrat text-[10px] font-bold uppercase tracking-wider text-maple">
                                    {programBadge}
                                  </span>
                                </div>
                                <span className="font-montserrat text-[10px] font-medium uppercase tracking-wider text-sage/80">
                                  {res.file_size || "PDF • GUIDE"}
                                </span>
                              </div>

                              {/* Title */}
                              <h4 className="font-serif text-xl sm:text-[22px] font-bold text-[#0D0E0D] leading-snug group-hover:text-maple transition-colors">
                                {res.title}
                              </h4>

                              {/* Description */}
                              <p className="mt-3 text-xs sm:text-[13px] text-sage font-sans leading-relaxed">
                                {res.description}
                              </p>

                              {/* Tags or author */}
                              <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[10.5px] font-montserrat text-sage">
                                {res.author && (
                                  <span className="font-semibold text-[#0D0E0D]/80">
                                    {res.author} •
                                  </span>
                                )}
                                <span>Édition 2026-2027</span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-6 pt-4 border-t border-[#0D0E0D]/10">
                              <button
                                type="button"
                                onClick={() => openDownloadModal(res)}
                                className="w-full inline-flex items-center justify-center gap-2.5 bg-[#232724] group-hover:bg-maple text-white px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] font-montserrat transition-all duration-200"
                              >
                                <Download className="h-4 w-4 stroke-[2.2]" />
                                <span>
                                  {lang === "fr"
                                    ? "Télécharger le cours / guide"
                                    : lang === "ar"
                                    ? "تحميل الدليل / الدورة"
                                    : "Download Guide / Course"}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
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

      {/* POP-UP MODAL: TÉLÉCHARGEMENT DE RESSOURCE & RETOURS D'EXPÉRIENCE */}
      {downloadModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm"
        >
          <div
            className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white border border-[#0D0E0D] p-6 sm:p-8 shadow-2xl"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setDownloadModalOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-sage hover:text-[#0D0E0D] border border-transparent hover:border-[#0D0E0D]/20 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>

            {downloadSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-maple text-white shadow-md">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="font-serif text-2xl sm:text-3xl font-bold text-[#0D0E0D]">
                  {lang === "fr" ? "Téléchargement en cours !" : lang === "ar" ? "جاري بدء التحميل!" : "Download in Progress!"}
                </h4>
                <p className="text-xs sm:text-sm text-sage leading-relaxed max-w-md mx-auto">
                  {lang === "fr"
                    ? `Merci ${downloadForm.name || ""} ! Votre demande pour « ${selectedResource?.title || "ce guide"} » a bien été enregistrée. Le fichier devrait s'ouvrir ou se télécharger automatiquement.`
                    : `Thank you! Your request for "${selectedResource?.title || "this resource"}" has been confirmed. The file is downloading.`}
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a
                    href={selectedResource?.file_url || selectedResource?.external_url || "/assets/guides/cap-green-lab-reconditionnement.pdf"}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-maple px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-[#0D0E0D] transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>{lang === "fr" ? "Relancer le téléchargement" : "Re-download"}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setDownloadModalOpen(false)}
                    className="w-full sm:w-auto border border-[#0D0E0D] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:bg-[#FAF9F6] transition-colors"
                  >
                    {lang === "fr" ? "Fermer" : "Close"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Modal Header */}
                <div className="border-b border-[#0D0E0D]/10 pb-4 mb-5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-maple font-montserrat block mb-1">
                    {lang === "fr"
                      ? "ACCÈS IMMÉDIAT • RESSOURCE DE FORMATION"
                      : lang === "ar"
                      ? "تحميل مباشر • موارد تدريبية"
                      : "DIRECT ACCESS • TRAINING RESOURCE"}
                  </span>
                  <h3 className="font-serif text-2xl sm:text-[26px] font-bold text-[#0D0E0D] leading-tight">
                    {lang === "fr" ? "Télécharger le document" : "Download Resource"}
                  </h3>
                  <div className="mt-3 bg-[#FAF9F6] border border-[#0D0E0D]/10 p-3 flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-maple shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-serif text-sm font-bold text-[#0D0E0D] leading-snug">
                        {selectedResource?.title}
                      </h5>
                      <span className="text-[11px] font-montserrat uppercase tracking-wider text-sage block mt-0.5">
                        {selectedResource?.category?.name || selectedResource?.program} • {selectedResource?.file_size || "PDF"}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-sage leading-relaxed font-sans">
                    {lang === "fr"
                      ? "Veuillez préciser vos coordonnées et l'usage prévu afin de nous aider à enrichir nos modules et vous faire parvenir les mises à jour."
                      : "Please tell us who you are and your learning aim to help us tailor future materials."}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleDownloadSubmit} className="space-y-4">
                  {/* Nom & Courriel */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0D0E0D]">
                        {lang === "fr" ? "NOM COMPLET *" : "FULL NAME *"}
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder={lang === "fr" ? "Votre nom et prénom" : "Your full name"}
                        value={downloadForm.name}
                        onChange={handleDownloadChange}
                        className="w-full border border-[#0D0E0D]/20 bg-white px-3.5 py-2.5 text-xs text-[#0D0E0D] placeholder:text-sage/50 focus:border-maple focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0D0E0D]">
                        {lang === "fr" ? "COURRIEL *" : "EMAIL ADDRESS *"}
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder={lang === "fr" ? "nom@exemple.com" : "you@example.com"}
                        value={downloadForm.email}
                        onChange={handleDownloadChange}
                        className="w-full border border-[#0D0E0D]/20 bg-white px-3.5 py-2.5 text-xs text-[#0D0E0D] placeholder:text-sage/50 focus:border-maple focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Organisation */}
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0D0E0D]">
                      {lang === "fr" ? "ORGANISATION / STRUCTURE / STATUT" : "ORGANIZATION / STATUS"}
                    </label>
                    <input
                      type="text"
                      name="organization"
                      placeholder={lang === "fr" ? "OBNL, coopérative, entreprise, indépendant, étudiant..." : "NGO, cooperative, company, individual..."}
                      value={downloadForm.organization}
                      onChange={handleDownloadChange}
                      className="w-full border border-[#0D0E0D]/20 bg-white px-3.5 py-2.5 text-xs text-[#0D0E0D] placeholder:text-sage/50 focus:border-maple focus:outline-none"
                    />
                  </div>

                  {/* Objectif / Aim */}
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0D0E0D]">
                      {lang === "fr"
                        ? "OBJECTIF D'UTILISATION (AIM) *"
                        : "AIM & PURPOSE OF USE *"}
                    </label>
                    <textarea
                      name="aim"
                      required
                      rows={2}
                      placeholder={lang === "fr"
                        ? "Dans quel cadre comptez-vous utiliser cette ressource ? (ex: projet d'atelier local, formation d'équipe, mémoire...)"
                        : "What is your main aim for using this guide? (e.g., team training, project kickoff, research...)"}
                      value={downloadForm.aim}
                      onChange={handleDownloadChange}
                      className="w-full border border-[#0D0E0D]/20 bg-white px-3.5 py-2 text-xs text-[#0D0E0D] placeholder:text-sage/50 focus:border-maple focus:outline-none"
                    />
                  </div>

                  {/* Feedback / Besoins complémentaires */}
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.18em] text-[#0D0E0D]">
                      {lang === "fr"
                        ? "RETOURS & ATTENTES DE FORMATION (FEEDBACK)"
                        : "FEEDBACK & SPECIFIC NEEDS"}
                    </label>
                    <textarea
                      name="feedback"
                      rows={2}
                      placeholder={lang === "fr"
                        ? "Quels thèmes ou outils aimeriez-vous voir approfondis par nos formateurs ?"
                        : "Any specific topics, challenges, or tools you would like our trainers to address?"}
                      value={downloadForm.feedback}
                      onChange={handleDownloadChange}
                      className="w-full border border-[#0D0E0D]/20 bg-white px-3.5 py-2 text-xs text-[#0D0E0D] placeholder:text-sage/50 focus:border-maple focus:outline-none"
                    />
                  </div>

                  {/* Checkbox Complete Guide */}
                  <div className="pt-1">
                    <label className="flex items-start gap-3 cursor-pointer select-none bg-[#FAF9F6] border border-[#0D0E0D]/10 p-3 hover:border-maple/50 transition-colors">
                      <input
                        type="checkbox"
                        name="requestCompleteGuide"
                        checked={downloadForm.requestCompleteGuide}
                        onChange={handleDownloadChange}
                        className="mt-0.5 h-4 w-4 rounded-none border-[#0D0E0D]/30 accent-[#0D0E0D] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-[#0D0E0D] font-medium leading-relaxed">
                        {lang === "fr"
                          ? "Oui, je souhaite recevoir gratuitement le guide complet augmenté, les supports pratiques par courriel et être informé des prochaines cohortes."
                          : "Yes, I would like to receive the complete guide edition, practical worksheets, and upcoming cohort updates."}
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submittingDownload}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#232724] hover:bg-maple text-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.22em] font-montserrat transition-all disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      <span>
                        {submittingDownload
                          ? (lang === "fr" ? "ENREGISTREMENT..." : "SUBMITTING...")
                          : (lang === "fr" ? "ENVOYER ET TÉLÉCHARGER LE GUIDE" : "SUBMIT & DOWNLOAD GUIDE")}
                      </span>
                    </button>
                  </div>

                  <p className="text-[10px] text-center text-sage/80 pt-1">
                    {lang === "fr"
                      ? "Vos données sont traitées en toute confidentialité par Cap Entrepreneurs conformément à notre politique de respect de la vie privée."
                      : "Your data is handled securely by Cap Entrepreneurs."}
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Programs;
