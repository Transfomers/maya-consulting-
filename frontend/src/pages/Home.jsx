import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Globe2,
  Users2,
  Leaf,
  Radio,
  Layers,
  HeartHandshake,
  Award,
  CheckCircle2,
  GraduationCap,
  Building2,
  Handshake,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import api from "@/lib/api";
import { KineticLines, Reveal, EditorialMarquee, Magnetic } from "@/components/motion";
import Scene3D from "@/components/Scene3D";
import ImageCarousel from "@/components/ImageCarousel";
import { IMAGES, PROGRAMS, PROGRAMS_FR, PROGRAMS_AR } from "@/lib/content";
import { useLang } from "@/lib/i18n";

const COMMUNITY_PHOTOS = [
  { src: "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=600&q=80", alt: "Arbre et renouveau" },
  { src: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80", alt: "Partenariat et cœur" },
  { src: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80", alt: "Apprentissage et transmission" },
  { src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80", alt: "Route vers l'horizon" },
  { src: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80", alt: "Mobilité et proximité" },
  { src: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80", alt: "Structure et architecture" },
  { src: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80", alt: "Partage et convivialité" },
  { src: "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=600&q=80", alt: "Ouverture sur le monde" },
];

const Home = () => {
  const { lang, t } = useLang();

  const currentPrograms = lang === "fr" ? PROGRAMS_FR : lang === "ar" ? PROGRAMS_AR : PROGRAMS;

  const AUDIENCES = [
    { label: t.home.audiences?.[0] || "Entrepreneurs", to: "/programs" },
    { label: t.home.audiences?.[1] || "Non-profit organizations", to: "/partners" },
    { label: t.home.audiences?.[2] || "Funders & donors", to: "/partners" },
    { label: t.home.audiences?.[3] || "Volunteers", to: "/volunteer" },
    { label: t.home.audiences?.[4] || "Institutional partners", to: "/partners" },
    { label: t.home.audiences?.[5] || "Creative & social innovators", to: "/join" },
  ];

  const PROGRAM_ICONS = [Leaf, Globe2, Radio, HeartHandshake];
  const INVOLVEMENT_IMAGES = [
    "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800",
  ];

  const COMMUNITY_TESTIMONIALS = [
    {
      id: "sarah-j",
      quoteFr: "Cap Green Lab a permis à notre communauté de réduire la fracture numérique tout en reconditionnant des équipements informatiques.",
      quoteEn: "Cap Green Lab enabled our community to reduce the digital divide while refurbishing vital computer hardware.",
      quoteAr: "مكّن مختبر كاب الأخضر مجتمعنا من تقليص الفجوة الرقمية مع تجديد المعدات الحاسوبية الأساسية.",
      author: "Sarah J.",
      roleFr: "Innovatrice Sociale",
      roleEn: "Social Innovator",
      roleAr: "مبتكرة اجتماعية",
      organization: "Cap Green Lab",
      rating: 5,
    },
    {
      id: "aminata-d",
      quoteFr: "AgriConnect a relié notre coopérative agricole féminine aux outils numériques modernes et aux marchés équitables.",
      quoteEn: "AgriConnect connected our women-led farming cooperative with modern digital tools and fair international markets.",
      quoteAr: "ربط برنامج أجري كونكت تعاونيتنا الزراعية النسائية بالأدوات الرقمية الحديثة والأسواق العادلة.",
      author: "Aminata D.",
      roleFr: "Responsable Coopérative",
      roleEn: "Cooperative Lead",
      roleAr: "مسؤولة تعاونية",
      organization: "AgriConnect",
      rating: 5,
    },
    {
      id: "elena-r",
      quoteFr: "Collaborer avec Cap Entrepreneurs au Canada et à l'international crée des opportunités économiques tangibles et durables.",
      quoteEn: "Collaborating with Cap Entrepreneurs across Canada and globally creates tangible and sustainable economic opportunities.",
      quoteAr: "التعاون مع كاب رواد الأعمال في كندا ودولياً يخلق فرصاً اقتصادية ملموسة ومستدامة.",
      author: "Elena R.",
      roleFr: "Partenaire Institutionnel",
      roleEn: "Institutional Partner",
      roleAr: "شريك مؤسسي",
      organization: "Alliances & Impact",
      rating: 5,
    },
  ];

  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % COMMUNITY_TESTIMONIALS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [COMMUNITY_TESTIMONIALS.length]);

  const [activeInvolvementCard, setActiveInvolvementCard] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const openInvolvementModal = (card) => {
    setActiveInvolvementCard(card);
    setFormValues({
      name: "",
      email: "",
      phone: "",
      message: "",
      program: card.fields?.find((f) => f.name === "program")?.options?.[0] || "",
      area: card.fields?.find((f) => f.name === "area")?.options?.[0] || "",
      availability: card.fields?.find((f) => f.name === "availability")?.options?.[0] || "",
      organization: "",
      partnerType: card.fields?.find((f) => f.name === "partnerType")?.options?.[0] || "",
      country: "",
    });
    setSubmitted(false);
  };

  const closeInvolvementModal = () => {
    setActiveInvolvementCard(null);
    setSubmitted(false);
    setFormValues({});
  };

  const handleInvolvementSubmit = async (e) => {
    e.preventDefault();
    if (!activeInvolvementCard) return;

    setSubmitting(true);
    try {
      await api.post("/submissions", {
        type: activeInvolvementCard.submissionType,
        payload: {
          ...formValues,
          track: activeInvolvementCard.tag,
          cardTitle: activeInvolvementCard.title,
          source: `Involvement Card ${activeInvolvementCard.number}`,
        },
      });
      setSubmitted(true);
      toast.success("Votre demande a bien été transmise à l'équipe !");
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const involvementCards = [
    {
      id: "skills",
      number: "01",
      title: "Je veux développer mes compétences",
      link: "/join",
      tag: "Formation & Compétences",
      submissionType: "application",
      intro: "Rejoignez un parcours structurant pour acquérir des compétences numériques, entrepreneuriales et techniques adaptées aux réalités du marché.",
      fields: [
        {
          name: "program",
          label: "Programme souhaité",
          kind: "select",
          options: [
            "Cap Green Lab- Technologie inclusive & économie circulaire",
            "AgriConnect- Entrepreneuriat rural & agriculture numérique",
            "Safe Vibe- Médias numériques & éducation",
            "Entrepreneuriat Créatif & Social- Femmes, arts & innovation",
            "Autre / Orientation générale"
          ],
          required: true,
        },
        {
          name: "message",
          label: "Vos objectifs et compétences à développer",
          kind: "textarea",
          placeholder: "Parlez-nous de votre projet, vos objectifs et vos compétences actuelles...",
          required: true,
        },
      ],
    },
    {
      id: "volunteer",
      number: "02",
      title: "Je veux faire du bénévolat",
      link: "/volunteer",
      tag: "Engagement citoyen",
      submissionType: "volunteer",
      intro: "Partagez vos compétences et votre énergie au service des initiatives entrepreneuriales et sociales accompagnées par CAP Entrepreneurs.",
      fields: [
        {
          name: "area",
          label: "Domaine de contribution",
          kind: "select",
          options: [
            "Compétences numériques & Développement",
            "Communication & Création de contenu",
            "Développement d'affaires & Stratégie",
            "Formation, Ateliers & Mentorat",
            "Arts, Culture & Événementiel",
            "Gestion de projet & Opérations"
          ],
          required: true,
        },
        {
          name: "availability",
          label: "Disponibilité",
          kind: "select",
          options: [
            "2 h / semaine",
            "4–6 h / semaine",
            "7–10 h / semaine",
            "Ponctuel / Par projet"
          ],
          required: true,
        },
        {
          name: "message",
          label: "Vos compétences & motivations",
          kind: "textarea",
          placeholder: "Décrivez vos compétences professionnelles et la manière dont vous aimeriez contribuer...",
          required: true,
        },
      ],
    },
    {
      id: "ngo",
      number: "03",
      title: "Je représente une ONG / entreprise sociale",
      link: "/partners",
      tag: "Organisations",
      submissionType: "partner",
      intro: "Bâtissons des passerelles d'action et co-développons des solutions concrètes pour vos communautés et bénéficiaires.",
      fields: [
        {
          name: "organization",
          label: "Nom de l'ONG / Entreprise sociale",
          required: true,
          placeholder: "Nom officiel de votre organisation",
        },
        {
          name: "country",
          label: "Pays / Région d'opération",
          required: true,
          placeholder: "Ex: Canada, Côte d'Ivoire, Maroc, Sénégal...",
        },
        {
          name: "message",
          label: "Nature de la collaboration souhaitée",
          kind: "textarea",
          placeholder: "Décrivez les défis de vos bénéficiaires et la collaboration envisagée...",
          required: true,
        },
      ],
    },
    {
      id: "partner",
      number: "04",
      title: "Je veux devenir partenaire",
      link: "/partners",
      tag: "Partenariats",
      submissionType: "partner",
      intro: "Co-construisez des programmes d'envergure, soutenez le développement économique durable et amplifiez votre impact territorial.",
      fields: [
        {
          name: "organization",
          label: "Nom de l'organisation / Entreprise",
          required: true,
          placeholder: "Nom de votre société ou institution",
        },
        {
          name: "partnerType",
          label: "Type de partenariat souhaité",
          kind: "select",
          options: [
            "Partenaire Entreprise / Mécénat de compétences",
            "Bailleur de fonds / Fondation",
            "Institution publique / Gouvernement",
            "Hub d'innovation / Incubateur partenaire",
            "Université / Centre de recherche"
          ],
          required: true,
        },
        {
          name: "message",
          label: "Projet de partenariat ou message",
          kind: "textarea",
          placeholder: "Partagez votre vision ou votre demande de prise de contact...",
          required: true,
        },
      ],
    },
  ].map((card, i) => ({
    ...card,
    image: INVOLVEMENT_IMAGES[i % INVOLVEMENT_IMAGES.length],
  }));

  return (
    <div data-testid="home-page" className="relative selection:bg-maple selection:text-white">
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative overflow-hidden border-b border-forest/15 bg-gradient-to-b from-bone via-white to-bone/60">
        {/* Ambient Gradient Glows */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -left-[10%] top-[5%] h-[600px] w-[600px] rounded-full bg-purple-400/15 mix-blend-multiply blur-[140px]" />
          <div className="absolute right-[5%] top-[-10%] h-[550px] w-[550px] rounded-full bg-blue-300/20 mix-blend-multiply blur-[140px]" />
          <div className="absolute -bottom-[20%] left-[25%] h-[600px] w-[600px] rounded-full bg-amber-200/25 mix-blend-multiply blur-[150px]" />
        </div>

        {/* Huge Outline Brand Watermark */}
        <span
          aria-hidden="true"
          className="text-outline pointer-events-none absolute -right-8 top-12 hidden select-none font-heading text-[28vw] font-black leading-none opacity-10 lg:block"
        >
          CAP
        </span>

        {/* Interactive 3D Canvas */}
        <Scene3D className="absolute inset-0 z-0 opacity-80" />

        <div className="relative z-10 mx-auto max-w-[1600px] px-5 pb-16 pt-24 md:px-10 md:pt-32 lg:pb-24">
          <div className="max-w-5xl">

            {/* H1 Headline */}
            <h1 className="sr-only">{t.home.h1}</h1>
            <KineticLines
              testId="hero-heading"
              lines={[
                <>{t.home.h1a}</>,
                <>
                  <span className="font-serif font-medium italic tracking-tight text-maple">{t.home.h1accent}</span>
                  {t.home.h1post}
                </>,
              ]}
              className="font-heading text-[10vw] font-black leading-[0.94] tracking-tight text-forest sm:text-6xl md:text-7xl lg:text-[4.6rem] xl:text-[5.4rem]"
            />

            {/* Mission Subtext */}
            <Reveal delay={0.25} className="mt-8 max-w-3xl">
              <p className="text-lg leading-relaxed text-forest/80 sm:text-xl md:text-2xl font-normal" data-testid="hero-subtext">
                {t.home.intro}
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={0.35} className="mt-10">
              <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                <Magnetic>
                  <Link
                    to="/join"
                    className="group relative flex w-full sm:w-auto justify-center items-center gap-3 overflow-hidden rounded-none bg-forest px-9 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone shadow-lg transition-all duration-300 hover:bg-maple hover:shadow-maple/20"
                  >
                    <span>{t.home.ctaJoin}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link
                    to="/partners"
                    className="group flex w-full sm:w-auto justify-center items-center gap-3 rounded-none border-2 border-forest bg-white/40 px-9 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-forest backdrop-blur-sm transition-all duration-300 hover:bg-forest hover:text-bone"
                  >
                    <span>{t.home.ctaPartner}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Magnetic>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================== MARQUEE ===================== */}
      <EditorialMarquee
        dark
        testId="home-marquee"
        items={t.home.marquee}
      />

      {/* ===================== OUR COMMUNITY / NOTRE COMMUNAUTÉ ===================== */}
      <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32" data-testid="our-community-section">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <Reveal>
            <span className="font-montserrat text-xs font-bold uppercase tracking-[0.25em] text-maple">
              {lang === "fr" ? "NOTRE COMMUNAUTÉ" : "OUR COMMUNITY"}
            </span>
            <h2 className="mt-3 font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-forest leading-tight">
              {lang === "fr"
                ? "Une communauté bâtie pour tous ceux qui créent des opportunités"
                : "A community built for everyone who creates opportunity"}
            </h2>
            <p className="mt-4 text-base md:text-lg text-sage font-medium">
              {lang === "fr" ? "Cap Entrepreneurs rassemble :" : "Cap Entrepreneurs brings together:"}
            </p>
          </Reveal>
        </div>

        {/* 8-Photo Mosaic Grid (2 rows of 4 columns matching reference image) */}
        <Reveal delay={0.15}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-[1360px] mx-auto overflow-hidden">
            {COMMUNITY_PHOTOS.map((photo, idx) => (
              <div key={idx} className="relative aspect-square overflow-hidden bg-forest/5 group shadow-xs">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </Reveal>

        {/* Central Editorial Quote */}
        <Reveal delay={0.25}>
          <div className="max-w-4xl mx-auto my-12 md:my-16 text-center px-4">
            <div className="w-12 h-px bg-maple mx-auto mb-6" />
            <blockquote className="font-serif italic text-xl sm:text-2xl md:text-3xl text-forest font-normal leading-relaxed">
              {lang === "fr"
                ? "« Ensemble, nous formons un écosystème où les compétences deviennent des projets, les projets deviennent de l'impact, et l'impact devient un changement durable. »"
                : "“Together, we form an ecosystem where skills become projects, projects become impact, and impact becomes lasting change.”"}
            </blockquote>
            <div className="w-12 h-px bg-maple mx-auto mt-6" />
          </div>
        </Reveal>

        {/* 6 Community Stakeholder Pathway Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1360px] mx-auto">
          {[
            { num: "01", fr: "Entrepreneurs", en: "Entrepreneurs", ar: "رواد الأعمال", to: "/programs" },
            { num: "02", fr: "Organismes à but non lucratif", en: "Non-profit organizations", ar: "المنظمات غير الربحية", to: "/partners" },
            { num: "03", fr: "Bailleurs de fonds & donateurs", en: "Funders & donors", ar: "الممولون والمانحون", to: "/partners" },
            { num: "04", fr: "Bénévoles", en: "Volunteers", ar: "المتطوعون", to: "/volunteer" },
            { num: "05", fr: "Partenaires institutionnels", en: "Institutional partners", ar: "الشركاء المؤسسيون", to: "/partners" },
            { num: "06", fr: "Innovateurs créatifs & sociaux", en: "Creative & social innovators", ar: "المبتكرون المبدعون والاجتماعيون", to: "/join" },
          ].map((stk, i) => (
            <Reveal key={i} delay={0.1 + i * 0.05}>
              <Link
                to={stk.to}
                className="group flex items-center justify-between p-6 bg-[#FAFAFA] border border-forest/10 hover:border-maple hover:bg-white transition-all shadow-xs"
              >
                <div className="flex items-center gap-4">
                  <span className="font-serif text-2xl italic font-bold text-maple">
                    {stk.num}
                  </span>
                  <span className="font-heading text-base font-bold text-forest group-hover:text-maple transition-colors">
                    {lang === "fr" ? stk.fr : lang === "ar" ? stk.ar : stk.en}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-montserrat text-xs font-bold uppercase tracking-wider text-forest/60 group-hover:text-maple transition-colors">
                  <span>{lang === "fr" ? "Découvrir" : lang === "ar" ? "استكشف" : "Explore"}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* ===================== INVOLVEMENT CARDS: COMMENT SOUHAITEZ-VOUS VOUS IMPLIQUER ? ===================== */}
        <div className="mt-20 border-t border-forest/15 pt-16 md:mt-28 md:pt-20" data-testid="involvement-cards-section">
          <Reveal delay={0.1}>
            <div className="mb-12 text-center max-w-3xl mx-auto">
              <span className="font-montserrat text-xs font-semibold uppercase tracking-[0.25em] text-maple">
                {lang === "fr" ? "S'ENGAGER" : "GET INVOLVED"}
              </span>
              <h3 className="mt-3 font-heading text-3xl font-black tracking-tight text-forest sm:text-4xl md:text-5xl">
                {lang === "fr" ? "Comment souhaitez-vous vous impliquer ?" : "How would you like to get involved?"}
              </h3>
            </div>
          </Reveal>

          {/* 4 Cards on a single line on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 items-start">
            {involvementCards.map((card, i) => (
              <Reveal key={i} delay={0.15 + i * 0.08} className="w-full">
                <div
                  onClick={() => openInvolvementModal(card)}
                  data-testid={`involvement-card-${i + 1}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openInvolvementModal(card);
                    }
                  }}
                  className="group flex flex-col items-center text-center transition-all duration-300 cursor-pointer focus:outline-none"
                >
                  {/* Photo on top with zoom effect */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-forest/5 shadow-sm">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-0.5 font-serif text-xs italic font-bold text-maple shadow-sm">
                      {card.number}
                    </div>
                  </div>

                  {/* Text details */}
                  <div className="mt-6 flex flex-col items-center w-full px-2">
                    <span className="font-montserrat text-[10.5px] font-bold uppercase tracking-[0.22em] text-maple mb-2">
                      {card.tag}
                    </span>
                    <h4 className="font-heading text-lg font-bold leading-snug text-forest group-hover:text-maple transition-colors md:text-xl">
                      {card.title}
                    </h4>

                    {/* Small center divider line */}
                    <div className="w-8 h-[2px] bg-maple/50 my-3.5 transition-all duration-300 group-hover:w-12 group-hover:bg-maple" />

                    <span className="inline-flex items-center gap-1.5 font-montserrat text-xs font-semibold uppercase tracking-[0.14em] text-forest/70 group-hover:text-maple transition-colors">
                      <span>{t.home.involvementCta || (lang === "fr" ? "Commencer" : "Get Started")}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== IMAGE SLIDER ===================== */}
      <ImageCarousel />

      {/* ===================== {lang === "fr" ? "PROGRAMMES STRUCTURANTS" : lang === "ar" ? "برامج هيكلية" : "STRUCTURING PROGRAMS"} (EDITORIAL SHOWCASE) ===================== */}
      <section className="border-y border-forest/15 bg-white py-24 md:py-32" data-testid="home-programs-section">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-forest/10">
            <Reveal>
              <div className="flex items-center gap-2 font-montserrat text-xs font-bold uppercase tracking-[0.25em] text-maple mb-3">
                <Layers className="h-4 w-4" />
                <span>STRUCTURING PROGRAMS</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-forest leading-tight max-w-3xl">
                Les programmes sont au cœur de Cap Entrepreneurs
              </h2>
              <p className="mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-sage font-normal">
                Nos quatre programmes structurants transforment l'apprentissage en impact mesurable :
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <Link
                to="/programs"
                data-testid="home-programs-view-all"
                className="group inline-flex items-center gap-2 bg-forest px-8 py-4 font-montserrat text-xs font-bold uppercase tracking-[0.16em] text-bone transition-all duration-300 hover:bg-maple"
              >
                <span>{lang === "fr" ? "DÉCOUVRIR NOS PROGRAMMES" : lang === "ar" ? "اكتشف برامجنا" : "EXPLORE OUR PROGRAMS"}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>

          {/* 4 Editorial Program Cards in Staggered Lifestyle Magazine Grid */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 xl:gap-10 items-start">
            {[
              {
                id: "cap-green-lab",
                number: "01",
                name: "Cap Green Lab",
                theme: "TECHNOLOGIE INCLUSIVE & ÉCONOMIE CIRCULAIRE",
                purpose: "Cap Green Lab est notre laboratoire dédié à la convergence de la transition numérique, de l'accessibilité, des compétences techniques et de l'économie circulaire.",
                link: "/programs#cap-green-lab",
                image: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800",
                aspect: "aspect-[4/3]"
              },
              {
                id: "agriconnect",
                number: "02",
                name: "AgriConnect",
                theme: "ENTREPRENEURIAT RURAL & AGRICULTURE NUMÉRIQUE",
                purpose: "AgriConnect soutient l'entrepreneuriat rural et l'agriculture numérique en connectant coopératives, femmes entrepreneures et jeunes agriculteurs aux outils et aux marchés.",
                link: "/programs#agriconnect",
                image: "https://images.pexels.com/photos/2165688/pexels-photo-2165688.jpeg?auto=compress&cs=tinysrgb&w=800",
                aspect: "aspect-[3/4]"
              },
              {
                id: "safe-vibe",
                number: "03",
                name: "Safe Vibe",
                theme: "MÉDIAS NUMÉRIQUES & ÉDUCATION",
                purpose: "Safe Vibe est notre programme d'éducation numérique et de production médiatique. Il outille les jeunes et les communautés pour devenir des créateurs de contenu responsables et des citoyens numériques éclairés.",
                link: "/programs#safe-vibe",
                image: "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800",
                aspect: "aspect-[3/4]"
              },
              {
                id: "creative-social",
                number: "04",
                name: "Entrepreneuriat Créatif & Social",
                theme: "FEMMES, ARTS & INNOVATION SOCIALE",
                purpose: "Ce programme soutient l'entrepreneuriat féminin, les arts et l'innovation sociale. Il accompagne les femmes et les créatifs dans la structuration de leurs projets et la création de modèles économiques durables.",
                link: "/programs#creative-social",
                image: "https://images.pexels.com/photos/12903148/pexels-photo-12903148.jpeg?auto=compress&cs=tinysrgb&w=800",
                aspect: "aspect-[4/3]"
              }
            ].map((p, i) => (
              <Reveal key={p.id} delay={i * 0.1} className="w-full">
                <Link
                  to={p.link}
                  data-testid={`home-program-${p.id}`}
                  className="group flex flex-col items-center text-center transition-all duration-300"
                >
                  {/* Photo with dynamic editorial aspect ratio matching reference */}
                  <div className={`relative w-full overflow-hidden bg-forest/5 shadow-sm ${p.aspect}`}>
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-0.5 font-serif text-xs italic font-bold text-maple shadow-sm">
                      {p.number}
                    </div>
                  </div>

                  {/* Centered Editorial Content */}
                  <div className="mt-6 flex flex-col items-center w-full px-2">
                    <span className="font-montserrat text-[10px] font-bold uppercase tracking-[0.2em] text-maple mb-2">
                      {p.theme}
                    </span>
                    <h3 className="font-serif text-2xl md:text-[26px] font-normal tracking-tight text-forest group-hover:text-maple transition-colors leading-snug">
                      {p.name}
                    </h3>
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-sage font-normal max-w-xs">
                      {p.purpose}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 font-montserrat text-xs font-semibold uppercase tracking-[0.14em] text-forest/80 group-hover:text-maple transition-colors">
                      <span>{lang === "fr" ? "EN SAVOIR PLUS" : lang === "ar" ? "اعرف المزيد" : "LEARN MORE"}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* ===================== GLOBAL HORIZON & INTERNATIONAL SUMMITS (EDITORIAL FORMAT) ===================== */}
          <Reveal delay={0.25} className="mt-20 md:mt-28">
            <div className="border border-forest/10 bg-[#F6F3EE] p-8 md:p-12 lg:p-14">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

                {/* Left: Editorial Horizon Description */}
                <div className="lg:col-span-5">
                  <div className="flex items-center gap-2 font-montserrat text-[11px] font-bold uppercase tracking-[0.25em] text-maple mb-3">
                    <Globe2 className="h-3.5 w-3.5" />
                    <span>{lang === "fr" ? "HORIZON MONDIAL" : lang === "ar" ? "أفق عالمي" : "GLOBAL HORIZON"}</span>
                  </div>
                  <h3 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-forest leading-tight">
                    {lang === "fr" ? (
                      <>
                        Horizon Mondial &<br />
                        <span className="italic font-light">Sommets Internationaux</span>
                      </>
                    ) : lang === "ar" ? (
                      <>
                        أفق عالمي &<br />
                        <span className="italic font-light">قمم دولية</span>
                      </>
                    ) : (
                      <>
                        Global Horizon &<br />
                        <span className="italic font-light">International Summits</span>
                      </>
                    )}
                  </h3>
                  <p className="mt-4 text-sm md:text-base text-sage leading-relaxed font-normal">
                    {t.home.h4International || "Des délégations d'envergure, des hubs régionaux et des rencontres intercontinentales pour connecter les entrepreneurs d'Afrique, d'Europe, des Caraïbes et d'Amérique du Nord."}
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/global-festival"
                      className="inline-flex items-center gap-2 font-montserrat text-xs font-bold uppercase tracking-[0.16em] text-forest hover:text-maple transition-colors border-b border-forest/30 pb-1"
                    >
                      <span>{lang === "fr" ? "DÉCOUVRIR LE GLOBAL FESTIVAL" : lang === "ar" ? "اكتشف المهرجان العالمي" : "DISCOVER THE GLOBAL FESTIVAL"}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Right: 4 Editorial Summit Destination Cards */}
                <div className="lg:col-span-7">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        city: "Paris",
                        year: "2027",
                        tag: lang === "fr" ? "Lancement & Pré-Festival" : lang === "ar" ? "الإطلاق وما قبل المهرجان" : "Launch & Pre-Festival",
                        desc: lang === "fr" ? "Plateforme d'échanges euro-africains & partenariats institutionnels" : lang === "ar" ? "منصة تبادل أوروبية أفريقية وشراكات مؤسسية" : "Euro-African exchange platform & institutional partnerships"
                      },
                      {
                        city: "Nairobi",
                        year: "2027",
                        tag: lang === "fr" ? "Global Festival Afrique" : lang === "ar" ? "المهرجان العالمي إفريقيا" : "Global Festival Africa",
                        desc: lang === "fr" ? "Grand rassemblement tech, climat & innovation inclusive" : lang === "ar" ? "تجمع رئيسي للتكنولوجيا والمناخ والابتكار الشامل" : "Flagship tech, climate & inclusive innovation summit"
                      },
                      {
                        city: "Marrakech",
                        year: "2027",
                        tag: lang === "fr" ? "African Creative Sourcing" : lang === "ar" ? "التوريد الإبداعي الأفريقي" : "African Creative Sourcing",
                        desc: lang === "fr" ? "Marché international des créateurs & acheteurs culturels" : lang === "ar" ? "سوق دولية للمبدعين والمشترين الثقافيين" : "International marketplace for creatives & cultural buyers"
                      },
                      {
                        city: "Martinique",
                        year: "2028",
                        tag: lang === "fr" ? "Expansion Caraïbes" : lang === "ar" ? "توسع الكاريبي" : "Caribbean Expansion",
                        desc: lang === "fr" ? "Passerelle atlantique pour l'économie bleue & l'entrepreneuriat insulaire" : lang === "ar" ? "جسر أطلسي للاقتصاد الأزرق وريادة الأعمال الجزرية" : "Atlantic gateway for blue economy & island entrepreneurship"
                      },
                    ].map((summit, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-forest/10 p-5 shadow-sm transition-all duration-300 hover:border-maple hover:shadow-md group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-montserrat text-xs font-bold uppercase tracking-wider text-forest group-hover:text-maple transition-colors">
                            📍 {summit.city}
                          </span>
                          <span className="font-serif text-sm italic font-bold text-maple">
                            {summit.year}
                          </span>
                        </div>
                        <span className="block font-montserrat text-[10px] font-bold uppercase tracking-wider text-maple mb-1">
                          {summit.tag}
                        </span>
                        <p className="text-xs text-sage leading-relaxed">
                          {summit.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ===================== TESTIMONIALS{/* ===================== TESTIMONIALS / VOICES (EDITORIAL MOSAIC & SLIDER) ===================== */}
      <section className="relative overflow-hidden bg-white border-t border-forest/15" data-testid="home-testimonials-section">
        {/* Top Yellow Accent Bar (Matching Reference Screenshot) */}
        <div className="h-1.5 w-full bg-maple" />

        {/* Emerald Mosaic Top Banner */}
        <div className="relative overflow-hidden bg-maple text-white py-16 md:py-24">
          {/* Multi-face portrait mosaic background */}
          <div className="absolute inset-0 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 opacity-20 filter grayscale mix-blend-luminosity pointer-events-none">
            {[
              "https://images.pexels.com/photos/12903148/pexels-photo-12903148.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/12903144/pexels-photo-12903144.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/12903145/pexels-photo-12903145.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/12903147/pexels-photo-12903147.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/12903143/pexels-photo-12903143.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/12903149/pexels-photo-12903149.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/12903150/pexels-photo-12903150.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/12903148/pexels-photo-12903148.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/12903144/pexels-photo-12903144.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/12903145/pexels-photo-12903145.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/12903147/pexels-photo-12903147.jpeg?auto=compress&cs=tinysrgb&w=400",
              "https://images.pexels.com/photos/12903143/pexels-photo-12903143.jpeg?auto=compress&cs=tinysrgb&w=400",
            ].map((src, idx) => (
              <div key={idx} className="aspect-square overflow-hidden">
                <img src={src} alt="Community Member" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          {/* Deep logo green overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B053A]/95 via-[#3B0764]/90 to-[#7322F7]/85" />

          {/* Content container */}
          <div className="relative z-10 mx-auto max-w-[1500px] px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

              {/* Left Side: Headline */}
              <div className="lg:col-span-7">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-[#E5B53A] font-montserrat block mb-3">
                  {t.home.voicesKicker || (lang === "fr" ? "TÉMOIGNAGES • LA VOIX DE LA COMMUNAUTÉ" : "TESTIMONIALS • VOICES OF THE COMMUNITY")}
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-normal leading-[1.18] tracking-tight text-white max-w-2xl font-serif">
                  {lang === "fr" ? (
                    <>
                      Porté par plus de 500+
                      <span className="block mt-1">participants et partenaires qui cheminent avec nous.</span>
                    </>
                  ) : lang === "ar" ? (
                    <>
                      بدعم وثقة أكثر من 500+
                      <span className="block mt-1">مشارك وشريك ومجتمع محلي.</span>
                    </>
                  ) : (
                    <>
                      Supported by over 500+
                      <span className="block mt-1">participants and partners who journey with us.</span>
                    </>
                  )}
                </h2>
                <p className="mt-4 text-[11px] font-mono tracking-wider text-white/75 uppercase">
                  VIA CAP ENTREPRENEURS • CANADA & INTERNATIONAL
                </p>
              </div>

              {/* Right Side: Key Stats Metrics with Hairlines */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-x-8 gap-y-6 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/20 lg:pl-10">
                <div>
                  <div className="h-px w-full bg-white/35 mb-2.5" />
                  <p className="text-2xl sm:text-3xl font-light text-white tracking-tight">98%</p>
                  <p className="text-[11px] uppercase tracking-wider text-white/75 mt-0.5 font-montserrat">{lang === "fr" ? "Taux de satisfaction" : lang === "ar" ? "نسبة الرضا" : "Satisfaction Rate"}</p>
                </div>
                <div>
                  <div className="h-px w-full bg-white/35 mb-2.5" />
                  <p className="text-2xl sm:text-3xl font-light text-white tracking-tight">250+</p>
                  <p className="text-[11px] uppercase tracking-wider text-white/75 mt-0.5 font-montserrat">{lang === "fr" ? "Équipements reconditionnés" : lang === "ar" ? "أجهزة مجددة" : "Refurbished Devices"}</p>
                </div>
                <div>
                  <div className="h-px w-full bg-white/35 mb-2.5" />
                  <p className="text-2xl sm:text-3xl font-light text-white tracking-tight">40+</p>
                  <p className="text-[11px] uppercase tracking-wider text-white/75 mt-0.5 font-montserrat">{lang === "fr" ? "Coopératives soutenues" : lang === "ar" ? "تعاونيات مدعومة" : "Cooperatives Supported"}</p>
                </div>
                <div>
                  <div className="h-px w-full bg-white/35 mb-2.5" />
                  <p className="text-2xl sm:text-3xl font-light text-white tracking-tight">15+</p>
                  <p className="text-[11px] uppercase tracking-wider text-white/75 mt-0.5 font-montserrat">{lang === "fr" ? "Alliances mondiales" : lang === "ar" ? "تحالفات عالمية" : "Global Alliances"}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Speech bubble pointer notch extending into the white testimonial slide below */}
          <div className="absolute -bottom-5 left-10 sm:left-24 z-20 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-maple" />
        </div>

        {/* White Testimonial Slider Container */}
        <div className="bg-white py-16 md:py-24">
          <div className="mx-auto max-w-[1500px] px-6 md:px-12">
            <div className="max-w-4xl pl-2 sm:pl-8">

              {/* Author name lead-in */}
              <p className="text-sm font-semibold text-[#0D0E0D] mb-4 font-sans tracking-wide">
                - {COMMUNITY_TESTIMONIALS[currentTestimonialIndex].author}
              </p>

              {/* Animated Quote Slide */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonialIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <blockquote className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] text-[#0D0E0D] font-light leading-relaxed">
                    “{lang === "fr" ? COMMUNITY_TESTIMONIALS[currentTestimonialIndex].quoteFr : lang === "ar" ? COMMUNITY_TESTIMONIALS[currentTestimonialIndex].quoteAr : COMMUNITY_TESTIMONIALS[currentTestimonialIndex].quoteEn}”
                  </blockquote>

                  {/* Role / Org */}
                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-maple font-montserrat">
                    {(lang === "fr" ? COMMUNITY_TESTIMONIALS[currentTestimonialIndex].roleFr : lang === "ar" ? COMMUNITY_TESTIMONIALS[currentTestimonialIndex].roleAr : COMMUNITY_TESTIMONIALS[currentTestimonialIndex].roleEn)} • {COMMUNITY_TESTIMONIALS[currentTestimonialIndex].organization}
                  </p>

                  {/* 5 Stars */}
                  <div className="mt-3 flex items-center gap-1 text-amber-400 text-lg">
                    ★★★★★
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Slider Controls: Dots + Arrows */}
              <div className="mt-10 flex items-center justify-between pt-6 border-t border-forest/10 max-w-xl">
                {/* Dots Pagination */}
                <div className="flex items-center gap-2.5">
                  {COMMUNITY_TESTIMONIALS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTestimonialIndex(idx)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${currentTestimonialIndex === idx
                          ? "w-8 bg-maple"
                          : "w-2.5 bg-forest/20 hover:bg-forest/40"
                        }`}
                      aria-label={`Témoignage ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Prev / Next Arrow Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTestimonialIndex((prev) => (prev - 1 + COMMUNITY_TESTIMONIALS.length) % COMMUNITY_TESTIMONIALS.length)}
                    className="p-2 border border-forest/20 hover:border-maple hover:text-maple text-[#0D0E0D] transition-colors"
                    aria-label="Témoignage précédent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentTestimonialIndex((prev) => (prev + 1) % COMMUNITY_TESTIMONIALS.length)}
                    className="p-2 border border-forest/20 hover:border-maple hover:text-maple text-[#0D0E0D] transition-colors"
                    aria-label="Témoignage suivant"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ===================== FINAL CALL TO ACTION ===================== */}
      <section className="relative overflow-hidden border-t border-forest/15 bg-[#0D0E0D] text-bone" data-testid="home-cta-section">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-maple/15 blur-[160px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1500px] px-5 py-24 text-center md:px-10 md:py-32">
          <Reveal>
            <span className="mb-4 inline-block rounded-full border border-bone/20 bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-bone backdrop-blur-md font-montserrat">
              {lang === "fr" ? "ENGAGEZ-VOUS DÈS AUJOURD'HUI" : lang === "ar" ? "ابدأ مسارك اليوم" : "START YOUR JOURNEY TODAY"}
            </span>
            <h2 className="mx-auto mt-4 max-w-4xl font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-tight tracking-tight text-white">
              {t.home.h6Title || "Prêt à ouvrir de nouveaux horizons ?"}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-bone/80 md:text-xl font-sans">
              {t.home.h6Sub || "Que vous souhaitiez apprendre, bâtir ou investir dans le changement — il y a une place pour vous ici."}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Magnetic>
                <Link
                  to="/join"
                  data-testid="cta-member-button"
                  className="group inline-flex items-center gap-3 bg-maple hover:bg-purple-700 px-9 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-white shadow-xl transition-all duration-300"
                >
                  <span>{t.home.ctaJoin || "Rejoindre la communauté"}</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Magnetic>
              <Magnetic>
                <Link
                  to="/partners"
                  data-testid="cta-partner-button"
                  className="group inline-flex items-center gap-3 border-2 border-bone/80 bg-transparent px-9 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone backdrop-blur-sm transition-all duration-300 hover:bg-bone hover:text-[#0D0E0D]"
                >
                  <span>{t.home.ctaPartner || "Devenir partenaire"}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>

      {/* INVOLVEMENT FORM MODAL */}
      <AnimatePresence>
        {activeInvolvementCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeInvolvementModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-xl bg-white border border-forest/15 shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={closeInvolvementModal}
                className="absolute top-5 right-5 p-2 text-forest/60 hover:text-forest transition-colors"
                aria-label={lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>

              {submitted ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-maple/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-maple" />
                  </div>
                  <span className="font-montserrat text-xs font-bold uppercase tracking-[0.2em] text-maple mb-2">
                    {lang === "fr" ? "Demande Enregistrée" : lang === "ar" ? "تم تسجيل الطلب" : "Inquiry Received"}
                  </span>
                  <h3 className="font-heading text-2xl font-black text-forest mb-3">
                    {lang === "fr" ? "Merci pour votre engagement !" : lang === "ar" ? "شكراً لمشاركتك!" : "Thank You For Getting Involved!"}
                  </h3>
                  <p className="text-sage text-sm leading-relaxed max-w-md mb-8">
                    {lang === "fr"
                      ? "Votre formulaire a bien été transmis à l'équipe CAP Entrepreneurs et est désormais enregistré dans notre système. Nous reviendrons vers vous très rapidement."
                      : lang === "ar"
                      ? "تم استلام طلبك بنجاح وسيتواصل معك فريق كاب رواد الأعمال قريباً لمتابعة الخطوات التالية."
                      : "Your inquiry has been successfully received by the CAP Entrepreneurs team. We will get back to you shortly."}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
                    <button
                      type="button"
                      onClick={closeInvolvementModal}
                      className="w-full sm:w-auto px-8 py-3.5 bg-forest text-white font-montserrat text-xs font-bold uppercase tracking-[0.16em] hover:bg-maple transition-colors"
                    >
                      Fermer
                    </button>
                    <Link
                      to={activeInvolvementCard.link}
                      onClick={closeInvolvementModal}
                      className="w-full sm:w-auto px-8 py-3.5 border border-forest/20 text-forest font-montserrat text-xs font-bold uppercase tracking-[0.16em] hover:bg-forest hover:text-white transition-colors"
                    >
                      Consulter la page dédiée ↗
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6 pr-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-montserrat text-[11px] font-bold uppercase tracking-[0.2em] text-maple">
                        {activeInvolvementCard.number} • {activeInvolvementCard.tag}
                      </span>
                    </div>
                    <h3 className="font-heading text-2xl sm:text-3xl font-black text-forest leading-tight">
                      {activeInvolvementCard.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-sage leading-relaxed">
                      {activeInvolvementCard.intro}
                    </p>
                  </div>

                  <form onSubmit={handleInvolvementSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                        {lang === "fr" ? "Nom complet" : lang === "ar" ? "الاسم الكامل" : "Full Name"} <span className="text-maple">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={lang === "fr" ? "Ex: Amara Traoré" : lang === "ar" ? "مثال: أمارا تراوري" : "e.g., Alex Tremblay"}
                        value={formValues.name || ""}
                        onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                        className="w-full border border-forest/20 px-3.5 py-2.5 text-sm focus:outline-none focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                        {lang === "fr" ? "Adresse courriel" : lang === "ar" ? "البريد الإلكتروني" : "Email Address"} <span className="text-maple">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder={lang === "fr" ? "vous@exemple.com" : lang === "ar" ? "name@example.com" : "you@example.com"}
                        value={formValues.email || ""}
                        onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                        className="w-full border border-forest/20 px-3.5 py-2.5 text-sm focus:outline-none focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                        {lang === "fr" ? "Numéro de téléphone" : lang === "ar" ? "رقم الهاتف" : "Phone Number"} <span className="text-sage text-[10px] font-normal">{lang === "fr" ? "(optionnel)" : lang === "ar" ? "(اختياري)" : "(optional)"}</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="+1 (514) 000-0000"
                        value={formValues.phone || ""}
                        onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                        className="w-full border border-forest/20 px-3.5 py-2.5 text-sm focus:outline-none focus:border-forest"
                      />
                    </div>

                    {activeInvolvementCard.fields?.map((f) => {
                      if (f.kind === "select") {
                        return (
                          <div key={f.name}>
                            <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                              {f.label} {f.required && <span className="text-maple">*</span>}
                            </label>
                            <select
                              required={f.required}
                              value={formValues[f.name] || ""}
                              onChange={(e) => setFormValues({ ...formValues, [f.name]: e.target.value })}
                              className="w-full border border-forest/20 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-forest"
                            >
                              {f.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }
                      if (f.kind === "textarea") {
                        return (
                          <div key={f.name}>
                            <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                              {f.label} {f.required && <span className="text-maple">*</span>}
                            </label>
                            <textarea
                              rows={3}
                              required={f.required}
                              placeholder={f.placeholder}
                              value={formValues[f.name] || ""}
                              onChange={(e) => setFormValues({ ...formValues, [f.name]: e.target.value })}
                              className="w-full border border-forest/20 px-3.5 py-2.5 text-sm focus:outline-none focus:border-forest"
                            />
                          </div>
                        );
                      }
                      return (
                        <div key={f.name}>
                          <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                            {f.label} {f.required && <span className="text-maple">*</span>}
                          </label>
                          <input
                            type="text"
                            required={f.required}
                            placeholder={f.placeholder}
                            value={formValues[f.name] || ""}
                            onChange={(e) => setFormValues({ ...formValues, [f.name]: e.target.value })}
                            className="w-full border border-forest/20 px-3.5 py-2.5 text-sm focus:outline-none focus:border-forest"
                          />
                        </div>
                      );
                    })}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex items-center justify-center gap-2 bg-forest px-8 py-4 font-montserrat text-xs font-bold uppercase tracking-[0.16em] text-white shadow-md transition-all hover:bg-maple disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{lang === "fr" ? "Transmission en cours..." : lang === "ar" ? "جاري الإرسال..." : "Submitting..."}</span>
                          </>
                        ) : (
                          <>
                            <span>{lang === "fr" ? "Transmettre mon dossier à l'équipe" : lang === "ar" ? "إرسال طلبي للفريق" : "Submit to the Team"}</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-2 text-center">
                      <Link
                        to={activeInvolvementCard.link}
                        onClick={closeInvolvementModal}
                        className="text-xs text-sage hover:text-forest underline transition-colors"
                      >
                        {lang === "fr" ? "Ou consulter la page complète" : lang === "ar" ? "أو استعراض الصفحة الكاملة" : "Or explore the full page"} ({activeInvolvementCard.tag}) →
                      </Link>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;

