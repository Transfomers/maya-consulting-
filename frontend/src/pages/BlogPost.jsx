import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { Reveal } from "@/components/motion";
import { ArrowLeft, Clock, Calendar, Share2, Sparkles, User, Tag } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { IMAGES } from "@/lib/content";

const FALLBACK_ARTICLES = {
  "26-ways-ecosystem-thrive-collaborative-hub": {
    title: "26 Ways to Make Your Ecosystem Thrive Like a Modern Collaborative Hub",
    titleFr: "26 clés pour faire prospérer un écosystème solidaire et collaboratif",
    titleAr: "26 ركيزة لازدهار منظومة ريادية تعاونية ومستدامة",
    excerpt: "How collaborative laboratories, circular economy, and inclusive entrepreneurship empower creators across Canada and global hubs.",
    excerptFr: "Comment les laboratoires partagés, l'économie circulaire et l'inclusion numérique renforcent l'autonomie des créateurs au Canada et dans nos hubs partenaires.",
    excerptAr: "كيف تمكّن المختبرات التشاركية والاقتصاد الدائري والشمول الرقمي المبدعين في كندا والمراكز الدولية.",
    category: "Community",
    categoryFr: "Communauté",
    categoryAr: "المجتمع",
    tags: ["Ecosystem", "Innovation", "Global", "Collaboration"],
    author: "Murielle A. & Équipe éditoriale",
    authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    date: "8 mai 2026",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80",
    content: `
      <p class="lead text-lg font-medium text-forest/80 leading-relaxed mb-6">
        Bâtir un écosystème entrepreneurial et solidaire ne consiste pas à ériger des hiérarchies rigides — c'est cultiver un terrain fertile où les compétences, la solidarité et l'ambition d'intérêt général se rencontrent naturellement.
      </p>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">1. L'art des espaces collaboratifs ouverts</h2>
      <p class="mb-6 leading-relaxed">
        Qu'il s'agisse de concevoir un atelier communautaire au Québec ou d'animer des échanges virtuels entre Montréal, Paris, Nairobi et Port-au-Prince, l'espace façonne la confiance. La transparence, le partage des ressources et l'accessibilité encouragent une véritable émancipation collective.
      </p>
      <blockquote class="border-l-4 border-maple pl-6 my-8 italic text-lg text-forest/90 font-serif">
        "Les écosystèmes ne grandissent pas par décret ; ils prospèrent parce que des personnes y trouvent une solidarité tangible et active au quotidien."
      </blockquote>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">2. Des pratiques durables et circulaires</h2>
      <p class="mb-6 leading-relaxed">
        Du reconditionnement d'équipements informatiques à l'approvisionnement responsable, nos cohortes privilégient des rituels concrets qui transforment les idées naissantes en projets résilients au service de leur communauté.
      </p>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">3. Passerelles internationales et confiance partagée</h2>
      <p class="mb-6 leading-relaxed">
        Relier les entrepreneurs sociaux du Canada aux réseaux d'innovation mondiaux multiplie les perspectives d'impact tout en garantissant des standards éthiques de gouvernance et de respect mutuel.
      </p>
    `
  },
  "the-strategic-blueprint-non-stop": {
    title: "The Strategic Blueprint I'll Be Using Non-Stop This Season",
    titleFr: "Le cadre stratégique d'action pour démultiplier l'impact social",
    titleAr: "المخطط الاستراتيجي لتعظيم الأثر المجتمعي المستدام",
    excerpt: "Why agile execution and decentralized mentorship transformed how our incubation cohorts launch and scale impact-driven ventures.",
    excerptFr: "Pourquoi l'action agile sur le terrain et le mentorat décentralisé transforment l'accompagnement des initiatives communautaires durables.",
    excerptAr: "كيف يحدث التنفيذ المرن والإرشاد التشاركي تحولاً نوعياً في مرافقة المبادرات ذات الأثر الاجتماعي.",
    category: "Leadership",
    categoryFr: "Gouvernance",
    categoryAr: "الحوكمة",
    tags: ["Stratégie", "Mentorat", "Impact"],
    author: "Murielle A.",
    authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    date: "8 mai 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    content: `
      <p class="lead text-lg font-medium text-forest/80 leading-relaxed mb-6">
        Toute initiative sociale rencontre l'écueil de la planification excessive : passer des mois à peaufiner des documents théoriques pendant que les besoins réels sur le terrain évoluent. Voici une démarche pragmatique éprouvée.
      </p>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">L'expérimentation rapide auprès des participants</h2>
      <p class="mb-6 leading-relaxed">
        Plutôt que d'attendre un modèle parfait, testez vos solutions en situation réelle dès les premières semaines. Le retour direct des bénéficiaires et des bénévoles apporte une clarté incomparable.
      </p>
      <blockquote class="border-l-4 border-maple pl-6 my-8 italic text-lg text-forest/90 font-serif">
        "L'écoute active de la communauté est la clé de voûte de toute initiative sociale pérenne."
      </blockquote>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">La force de l'entraide entre pairs</h2>
      <p class="mb-6 leading-relaxed">
        En jumelant chaque porteur de projet avec un mentor bienveillant et des pairs engagés, les solitudes se brisent et les apprentissages se multiplient exponentiellement.
      </p>
    `
  },
  "the-cult-beauty-products-in-pairs": {
    title: "The Essential Digital Tools You Should Be Adopting in Pairs",
    titleFr: "Les outils numériques essentiels pour une transition responsable",
    titleAr: "الأدوات الرقمية الأساسية لتعزيز التحول المجتمعي المسؤول",
    excerpt: "From asynchronous collaboration hubs to circular supply chain trackers: the top tech pairings our entrepreneurs swear by.",
    excerptFr: "Des plateformes collaboratives ouvertes aux outils de traçabilité circulaire : le socle technologique recommandé pour les projets à impact.",
    excerptAr: "من منصات التعاون المفتوحة إلى أدوات التتبع الدائري: المنظومة التقنية المثلى للمشاريع الريادية الاجتماعية.",
    category: "Tech Inclusive",
    categoryFr: "Tech Inclusive",
    categoryAr: "تكنولوجيا شاملة",
    tags: ["Outils Numériques", "Inclusion", "Durabilité"],
    author: "Elena Rostova",
    authorAvatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80",
    date: "8 mai 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    content: `
      <p class="lead text-lg font-medium text-forest/80 leading-relaxed mb-6">
        La technologie doit libérer l'énergie humaine et favoriser l'inclusion, non constituer une barrière d'accès. Ce duo d'outils renforce l'efficacité collective sans surcharger les équipes.
      </p>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">1. Documentation partagée et gestion des connaissances</h2>
      <p class="mb-6 leading-relaxed">
        Garder le savoir accessible et bien indexé permet d'accueillir et d'intégrer de nouveaux bénévoles ou membres d'équipe en quelques heures avec clarté et bienveillance.
      </p>
      <blockquote class="border-l-4 border-maple pl-6 my-8 italic text-lg text-forest/90 font-serif">
        "Un outil n'a de valeur que par la bienveillance et la clarté de la culture humaine qui l'anime."
      </blockquote>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">2. Indicateurs d'impact et tableaux de bord communautaires</h2>
      <p class="mb-6 leading-relaxed">
        Lorsque vos donateurs, partenaires et bénéficiaires constatent l'impact social concret en toute transparence, la confiance se consolide durablement.
      </p>
    `
  },
  "struggle-to-hit-your-goals-try-this": {
    title: "If You Struggle to Hit Your Goals, Try This Instead",
    titleFr: "Atteindre ses objectifs d'impact : la force des micro-actions collectives",
    titleAr: "تحقيق أهداف الأثر الاجتماعي: قوة المبادرات التشاركية",
    excerpt: "This year, instead of setting grand, lofty goals and broad resolutions, learn how micro-sprints and peer accountability check-ins deliver daily momentum.",
    excerptFr: "Plutôt que des résolutions abstraites, découvrez comment les cercles de pairs et les sprints solidaires créent un élan quotidien durable.",
    excerptAr: "بدلاً من القرارات النظرية، اكتشف كيف تخلق حلقات الدعم والخطوات العملية زخماً مستمراً ومثمراً.",
    category: "Impact Social",
    categoryFr: "Impact Social",
    categoryAr: "الأثر الاجتماعي",
    tags: ["Productivité", "Solidarité", "Croissance"],
    author: "Murielle A.",
    authorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    date: "8 mai 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    content: `
      <p class="lead text-lg font-medium text-forest/80 leading-relaxed mb-6">
        Se fixer des buts ambitieux est louable, mais sans rythme régulier, l'épuisement guette. Voici la méthode des petits pas partagés qui dynamise les cohortes de Cap Entrepreneurs.
      </p>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">Le principe des 3 priorités quotidiennes</h2>
      <p class="mb-6 leading-relaxed">
        Chaque matin, identifiez les trois actions qui font avancer concrètement la mission. Concentrez votre énergie sur ce qui apporte une réelle valeur humaine.
      </p>
      <blockquote class="border-l-4 border-maple pl-6 my-8 italic text-lg text-forest/90 font-serif">
        "La régularité bienveillante produit plus d'impact que l'intensité sporadique."
      </blockquote>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">Célébrer chaque étape franchie</h2>
      <p class="mb-6 leading-relaxed">
        Dans l'action communautaire, chaque progrès compte. Partager ses victoires avec ses pairs nourrit la motivation et solidifie les liens.
      </p>
    `
  },
  "high-impact-resource-finds": {
    title: "These High-Impact Resource Finds Will Transform Your Project",
    titleFr: "Ressources et opportunités d'impact pour propulser vos projets",
    titleAr: "الموارد والفرص المحفزة لتعزيز نمو المشاريع الواعدة",
    excerpt: "A curated selection of grant registries, open-source diagnostic templates, and collaborative funding networks available right now.",
    excerptFr: "Une sélection de répertoires de subventions, de modèles diagnostics libres et de réseaux d'entraide accessibles à notre communauté.",
    excerptAr: "دليل مختار من سجلات المنح ونماذج التقييم مفتوحة المصدر وشبكات التمويل التضامني المتاحة لمجتمعنا.",
    category: "Mentorat",
    categoryFr: "Mentorat",
    categoryAr: "الإرشاد",
    tags: ["Financement", "Ressources", "Mentorat"],
    author: "Aminata Diallo",
    authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    date: "8 mai 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    content: `
      <p class="lead text-lg font-medium text-forest/80 leading-relaxed mb-6">
        L'accès aux ressources est le nerf de la pérennité associative. Nous avons réuni les leviers les plus pertinents pour soutenir les initiatives solidaires.
      </p>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">Les bourses et financements non dilutifs</h2>
      <p class="mb-6 leading-relaxed">
        Découvrez les programmes canadiens et internationaux dédiés à l'inclusion numérique, à la transition écologique et à l'autonomisation économique des femmes.
      </p>
      <blockquote class="border-l-4 border-maple pl-6 my-8 italic text-lg text-forest/90 font-serif">
        "Les financements éthiques soutiennent la mission sociale sans dénaturer la vision d'origine."
      </blockquote>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">Les gabarits et outils en libre accès</h2>
      <p class="mb-6 leading-relaxed">
        Téléchargez nos fiches pratiques de diagnostic, de gestion budgétaire prévisionnelle et d'évaluation d'impact social pour structurer votre démarche.
      </p>
    `
  },
  "cute-jewelry-ideas-for-any-occasion": {
    title: "Ethical Sourcing & Creative Design for Global Markets",
    titleFr: "Sourcing éthique et valorisation créative pour les marchés solidaires",
    titleAr: "التوريد الأخلاقي والتصميم الإبداعي للأسواق الدولية العادلة",
    excerpt: "Connecting African creative talents and Quebec designers with sustainable buyers worldwide through our premier sourcing programme.",
    excerptFr: "Relier les talents créatifs africains et les designers du Québec aux acheteurs éthiques à travers notre programme de sourcing international.",
    excerptAr: "ربط المواهب الإبداعية الإفريقية والمصممين في كيبيك بالمشترين الدوليين المسؤولين عبر برنامج التوريد العالمي.",
    category: "International",
    categoryFr: "International",
    categoryAr: "دولي",
    tags: ["Sourcing", "Culture", "Commerce Équitable"],
    author: "Murielle A. & Conseil Créatif",
    authorAvatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80",
    date: "8 mai 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
    content: `
      <p class="lead text-lg font-medium text-forest/80 leading-relaxed mb-6">
        La créativité artisanale et le design responsable sont de formidables moteurs d'émancipation économique. Notre programme de sourcing international crée des ponts équitables entre continents.
      </p>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">Des partenariats directs et équitables</h2>
      <p class="mb-6 leading-relaxed">
        En éliminant les intermédiaires abusifs, nous veillons à ce que la juste valeur du travail retourne directement aux artisans et coopératives créatives locales.
      </p>
      <blockquote class="border-l-4 border-maple pl-6 my-8 italic text-lg text-forest/90 font-serif">
        "Le commerce équitable honore les savoir-faire traditionnels tout en ouvrant des perspectives économiques dignes."
      </blockquote>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">Accès aux réseaux canadiens et internationaux</h2>
      <p class="mb-6 leading-relaxed">
        À travers les rendez-vous de Marrakech, Paris et Nairobi, les créateurs rencontrent des acheteurs professionnels engagés dans une démarche durable et solidaire.
      </p>
    `
  },
  "bridging-digital-divide-inclusive-technologies": {
    title: "How to Build Sustainable Digital Futures Across Canada and Global Hubs",
    titleFr: "Bâtir des avenirs numériques durables et universellement inclusifs",
    titleAr: "بناء مستقبل رقمي مستدام وشامل في كندا والمراكز الدولية",
    excerpt: "How collaborative laboratories and inclusive hardware refurbishment empower underserved communities across Canada and emerging markets.",
    excerptFr: "Comment le reconditionnement d'équipements et l'accessibilité universelle réduisent durablement la fracture numérique au Canada et à l'international.",
    excerptAr: "كيف يسهم تجديد الأجهزة والإتاحة التكنولوجية في تقليص الفجوة الرقمية وتمكين المجتمعات المحلية.",
    category: "Circularity",
    categoryFr: "Circularité",
    categoryAr: "اقتصاد دائري",
    tags: ["Tech Circulaire", "Inclusion", "Cap Green Lab"],
    author: "Sarah Jenkins & Murielle A.",
    authorAvatar: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80",
    date: "8 mai 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
    content: `
      <p class="lead text-lg font-medium text-forest/80 leading-relaxed mb-6">
        Au XXIe siècle, l'accès au matériel informatique et aux compétences numériques est un préalable indispensable à l'exercice de la citoyenneté et à l'autonomie économique.
      </p>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">1. Reconditionner le matériel, reconstruire des opportunités</h2>
      <p class="mb-6 leading-relaxed">
        À travers l'initiative Cap Green Lab, nous collectons, diagnostiquons et reconditionnons des parcs informatiques d'entreprises pour équiper des écoles, des coopératives et des familles dans le besoin.
      </p>
      <blockquote class="border-l-4 border-maple pl-6 my-8 italic text-lg text-forest/90 font-serif">
        "Chaque ordinateur sauvé du rebut est une passerelle d'apprentissage offerte à un jeune ou un créateur."
      </blockquote>
      <h2 class="text-2xl font-black text-forest mt-10 mb-4 font-montserrat">2. L'accessibilité technologique universelle</h2>
      <p class="mb-6 leading-relaxed">
        Nos ateliers intègrent des solutions d'accessibilité pour les personnes en situation de handicap, garantissant que la transition numérique n'exclue personne.
      </p>
    `
  }
};

export default function BlogPost() {
  const { slug } = useParams();
  const { lang, t } = useLang();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/${slug}`);
        setPost(res.data);
      } catch (err) {
        // Check fallback articles
        if (FALLBACK_ARTICLES[slug]) {
          setPost({
            slug,
            translations: [{
              language: lang,
              title: FALLBACK_ARTICLES[slug].title,
              excerpt: FALLBACK_ARTICLES[slug].excerpt,
              content: FALLBACK_ARTICLES[slug].content
            }],
            ...FALLBACK_ARTICLES[slug]
          });
        } else {
          // Generate an elegant fallback article for any selected slug
          const humanTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          setPost({
            slug,
            title: humanTitle,
            category: "Ecosystem Insight",
            author: "CAP Entrepreneurs Editorial Team",
            authorAvatar: IMAGES.portraitF,
            date: "October 2026",
            readTime: "5 min read",
            image: IMAGES.collaboration,
            translations: [{
              language: lang,
              title: humanTitle,
              excerpt: "Exploring community empowerment, sustainable digital transition, and inclusive opportunities.",
              content: `
                <p class="lead text-lg font-medium text-forest/80 leading-relaxed mb-6">
                  Community-driven transformation relies on shared digital tools, robust mentorship networks, and transparent governance.
                </p>
                <h2 class="text-2xl font-black text-forest mt-8 mb-4 font-montserrat">Empowering Changemakers</h2>
                <p class="mb-6 leading-relaxed">
                  Through collaborative training and international exchange, our initiatives support participants in developing scalable, sustainable solutions rooted in local realities.
                </p>
              `
            }]
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, lang]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-forest/60 font-montserrat uppercase tracking-widest text-sm font-bold">
        Loading story...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center font-montserrat">
        <h1 className="text-3xl font-black text-forest">Article Not Found</h1>
        <Link to="/blog" className="mt-4 text-maple font-bold hover:underline">← Back to all articles</Link>
      </div>
    );
  }

  const getTranslation = (p) => {
    if (!p.translations || p.translations.length === 0) return { title: p.title || p.slug, excerpt: '', content: p.content || '' };
    const localized = p.translations.find(t => t.language === lang);
    return localized || p.translations[0];
  };

  const trans = getTranslation(post);
  const title = trans.seo_title || trans.title || post.title || "CAP Entrepreneurs Story";
  const description = trans.seo_description || trans.excerpt || post.excerpt || "Read our latest article.";
  const canonicalUrl = trans.canonical_url || `https://capentrepreneurs.org/${lang}/blog/${post.slug}`;
  const displayImage = post.image || (post.featured_image_id ? `/api/v1/admin/media/${post.featured_image_id}` : IMAGES.collaboration);

  return (
    <article className="min-h-screen bg-[#FAF9F6] font-montserrat text-forest pb-32 pt-28 antialiased" data-testid="blog-post-page">
      <Helmet>
        <title>{title} | CAP Entrepreneurs</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      {/* Header Container */}
      <div className="mx-auto max-w-[900px] px-5">
        <Reveal>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-forest/70 hover:bg-forest hover:text-white transition-all mb-8 shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="rounded-full bg-maple/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-maple">
              {post.category || "Community Insight"}
            </span>
            <span className="text-xs font-medium text-forest/50">
              {post.date || new Date(post.published_at || post.created_at || Date.now()).toLocaleDateString()}
            </span>
            <span className="text-xs text-forest/30">•</span>
            <span className="text-xs font-medium text-forest/50">
              {post.readTime || "5 min read"}
            </span>
          </div>

          <h1 className="font-montserrat text-3xl md:text-5xl font-black leading-tight tracking-tight text-forest mb-8">
            {trans.title}
          </h1>

          {/* Author Block */}
          <div className="flex items-center gap-4 border-y border-forest/10 py-5">
            <img
              src={post.authorAvatar || IMAGES.portraitF}
              alt={post.author || "CAP Entrepreneurs"}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-forest/10"
            />
            <div>
              <p className="font-bold text-sm text-forest">Written by {post.author || "CAP Entrepreneurs"}</p>
              <p className="text-xs text-forest/60">Canadian Non-Profit Ecosystem</p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Cover Image */}
      <Reveal delay={0.15}>
        <div className="mx-auto max-w-[1100px] px-5 my-10">
          <div className="overflow-hidden rounded-3xl border border-forest/10 shadow-lg bg-forest/5 aspect-[21/10]">
            <img
              src={displayImage}
              alt={trans.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </Reveal>

      {/* Article Content */}
      <div className="mx-auto max-w-[840px] px-5">
        <Reveal delay={0.25}>
          <div
            className="prose prose-lg max-w-none text-forest/85 leading-relaxed font-montserrat prose-headings:font-montserrat prose-headings:font-black prose-headings:tracking-tight prose-headings:text-forest prose-a:text-maple prose-a:font-semibold hover:prose-a:underline prose-blockquote:border-maple prose-blockquote:text-forest prose-img:rounded-2xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: trans.content }}
          />
        </Reveal>

        {/* Share & Back Bottom Bar */}
        <Reveal delay={0.35}>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-forest/15 pt-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-forest hover:text-maple transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Explore More Articles
            </Link>

            <Link
              to="/join"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-maple transition-all"
            >
              Join Our Ecosystem
            </Link>
          </div>
        </Reveal>
      </div>
    </article>
  );
}

