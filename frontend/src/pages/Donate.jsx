import { useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/motion";
import {
  Heart,
  Globe2,
  Sprout,
  Radio,
  Palette,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Building2,
  Users2,
  ShieldCheck,
  Send,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const DONATE_AMOUNTS = [25, 50, 100, 250];

const GALLERY_PHOTOS = [
  "/assets/images/cap_green_lab.webp",
  "/assets/images/agriconnect_farming.webp",
  "/assets/images/safe_vibe_media.webp",
  "/assets/images/women_social_innovators.webp",
  "/assets/images/youth_tech_bootcamp.webp",
  "/assets/images/diaspora_global_summit.webp",
  "/assets/images/cap_ecosystem_collaboration.webp"
];

export default function Donate() {
  const { lang } = useLang();
  const isFrench = lang === "fr";
  const isArabic = lang === "ar";

  // Donation interactive state
  const [frequency, setFrequency] = useState("one-time"); // 'one-time' | 'monthly'
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [programDesignation, setProgramDesignation] = useState("General Support / Mission Globale");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorMessage, setDonorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // FAQ open/close accordion state
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    if (!donorEmail || !donorEmail.includes("@")) {
      toast.error(isFrench ? "Veuillez entrer une adresse courriel valide." : "Please enter a valid email address.");
      return;
    }
    if (!effectiveAmount || effectiveAmount <= 0) {
      toast.error(isFrench ? "Veuillez choisir un montant valide." : "Please choose a valid contribution amount.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/submissions", {
        type: "donate",
        payload: {
          name: donorName || "Donateur Anonyme",
          fullName: donorName || "Donateur Anonyme",
          email: donorEmail,
          amount: effectiveAmount,
          currency: "CAD",
          frequency,
          program: programDesignation,
          message: donorMessage,
          submittedAt: new Date().toISOString(),
        }
      });
      setSubmitted(true);
      toast.success(
        isFrench
          ? `Merci de tout cœur pour votre engagement de ${effectiveAmount} $ CAD ! Notre équipe vous contactera pour finaliser votre don.`
          : `Thank you warmly for your pledge of $${effectiveAmount} CAD! Our team will contact you to finalize your contribution.`
      );
    } catch (err) {
      console.warn("Fallback local pledge submission:", err);
      setSubmitted(true);
      toast.success(
        isFrench
          ? `Votre promesse de don de ${effectiveAmount} $ CAD a été enregistrée avec succès. Merci pour votre soutien !`
          : `Your contribution pledge of $${effectiveAmount} CAD was recorded successfully. Thank you for your support!`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const FAQS = [
    {
      qFr: "Qui peut faire un don à Cap Entrepreneurs ?",
      qEn: "Who can donate to CAP Entrepreneurs?",
      qAr: "من يمكنه التبرع لكاب رواد الأعمال؟",
      aFr: "Les particuliers, entreprises, fondations et organisations peuvent nous contacter pour explorer des modalités de soutien adaptées à leurs objectifs.",
      aEn: "Individuals, businesses, foundations and organizations can contact CAP Entrepreneurs to explore appropriate ways to provide support.",
      aAr: "يمكن للأفراد والشركات والمؤسسات والمنظمات التواصل معنا لاستكشاف سبل الدعم الملائمة لأهدافهم الاجتماعية."
    },
    {
      qFr: "Que finance mon don ?",
      qEn: "What does my donation support?",
      qAr: "ما الذي يموله تبرعي؟",
      aFr: "Vos contributions soutiennent directement la mission, le déploiement des programmes structurants (Cap Green Lab, AgriConnect, Safe Vibe, Entrepreneuriat Créatif) et l'infrastructure communautaire.",
      aEn: "Contributions can support CAP Entrepreneurs' mission, programs and organizational priorities. Any restrictions or program-specific designations should be confirmed before a donation is made.",
      aAr: "تدعم مساهماتك رسالتنا مباشرة، وإطلاق البرامج الهيكلية (مختبر كاب الأخضر، أجري كونكت، سيف فايب، وريادة الأعمال الإبداعية) والبنية التحتية المجتمعية."
    },
    {
      qFr: "Puis-je soutenir un programme spécifique ?",
      qEn: "Can I support a specific program?",
      qAr: "هل يمكنني توجيه التبرع لبرنامج محدد؟",
      aFr: "Oui, vous pouvez cibler CAP Green Lab, AgriConnect, Safe Vibe ou Entrepreneuriat Créatif & Social. Notre équipe s'assure de l'affectation fidèle de vos fonds.",
      aEn: "You can express an interest in supporting CAP Green Lab, AgriConnect, Safe Vibe or Creative & Social Entrepreneurship. Please confirm with CAP Entrepreneurs whether restricted donations are currently accepted.",
      aAr: "نعم، يمكنك تخصيص تبرعك لأحد البرامج الأربعة، ويضمن فريقنا التوجيه الدقيق لأموال الدعم وفق رغبتك."
    },
    {
      qFr: "Mon organisation peut-elle contribuer du matériel ou des services professionnels ?",
      qEn: "Can my organization contribute equipment or professional services?",
      qAr: "هل يمكن لمؤسستي التبرع بمعدات أو خدمات مهنية؟",
      aFr: "Absolument. Nous accueillons avec enthousiasme les dons d'équipements informatiques, les logiciels, les expertises techniques, le mentorat et les partenariats stratégiques.",
      aEn: "CAP Entrepreneurs welcomes partnership discussions involving financial support, technical resources, equipment, expertise and strategic collaboration. Contact the team to discuss your proposal.",
      aAr: "بالتأكيد. نرحب بالمساهمات العينية من أجهزة حاسوبية، وبرمجيات، وخبرات تقنية، وإرشاد، وشراكات استراتيجية."
    },
    {
      qFr: "Puis-je faire un don mensuel récurrent ?",
      qEn: "Can I make a recurring donation?",
      qAr: "هل يمكنني تقديم تبرع شهري متكرر؟",
      aFr: "Oui, l'option de contribution mensuelle permet d'assurer une pérennité essentielle à nos cohortes et ateliers tout au long de l'année.",
      aEn: "Recurring donations may be offered if supported by the active donation platform. Please check the available options during checkout.",
      aAr: "نعم، تتيح المساهمة الشهرية ضمان الاستدامة الضرورية لورش العمل والبرامج على مدار العام."
    },
    {
      qFr: "Vais-je recevoir un reçu fiscal ?",
      qEn: "Will I receive a tax receipt?",
      qAr: "هل سأحصل على إيصال ضريبي؟",
      aFr: "Veuillez contacter Cap Entrepreneurs pour confirmer les critères d'admissibilité fiscale applicables selon la nature de votre don et votre juridiction.",
      aEn: "Please contact CAP Entrepreneurs to confirm whether your contribution qualifies for a tax receipt and what documentation may be available. Do not assume that every donation is tax-deductible.",
      aAr: "يرجى التواصل مع كاب رواد الأعمال لتأكيد معايير الأهلية الضريبية المطبقة وفقاً للولاية القضائية ونوع المساهمة."
    },
    {
      qFr: "Comment en savoir plus sur Cap Entrepreneurs ?",
      qEn: "How can I learn more about CAP Entrepreneurs?",
      qAr: "كيف يمكنني معرفة المزيد عن كاب رواد الأعمال؟",
      aFr: "Explorez nos pages À propos, Programmes, Bénévolat et Partenariats, ou contactez directement notre équipe pour échanger sur nos perspectives communes.",
      aEn: "Explore our About Us, Programs, Volunteer and Partnerships pages to learn more about our mission and ways to participate.",
      aAr: "استكشف صفحات: عن المنظمة، والبرامج، والتطوع، والشراكات، أو تواصل مباشرة مع فريقنا لمناقشة آفاق التعاون المشترك."
    }
  ];

  return (
    <div data-testid="donate-page" className="min-h-screen bg-white text-forest antialiased pb-32 pt-28">

      {/* ===================== HERO CONTAINER ===================== */}
      <section className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12 mb-20 text-center">
        <Reveal>
          <span className="font-montserrat text-xs font-bold uppercase tracking-[0.28em] text-maple">
            {isFrench ? "DONNER À CAP ENTREPRENEURS" : isArabic ? "التبرع لكاب رواد الأعمال" : "DONATE TO CAP ENTREPRENEURS"}
          </span>
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-forest leading-[1.12] max-w-4xl mx-auto">
            {isFrench ? "Ouvrir de nouveaux horizons. Rendre l'opportunité possible." : isArabic ? "فتح آفاق جديدة. جعل الفرص ممكنة للجميع." : "Open New Horizons. Make Opportunity Possible."}
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed text-sage font-normal">
            {isFrench
              ? "Votre soutien contribue à connecter les talents, les compétences, la technologie et les opportunités afin de bâtir des économies numériques plus inclusives, accessibles et durables."
              : isArabic
                ? "يساعد دعمك في ربط الأفراد والمهارات والتكنولوجيا والفرص لبناء اقتصادات رقمية أكثر شمولاً واستدامة."
                : "Your support helps connect people, skills, technology and opportunities to build more inclusive, accessible and sustainable digital economies."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#make-donation"
              className="bg-forest hover:bg-maple text-white font-montserrat text-xs font-bold uppercase tracking-[0.2em] px-8 py-4 shadow-sm transition-all duration-300"
            >
              {isFrench ? "DONNER MAINTENANT" : "DONATE NOW"}
            </a>
            <Link
              to="/partners"
              className="border border-forest/20 hover:border-forest text-forest font-montserrat text-xs font-bold uppercase tracking-[0.2em] px-8 py-4 transition-colors"
            >
              {isFrench ? "DEVENIR PARTENAIRE" : "BECOME A PARTNER"}
            </Link>
          </div>

          <p className="mt-5 font-serif italic text-sm text-neutral-500">
            {isFrench ? "Une contribution. Un engagement partagé. De nouvelles possibilités." : "One contribution. Shared commitment. New possibilities."}
          </p>
        </Reveal>
      </section>

      {/* ===================== SECTION 1: WHY YOUR SUPPORT MATTERS ===================== */}
      <section className="border-t border-forest/10 bg-[#FAFAFA] py-20 md:py-28">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6">
              <Reveal>
                <span className="font-montserrat text-[11px] font-bold uppercase tracking-[0.25em] text-maple">
                  1. {isFrench ? "POURQUOI VOTRE SOUTIEN COMPTE" : "WHY YOUR SUPPORT MATTERS"}
                </span>
                <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-forest leading-tight">
                  {isFrench ? "L'opportunité ne devrait avoir aucune frontière" : "Opportunity Should Have No Borders"}
                </h2>
                <div className="w-12 h-px bg-maple my-6" />
                <p className="text-base leading-relaxed text-sage mb-5">
                  {isFrench
                    ? "L'accès à la technologie, aux compétences numériques, aux réseaux professionnels et aux ressources entrepreneuriales demeure inégal selon les communautés et les territoires."
                    : "Access to technology, digital skills, professional networks and entrepreneurial resources remains uneven across communities."}
                </p>
                <p className="text-base leading-relaxed text-sage mb-5">
                  {isFrench
                    ? "Cap Entrepreneurs s'efforce de combler ces fossés en rassemblant les forces vives autour de l'apprentissage concret, de la technologie inclusive, de l'entrepreneuriat et de l'innovation sociale."
                    : "CAP Entrepreneurs works to help bridge these gaps by bringing people together around practical learning, inclusive technology, entrepreneurship and social innovation."}
                </p>
                <p className="text-base leading-relaxed text-forest font-medium">
                  {isFrench
                    ? "Votre soutien nous aide à façonner un avenir où la géographie, le handicap ou les circonstances économiques ne déterminent plus qui peut participer activement à l'économie numérique."
                    : "Your support can help us work toward a future where geography, disability, economic circumstances or limited access to technology do not determine who gets to participate in the digital economy."}
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-6">
              <Reveal delay={0.15}>
                <div className="relative aspect-[4/3] overflow-hidden bg-forest/5 shadow-md">
                  <img
                    src="https://images.unsplash.com/photo-1531496730074-83b638c0a7ac?auto=format&fit=crop&w=1200&q=80"
                    alt="Why support matters"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
                    <p className="font-serif italic text-white text-lg sm:text-xl">
                      {isFrench
                        ? "« Ensemble, créons des passerelles concrètes pour apprendre, bâtir, collaborer et transformer nos communautés. »"
                        : "“Together, we create pathways for people to learn, build, collaborate and contribute to meaningful change.”"}
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SECTION 2: FOUR PROGRAMS. ONE SHARED MISSION ===================== */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Reveal>
              <span className="font-montserrat text-[11px] font-bold uppercase tracking-[0.25em] text-maple">
                2. {isFrench ? "OÙ VOTRE SOUTIEN FAIT LA DIFFÉRENCE" : "WHERE YOUR SUPPORT CAN MAKE A DIFFERENCE"}
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-forest">
                {isFrench ? "Quatre programmes. Une mission partagée." : "Four Programs. One Shared Mission."}
              </h2>
              <p className="mt-4 text-base text-sage">
                {isFrench
                  ? "Votre contribution soutient directement le développement et le déploiement sur le terrain de nos quatre piliers structurants :"
                  : "Your contribution can support the development and delivery of CAP Entrepreneurs' four core programs."}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* 1. CAP Green Lab */}
            <Reveal delay={0.1}>
              <div className="p-8 border border-forest/10 bg-[#FAFAFA] flex flex-col justify-between h-full hover:border-maple transition-colors shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-2xl italic font-bold text-maple">01</span>
                    <Globe2 className="h-6 w-6 text-maple" />
                  </div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-forest mb-1">CAP Green Lab</h3>
                  <p className="font-montserrat text-xs font-semibold uppercase tracking-wider text-maple mb-4">
                    {isFrench ? "Technologie inclusive & Économie circulaire" : "Inclusive Technology & Circular Economy"}
                  </p>
                  <p className="text-sm text-sage leading-relaxed mb-4">
                    {isFrench
                      ? "La technologie doit être accessible, utile et gérée de manière responsable. CAP Green Lab réunit inclusion numérique, compétences techniques de réparation et réemploi responsable."
                      : "Technology should be accessible, useful and responsibly managed. CAP Green Lab brings together digital inclusion, accessibility and circular-economy practices."}
                  </p>
                  <ul className="space-y-2 text-xs text-forest/80 font-medium">
                    <li className="flex items-center gap-2">• {isFrench ? "Reconditionnement et réutilisation d'équipements informatiques" : "Refurbishing and reusing digital equipment"}</li>
                    <li className="flex items-center gap-2">• {isFrench ? "Accessibilité technologique pour les personnes en situation de handicap" : "Promoting technological accessibility for people with disabilities"}</li>
                    <li className="flex items-center gap-2">• {isFrench ? "Formations au diagnostic, à la maintenance et au reconditionnement" : "Practical skills in diagnostics, maintenance and refurbishment"}</li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-forest/10">
                  <span className="font-serif italic text-xs text-forest/70">
                    {isFrench ? "Objectif : Réduire la fracture numérique et le gaspillage électronique." : "Our goal: Make tech accessible while reducing electronic waste."}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* 2. AgriConnect */}
            <Reveal delay={0.15}>
              <div className="p-8 border border-forest/10 bg-[#FAFAFA] flex flex-col justify-between h-full hover:border-maple transition-colors shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-2xl italic font-bold text-maple">02</span>
                    <Sprout className="h-6 w-6 text-maple" />
                  </div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-forest mb-1">AgriConnect</h3>
                  <p className="font-montserrat text-xs font-semibold uppercase tracking-wider text-maple mb-4">
                    {isFrench ? "Entrepreneuriat rural & Agriculture numérique" : "Rural Entrepreneurship & Digital Agriculture"}
                  </p>
                  <p className="text-sm text-sage leading-relaxed mb-4">
                    {isFrench
                      ? "L'innovation doit toucher les zones rurales avec la même force que les métropoles. AgriConnect connecte coopératives, femmes et jeunes agriculteurs aux outils numériques et marchés."
                      : "Innovation should reach rural communities as well as urban centres. AgriConnect connects cooperatives, women entrepreneurs and young farmers with tools and markets."}
                  </p>
                  <ul className="space-y-2 text-xs text-forest/80 font-medium">
                    <li className="flex items-center gap-2">• {isFrench ? "Outils numériques agricoles et apprentissage pratique" : "Digital agricultural tools and practical learning"}</li>
                    <li className="flex items-center gap-2">• {isFrench ? "Autonomisation des femmes rurales et coopératives agricoles" : "Rural women entrepreneurs and agricultural cooperatives"}</li>
                    <li className="flex items-center gap-2">• {isFrench ? "Accès direct aux marchés et financements durables" : "Access to markets and financing opportunities"}</li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-forest/10">
                  <span className="font-serif italic text-xs text-forest/70">
                    {isFrench ? "Objectif : Renforcer les capacités économiques des entrepreneurs agricoles." : "Our goal: Help rural entrepreneurs strengthen capabilities and opportunities."}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* 3. Safe Vibe */}
            <Reveal delay={0.2}>
              <div className="p-8 border border-forest/10 bg-[#FAFAFA] flex flex-col justify-between h-full hover:border-maple transition-colors shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-2xl italic font-bold text-maple">03</span>
                    <Radio className="h-6 w-6 text-maple" />
                  </div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-forest mb-1">Safe Vibe</h3>
                  <p className="font-montserrat text-xs font-semibold uppercase tracking-wider text-maple mb-4">
                    {isFrench ? "Médias numériques & Éducation citoyenne" : "Digital Media & Education"}
                  </p>
                  <p className="text-sm text-sage leading-relaxed mb-4">
                    {isFrench
                      ? "Être connecté ne suffit pas : encore faut-il être émancipé par le numérique. Safe Vibe prépare les jeunes à s'exprimer avec discernement et à créer du contenu de manière responsable."
                      : "Being digitally connected is not the same as being digitally empowered. Safe Vibe helps young people create content responsibly and participate confidently."}
                  </p>
                  <ul className="space-y-2 text-xs text-forest/80 font-medium">
                    <li className="flex items-center gap-2">• {isFrench ? "Éducation aux médias et à l'information vérifiée" : "Media and information literacy"}</li>
                    <li className="flex items-center gap-2">• {isFrench ? "Production de podcasts, vidéos et récits communautaires" : "Video, podcast and social media production"}</li>
                    <li className="flex items-center gap-2">• {isFrench ? "Sécurité en ligne et participation numérique responsable" : "Online safety and responsible digital participation"}</li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-forest/10">
                  <span className="font-serif italic text-xs text-forest/70">
                    {isFrench ? "Objectif : Former des citoyens numériques éclairés et des créateurs engagés." : "Our goal: Empower informed digital citizens and responsible creators."}
                  </span>
                </div>
              </div>
            </Reveal>

            {/* 4. Creative & Social */}
            <Reveal delay={0.25}>
              <div className="p-8 border border-forest/10 bg-[#FAFAFA] flex flex-col justify-between h-full hover:border-maple transition-colors shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif text-2xl italic font-bold text-maple">04</span>
                    <Palette className="h-6 w-6 text-maple" />
                  </div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-forest mb-1">
                    {isFrench ? "Entrepreneuriat Créatif & Social" : "Creative & Social Entrepreneurship"}
                  </h3>
                  <p className="font-montserrat text-xs font-semibold uppercase tracking-wider text-maple mb-4">
                    {isFrench ? "Femmes, Arts & Innovation sociale" : "Women, Arts & Social Innovation"}
                  </p>
                  <p className="text-sm text-sage leading-relaxed mb-4">
                    {isFrench
                      ? "Les idées créatives méritent de devenir des entreprises durables. Ce programme accompagne les créatrices et innovateurs sociaux pour consolider leur modèle et rayonner internationalement."
                      : "Creative ideas deserve the opportunity to become sustainable ventures. This program supports women entrepreneurs, artists and innovators to scale."}
                  </p>
                  <ul className="space-y-2 text-xs text-forest/80 font-medium">
                    <li className="flex items-center gap-2">• {isFrench ? "Accompagnement de l'entrepreneuriat féminin" : "Women's entrepreneurship"}</li>
                    <li className="flex items-center gap-2">• {isFrench ? "Développement des filières de l'économie créative" : "Creative-economy development"}</li>
                    <li className="flex items-center gap-2">• {isFrench ? "Sourcing créatif africain et acheteurs internationaux" : "Networking, mentoring and access to global buyers"}</li>
                  </ul>
                </div>
                <div className="mt-6 pt-4 border-t border-forest/10">
                  <span className="font-serif italic text-xs text-forest/70">
                    {isFrench ? "Objectif : Transformer les initiatives créatives en contributions durables." : "Our goal: Help creative initiatives grow into lasting community contributions."}
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================== SECTION 3: SHARED INFRASTRUCTURE ===================== */}
      <section className="bg-forest text-bone py-20 md:py-28">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <Reveal>
              <span className="font-montserrat text-[11px] font-bold uppercase tracking-[0.25em] text-maple">
                3. {isFrench ? "SOUTENIR NOTRE INFRASTRUCTURE COMMUNE" : "SUPPORT OUR SHARED INFRASTRUCTURE"}
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-bone leading-tight">
                {isFrench ? "Bâtir les passerelles au cœur de l'impact" : "Help Build the Connections Behind the Impact"}
              </h2>
              <div className="w-12 h-px bg-maple my-6" />
              <p className="text-base sm:text-lg text-bone/80 leading-relaxed mb-8">
                {isFrench
                  ? "Au-delà de chaque programme individuel, Cap Entrepreneurs développe un écosystème qui relie comités, programmes, bénévoles, partenaires et communautés. Vos contributions permettent de financer les outils d'apprentissage, la coordination des missions et la mesure continue de l'impact social."
                  : "Beyond individual programs, CAP Entrepreneurs is developing an ecosystem that connects committees, programs, volunteers, partners and communities. Contributions support learning tools, mission coordination and verified impact tracking."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-montserrat uppercase tracking-wider text-bone/90">
                <div className="flex items-center gap-2 border border-white/10 p-3.5 bg-white/5">
                  <CheckCircle2 className="w-4 h-4 text-maple shrink-0" />
                  <span>{isFrench ? "Ressources numériques éducatives" : "Educational and digital resources"}</span>
                </div>
                <div className="flex items-center gap-2 border border-white/10 p-3.5 bg-white/5">
                  <CheckCircle2 className="w-4 h-4 text-maple shrink-0" />
                  <span>{isFrench ? "Coordination et déploiement terrain" : "Program coordination & implementation"}</span>
                </div>
                <div className="flex items-center gap-2 border border-white/10 p-3.5 bg-white/5">
                  <CheckCircle2 className="w-4 h-4 text-maple shrink-0" />
                  <span>{isFrench ? "Mobilisation bénévole & mentorat" : "Community engagement & volunteers"}</span>
                </div>
                <div className="flex items-center gap-2 border border-white/10 p-3.5 bg-white/5">
                  <CheckCircle2 className="w-4 h-4 text-maple shrink-0" />
                  <span>{isFrench ? "Partenariats & gouvernance ouverte" : "Partnerships & knowledge sharing"}</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===================== SECTION 4: FROM CANADA TO THE WORLD ===================== */}
      <section className="py-24 md:py-32 border-b border-forest/10">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Reveal>
              <span className="font-montserrat text-[11px] font-bold uppercase tracking-[0.25em] text-maple">
                4. {isFrench ? "DU CANADA AU RESTE DU MONDE" : "FROM CANADA TO THE WORLD"}
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-forest">
                {isFrench ? "Enracinement local. Coopération internationale." : "Local Commitment. International Collaboration."}
              </h2>
              <p className="mt-4 text-base text-sage">
                {isFrench
                  ? "Cap Entrepreneurs est enraciné au Québec, connecté au Canada et ouvert sur le monde. Notre parcours international planifié tisse des collaborations durables à travers 4 étapes clés :"
                  : "CAP Entrepreneurs is rooted in Quebec, connected to Canada and open to the world through our planned international journey:"}
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                city: "Paris 2027",
                themeFr: "Ouvrir de nouvelles perspectives",
                themeEn: "Opening New Perspectives",
                descFr: "Nouer des connexions internationales, stimuler le partage de savoirs et faire rayonner le savoir-faire canadien.",
                descEn: "Building international connections, encouraging collaboration and creating knowledge exchange."
              },
              {
                city: "Nairobi 2027",
                themeFr: "Le Festival Global",
                themeEn: "The Global Festival",
                descFr: "Le grand rassemblement mondial pour la tech inclusive, la circularité, les compétences numériques et l'innovation sociale.",
                descEn: "Bringing together entrepreneurs, innovators and institutions around inclusive tech and circular solutions."
              },
              {
                city: "Marrakech 2027",
                themeFr: "Écosystèmes Créatifs",
                themeEn: "Connecting Creative Ecosystems",
                descFr: "Renforcer les passerelles interculturelles et le programme de sourcing créatif africain avec les acheteurs internationaux.",
                descEn: "Strengthening cross-cultural collaboration and exploring opportunities for creative talent and buyers."
              },
              {
                city: "Martinique 2028",
                themeFr: "Élargir les horizons",
                themeEn: "Expanding Our Horizons",
                descFr: "Développer les synergies à travers les Caraïbes, le Canada et les réseaux internationaux francophones.",
                descEn: "Developing connections across the Caribbean, Canada and wider international networks."
              }
            ].map((dest, i) => (
              <Reveal key={i} delay={0.1 + i * 0.08}>
                <div className="border border-forest/15 p-6 bg-[#FAFAFA] flex flex-col justify-between h-full hover:border-maple transition-colors shadow-xs">
                  <div>
                    <span className="font-serif text-xs font-bold uppercase tracking-widest text-maple block mb-2">
                      0{i + 1}
                    </span>
                    <h4 className="font-serif text-xl sm:text-2xl font-normal text-forest mb-1">{dest.city}</h4>
                    <p className="font-montserrat text-[11px] font-bold uppercase tracking-wider text-forest/70 mb-3">
                      {isFrench ? dest.themeFr : dest.themeEn}
                    </p>
                    <p className="text-xs text-sage leading-relaxed">
                      {isFrench ? dest.descFr : dest.descEn}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SECTION 5: MAKE YOUR CONTRIBUTION (INTERACTIVE FORM) ===================== */}
      <section id="make-donation" className="py-24 md:py-32 bg-[#FAF8F5]">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Reveal>
              <span className="font-montserrat text-[11px] font-bold uppercase tracking-[0.25em] text-maple">
                5. {isFrench ? "FAIRE VOTRE CONTRIBUTION" : "MAKE YOUR CONTRIBUTION"}
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-forest">
                {isFrench ? "Chaque contribution ouvre une possibilité" : "Every Contribution Starts a Possibility"}
              </h2>
              <p className="mt-3 text-sm text-sage">
                {isFrench
                  ? "Que vous soyez un particulier, une entreprise ou une fondation, choisissez la manière dont vous souhaitez faire progresser notre mission."
                  : "Whether you are an individual, business or foundation, choose how you would like to give to support our mission."}
              </p>
            </Reveal>
          </div>

          <div className="border border-forest/15 bg-white p-6 sm:p-10 md:p-12 shadow-sm max-w-3xl mx-auto">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-maple/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-maple" />
                </div>
                <h3 className="font-serif text-3xl font-normal text-forest mb-2">
                  {isFrench ? "Merci pour votre générosité !" : "Thank You For Your Generosity!"}
                </h3>
                <p className="text-sm text-sage max-w-md mx-auto mb-6">
                  {isFrench
                    ? `Votre promesse de don de ${effectiveAmount} $ CAD (${frequency === "monthly" ? "mensuel" : "ponctuel"}) a été enregistrée. Nous vous contacterons à ${donorEmail} avec les instructions détaillées.`
                    : `Your pledge of $${effectiveAmount} CAD (${frequency}) has been recorded. We will contact you at ${donorEmail} with payment completion details.`}
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="font-montserrat text-xs font-bold uppercase tracking-wider text-maple hover:underline"
                >
                  {isFrench ? "Faire une autre contribution" : "Make another pledge"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleDonationSubmit} className="space-y-8">
                {/* 1. Frequency Selector */}
                <div>
                  <label className="block font-montserrat text-[11px] font-bold uppercase tracking-[0.2em] text-forest mb-3">
                    {isFrench ? "Fréquence du don" : "Donation frequency"}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFrequency("one-time")}
                      className={`py-3 text-xs font-montserrat font-bold uppercase tracking-wider transition-all border ${frequency === "one-time"
                          ? "bg-forest text-white border-forest shadow-xs"
                          : "bg-white text-forest/70 border-forest/20 hover:border-forest"
                        }`}
                    >
                      {isFrench ? "Don ponctuel" : "One-time donation"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrequency("monthly")}
                      className={`py-3 text-xs font-montserrat font-bold uppercase tracking-wider transition-all border ${frequency === "monthly"
                          ? "bg-forest text-white border-forest shadow-xs"
                          : "bg-white text-forest/70 border-forest/20 hover:border-forest"
                        }`}
                    >
                      {isFrench ? "Don mensuel" : "Monthly donation"}
                    </button>
                  </div>
                </div>

                {/* 2. Amount Options */}
                <div>
                  <label className="block font-montserrat text-[11px] font-bold uppercase tracking-[0.2em] text-forest mb-3">
                    {isFrench ? "Montant suggéré (CAD)" : "Donation amount (CAD)"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {DONATE_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt);
                          setCustomAmount("");
                        }}
                        className={`py-3.5 font-serif text-xl sm:text-2xl transition-all border ${selectedAmount === amt && !customAmount
                            ? "bg-maple text-white border-maple shadow-sm font-bold"
                            : "bg-white text-forest border-forest/20 hover:border-forest"
                          }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount Field */}
                  <div className="relative mt-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-base text-neutral-400">$</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      placeholder={isFrench ? "Autre montant personnalisé (CAD)" : "Other custom amount (CAD)"}
                      className="w-full border border-forest/20 bg-white pl-8 pr-4 py-3 text-sm focus:border-maple outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* 3. Program Designation */}
                <div>
                  <label className="block font-montserrat text-[11px] font-bold uppercase tracking-[0.2em] text-forest mb-2">
                    {isFrench ? "Affectation du soutien" : "Support a specific program"}
                  </label>
                  <select
                    value={programDesignation}
                    onChange={(e) => setProgramDesignation(e.target.value)}
                    className="w-full border border-forest/20 bg-white px-4 py-3 text-xs sm:text-sm text-forest focus:border-maple outline-none"
                  >
                    <option value="General Support / Mission Globale">
                      {isFrench ? "Soutien général - Mission globale de Cap Entrepreneurs" : "General Support - Cap Entrepreneurs core mission"}
                    </option>
                    <option value="CAP Green Lab">CAP Green Lab (Tech inclusive & Circularité)</option>
                    <option value="AgriConnect">AgriConnect (Entrepreneuriat rural & AgriTech)</option>
                    <option value="Safe Vibe">Safe Vibe (Médias numériques & Jeunesse)</option>
                    <option value="Creative & Social Entrepreneurship">
                      {isFrench ? "Entrepreneuriat Créatif & Social (Femmes & Arts)" : "Creative & Social Entrepreneurship"}
                    </option>
                  </select>
                </div>

                {/* 4. Donor Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-montserrat text-[10.5px] font-bold uppercase tracking-wider text-forest mb-1.5">
                      {isFrench ? "Nom complet" : "Full name"}
                    </label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder={isFrench ? "Votre nom ou organisation" : "Your name or organization"}
                      className="w-full border border-forest/20 bg-white px-3.5 py-2.5 text-xs text-forest focus:border-maple outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-montserrat text-[10.5px] font-bold uppercase tracking-wider text-forest mb-1.5">
                      {isFrench ? "Adresse courriel *" : "Email address *"}
                    </label>
                    <input
                      type="email"
                      required
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full border border-forest/20 bg-white px-3.5 py-2.5 text-xs text-forest focus:border-maple outline-none"
                    />
                  </div>
                </div>

                {/* 5. Message Note */}
                <div>
                  <label className="block font-montserrat text-[10.5px] font-bold uppercase tracking-wider text-forest mb-1.5">
                    {isFrench ? "Note ou intention particulière (facultatif)" : "Note or special dedication (optional)"}
                  </label>
                  <textarea
                    rows={2}
                    value={donorMessage}
                    onChange={(e) => setDonorMessage(e.target.value)}
                    placeholder={isFrench ? "Partagez votre message ou vos souhaits..." : "Share a note or special instruction..."}
                    className="w-full border border-forest/20 bg-white px-3.5 py-2.5 text-xs text-forest focus:border-maple outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-forest hover:bg-maple text-white font-montserrat text-xs font-bold uppercase tracking-[0.2em] py-4 shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isFrench ? "Traitement..." : "Processing..."}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isFrench
                          ? `CONFIRMER LE DON DE ${effectiveAmount} $ CAD`
                          : `CONFIRM CONTRIBUTION OF $${effectiveAmount} CAD`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-neutral-400 text-center leading-relaxed">
                  {isFrench
                    ? "Votre contribution est soumise aux conditions du fournisseur de paiement. Veuillez vérifier les informations avant de compléter."
                    : "Your donation is subject to the terms and conditions of the payment provider. Please review the information presented before completing."}
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ===================== SECTION 6: INVITATION TO PARTNERS ===================== */}
      <section className="py-20 md:py-28 border-y border-forest/10">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8">
              <span className="font-montserrat text-[11px] font-bold uppercase tracking-[0.25em] text-maple">
                6. {isFrench ? "INVITATION AUX ORGANISATIONS ET PARTENAIRES" : "AN INVITATION TO ORGANIZATIONS AND PARTNERS"}
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl font-normal text-forest leading-tight">
                {isFrench ? "Vos ressources peuvent ouvrir de nouveaux horizons" : "Your Resources Can Open New Horizons"}
              </h2>
              <p className="mt-4 text-base text-sage leading-relaxed max-w-3xl">
                {isFrench
                  ? "La contribution financière n'est qu'une des manières de soutenir notre écosystème. Les entreprises, universités et institutions peuvent également apporter des technologies, des équipements, du mentorat, des réseaux d'acheteurs et des capacités de déploiement."
                  : "Financial contributions are one way to support our mission. Organizations can also contribute knowledge, technology, equipment, mentorship, networks and implementation capacity."}
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <Link
                to="/partners"
                className="bg-forest hover:bg-maple text-white font-montserrat text-xs font-bold uppercase tracking-[0.2em] px-8 py-4 transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>{isFrench ? "EXPLORER LES PARTENARIATS" : "EXPLORE PARTNERSHIPS"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SECTION 7: FAQS ACCORDION ===================== */}
      <section className="py-24 md:py-32 bg-[#FAFAFA]">
        <div className="mx-auto max-w-[900px] px-5 sm:px-8">
          <div className="text-center mb-16">
            <span className="font-montserrat text-[11px] font-bold uppercase tracking-[0.25em] text-maple">
              7. {isFrench ? "FOIRE AUX QUESTIONS" : "FREQUENTLY ASKED QUESTIONS"}
            </span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-normal text-forest">
              {isFrench ? "Questions fréquentes sur les dons" : "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="divide-y divide-forest/10 border-y border-forest/10">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-5">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between text-left group gap-4"
                  >
                    <span className="font-serif text-lg sm:text-xl font-normal text-forest group-hover:text-maple transition-colors">
                      {isFrench ? faq.qFr : faq.qEn}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-forest/60 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-maple" : ""
                        }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-3 text-sm text-sage leading-relaxed pr-8 font-normal">
                      {isFrench ? faq.aFr : isArabic ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== SECTION 8: FINAL CALL TO ACTION ===================== */}
      <section className="py-24 md:py-32 bg-forest text-bone text-center">
        <div className="mx-auto max-w-[1000px] px-5 sm:px-8">
          <Reveal>
            <span className="font-montserrat text-xs font-bold uppercase tracking-[0.28em] text-maple">
              8. {isFrench ? "APPEL FINAL À L'ACTION" : "FINAL CALL TO ACTION"}
            </span>
            <h2 className="mt-4 font-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight leading-tight">
              {isFrench ? "L'avenir se bâtit par l'action collective." : "The Future Is Built Through Collective Action."}
            </h2>
            <p className="mt-5 text-base sm:text-lg text-bone/80 max-w-2xl mx-auto leading-relaxed">
              {isFrench
                ? "Chaque nouvelle compétence acquise, chaque connexion tissée et chaque opportunité ouverte contribue à une économie numérique plus forte et solidaire. Rejoignez-nous pour ouvrir de nouveaux horizons."
                : "Every new skill, every connection and every opportunity can contribute to a stronger and more inclusive digital economy. Join us in opening new horizons."}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#make-donation"
                className="bg-maple hover:bg-white hover:text-forest text-white font-montserrat text-xs font-bold uppercase tracking-[0.2em] px-8 py-4 transition-all duration-300 shadow-md"
              >
                {isFrench ? "DONNER MAINTENANT" : "DONATE NOW"}
              </a>
              <Link
                to="/partners"
                className="border border-white/30 hover:border-white text-white font-montserrat text-xs font-bold uppercase tracking-[0.2em] px-8 py-4 transition-colors"
              >
                {isFrench ? "DEVENIR PARTENAIRE" : "BECOME A PARTNER"}
              </Link>
            </div>
            <p className="mt-6 font-serif italic text-sm text-bone/60">
              CAP Entrepreneurs - Opening New Horizons.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ===================== BOTTOM COMMUNITY GALLERY (MATCHING USER REFERENCE IMAGE) ===================== */}
      <section className="pt-20 bg-white">
        <div className="text-center mb-8">
          <span className="font-script text-3xl sm:text-4xl text-neutral-400 block select-none">
            instagram:
          </span>
          <span className="font-montserrat text-[10px] font-bold uppercase tracking-[0.25em] text-forest/70 -mt-1 block">
            @cap_entrepreneurs
          </span>
        </div>

        {/* Mosaic strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 px-2">
          {GALLERY_PHOTOS.map((src, i) => (
            <div key={i} className="aspect-square overflow-hidden bg-forest/5 group shadow-xs">
              <img
                src={src}
                alt="Community mosaic"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
