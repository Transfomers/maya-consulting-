import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  Sparkles,
  ArrowUpRight,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Calendar,
  Check,
  RotateCcw
} from "lucide-react";
import { Reveal } from "@/components/motion";
import { IMAGES } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { toast } from "sonner";
import EditorialRejoindreHero from "@/components/EditorialRejoindreHero";

// Photo assets matching the reference designs
const DESIGN_ASSETS = {
  heroCyclist: "https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?auto=format&fit=crop&w=1600&q=80",
  natureMountain: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
  roadCoastal: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80",
  mistyForest: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
  aboutPortrait: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
  oceanBanner: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
};

const Volunteer = () => {
  const { lang, t } = useLang();
  const formRef = useRef(null);

  // Interactive Questionnaire State
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({
    skill: "",
    level: "",
    time: ""
  });
  const [quizResult, setQuizResult] = useState(null);

  // Form State matching the clean contact form at the end
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    area: "",
    experience: "",
    availability: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const QUESTIONS = [
    {
      id: "skill",
      title: t.volunteer.q1Title || "1. Que souhaitez-vous apporter ?",
      options: t.volunteer.q1Options || [
        "Compétences numériques",
        "Communication",
        "Développement des affaires",
        "Formation",
        "Arts & culture",
        "Technologie",
        "Agriculture",
        "Partenariats",
        "Gestion de projet"
      ],
    },
    {
      id: "level",
      title: t.volunteer.q2Title || "2. Quel est votre niveau d'expérience ?",
      options: t.volunteer.q2Options || [
        "Étudiant / Fellow",
        "Associé",
        "Professionnel",
        "Consultant",
        "Directeur / Dirigeant"
      ],
    },
    {
      id: "time",
      title: t.volunteer.q3Title || "3. Combien de temps pouvez-vous consacrer ?",
      options: t.volunteer.q3Options || [
        "2 h / semaine",
        "4–6 h / semaine",
        "7–10 h / semaine",
        "Par projet"
      ],
    }
  ];

  const handleSelectQuizOption = (option) => {
    const currentQ = QUESTIONS[quizStep].id;
    const updated = { ...quizAnswers, [currentQ]: option };
    setQuizAnswers(updated);

    if (quizStep < QUESTIONS.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      calculateRecommendation(updated);
    }
  };

  const calculateRecommendation = (finalAnswers) => {
    let program = "Cap Green Lab";
    let role = "Bénévole Technicien & Reconditionnement";
    let training = "Diagnostic, maintenance et réemploi d'équipements informatiques";

    const s = (finalAnswers.skill || "").toLowerCase();
    if (s.includes("agri")) {
      program = "AgriConnect";
      role = "Facilitateur Numérique Rural";
      training = "Outils agricoles connectés, coopératives et marchés équitables";
    } else if (s.includes("méd") || s.includes("media") || s.includes("comm") || s.includes("art")) {
      program = "Safe Vibe & Médias Numériques";
      role = "Mentor Contenu & Citoyenneté Numérique";
      training = "Production médiatique éthique, podcast et sensibilisation";
    } else if (s.includes("parten") || s.includes("projet") || s.includes("affair") || s.includes("gest")) {
      program = "African Creative Sourcing & Global Festival";
      role = "Coordinateur Partenariats & Écosystème";
      training = "Sourcing international, logistique et relations acheteurs";
    }

    setQuizResult({
      program,
      role,
      training,
      summary: `${program}- ${role} (Formation : ${training})`
    });

    // Auto populate corresponding form fields
    setFormData((prev) => ({
      ...prev,
      area: finalAnswers.skill || prev.area,
      experience: finalAnswers.level || prev.experience,
      availability: finalAnswers.time || prev.availability
    }));
  };

  const scrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.area) {
      toast.error(t.form?.required || "Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/submissions", {
        type: "volunteer",
        payload: {
          ...formData,
          recommendedPathway: quizResult?.summary || null
        }
      });
      toast.success(t.membership?.volSuccess || "Merci ! Votre candidature de bénévolat a bien été reçue.");
      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      toast.error(t.form?.error || "Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const popularPrograms = [
    {
      title: "Cap Green Lab",
      category: "Tech Inclusive",
      image: IMAGES.workshop,
      link: "/programs#cap-green-lab"
    },
    {
      title: "AgriConnect",
      category: "Agriculture Digitale",
      image: IMAGES.building,
      link: "/programs#agriconnect"
    },
    {
      title: "Safe Vibe",
      category: "Médias Responsables",
      image: IMAGES.board,
      link: "/programs#safe-vibe"
    },
    {
      title: "African Sourcing & Buyer",
      category: "Commerce & Festival",
      image: IMAGES.collaboration,
      link: "/programs#creative-social"
    }
  ];

  return (
    <div data-testid="volunteer-page" className="min-h-screen bg-[#FAF9F6] text-[#0D0E0D] font-sans selection:bg-maple selection:text-white">

      {/* 1. EDITORIAL REJOINDRE HERO (Matching "Why Every Woman Needs Nice Pj's" / La-féminité layout) */}
      <EditorialRejoindreHero
        testId="volunteer-hero"
        brandName="Cap-Entrepreneurs"
        categoryKicker={lang === "fr" ? "ENGAGEMENT CITOYEN & BÉNÉVOLAT" : lang === "ar" ? "التطوع المجتمعي" : "CITIZEN ENGAGEMENT & VOLUNTEERING"}
        verticalKicker={lang === "fr" ? "B É N É V O L A T" : lang === "ar" ? "ت ط و ع" : "V O L U N T E E R"}
        titleLines={lang === "fr" ? ["Créer", "Un Impact", "Humain Et", "Solidaire."] : lang === "ar" ? ["اصنع", "أثراً", "إنسانياً", "ومستداماً."] : ["Your Skills", "Can Open", "New", "Horizons."]}
        subtitle={t.volunteer.intro}
        ctaLabel={lang === "fr" ? "Trouver mon parcours bénévole" : lang === "ar" ? "اكتشف مسارك التطوعي" : "Find Your Volunteer Pathway"}
        ctaTarget="#questionnaire"
        bgImage="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80"
        fgImage="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"
      />

      {/* 3. MAIN EDITORIAL CONTENT + SIDEBAR LAYOUT (Matching Screenshot 1) */}
      <main className="mx-auto max-w-[1360px] px-4 sm:px-6 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">

          {/* LEFT COLUMN: MAIN CONTENT (8 cols) */}
          <div className="lg:col-span-8 space-y-20">

            {/* FEATURED STORY 1: "Trouver votre parcours bénévole" (Quiz) */}
            <article id="questionnaire" className="bg-white border border-[#0D0E0D]/10 p-6 sm:p-10 shadow-sm">
              <Reveal>
                {/* Large Featured Photo */}
                <div className="overflow-hidden border border-[#0D0E0D]/10 mb-8">
                  <img
                    src={DESIGN_ASSETS.natureMountain}
                    alt="Orientation & Parcours"
                    className="aspect-[16/9] w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>

                {/* Article Metadata */}
                <div className="text-center mb-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                    ORIENTATION & TALENTS
                  </p>
                  <h3 className="mt-2 font-serif text-2xl sm:text-3xl md:text-4xl font-medium text-[#0D0E0D]">
                    {t.volunteer.quizTitle || "Trouver votre parcours bénévole"}
                  </h3>
                  <div className="mx-auto mt-3 mb-2 h-[2px] w-10 bg-maple" />
                  <p className="text-xs text-sage italic font-serif">
                    {lang === "fr"
                      ? "Évaluation personnalisée en 3 étapes • Accédez à la recommandation idéale"
                      : lang === "ar"
                      ? "تقييم مخصص في 3 خطوات • احصل على المسار الموصى به"
                      : "Personalized 3-step assessment • Discover your ideal match"}
                  </p>
                </div>

                {/* Interactive Questionnaire Box */}
                {!quizResult ? (
                  <div className="border-t border-[#0D0E0D]/10 pt-6">
                    {/* Step Indicators */}
                    <div className="mb-6 flex items-center justify-between gap-2">
                      {QUESTIONS.map((q, idx) => (
                        <div key={q.id} className="flex-1">
                          <div className={`h-1.5 w-full rounded-none transition-all ${idx <= quizStep ? "bg-maple" : "bg-[#0D0E0D]/10"}`} />
                          <span className="mt-1 block text-[10px] uppercase font-bold tracking-wider text-sage">
                            0{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>

                    <h4 className="font-serif text-xl sm:text-2xl font-medium text-[#0D0E0D] mb-5">
                      {QUESTIONS[quizStep].title}
                    </h4>

                    {/* Options Grid */}
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {QUESTIONS[quizStep].options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectQuizOption(opt)}
                          className="group flex items-center justify-between border border-[#0D0E0D]/15 bg-[#FAF9F6] p-4 text-left text-xs font-semibold text-[#0D0E0D] transition-all hover:border-maple hover:bg-white hover:shadow-sm"
                        >
                          <span>{opt}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-maple opacity-0 transition-opacity group-hover:opacity-100 shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>

                    {quizStep > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuizStep(quizStep - 1)}
                        className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-sage hover:text-[#0D0E0D]"
                      >
                        {lang === "fr" ? "← Retour à la question précédente" : lang === "ar" ? "← الرجوع للسؤال السابق" : "← Back to previous question"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border border-maple/30 bg-maple/5 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-maple text-white shadow-sm">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                      {t.volunteer.resultTitle || "Résultat : Votre parcours recommandé"}
                    </span>
                    <h4 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#0D0E0D]">
                      {quizResult.program}
                    </h4>
                    <p className="mt-1 text-sm font-semibold text-maple">
                      {(lang === "fr" ? "Rôle proposé : " : lang === "ar" ? "الدور المقترح: " : "Suggested Role: ")}{quizResult.role}
                    </p>

                    <div className="mt-5 max-w-xl mx-auto rounded-none bg-white p-5 border border-[#0D0E0D]/10 text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-sage mb-1 font-montserrat">
                        {lang === "fr" ? "PARCOURS DE FORMATION & IMMERSION" : lang === "ar" ? "مسار التدريب والاندماج" : "TRAINING & IMMERSION PATHWAY"}
                      </p>
                      <p className="font-serif italic text-base text-[#0D0E0D]">
                        {quizResult.training}
                      </p>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        onClick={scrollToForm}
                        className="inline-flex items-center gap-2 bg-[#232724] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-maple"
                      >
                        <span>{lang === "fr" ? "Postuler pour ce parcours" : lang === "ar" ? "التقديم لهذا المسار" : "Apply for this pathway"}</span> <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQuizStep(0);
                          setQuizAnswers({ skill: "", level: "", time: "" });
                          setQuizResult(null);
                        }}
                        className="inline-flex items-center gap-2 border border-[#0D0E0D]/30 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D] hover:bg-[#FAF9F6]"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> <span>{lang === "fr" ? "Recommencer" : lang === "ar" ? "إعادة البدء" : "Start Over"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </Reveal>
            </article>

            {/* FEATURED STORY 2: "Votre Parcours Bénévole" (Growth, Learning & Lasting Impact) */}
            <section className="bg-white border border-[#0D0E0D]/10 p-6 sm:p-10 shadow-sm">
              <Reveal>
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                    {t.volunteer.journeyTitle || "Votre Parcours Bénévole"}
                  </p>
                  <h3 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#0D0E0D]">
                    Growth, Learning and Lasting Impact
                  </h3>
                  <div className="mx-auto mt-3 mb-3 h-[2px] w-12 bg-maple" />
                  <p className="font-serif italic text-sm sm:text-base text-sage leading-relaxed">
                    {t.volunteer.journeyIntro || "Chez Cap Entrepreneurs, le bénévolat n'est pas seulement une contribution. C'est une opportunité d'évolution, d'apprentissage et d'impact-au Canada et à l'international."}
                  </p>
                </div>

                {/* 2x2 Editorial Cards (Matching Fashion Model Shoot & Golden Snow Land in Screenshot 1) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-[#0D0E0D]/10">

                  {/* Card 1 */}
                  <div className="border border-[#0D0E0D]/10 bg-[#FAF9F6] p-5">
                    <div className="overflow-hidden border border-[#0D0E0D]/10 mb-4">
                      <img
                        src={DESIGN_ASSETS.roadCoastal}
                        alt="01 Postuler"
                        className="aspect-[16/10] w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                      ÉTAPE 01
                    </span>
                    <h4 className="mt-1 font-serif text-xl font-bold text-[#0D0E0D]">
                      01 Postuler
                    </h4>
                    <p className="mt-2 text-xs sm:text-sm text-sage leading-relaxed">
                      Mettez vos compétences et votre temps au service d'un projet porteur de sens. Remplissez notre formulaire pour démarrer l'aventure.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="border border-[#0D0E0D]/10 bg-[#FAF9F6] p-5">
                    <div className="overflow-hidden border border-[#0D0E0D]/10 mb-4">
                      <img
                        src={DESIGN_ASSETS.mistyForest}
                        alt="02 Formation"
                        className="aspect-[16/10] w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                      ÉTAPE 02
                    </span>
                    <h4 className="mt-1 font-serif text-xl font-bold text-[#0D0E0D]">
                      02 Formation
                    </h4>
                    <p className="mt-2 text-xs sm:text-sm text-sage leading-relaxed">
                      Accédez à des formations adaptées à votre rôle et à vos objectifs. Bénéficiez d'un accompagnement personnalisé par nos pairs.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="border border-[#0D0E0D]/10 bg-[#FAF9F6] p-5">
                    <div className="border-b border-[#0D0E0D]/10 pb-3 mb-3">
                      <span className="font-serif text-3xl italic text-maple">03</span>
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#0D0E0D] font-montserrat">
                        ALIGNEMENT
                      </span>
                    </div>
                    <h4 className="font-serif text-xl font-bold text-[#0D0E0D]">
                      03 Match
                    </h4>
                    <p className="mt-2 text-xs sm:text-sm text-sage leading-relaxed">
                      Impliquez-vous dans le programme correspondant à vos aspirations (Cap Green Lab, AgriConnect, Safe Vibe ou Initiatives Mondiales).
                    </p>
                  </div>

                  {/* Card 4 */}
                  <div className="border border-[#0D0E0D]/10 bg-[#FAF9F6] p-5">
                    <div className="border-b border-[#0D0E0D]/10 pb-3 mb-3">
                      <span className="font-serif text-3xl italic text-maple">04</span>
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#0D0E0D] font-montserrat">
                        VALORISATION
                      </span>
                    </div>
                    <h4 className="font-serif text-xl font-bold text-[#0D0E0D]">
                      04 Impact
                    </h4>
                    <p className="mt-2 text-xs sm:text-sm text-sage leading-relaxed">
                      Recevez des certificats et des badges pour valoriser votre engagement auprès d'employeurs ou partenaires internationaux.
                    </p>
                  </div>

                </div>

                {/* Benefits List */}
                <div className="mt-12 pt-8 border-t border-[#0D0E0D]/10">
                  <h4 className="font-serif text-2xl font-bold text-[#0D0E0D] mb-6">
                    {t.volunteer.whatYouGainTitle || "Ce que vous gagnez :"}
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(t.volunteer.whatYouGain || [
                      "Compétences recherchées",
                      "Expérience professionnelle valorisante",
                      "Un réseau international",
                      "Impact concret sur les communautés",
                      "Exposition aux meilleures pratiques canadiennes",
                      "Opportunités internationales"
                    ]).map((gain) => (
                      <div key={gain} className="flex items-center gap-3 border border-[#0D0E0D]/10 bg-[#FAF9F6] p-3.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-maple text-white shrink-0">
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#0D0E0D]">
                          {gain}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* International Opportunities Highlight */}
                  <div className="mt-8 border-l-2 border-maple bg-[#FAF9F6] p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe2 className="h-4 w-4 text-maple" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0D0E0D] font-montserrat">
                        Opportunités internationales
                      </span>
                    </div>
                    <p className="font-serif italic text-sm sm:text-base text-sage leading-relaxed">
                      {t.volunteer.internationalNote || "Les bénévoles peuvent également contribuer au Programme African Creative Sourcing & Buyer (logistique, communication, relation acheteurs) et au Global Festival Nairobi 2027."}
                    </p>
                  </div>
                </div>
              </Reveal>
            </section>

          </div>

          {/* RIGHT COLUMN: MAGAZINE SIDEBAR (4 cols - Matching Screenshot 1) */}
          <aside className="lg:col-span-4 space-y-12">

            {/* WIDGET 1: ABOUT ME / ABOUT CAP (Framed with double horizontal lines) */}
            <div className="bg-white border border-[#0D0E0D]/10 p-6 shadow-sm">
              {/* Header framed with top & bottom line */}
              <div className="border-t border-b border-[#0D0E0D] py-2.5 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.28em] text-[#0D0E0D] font-montserrat">
                  ABOUT CAP
                </span>
              </div>

              {/* Portrait Image (Woman with kraft paper bouquet) */}
              <div className="mt-6 overflow-hidden border border-[#0D0E0D]/10">
                <img
                  src={DESIGN_ASSETS.aboutPortrait}
                  alt="Cap Entrepreneurs Bénévolat"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Bio Excerpt */}
              <p className="mt-5 text-xs sm:text-sm leading-relaxed text-sage text-center">
                Organisme à but non lucratif canadien dédié à l'émancipation par le numérique, accompagnant les individus, les bénévoles et les organisations vers un impact durable.
              </p>

              {/* Cursive Signature Graphic */}
              <div className="mt-5 flex flex-col items-center justify-center">
                <svg
                  viewBox="0 0 240 60"
                  className="h-12 w-auto max-w-[170px] text-[#0D0E0D] opacity-85"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 25 45 C 20 32, 28 14, 48 16 C 68 20, 52 46, 42 46 C 36 46, 40 36, 56 34 C 68 32, 82 34, 88 38" />
                  <path d="M 92 40 C 96 34, 104 30, 112 34 C 116 36, 118 43, 120 46" />
                  <path d="M 122 30 L 126 52 M 124 36 C 129 32, 136 32, 142 36 C 146 40, 147 48, 149 50" />
                  <path d="M 154 36 C 162 34, 172 36, 179 38 M 166 28 L 164 50" />
                  <path d="M 182 43 C 189 33, 199 30, 212 33 C 222 36, 219 48, 229 50" />
                </svg>
                <span className="font-serif italic text-sm text-[#0D0E0D]/80 -mt-1 tracking-wider">
                  Cap Entrepreneurs
                </span>
              </div>
            </div>

            {/* WIDGET 2: FOLLOW US ON */}
            <div className="bg-white border border-[#0D0E0D]/10 p-6 shadow-sm">
              <div className="border-t border-b border-[#0D0E0D] py-2.5 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.28em] text-[#0D0E0D] font-montserrat">
                  FOLLOW US ON
                </span>
              </div>
              <div className="mt-6 flex items-center justify-center gap-4">
                {[
                  { icon: Facebook, label: "Facebook", href: "https://facebook.com" },
                  { icon: Instagram, label: "Instagram", href: "https://instagram.com" },
                  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
                  { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
                ].map((social, idx) => (
                  <a
                    key={idx}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center border border-[#0D0E0D]/15 bg-[#FAF9F6] text-[#0D0E0D] transition-colors hover:border-maple hover:bg-maple hover:text-white"
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* WIDGET 3: POPULAR POSTS / PROGRAMMES PHARES */}
            <div className="bg-white border border-[#0D0E0D]/10 p-6 shadow-sm">
              <div className="border-t border-b border-[#0D0E0D] py-2.5 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.28em] text-[#0D0E0D] font-montserrat">
                  POPULAR INITIATIVES
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {popularPrograms.map((prog, idx) => (
                  <Link
                    key={idx}
                    to={prog.link}
                    className="group flex items-center gap-3.5 border-b border-[#0D0E0D]/10 pb-3 last:border-b-0 last:pb-0"
                  >
                    <img
                      src={prog.image}
                      alt={prog.title}
                      className="h-14 w-14 shrink-0 object-cover border border-[#0D0E0D]/10 transition-transform group-hover:scale-105"
                    />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-maple font-montserrat">
                        {prog.category}
                      </span>
                      <h5 className="font-serif text-sm font-bold text-[#0D0E0D] group-hover:text-maple transition-colors line-clamp-1">
                        {prog.title}
                      </h5>
                      <span className="text-[10px] text-sage">En savoir plus →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* WIDGET 4: BANNER ADS / GLOBAL FESTIVAL (Like Banner Ads 300x250) */}
            <div className="relative overflow-hidden border border-[#0D0E0D]/10 shadow-sm">
              <img
                src={DESIGN_ASSETS.oceanBanner}
                alt="Banner Festival"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-[#0D0E0D]/40 backdrop-blur-[1px] flex items-center justify-center p-6 text-center">
                <div className="border border-white/60 bg-white/10 p-6 backdrop-blur-md text-white max-w-[280px]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple">
                    GLOBAL FESTIVAL
                  </p>
                  <p className="mt-1 font-serif text-lg font-bold">
                    Nairobi 2027 & Paris 2027
                  </p>
                  <p className="mt-1 text-[11px] opacity-80">
                    Connecter les talents et les continents
                  </p>
                </div>
              </div>
            </div>

            {/* WIDGET 5: CATEGORIES / DOMAINES CLÉS */}
            <div className="bg-white border border-[#0D0E0D]/10 p-6 shadow-sm">
              <div className="border-t border-b border-[#0D0E0D] py-2.5 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.28em] text-[#0D0E0D] font-montserrat">
                  DOMAINES CLÉS
                </span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
                {[
                  "Numérique",
                  "Formation",
                  "Transition Écologique",
                  "Agriculture",
                  "Médias & Arts",
                  "Partenariats",
                  "Inclusion",
                  "Gouvernance"
                ].map((cat, i) => (
                  <span
                    key={i}
                    className="border border-[#0D0E0D]/10 bg-[#FAF9F6] p-2 text-center text-sage font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

          </aside>

        </div>
      </main>

      {/* 4. THE FORMS AT THE END (Matching Screenshot 2: Contact Me / Join Us) */}
      <section
        ref={formRef}
        id="volunteer-form"
        className="bg-white border-t border-[#0D0E0D]/10 py-20 md:py-28"
      >
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 md:px-8">

          {/* Centered Form Header (Matching Screenshot 2: Contact Me / LETS GET INTOUCH) */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-4xl sm:text-5xl font-medium text-[#0D0E0D] tracking-tight">
              {lang === "fr" ? "Agir avec nous" : lang === "ar" ? "تطوع معنا" : "Join Us as a Volunteer"}
            </h2>
            <div className="mx-auto mt-4 mb-3 h-[2px] w-12 bg-maple" />
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sage font-montserrat">
              {t.volunteer.formTitle || "DITES-NOUS COMMENT VOUS SOUHAITEZ AIDER"}
            </p>
          </div>

          {/* Two-Column Form Layout: Left Column = Form, Right Column = About Widget (Matching Screenshot 2) */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">

            {/* LEFT COLUMN: THE APPLICATION FORM (8 cols) */}
            <div className="lg:col-span-8">

              {/* Narrative Text */}
              <p className="text-sm sm:text-base leading-relaxed text-sage mb-8">
                {lang === "fr"
                  ? "Que vous soyez étudiant, professionnel, consultant ou citoyen engagé, il y a une place pour vous chez Cap Entrepreneurs. Remplissez ce formulaire et notre équipe prendra contact avec vous dans les meilleurs délais pour convenir d'une première rencontre d'accueil et d'alignement."
                  : lang === "ar"
                  ? "سواء كنت طالباً، أو مهنياً، أو استشارياً، أو مواطناً فاعلاً، فهناك مكان لك في كاب رواد الأعمال. املأ هذا النموذج وسيتواصل معك فريقنا في أقرب وقت لتنسيق لقاء التعارف الأول."
                  : "Whether you are a student, professional, consultant, or engaged citizen, there is a meaningful place for you at Cap Entrepreneurs. Complete this application and our team will get in touch shortly to schedule an onboarding consultation."}
              </p>

              {submitted ? (
                <div className="border border-maple bg-maple/5 p-8 md:p-12 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-maple text-white">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0D0E0D]">
                    {lang === "fr" ? "Merci pour votre engagement !" : lang === "ar" ? "شكراً لمشاركتك وتطوعك!" : "Thank You For Volunteering!"}
                  </h3>
                  <p className="mt-3 text-sm text-sage max-w-md mx-auto">
                    Votre formulaire a bien été transmis à notre équipe de coordination des bénévoles. Nous avons hâte d'échanger avec vous.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        area: "",
                        experience: "",
                        availability: "",
                        message: ""
                      });
                    }}
                    className="mt-6 inline-flex items-center gap-2 border border-[#0D0E0D] px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#0D0E0D] hover:bg-[#FAF9F6]"
                  >
                    Envoyer une autre candidature
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6" data-testid="volunteer-page-form">

                  {/* NAME * */}
                  <div>
                    <label
                      htmlFor="form-volunteer-name-input"
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]"
                    >
                      NOM COMPLET *
                    </label>
                    <input
                      id="form-volunteer-name-input"
                      data-testid="form-volunteer-name-input"
                      type="text"
                      name="name"
                      required
                      placeholder="Votre nom complet"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm text-[#0D0E0D] placeholder:text-sage/50 transition-colors focus:border-maple focus:outline-none"
                    />
                  </div>

                  {/* EMAIL * */}
                  <div>
                    <label
                      htmlFor="form-volunteer-email-input"
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]"
                    >
                      COURRIEL *
                    </label>
                    <input
                      id="form-volunteer-email-input"
                      data-testid="form-volunteer-email-input"
                      type="email"
                      name="email"
                      required
                      placeholder="nom@exemple.com"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm text-[#0D0E0D] placeholder:text-sage/50 transition-colors focus:border-maple focus:outline-none"
                    />
                  </div>

                  {/* DOMAINE D'INTÉRÊT * */}
                  <div>
                    <label
                      htmlFor="form-volunteer-area-input"
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]"
                    >
                      DOMAINE D'INTÉRÊT *
                    </label>
                    <select
                      id="form-volunteer-area-input"
                      data-testid="form-volunteer-area-input"
                      name="area"
                      required
                      value={formData.area}
                      onChange={handleFormChange}
                      className={`w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm transition-colors focus:border-maple focus:outline-none ${formData.area ? "text-[#0D0E0D]" : "text-sage/60"
                        }`}
                    >
                      <option value="" disabled>
                        Sélectionnez votre domaine d'intérêt
                      </option>
                      {(t.volunteer.q1Options || [
                        "Compétences numériques",
                        "Communication",
                        "Développement des affaires",
                        "Formation",
                        "Arts & culture",
                        "Technologie",
                        "Agriculture",
                        "Partenariats",
                        "Gestion de projet"
                      ]).map((opt) => (
                        <option key={opt} value={opt} className="text-[#0D0E0D]">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2 COLUMNS: EXPERIENCE LEVEL * & DISPONIBILITÉ * */}
                  <div className="grid gap-6 sm:grid-cols-2">

                    {/* EXPERIENCE LEVEL * */}
                    <div>
                      <label
                        htmlFor="form-volunteer-experience-input"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]"
                      >
                        NIVEAU D'EXPÉRIENCE *
                      </label>
                      <select
                        id="form-volunteer-experience-input"
                        data-testid="form-volunteer-experience-input"
                        name="experience"
                        required
                        value={formData.experience}
                        onChange={handleFormChange}
                        className={`w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm transition-colors focus:border-maple focus:outline-none ${formData.experience ? "text-[#0D0E0D]" : "text-sage/60"
                          }`}
                      >
                        <option value="" disabled>
                          Select your experience level
                        </option>
                        {(t.volunteer.q2Options || [
                          "Étudiant / Fellow",
                          "Associé",
                          "Professionnel",
                          "Consultant",
                          "Directeur / Dirigeant"
                        ]).map((lvl) => (
                          <option key={lvl} value={lvl} className="text-[#0D0E0D]">
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* DISPONIBILITÉ * */}
                    <div>
                      <label
                        htmlFor="form-volunteer-availability-input"
                        className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]"
                      >
                        DISPONIBILITÉ *
                      </label>
                      <select
                        id="form-volunteer-availability-input"
                        data-testid="form-volunteer-availability-input"
                        name="availability"
                        required
                        value={formData.availability}
                        onChange={handleFormChange}
                        className={`w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm transition-colors focus:border-maple focus:outline-none ${formData.availability ? "text-[#0D0E0D]" : "text-sage/60"
                          }`}
                      >
                        <option value="" disabled>
                          Select your availability
                        </option>
                        {(t.volunteer.q3Options || [
                          "2 h / semaine",
                          "4–6 h / semaine",
                          "7–10 h / semaine",
                          "Par projet"
                        ]).map((time) => (
                          <option key={time} value={time} className="text-[#0D0E0D]">
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* MESSAGE / COMPÉTENCES & EXPÉRIENCE * */}
                  <div>
                    <label
                      htmlFor="form-volunteer-message-input"
                      className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]"
                    >
                      COMPÉTENCES & EXPÉRIENCE
                    </label>
                    <textarea
                      id="form-volunteer-message-input"
                      data-testid="form-volunteer-message-input"
                      name="message"
                      rows={5}
                      placeholder="Décrivez brièvement vos motivations, vos compétences clés ou vos disponibilités particulières..."
                      value={formData.message}
                      onChange={handleFormChange}
                      className="w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm text-[#0D0E0D] placeholder:text-sage/50 transition-colors focus:border-maple focus:outline-none"
                    />
                  </div>

                  {/* SUBMIT BUTTON (Matching Screenshot 2: SUBMIT FORM in clean dark grey button) */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      data-testid="form-volunteer-submit-button"
                      className="bg-[#545954] px-10 py-4 text-xs font-bold uppercase tracking-[0.25em] text-white transition-colors hover:bg-maple disabled:opacity-50"
                    >
                      {submitting ? (t.form?.sending || "ENVOI EN COURS...") : (t.volunteer?.ctaButton || "DEVENIR BÉNÉVOLE")}
                    </button>
                  </div>

                </form>
              )}

            </div>

            {/* RIGHT COLUMN: ABOUT ME / ABOUT CAP (Matching Screenshot 2 Sidebar) */}
            <div className="lg:col-span-4">
              <div className="bg-[#FAF9F6] border border-[#0D0E0D]/10 p-6 sm:p-8">

                {/* Header framed with double line */}
                <div className="border-t border-b border-[#0D0E0D] py-2.5 text-center">
                  <span className="text-xs font-bold uppercase tracking-[0.28em] text-[#0D0E0D] font-montserrat">
                    ABOUT ME
                  </span>
                </div>

                {/* Portrait Image */}
                <div className="mt-6 overflow-hidden border border-[#0D0E0D]/10">
                  <img
                    src={DESIGN_ASSETS.aboutPortrait}
                    alt="Cap Entrepreneurs Community"
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>

                {/* Excerpt Bio */}
                <p className="mt-6 text-xs sm:text-sm leading-relaxed text-sage text-center">
                  Rejoignez un mouvement engagé pour l'inclusion numérique, l'innovation responsable et la durabilité. Votre contribution bénévole a une valeur inestimable pour notre écosystème.
                </p>

                {/* Handwritten Cursive Signature Graphic */}
                <div className="mt-6 flex flex-col items-center justify-center">
                  <svg
                    viewBox="0 0 240 60"
                    className="h-12 w-auto max-w-[170px] text-[#0D0E0D] opacity-85"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M 25 45 C 20 32, 28 14, 48 16 C 68 20, 52 46, 42 46 C 36 46, 40 36, 56 34 C 68 32, 82 34, 88 38" />
                    <path d="M 92 40 C 96 34, 104 30, 112 34 C 116 36, 118 43, 120 46" />
                    <path d="M 122 30 L 126 52 M 124 36 C 129 32, 136 32, 142 36 C 146 40, 147 48, 149 50" />
                    <path d="M 154 36 C 162 34, 172 36, 179 38 M 166 28 L 164 50" />
                    <path d="M 182 43 C 189 33, 199 30, 212 33 C 222 36, 219 48, 229 50" />
                  </svg>
                  <span className="font-serif italic text-sm text-[#0D0E0D]/80 -mt-1 tracking-wider">
                    Cap Entrepreneurs
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};

export default Volunteer;
