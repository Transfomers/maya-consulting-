import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  HelpCircle,
  Layers,
  Rocket,
  Compass,
  HeartHandshake
} from "lucide-react";
import { Reveal } from "@/components/motion";
import EditorialRejoindreHero from "@/components/EditorialRejoindreHero";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { toast } from "sonner";

// Photo assets matching the reference magazine editorial
const JOIN_ASSETS = {
  avatar1: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  avatar2: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
  avatar3: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  avatar4: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
  avatar5: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80",

  featuredStory: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80",
  aspiring: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
  entrepreneurs: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
  volunteers: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
  mentors: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
  partners: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
  sponsors: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
  students: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",

  sidebarAuthor: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  sidebarBanner: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
};

const PATHWAY_DATA = [
  {
    id: "aspiring",
    number: "01",
    audienceEn: "For Aspiring Entrepreneurs",
    audienceFr: "Porteurs de projet & Futurs entrepreneurs",
    audienceAr: "لرواد الأعمال الطموحين",
    taglineEn: "Have an idea? Take the first step.",
    taglineFr: "Une idée en tête ? Franchissez le premier pas.",
    taglineAr: "هل لديك فكرة؟ اتخذ الخطوة الأولى.",
    descEn: "You may have a business idea, a solution to a problem, or a vision for something new. CAP Entrepreneurs encourages aspiring entrepreneurs to explore their potential, develop their ideas, and take practical steps toward building their ventures. Join our community to connect with opportunities, discover relevant resources, participate in activities, and become part of an environment that encourages entrepreneurial thinking. You do not need to have everything figured out to begin. What matters is your willingness to learn, develop your ideas, and move forward.",
    descFr: "Vous avez une idée d'entreprise, une réponse à un défi de société ou une vision novatrice. Cap Entrepreneurs encourage les porteurs de projet à développer leur plein potentiel, structurer leur démarche et concrétiser leurs initiatives dans un cadre bienveillant et solidaire. Rejoignez notre communauté pour accéder à des ressources adaptées, participer à des ateliers concrets et cheminer aux côtés de pairs qui partagent vos valeurs. Il n'est pas nécessaire d'avoir tout prévu pour commencer : ce qui compte, c'est votre désir d'apprendre et d'avancer.",
    descAr: "قد تكون لديك فكرة عمل، أو حل لمشكلة مجتمعية، أو رؤية لابتكار جديد. تشجع كاب رواد الأعمال أصحاب المشاريع الطموحين على استكشاف إمكاناتهم، وتطوير أفكارهم، واتخاذ خطوات عملية نحو بناء مبادراتهم. انضم إلى مجتمعنا للتواصل مع الفرص، واكتشاف الموارد المناسبة، والمشاركة في الأنشطة، والاندماج في بيئة تحفز الفكر الريادي المسؤول.",
    actionLabelEn: "Explore Entrepreneurial Opportunities",
    actionLabelFr: "Explorer nos opportunités d'accompagnement",
    actionLabelAr: "استكشف فرص الدعم والمرافقة",
    image: JOIN_ASSETS.aspiring,
    categoryEn: "LAUNCH & IDEATION",
    categoryFr: "LANCEMENT & IDÉATION",
    categoryAr: "إطلاق وتطوير الأفكار"
  },
  {
    id: "entrepreneurs",
    number: "02",
    audienceEn: "For Entrepreneurs and Business Owners",
    audienceFr: "Entrepreneurs & Dirigeants d'entreprises sociales",
    audienceAr: "لرواد الأعمال وأصحاب المشاريع",
    taglineEn: "You have started building. Let's move forward together.",
    taglineFr: "Vous bâtissez déjà. Avançons ensemble.",
    taglineAr: "لقد بدأت بالبناء بالفعل. دعنا نتقدم معاً.",
    descEn: "Entrepreneurship is a continuous journey of learning, adapting, and growing. Whether you are developing your first product, strengthening an existing business, exploring new markets, or looking for meaningful connections, being part of a supportive ecosystem can make a difference. CAP Entrepreneurs seeks to foster connections, encourage knowledge-sharing, and help entrepreneurs discover resources and opportunities relevant to their growth. Become part of a community where experiences can be shared, challenges can be discussed, and new possibilities can emerge through collaboration.",
    descFr: "L'entrepreneuriat est un cheminement continu d'apprentissage, d'adaptation et de dépassement. Que vous conceviez votre première solution, consolidiez une entreprise à impact ou cherchiez de nouveaux débouchés, être entouré d'un écosystème bienveillant fait toute la différence. Cap Entrepreneurs favorise l'échange de savoirs, le partage d'expériences et l'accès à des opportunités concrètes. Rejoignez un réseau solidaire où les défis se transforment en projets et où la collaboration ouvre de nouveaux horizons.",
    descAr: "ريادة الأعمال رحلة مستمرة من التعلم والتكيف والنمو. سواء كنت تطور منتجك الأول، أو تعزز مشروعاً قائماً، أو تبحث عن علاقات ذات مغزى، فإن التواجد ضمن منظومة داعمة يحدث فارقاً حقيقياً. تسعى كاب رواد الأعمال إلى تعزيز الروابط، وتشجيع تبادل المعرفة، ومساعدة رواد الأعمال على اكتشاف الموارد والفرص الملائمة لنموهم.",
    actionLabelEn: "Connect with Our Community",
    actionLabelFr: "Rejoindre le réseau des pairs",
    actionLabelAr: "تواصل مع مجتمعنا",
    image: JOIN_ASSETS.entrepreneurs,
    categoryEn: "GROWTH & NETWORK",
    categoryFr: "CROISSANCE & RÉSEAU",
    categoryAr: "النمو وشبكة العلاقات"
  },
  {
    id: "volunteers",
    number: "03",
    audienceEn: "For Volunteers",
    audienceFr: "Bénévoles & Citoyens engagés",
    audienceAr: "للمتطوعين والمشاركين المجتمعيين",
    taglineEn: "Share your skills. Contribute to something meaningful.",
    taglineFr: "Partagez vos compétences. Contribuez à l'impact.",
    taglineAr: "شارك مهاراتك. ساهم في إحداث أثر هادف.",
    descEn: "You do not have to be an entrepreneur to make a difference in entrepreneurship. Our volunteer community welcomes people who want to contribute their time, knowledge, creativity, and professional skills to support our mission. Whether your strengths are in communication, technology, research, administration, event coordination, business development, design, education, or community engagement, your contribution can help us create meaningful opportunities for others. Students, early-career professionals, experienced specialists, and motivated individuals from different backgrounds are welcome to express their interest.",
    descFr: "Il n'est pas nécessaire d'être entrepreneur pour faire une réelle différence dans notre mission sociale. Notre communauté bénévole accueille toutes les personnes souhaitant offrir leur temps, leurs compétences professionnelles, leur créativité et leur énergie. Que votre expertise réside dans les technologies, la communication, la formation, l'administration, l'organisation d'événements ou l'animation communautaire, chaque contribution renforce notre capacité d'action et ouvre des opportunités pour ceux qui en ont le plus besoin.",
    descAr: "لا يلزم أن تكون رائد أعمال لتحدث فرقاً إيجابياً. يرحب مجتمع المتطوعين لدينا بالأشخاص الذين يرغبون في المساهمة بوقتهم ومعرفتهم وإبداعهم ومهاراتهم المهنية لدعم رسالتنا. وسواء كانت نقاط قوتك في الاتصال، أو التكنولوجيا، أو الإدارة، أو التدريب، فإن مساهمتك تساعد في خلق فرص ملموسة للآخرين.",
    actionLabelEn: "Become a Volunteer",
    actionLabelFr: "Devenir bénévole chez CAP",
    actionLabelAr: "تطوع معنا في كاب",
    image: JOIN_ASSETS.volunteers,
    categoryEn: "CITIZEN ENGAGEMENT",
    categoryFr: "ENGAGEMENT CITOYEN",
    categoryAr: "المشاركة المجتمعية والتطوع"
  },
  {
    id: "mentors",
    number: "04",
    audienceEn: "For Mentors and Professionals",
    audienceFr: "Mentors & Professionnels chevronnés",
    audienceAr: "للموجهين والخبراء المهنيين",
    taglineEn: "Your experience could help someone move forward.",
    taglineFr: "Votre expérience éclaire le parcours d'autrui.",
    taglineAr: "خبرتك تلهم وتساعد الآخرين على التقدم.",
    descEn: "Behind every successful entrepreneur are lessons learned, challenges overcome, and people who offered guidance at the right time. CAP Entrepreneurs welcomes interest from professionals, experienced entrepreneurs, subject-matter specialists, and other individuals who want to share their knowledge and support the development of entrepreneurial talent. Mentors and professionals may contribute through knowledge-sharing sessions, workshops, individual guidance, expert discussions, or other collaborative activities.",
    descFr: "Derrière chaque réussite entrepreneuriale se trouvent des enseignements précieux, des écueils surmontés et des mentors bienveillants qui ont su guider au bon moment. Cap Entrepreneurs invite les professionnels, entrepreneurs d'expérience et spécialistes sectoriels à transmettre leur savoir-faire. En devenant mentor, vous accompagnez la montée en compétences de créateurs engagés à travers des ateliers pratiques, des revues de projet ou un accompagnement personnalisé fondé sur la solidarité.",
    descAr: "خلف كل رائد أعمال ناجح دروس مستفادة وتحديات تم التغلب عليها وموجهون قدموا الإرشاد في الوقت المناسب. ترحب كاب رواد الأعمال بالمهنيين ورواد الأعمال ذوي الخبرة والمختصين الذين يرغبون في مشاركة معرفتهم ودعم المواهب الريادية الصاعدة.",
    actionLabelEn: "Express Interest in Mentoring",
    actionLabelFr: "S'impliquer comme mentor",
    actionLabelAr: "أبدِ اهتمامك بالإرشاد",
    image: JOIN_ASSETS.mentors,
    categoryEn: "MENTORSHIP & EXPERTISE",
    categoryFr: "MENTORAT & EXPERTISE",
    categoryAr: "الإرشاد والخبرة"
  },
  {
    id: "partners",
    number: "05",
    audienceEn: "For Organizations and Strategic Partners",
    audienceFr: "Organismes & Partenaires institutionnels",
    audienceAr: "للمنظمات والشركاء الاستراتيجيين",
    taglineEn: "Let's create opportunities together.",
    taglineFr: "Créons des synergies à fort impact.",
    taglineAr: "لنبتكر الفرص معاً بتعاون وثيق.",
    descEn: "Meaningful progress often happens when organizations combine their strengths, knowledge, networks, and resources around a shared purpose. CAP Entrepreneurs welcomes conversations with organizations, educational institutions, businesses, entrepreneurship support organizations, professional networks, and other stakeholders interested in advancing entrepreneurship and innovation. Partnership opportunities may include joint initiatives, training, events, knowledge exchange, resource sharing, community engagement, and other mutually beneficial collaborations.",
    descFr: "Les transformations durables naissent lorsque des organisations complémentaires conjuguent leurs expertises, leurs réseaux et leurs ressources autour d'une mission d'intérêt collectif. Cap Entrepreneurs collabore activement avec des organismes à but non lucratif, des institutions d'enseignement, des collectivités et des entreprises socialement engagées pour déployer des programmes conjoints, favoriser l'inclusion numérique et enrichir l'écosystème.",
    descAr: "يتحقق التقدم المستدام عندما تجمع المنظمات نقاط قوتها ومعرفتها وشبكاتها ومواردها حول هدف مجتمعي مشترك. ترحب كاب رواد الأعمال بالتعاون مع المنظمات غير الربحية، والمؤسسات التعليمية، والشبكات المهنية، والجهات المعنية بدعم الابتكار والشمول الرقمي.",
    actionLabelEn: "Explore Partnership Opportunities",
    actionLabelFr: "Développer un partenariat",
    actionLabelAr: "استكشف فرص الشراكة",
    image: JOIN_ASSETS.partners,
    categoryEn: "STRATEGIC ALLIANCES",
    categoryFr: "ALLIANCES STRATÉGIQUES",
    categoryAr: "تحالفات استراتيجية"
  },
  {
    id: "sponsors",
    number: "06",
    audienceEn: "For Sponsors, Donors, and Supporters",
    audienceFr: "Bailleurs de fonds, Donateurs & Mécènes",
    audienceAr: "للجهات المانحة والممولين والداعمين",
    taglineEn: "Help create the conditions for entrepreneurs to thrive.",
    taglineFr: "Créer les conditions de l'émancipation durable.",
    taglineAr: "ساهم في تهيئة الظروف لازدهار الجميع.",
    descEn: "Entrepreneurial potential exists everywhere, but access to opportunities, networks, knowledge, and resources is not always equal. Individuals and organizations who believe in the power of entrepreneurship can contribute to initiatives that support learning, innovation, business development, and community progress. We welcome conversations with potential sponsors, donors, and supporters interested in learning about our mission, our activities, our priorities, and opportunities to contribute. Every contribution should serve a clear purpose and help create meaningful value.",
    descFr: "Le talent et la volonté d'entreprendre existent dans tous les milieux, mais l'accès aux outils, aux financements éthiques et aux opportunités demeure inégal. En soutenant financièrement ou matériellement Cap Entrepreneurs, vous permettez l'équipement numérique de personnes défavorisées, la formation de coopératives agricoles féminines et l'organisation de rencontres intercontinentales. Chaque contribution s'inscrit dans une gouvernance canadienne rigoureuse et transparente.",
    descAr: "الطاقات الريادية موجودة في كل مكان، ولكن الوصول إلى الموارد والشبكات والفرص لا يزال غير متكافئ. يمكن للأفراد والمنظمات الذين يؤمنون برسالة الأثر الاجتماعي المساهمة في دعم البرامج التي تعزز التعلم والابتكار وتمكين المجتمعات المحلية.",
    actionLabelEn: "Discuss Ways to Support CAP",
    actionLabelFr: "Soutenir notre mission sociale",
    actionLabelAr: "ناقش سبل دعم المهمة",
    image: JOIN_ASSETS.sponsors,
    categoryEn: "PATRONAGE & IMPACT",
    categoryFr: "MÉCÉNAT & IMPACT",
    categoryAr: "الرعاية والأثر الاجتماعي"
  },
  {
    id: "students",
    number: "07",
    audienceEn: "For Students, Young Professionals, and Emerging Talent",
    audienceFr: "Étudiants & Jeunes talents de la relève",
    audienceAr: "للطلاب والمهنيين الشباب والمواهب الصاعدة",
    taglineEn: "Your journey can start before you feel ready.",
    taglineFr: "Votre aventure commence dès aujourd'hui.",
    taglineAr: "رحلتك يمكن أن تبدأ قبل أن تشعر بأنك جاهز تماماً.",
    descEn: "You do not need to wait until you have years of experience to become part of a community that values ideas, initiative, and learning. Students and emerging professionals can explore opportunities to contribute their skills, participate in relevant activities, connect with experienced people, and learn more about entrepreneurship and innovation. Whether you are interested in business, technology, communication, research, design, leadership, or social impact, there are opportunities to discover new interests and develop practical experience.",
    descFr: "Il n'est pas nécessaire d'attendre des années d'expérience pour s'investir dans un écosystème qui valorise la créativité et l'audace citoyenne. Les étudiants et jeunes diplômés peuvent explorer des missions de bénévolat valorisantes, collaborer sur des projets technologiques réels, bénéficier du mentorat de professionnels chevronnés et acquérir une expérience concrète reconnue sur le marché du travail.",
    descAr: "لست بحاجة إلى الانتظار لسنوات من الخبرة لتصبح جزءاً من مجتمع يقدر الأفكار والمبادرة والتعلم. يمكن للطلاب والمهنيين الشباب استكشاف فرص لتطبيق مهاراتهم، والتواصل مع أصحاب الخبرة، وبناء تجربة عملية تسهم في مسارهم المهني.",
    actionLabelEn: "Explore Ways to Get Involved",
    actionLabelFr: "Découvrir la communauté jeunesse",
    actionLabelAr: "استكشف سبل المشاركة للشباب",
    image: JOIN_ASSETS.students,
    categoryEn: "NEXT GENERATION & TALENT",
    categoryFr: "RELÈVE & JEUNES TALENTS",
    categoryAr: "جيل المستقبل والمواهب"
  }
];

const FAQS = [
  {
    qEn: "Do I need to be an entrepreneur to join CAP Entrepreneurs?",
    qFr: "Dois-je obligatoirement être entrepreneur pour rejoindre Cap Entrepreneurs ?",
    qAr: "هل يجب أن أكون رائد أعمال للانضمام إلى كاب رواد الأعمال؟",
    aEn: "No. You can express interest as a volunteer, mentor, professional, student, organization, sponsor, donor, or supporter. The appropriate next steps depend on the type of engagement you are seeking.",
    aFr: "Non, absolument pas. Vous pouvez vous impliquer comme bénévole, mentor, apprenant, étudiant, organisation partenaire ou donateur. Notre organisme est un écosystème ouvert à toutes les énergies positives.",
    aAr: "لا، على الإطلاق. يمكنك الانضمام كمتطوع، أو موجه، أو طالب، أو منظمة شريكة، أو داعم. تتحدد الخطوات التالية حسب المسار الذي تختاره."
  },
  {
    qEn: "Is there a fee to join?",
    qFr: "Y a-t-il des frais d'adhésion pour rejoindre la communauté ?",
    qAr: "هل توجد رسوم للانضمام إلى المجتمع؟",
    aEn: "Participation in general community onboarding is free. Specific specialized programs or cohort tracks may have targeted criteria or partner sponsorships.",
    aFr: "L'accueil au sein de notre communauté générale est entièrement gratuit. En tant qu'organisme à but non lucratif canadien, nos programmes d'accompagnement sont soutenus par nos partenaires et donateurs pour garantir l'accessibilité au plus grand nombre.",
    aAr: "الانضمام العام لمجتمعنا مجاني بالكامل. كمنظمة غير ربحية كندية، يتم دعم برامجنا من خلال شركائنا والجهات المانحة لضمان وصول الجميع إليها."
  },
  {
    qEn: "Can I participate remotely?",
    qFr: "Puis-je participer et m'engager à distance ?",
    qAr: "هل يمكنني المشاركة عن بُعد؟",
    aEn: "Yes. Many initiatives, working committees, mentoring sessions, and digital training modules are accessible entirely online from Canada and internationally.",
    aFr: "Oui. Une grande partie de nos activités, comités de travail, séances de mentorat et modules de formation sont accessibles virtuellement, favorisant la collaboration entre le Canada et nos hubs internationaux.",
    aAr: "نعم. يتم تنظيم العديد من الأنشطة وجلسات الإرشاد واللجان ومسارات التدريب الرقمي بالكامل عبر الإنترنت من كندا ومختلف دول العالم."
  },
  {
    qEn: "Do I need prior professional experience?",
    qFr: "Une expérience professionnelle préalable est-elle exigée ?",
    qAr: "هل تتطلب المشاركة خبرة مهنية سابقة؟",
    aEn: "Not necessarily. Several pathways welcome beginners and students, while specialized advisory roles value domain expertise and lived leadership.",
    aFr: "Pas obligatoirement. Plusieurs de nos parcours accueillent avec enthousiasme les débutants et étudiants, tandis que nos comités thématiques et rôles de mentorat s'adressent à des profils plus expérimentés.",
    aAr: "ليس بالضرورة. ترحب العديد من المسارات بالمبتدئين والطلاب الراغبين في التعلم، بينما تخصص أدوار التوجيه واللجان لأصحاب الخبرات التخصصية."
  },
  {
    qEn: "Will joining guarantee funding, mentorship, or business support?",
    qFr: "Rejoindre la communauté garantit-il un financement ou un accompagnement direct ?",
    qAr: "هل يضمن الانضمام الحصول على تمويل أو دعم مباشر؟",
    aEn: "No. Joining the community connects you with resources and opportunities, but admissions to specific cohorts or programs depend on eligibility, project readiness, and organizational capacity.",
    aFr: "Non. La soumission d'un dossier permet d'entrer en relation avec notre équipe et d'accéder à nos ressources partagées. L'admission aux cohortes spécialisées dépend de l'admissibilité, de l'alignement avec notre mission sociale et des places disponibles.",
    aAr: "لا. يتيح لك الانضمام التواصل مع المنظومة والوصول إلى الموارد المشتركة، بينما يخضع القبول في البرامج التخصصية لمعايير الأهلية والطاقة الاستيعابية."
  },
  {
    qEn: "How do I get started?",
    qFr: "Comment puis-je débuter concrètement ?",
    qAr: "كيف أبدأ بشكل عملي؟",
    aEn: "Choose the pathway that best describes your aspirations, fill out the form below, and our onboarding team will review your submission and contact you.",
    aFr: "Choisissez le parcours qui correspond le mieux à votre profil ou à vos aspirations, complétez le formulaire ci-dessous, et notre équipe de coordination prendra contact avec vous pour un premier échange d'orientation.",
    aAr: "اختر المسار الذي يطابق تطلعاتك، واملأ النموذج أدناه، وسيتواصل معك فريق التنسيق لدينا لمتابعة خطواتك التالية."
  }
];

const Join = () => {
  const { lang, t } = useLang();
  const isFr = lang === "fr";
  const isAr = lang === "ar";

  const formRef = useRef(null);
  const [selectedPathway, setSelectedPathway] = useState("aspiring");
  const [openFaq, setOpenFaq] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pathway: "Porteurs de projet & Futurs entrepreneurs",
    organization: "",
    goals: "",
    message: "",
    signature: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Newsletter sidebar state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const getAudience = (p) => (isFr ? p.audienceFr : isAr ? p.audienceAr : p.audienceEn);
  const getTagline = (p) => (isFr ? p.taglineFr : isAr ? p.taglineAr : p.taglineEn);
  const getDesc = (p) => (isFr ? p.descFr : isAr ? p.descAr : p.descEn);
  const getActionLabel = (p) => (isFr ? p.actionLabelFr : isAr ? p.actionLabelAr : p.actionLabelEn);
  const getCategory = (p) => (isFr ? p.categoryFr : isAr ? p.categoryAr : p.categoryEn);

  const scrollToForm = (pathwayTitle) => {
    if (pathwayTitle) {
      setFormData(prev => ({ ...prev, pathway: pathwayTitle }));
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
    if (!formData.name || !formData.email || !formData.pathway) {
      toast.error(
        isFr
          ? "Veuillez remplir tous les champs obligatoires (*)"
          : isAr
          ? "يرجى ملء جميع الحقول المطلوبة (*)"
          : "Please fill in all required fields (*)"
      );
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/submissions", {
        type: "join",
        payload: formData
      });
      toast.success(
        isFr
          ? "Merci pour votre démarche ! Notre équipe examinera votre profil et prendra contact avec vous."
          : isAr
          ? "شكراً لك! تم استلام طلبك وسيتواصل معك فريقنا قريباً."
          : "Thank you! Your inquiry has been received. Our team will contact you shortly."
      );
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error(
        isFr
          ? "Une erreur est survenue lors de l'envoi. Veuillez réessayer."
          : isAr
          ? "حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى."
          : "An error occurred during submission. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribing(true);
    try {
      await api.post("/submissions", {
        type: "newsletter",
        payload: { email: newsletterEmail, source: "join_sidebar" }
      });
      toast.success(
        isFr
          ? "Merci de vous être abonné à nos nouvelles communautaires !"
          : isAr
          ? "شكراً لاشتراكك في نشرتنا المجتمعية!"
          : "Thank you for subscribing to our community updates!"
      );
      setNewsletterEmail("");
    } catch (err) {
      toast.error(
        isFr
          ? "Impossible d'enregistrer l'inscription. Veuillez réessayer."
          : isAr
          ? "تعذر التسجيل. يرجى المحاولة مرة أخرى."
          : "Could not subscribe. Please try again."
      );
    } finally {
      setSubscribing(false);
    }
  };

  const topAvatars = [
    {
      img: JOIN_ASSETS.avatar1,
      label: isFr ? "ENTREPRENEURS" : isAr ? "رواد الأعمال" : "ENTREPRENEURS",
      id: "aspiring"
    },
    {
      img: JOIN_ASSETS.avatar2,
      label: isFr ? "AFFAIRES & PROJETS" : isAr ? "المشاريع" : "BUSINESS",
      id: "entrepreneurs"
    },
    {
      img: JOIN_ASSETS.avatar3,
      label: isFr ? "BÉNÉVOLES" : isAr ? "المتطوعون" : "VOLUNTEERS",
      id: "volunteers"
    },
    {
      img: JOIN_ASSETS.avatar4,
      label: isFr ? "MENTORS" : isAr ? "الموجهون" : "MENTORS",
      id: "mentors"
    },
    {
      img: JOIN_ASSETS.avatar5,
      label: isFr ? "PARTENAIRES" : isAr ? "الشركاء" : "PARTNERS",
      id: "partners"
    }
  ];

  return (
    <div data-testid="join-page" className="min-h-screen bg-[#FAF9F6] text-[#0D0E0D] font-sans selection:bg-maple selection:text-white">

      {/* 1. TOP CIRCULAR CATEGORY AVATARS */}
      <section className="bg-white border-b border-[#0D0E0D]/10 pt-28 pb-8">
        <div className="mx-auto max-w-[1360px] px-5 sm:px-8">
          <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-14 overflow-x-auto py-2">
            {topAvatars.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => scrollToForm(cat.label)}
                className="group flex flex-col items-center cursor-pointer shrink-0"
              >
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-maple transition-all duration-300 p-0.5 shadow-sm">
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="h-full w-full object-cover rounded-full transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <span className="mt-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#0D0E0D]/80 group-hover:text-maple font-montserrat transition-colors">
                  {cat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL HERO */}
      <EditorialRejoindreHero
        testId="join-hero"
        brandName="Cap-Entrepreneurs"
        categoryKicker={
          isFr
            ? "REJOINDRE L'ÉCOSYSTÈME"
            : isAr
            ? "الانضمام للمنظومة"
            : "JOIN THE ECOSYSTEM"
        }
        verticalKicker={
          isFr
            ? "R E J O I N D R E"
            : isAr
            ? "ان ض م"
            : "J O I N"
        }
        titleLines={
          isFr
            ? ["Rejoindre", "Une Communauté", "Qui Fait Avancer", "Les Idées."]
            : isAr
            ? ["كن جزءاً", "من مجتمع", "يدفع الأفكار", "نحو الأمام."]
            : ["Be Part Of A", "Community That", "Moves Ideas", "Forward."]
        }
        subtitle={
          isFr
            ? "Toute grande initiative commence par une idée. Mais pour la concrétiser durablement, il faut des compétences, de l'entraide, des ressources et un écosystème solidaire. Chez Cap Entrepreneurs, organisme à but non lucratif canadien, nous rassemblons les individus et les organisations pour créer des opportunités, accompagner les parcours et propulser un impact social mesurable."
            : isAr
            ? "كل مشروع عظيم يبدأ بفكرة. ولكن تحويل تلك الفكرة إلى واقع مستدام يتطلب المعرفة والدعم والتعاون والموارد ومنظومة متضامنة. في كاب رواد الأعمال، نجمع الناس لخلق الفرص، ومرافقة المسارات، ودفع الأفكار نحو أثر اجتماعي ملموس."
            : "Every great venture begins with an idea. But turning that idea into reality takes knowledge, support, collaboration, resources, and a community that believes in what is possible. At CAP Entrepreneurs, a Canadian non-profit organization, we bring people together to create opportunities, accompany entrepreneurs, and propel ideas toward meaningful impact."
        }
        ctaLabel={
          isFr
            ? "Rejoindre l'écosystème"
            : isAr
            ? "انضم إلى مجتمعنا"
            : "Become Part of CAP"
        }
        onCtaClick={() => scrollToForm()}
        bgImage="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80"
        fgImage="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
      />

      {/* 3. MAIN EDITORIAL CONTENT + SIDEBAR LAYOUT */}
      <main className="mx-auto max-w-[1360px] px-4 sm:px-6 md:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">

          {/* LEFT COLUMN: MAIN CONTENT (8 cols) */}
          <div className="lg:col-span-8 space-y-16">

            {/* SECTION: FIND YOUR PLACE IN OUR COMMUNITY */}
            <div>
              <Reveal>
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-maple font-montserrat">
                    {isFr ? "PARCOURS COMMUNAUTAIRES" : isAr ? "مسارات المجتمع" : "COMMUNITY PATHWAYS"}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[#0D0E0D]">
                    {isFr
                      ? "Trouvez votre place au sein de notre communauté"
                      : isAr
                      ? "ابحث عن مكانك في مجتمعنا"
                      : "Find Your Place in Our Community"}
                  </h2>
                  <div className="mx-auto mt-3 mb-4 h-[2px] w-12 bg-maple" />
                  <p className="font-serif italic text-sm sm:text-base text-sage leading-relaxed">
                    {isFr
                      ? "Chacun a une contribution unique à apporter. Que vous cherchiez un accompagnement, souhaitiez partager votre savoir-faire ou désiriez bâtir des partenariats durables, vous pouvez participer activement à notre mission collective."
                      : isAr
                      ? "لكل شخص مساهمة قيّمة. سواء كنت تبحث عن الدعم، أو تأمل في مشاركة خبرتك، أو تبحث عن فرص للتعاون، يمكنك المشاركة في مهمتنا بطرق مختلفة."
                      : "Everyone has something valuable to contribute. Whether you are looking for support, hoping to share your expertise, or seeking opportunities to collaborate, you can take part in our mission in different ways."}
                  </p>
                </div>
              </Reveal>

              {/* FEATURED STORY CARD */}
              <article className="bg-white border border-[#0D0E0D]/10 p-6 sm:p-10 shadow-sm mb-12">
                <Reveal>
                  <div className="overflow-hidden border border-[#0D0E0D]/10 mb-6">
                    <img
                      src={JOIN_ASSETS.featuredStory}
                      alt={getAudience(PATHWAY_DATA[0])}
                      className="aspect-[16/9] w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                    />
                  </div>

                  <div className="text-center max-w-xl mx-auto">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                      {getCategory(PATHWAY_DATA[0])}
                    </span>
                    <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-[#0D0E0D]">
                      {getAudience(PATHWAY_DATA[0])}
                    </h3>
                    <p className="mt-1 font-serif italic text-sm text-maple">
                      {getTagline(PATHWAY_DATA[0])}
                    </p>
                    <p className="mt-4 text-xs sm:text-sm text-sage leading-relaxed text-left sm:text-center font-sans">
                      {getDesc(PATHWAY_DATA[0])}
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={() => scrollToForm(getAudience(PATHWAY_DATA[0]))}
                        className="inline-flex items-center gap-2 bg-[#232724] px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-maple"
                      >
                        <span>{getActionLabel(PATHWAY_DATA[0])}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Reveal>
              </article>

              {/* OTHER 6 PATHWAYS GRID */}
              <div className="grid gap-8 sm:grid-cols-2">
                {PATHWAY_DATA.slice(1).map((pathway, idx) => (
                  <article
                    key={pathway.id}
                    className="flex flex-col justify-between bg-white border border-[#0D0E0D]/10 p-6 shadow-sm hover:border-maple transition-colors"
                  >
                    <Reveal delay={idx * 0.05}>
                      <div className="overflow-hidden border border-[#0D0E0D]/10 mb-5">
                        <img
                          src={pathway.image}
                          alt={getAudience(pathway)}
                          className="aspect-[16/11] w-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-maple font-montserrat">
                          {getCategory(pathway)}
                        </span>
                        <span className="font-mono text-xs font-bold text-sage">
                          {pathway.number}
                        </span>
                      </div>

                      <h4 className="font-serif text-xl font-bold text-[#0D0E0D] leading-snug">
                        {getAudience(pathway)}
                      </h4>

                      <p className="mt-1 font-serif italic text-xs text-maple">
                        {getTagline(pathway)}
                      </p>

                      <p className="mt-3 text-xs text-sage leading-relaxed line-clamp-4">
                        {getDesc(pathway)}
                      </p>

                      <div className="mt-6 pt-4 border-t border-[#0D0E0D]/10">
                        <button
                          onClick={() => scrollToForm(getAudience(pathway))}
                          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0D0E0D] hover:text-maple transition-colors"
                        >
                          <span>{getActionLabel(pathway)}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </Reveal>
                  </article>
                ))}
              </div>

              {/* Note / Disclaimer Box */}
              <div className="mt-8 border-l-2 border-maple bg-[#FAF9F6] p-4 sm:p-5 text-xs text-sage leading-relaxed">
                <span className="font-bold text-[#0D0E0D]">
                  {isFr ? "Note : " : isAr ? "ملاحظة: " : "Note: "}
                </span>
                {isFr
                  ? "La participation, le mentorat et les partenariats sont coordonnés selon la nature de chaque projet, les critères d'admissibilité et les ressources disponibles au sein de l'organisme. La soumission d'une demande ne constitue pas un engagement automatique, mais initie un dialogue bienveillant avec notre équipe."
                  : isAr
                  ? "تعتمد المشاركة والإرشاد وترتيبات الشراكة على طبيعة الفرصة ومتطلبات الأهلية والموارد المتاحة. تقديم الطلب لا يضمن القبول التلقائي، بل يمثل بداية لحوار بنّاء مع فريقنا."
                  : "Participation, placement, support, and partnership arrangements depend on the nature of the opportunity, eligibility requirements, and available resources. Submitting an inquiry does not guarantee acceptance, funding, mentorship, or a partnership."}
              </div>
            </div>

            {/* SECTION: WHAT BRINGS US TOGETHER (Guiding Principles) */}
            <section className="bg-white border border-[#0D0E0D]/10 p-6 sm:p-10 shadow-sm text-center">
              <Reveal>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-maple font-montserrat">
                  {isFr ? "PRINCIPES DIRECTEURS" : isAr ? "المبادئ التوجيهية" : "GUIDING PRINCIPLES"}
                </p>
                <h3 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#0D0E0D]">
                  {isFr ? "Ce qui nous rassemble" : isAr ? "ما يجمعنا" : "What Brings Us Together"}
                </h3>
                <div className="mx-auto mt-3 mb-3 h-[2px] w-12 bg-maple" />
                <p className="font-serif italic text-sm text-sage max-w-xl mx-auto mb-10">
                  {isFr
                    ? "Cap Entrepreneurs s'articule autour de trois principes fondamentaux qui guident nos interactions avec les bénéficiaires, bénévoles, professionnels et partenaires."
                    : isAr
                    ? "ترتكز كاب رواد الأعمال على ثلاثة مبادئ توجيهية ترسم أسلوب تفاعلنا مع رواد الأعمال والمتطوعين والمهنيين والشركاء والمجتمع بأسره."
                    : "CAP Entrepreneurs is built around three guiding principles that shape the way we engage with entrepreneurs, volunteers, professionals, partners, and the wider community."}
                </p>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="border border-[#0D0E0D]/10 bg-[#FAF9F6] p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-maple/10 text-maple">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h4 className="font-heading text-lg font-black tracking-wider text-[#0D0E0D]">
                      {isFr ? "CRÉER" : isAr ? "ابتكار" : "CREATE"}
                    </h4>
                    <p className="mt-2 text-xs text-sage leading-relaxed">
                      {isFr
                        ? "Nous encourageons l'émergence d'idées novatrices, la prise d'initiative et le développement de solutions entrepreneuriales adaptées aux besoins réels."
                        : isAr
                        ? "نشجع الأفكار والمبادرة والابتكار وتطوير حلول ريادية تستجيب للاحتياجات الحقيقية."
                        : "We encourage ideas, initiative, innovation, and the development of entrepreneurial solutions."}
                    </p>
                  </div>

                  <div className="border border-[#0D0E0D]/10 bg-[#FAF9F6] p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-maple/10 text-maple">
                      <Compass className="h-6 w-6" />
                    </div>
                    <h4 className="font-heading text-lg font-black tracking-wider text-[#0D0E0D]">
                      {isFr ? "ACCOMPAGNER" : isAr ? "مرافقة" : "ACCOMPANY"}
                    </h4>
                    <p className="mt-2 text-xs text-sage leading-relaxed">
                      {isFr
                        ? "Nous croyons en la force du mentorat, de la formation continue et du soutien solidaire à chaque étape du cheminement."
                        : isAr
                        ? "نؤمن بقيمة التوجيه والتعلم المستمر والتعاون والدعم الصادق طوال مسار ريادة الأعمال."
                        : "We believe in the value of guidance, learning, collaboration, and support throughout the entrepreneurial journey."}
                    </p>
                  </div>

                  <div className="border border-[#0D0E0D]/10 bg-[#FAF9F6] p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-maple/10 text-maple">
                      <Rocket className="h-6 w-6" />
                    </div>
                    <h4 className="font-heading text-lg font-black tracking-wider text-[#0D0E0D]">
                      {isFr ? "PROPULSER" : isAr ? "انطلاق" : "PROPEL"}
                    </h4>
                    <p className="mt-2 text-xs text-sage leading-relaxed">
                      {isFr
                        ? "Nous créons des passerelles concrètes vers les opportunités, les réseaux internationaux et le financement éthique pour amplifier l'impact."
                        : isAr
                        ? "نسعى لربط الناس بالفرص والمساعدة في دفع المبادرات الواعدة نحو النمو والأثر الإيجابي المستدام."
                        : "We seek to connect people with opportunities and help promising initiatives move toward growth and meaningful impact."}
                    </p>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* SECTION: FREQUENTLY ASKED QUESTIONS */}
            <section className="bg-white border border-[#0D0E0D]/10 p-6 sm:p-10 shadow-sm">
              <Reveal>
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-maple font-montserrat">
                    {isFr ? "QUESTIONS & RÉPONSES" : isAr ? "الأسئلة الشائعة" : "QUESTIONS & ANSWERS"}
                  </p>
                  <h3 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#0D0E0D]">
                    {isFr ? "Foire aux questions" : isAr ? "الأسئلة الأكثر تكراراً" : "Frequently Asked Questions"}
                  </h3>
                  <div className="mx-auto mt-3 mb-3 h-[2px] w-12 bg-maple" />
                </div>

                <div className="space-y-4">
                  {FAQS.map((faq, idx) => {
                    const isOpen = openFaq === idx;
                    const question = isFr ? faq.qFr : isAr ? faq.qAr : faq.qEn;
                    const answer = isFr ? faq.aFr : isAr ? faq.aAr : faq.aEn;

                    return (
                      <div
                        key={idx}
                        className="border border-[#0D0E0D]/10 bg-[#FAF9F6] transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          className="flex w-full items-center justify-between p-5 text-left font-serif text-base sm:text-lg font-bold text-[#0D0E0D] hover:text-maple transition-colors"
                        >
                          <span>{question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 shrink-0 text-maple" />
                          ) : (
                            <ChevronDown className="h-5 w-5 shrink-0 text-sage" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-sage leading-relaxed border-t border-[#0D0E0D]/5 font-sans">
                            {answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Reveal>
            </section>

          </div>

          {/* RIGHT COLUMN: MAGAZINE SIDEBAR (4 cols) */}
          <aside className="lg:col-span-4 space-y-12">

            {/* WIDGET 1: AUTHOR / COMMUNITY LEAD */}
            <div className="bg-white border border-[#0D0E0D]/10 p-6 text-center shadow-sm">
              <div className="mx-auto h-24 w-24 rounded-full overflow-hidden border border-[#0D0E0D]/10 shadow-sm mb-4">
                <img
                  src={JOIN_ASSETS.sidebarAuthor}
                  alt="Cap Entrepreneurs Community"
                  className="h-full w-full object-cover"
                />
              </div>
              <h4 className="font-serif text-lg font-bold text-[#0D0E0D]">
                {isFr ? "Coordination Communautaire" : isAr ? "منسق المجتمع" : "CAP Community Lead"}
              </h4>
              <p className="mt-2 text-xs text-sage leading-relaxed">
                {isFr
                  ? "Nous rassemblons les individus pour ouvrir des perspectives durables, soutenir l'inclusion numérique et propulser des projets à fort impact social."
                  : isAr
                  ? "نجمع الناس لخلق الفرص، ومرافقة رواد الأعمال طوال مساراتهم، ودفع الأفكار نحو أثر ذي مغزى."
                  : "We bring people together to create opportunities, accompany entrepreneurs throughout their journeys, and propel ideas toward meaningful impact."}
              </p>
              <div className="mt-4 pt-3 border-t border-[#0D0E0D]/10">
                <span className="font-serif italic text-sm text-maple">
                  {isFr ? "Créer • Accompagner • Propulser" : isAr ? "ابتكار • مرافقة • انطلاق" : "Create • Accompany • Propel"}
                </span>
              </div>
            </div>

            {/* WIDGET 2: NEWSLETTER */}
            <div className="bg-white border border-[#0D0E0D]/10 p-6 text-center shadow-sm">
              <span className="font-serif italic text-3xl text-[#0D0E0D]/80 block mb-1">
                {isFr ? "suivez-nous" : isAr ? "تابعنا" : "follow"}
              </span>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-maple font-montserrat">
                {isFr ? "NOUVELLES COMMUNAUTAIRES" : isAr ? "مستجدات المجتمع" : "COMMUNITY UPDATES"}
              </p>
              <p className="mt-3 text-xs text-sage leading-relaxed">
                {isFr
                  ? "Recevez nos dernières actualités, nos initiatives solidaires et les dates clés des cohortes."
                  : isAr
                  ? "ابق على اطلاع بأحدث برامجنا وأخبار المهرجان والمبادرات المجتمعية."
                  : "Stay updated with our latest programs, festival news and community initiatives."}
              </p>

              <form onSubmit={handleNewsletterSubmit} className="mt-5 space-y-3">
                <input
                  type="email"
                  required
                  placeholder={isFr ? "Votre adresse courriel" : isAr ? "بريدك الإلكتروني" : "Your email address"}
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full border border-[#0D0E0D]/20 px-3.5 py-2.5 text-xs text-[#0D0E0D] placeholder:text-sage/50 focus:border-maple focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="w-full bg-[#232724] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white hover:bg-maple transition-colors"
                >
                  {subscribing
                    ? (isFr ? "INSCRIPTION EN COURS..." : isAr ? "جاري الاشتراك..." : "SUBSCRIBING...")
                    : (isFr ? "S'INSCRIRE" : isAr ? "اشتراك" : "SUBSCRIBE")}
                </button>
              </form>
            </div>

            {/* WIDGET 3: DON'T MISS */}
            <div className="bg-white border border-[#0D0E0D]/10 p-6 shadow-sm">
              <div className="border-t border-b border-[#0D0E0D] py-2 text-center mb-5">
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#0D0E0D] font-montserrat">
                  {isFr ? "À NE PAS MANQUER" : isAr ? "لا تفوت" : "DON'T MISS"}
                </span>
              </div>
              <div className="space-y-4">
                {[
                  {
                    title: isFr ? "Cap Green Lab - Tech Circulaire" : isAr ? "مختبر كاب الأخضر - تكنولوجيا دائرية" : "Cap Green Lab - Circular Tech",
                    tag: isFr ? "LABORATOIRE" : isAr ? "مختبر" : "LAB",
                    img: JOIN_ASSETS.aspiring,
                    to: "/programs#greenlab"
                  },
                  {
                    title: isFr ? "AgriConnect - Innovation Rurale" : isAr ? "أجري كونكت - ابتكار ريفي" : "AgriConnect - Rural Innovation",
                    tag: isFr ? "AGRI" : isAr ? "زراعة" : "AGRI",
                    img: JOIN_ASSETS.entrepreneurs,
                    to: "/programs#agriconnect"
                  },
                  {
                    title: isFr ? "Safe Vibe - Médias Responsables" : isAr ? "سيف فايب - إعلام مسؤول" : "Safe Vibe - Responsible Media",
                    tag: isFr ? "MÉDIAS" : isAr ? "إعلام" : "MEDIA",
                    img: JOIN_ASSETS.volunteers,
                    to: "/programs#safevibe"
                  },
                  {
                    title: isFr ? "Sourcing Créatif Africain" : isAr ? "توريد إبداعي أفريقي" : "African Creative Sourcing",
                    tag: isFr ? "COMMERCE" : isAr ? "تجارة" : "TRADE",
                    img: JOIN_ASSETS.partners,
                    to: "/global-festival"
                  }
                ].map((item, i) => (
                  <Link
                    key={i}
                    to={item.to}
                    className="flex items-center gap-3 pb-3 border-b border-[#0D0E0D]/10 last:border-b-0 last:pb-0 group"
                  >
                    <img
                      src={item.img}
                      alt={item.title}
                      className="h-12 w-12 object-cover border border-[#0D0E0D]/10 shrink-0"
                    />
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-maple">
                        {item.tag}
                      </span>
                      <h5 className="font-serif text-xs font-bold text-[#0D0E0D] group-hover:text-maple transition-colors line-clamp-1">
                        {item.title}
                      </h5>
                      <span className="text-[10px] text-sage">
                        {isFr ? "En savoir plus →" : isAr ? "اعرف المزيد ←" : "Learn more →"}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* WIDGET 4: BANNER */}
            <div className="relative overflow-hidden border border-[#0D0E0D]/10 shadow-sm">
              <img
                src={JOIN_ASSETS.sidebarBanner}
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
                    {isFr ? "Rejoignez nos délégations mondiales" : isAr ? "انضم لوفودنا الدولية" : "Join our international delegations"}
                  </p>
                </div>
              </div>
            </div>

            {/* WIDGET 5: PATHWAYS DIRECTORY */}
            <div className="bg-white border border-[#0D0E0D]/10 p-6 shadow-sm">
              <div className="border-t border-b border-[#0D0E0D] py-2 text-center mb-5">
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#0D0E0D] font-montserrat">
                  {isFr ? "RÔLES COMMUNAUTAIRES" : isAr ? "أدوار المجتمع" : "COMMUNITY ROLES"}
                </span>
              </div>
              <div className="space-y-2.5 text-xs">
                {PATHWAY_DATA.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => scrollToForm(getAudience(p))}
                    className="flex items-center justify-between p-2 cursor-pointer hover:bg-[#FAF9F6] border-b border-[#0D0E0D]/5 last:border-b-0"
                  >
                    <span className="text-sage font-medium line-clamp-1">{getAudience(p)}</span>
                    <span className="font-mono text-[10px] text-sage/70">({p.number})</span>
                  </div>
                ))}
              </div>
            </div>

          </aside>

        </div>
      </main>

      {/* 4. APPLICATION & REGISTRATION FORM */}
      <section
        ref={formRef}
        id="join-form-section"
        className="bg-white border-t border-[#0D0E0D]/10 py-20 md:py-28"
      >
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 md:px-8">

          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-maple font-montserrat">
              {isFr ? "PASSER À L'ACTION" : isAr ? "اتخاذ خطوة" : "TAKE ACTION"}
            </p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl font-medium text-[#0D0E0D] tracking-tight">
              {isFr ? "Votre prochain pas commence ici" : isAr ? "خطوتك التالية تبدأ هنا" : "Your Next Step Starts Here"}
            </h2>
            <div className="mx-auto mt-4 mb-3 h-[2px] w-12 bg-maple" />
            <p className="text-xs sm:text-sm text-sage leading-relaxed font-serif italic">
              {isFr
                ? "« L'avenir de l'entrepreneuriat se construit avec des personnes prêtes à imaginer de nouveaux horizons, à partager leurs savoirs et à agir ensemble pour le bien commun. Rejoignez Cap Entrepreneurs. Participez à l'aventure et faites avancer les idées. »"
                : isAr
                ? "« يتشكل مستقبل ريادة الأعمال من خلال أشخاص مستعدين لتخيل إمكانيات جديدة، ومشاركة ما يعرفونه، والعمل معاً، واتخاذ خطوات ملموسة. انضم إلى كاب رواد الأعمال. كن جزءاً من المسار وساهم في دفع الأفكار نحو الأمام. »"
                : "“The future of entrepreneurship is shaped by people who are willing to imagine new possibilities, share what they know, work together, and take action. Join CAP Entrepreneurs. Be part of the journey. Help move ideas forward.”"}
            </p>
          </div>

          <div className="max-w-3xl mx-auto border border-[#0D0E0D]/10 bg-[#FAF9F6] p-8 sm:p-12 shadow-sm">
            {submitted ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-maple text-white">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#0D0E0D]">
                  {isFr ? "Bienvenue chez Cap Entrepreneurs !" : isAr ? "مرحباً بك في كاب رواد الأعمال!" : "Welcome to CAP Entrepreneurs !"}
                </h3>
                <p className="mt-3 text-sm text-sage max-w-md mx-auto">
                  {isFr
                    ? "Votre démarche a été enregistrée avec succès. Notre équipe de coordination examinera votre profil et prendra contact avec vous dans les meilleurs délais."
                    : isAr
                    ? "تم إرسال طلبك بنجاح. سيقوم منسق الانضمام لدينا بمراجعة ملفك والتواصل معك بشأن الخطوات التالية."
                    : "Your inquiry has been successfully transmitted. Our onboarding coordinator will review your profile and reach out with relevant next steps."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: "",
                      email: "",
                      pathway: getAudience(PATHWAY_DATA[0]),
                      organization: "",
                      goals: "",
                      message: "",
                      signature: ""
                    });
                  }}
                  className="mt-6 inline-flex items-center gap-2 border border-[#0D0E0D] px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#0D0E0D] hover:bg-white"
                >
                  {isFr ? "Soumettre une autre demande" : isAr ? "تقديم طلب آخر" : "Submit Another Inquiry"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6" data-testid="join-page-form">

                {/* Pathway selection */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                    {isFr
                      ? "VOIE D'ENGAGEMENT SOUHAITÉE *"
                      : isAr
                      ? "المسار أو الدور المطلوب *"
                      : "PATHWAY / ROLE OF INTEREST *"}
                  </label>
                  <select
                    name="pathway"
                    required
                    value={formData.pathway}
                    onChange={handleFormChange}
                    className="w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm text-[#0D0E0D] focus:border-maple focus:outline-none"
                  >
                    {PATHWAY_DATA.map((p) => (
                      <option key={p.id} value={getAudience(p)}>
                        {getAudience(p)} ({getTagline(p)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name & Email */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                      {isFr ? "NOM COMPLET *" : isAr ? "الاسم الكامل *" : "FULL NAME *"}
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder={isFr ? "Ex: Alex Tremblay" : isAr ? "مثال: أليكس تريمبلاي" : "e.g., Alex Tremblay"}
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm text-[#0D0E0D] focus:border-maple focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                      {isFr ? "ADRESSE COURRIEL *" : isAr ? "البريد الإلكتروني *" : "EMAIL ADDRESS *"}
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder={isFr ? "vous@exemple.com" : isAr ? "name@example.com" : "you@example.com"}
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm text-[#0D0E0D] focus:border-maple focus:outline-none"
                    />
                  </div>
                </div>

                {/* Organization / Affiliation */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                    {isFr
                      ? "ORGANISME OU AFFILIATION (FACULTATIF)"
                      : isAr
                      ? "المنظمة أو الجهة التابع لها (اختياري)"
                      : "ORGANIZATION OR AFFILIATION (OPTIONAL)"}
                  </label>
                  <input
                    type="text"
                    name="organization"
                    placeholder={
                      isFr
                        ? "Nom de votre projet, association, coopérative ou entreprise"
                        : isAr
                        ? "اسم مشروعك أو جمعيتك أو شركتك"
                        : "Name of venture, non-profit, student association, or employer"
                    }
                    value={formData.organization}
                    onChange={handleFormChange}
                    className="w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm text-[#0D0E0D] focus:border-maple focus:outline-none"
                  />
                </div>

                {/* Goals & Motivation */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                    {isFr
                      ? "VOS OBJECTIFS & COMMENT VOUS SOUHAITEZ CONTRIBUER *"
                      : isAr
                      ? "أهدافك وكيف ترغب في المشاركة *"
                      : "YOUR GOALS & HOW YOU'D LIKE TO PARTICIPATE *"}
                  </label>
                  <textarea
                    name="goals"
                    required
                    rows={4}
                    placeholder={
                      isFr
                        ? "Décrivez vos aspirations, les compétences que vous souhaitez développer ou offrir, et ce qui motive votre démarche..."
                        : isAr
                        ? "أخبرنا عن اهتماماتك والمهارات التي تود تقديمها أو اكتسابها..."
                        : "Tell us about your interests, the skills you would like to offer or acquire, and what motivated you to connect with CAP..."
                    }
                    value={formData.goals}
                    onChange={handleFormChange}
                    className="w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm text-[#0D0E0D] focus:border-maple focus:outline-none"
                  />
                </div>

                {/* Additional Message */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                    {isFr
                      ? "MESSAGE OU INFORMATIONS COMPLÉMENTAIRES"
                      : isAr
                      ? "رسالة أو استفسار إضافي"
                      : "ADDITIONAL MESSAGE OR INQUIRY"}
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder={
                      isFr
                        ? "Toute information utile (disponibilités, questions sur nos programmes, etc.)..."
                        : isAr
                        ? "أي أسئلة أو تفاصيل إضافية تود مشاركتها..."
                        : "Any questions, specific programs of interest, or relevant context you would like to share..."
                    }
                    value={formData.message}
                    onChange={handleFormChange}
                    className="w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm text-[#0D0E0D] focus:border-maple focus:outline-none"
                  />
                </div>

                {/* Digital Signature */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#0D0E0D]">
                    {isFr
                      ? "SIGNATURE NUMÉRIQUE (VOTRE NOM COMPLET) *"
                      : isAr
                      ? "التوقيع الرقمي (اكتب اسمك الكامل) *"
                      : "DIGITAL SIGNATURE (TYPE YOUR FULL NAME) *"}
                  </label>
                  <input
                    type="text"
                    name="signature"
                    required
                    placeholder={isFr ? "Inscrivez votre nom complet pour signer" : isAr ? "اكتب اسمك الكامل للتوقيع" : "Type your full legal name to sign"}
                    value={formData.signature}
                    onChange={handleFormChange}
                    className="w-full border border-[#0D0E0D]/20 bg-white px-4 py-3 text-sm font-serif italic text-[#0D0E0D] focus:border-maple focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-sage">
                    {isFr
                      ? "En inscrivant votre nom, vous confirmez l'exactitude de vos informations et votre accord avec les valeurs de Cap Entrepreneurs."
                      : isAr
                      ? "بكتابة اسمك، فإنك تؤكد صحة معلوماتك وتوافقك مع قيم المنظمة."
                      : "By typing your name, you confirm that the information provided is accurate and agree to communicate in good faith."}
                  </p>
                </div>

                {/* Submit button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#232724] px-8 py-4 text-xs font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-maple disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>{isFr ? "TRANSMISSION EN COURS..." : isAr ? "جاري الإرسال..." : "SUBMITTING..."}</span>
                    ) : (
                      <>
                        <span>{isFr ? "TRANSMETTRE MA CANDIDATURE" : isAr ? "إرسال الطلب" : "SUBMIT INQUIRY"}</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}
          </div>

        </div>
      </section>

    </div>
  );
};

export default Join;
