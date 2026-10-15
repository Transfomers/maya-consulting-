import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { Reveal } from "@/components/motion";
import { ArrowRight, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const EDITORIAL_CATEGORIES = [
  { name: "All", fr: "Toutes", ar: "الكل", count: 24 },
  { name: "Community", fr: "Communauté", ar: "المجتمع", count: 12 },
  { name: "Leadership", fr: "Gouvernance", ar: "الحوكمة", count: 9 },
  { name: "Tech Inclusive", fr: "Tech Inclusive", ar: "تكنولوجيا شاملة", count: 8 },
  { name: "Impact Social", fr: "Impact Social", ar: "الأثر الاجتماعي", count: 11 },
  { name: "Mentorat", fr: "Mentorat", ar: "الإرشاد", count: 6 },
  { name: "International", fr: "International", ar: "دولي", count: 7 },
  { name: "Circularity", fr: "Circularité", ar: "اقتصاد دائري", count: 5 }
];

const CURATED_EDITORIAL_POSTS = [
  {
    id: "hero-featured",
    slug: "26-ways-ecosystem-thrive-collaborative-hub",
    isFeatured: true,
    titleEn: "26 Ways to Make Your Ecosystem Thrive Like a Modern Collaborative Hub",
    titleFr: "26 clés pour faire prospérer un écosystème solidaire et collaboratif",
    titleAr: "26 ركيزة لازدهار منظومة ريادية تعاونية ومستدامة",
    excerptEn: "How collaborative laboratories, circular economy, and inclusive entrepreneurship empower creators across Canada and global hubs.",
    excerptFr: "Comment les laboratoires partagés, l'économie circulaire et l'inclusion numérique renforcent l'autonomie des créateurs au Canada et dans nos hubs partenaires.",
    excerptAr: "كيف تمكّن المختبرات التشاركية والاقتصاد الدائري والشمول الرقمي المبدعين في كندا والمراكز الدولية.",
    category: "Community",
    categoryFr: "Communauté",
    categoryAr: "المجتمع",
    author: "Murielle A. & Équipe éditoriale",
    dateEn: "8 MAY",
    dateFr: "8 MAI",
    dateAr: "8 مايو",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80",
    ratio: "aspect-[16/10]"
  },
  {
    id: "grid-1",
    slug: "the-strategic-blueprint-non-stop",
    titleEn: "The Strategic Blueprint I'll Be Using Non-Stop This Season",
    titleFr: "Le cadre stratégique d'action pour démultiplier l'impact social",
    titleAr: "المخطط الاستراتيجي لتعظيم الأثر المجتمعي المستدام",
    excerptEn: "Why agile execution and decentralized mentorship transformed how our incubation cohorts launch and scale impact-driven ventures.",
    excerptFr: "Pourquoi l'action agile sur le terrain et le mentorat décentralisé transforment l'accompagnement des initiatives communautaires durables.",
    excerptAr: "كيف يحدث التنفيذ المرن والإرشاد التشاركي تحولاً نوعياً في مرافقة المبادرات ذات الأثر الاجتماعي.",
    category: "Leadership",
    categoryFr: "Gouvernance",
    categoryAr: "الحوكمة",
    author: "Murielle A.",
    dateEn: "8 MAY",
    dateFr: "8 MAI",
    dateAr: "8 مايو",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    ratio: "aspect-[3/4]"
  },
  {
    id: "grid-2",
    slug: "the-cult-beauty-products-in-pairs",
    titleEn: "The Essential Digital Tools You Should Be Adopting in Pairs",
    titleFr: "Les outils numériques essentiels pour une transition responsable",
    titleAr: "الأدوات الرقمية الأساسية لتعزيز التحول المجتمعي المسؤول",
    excerptEn: "From asynchronous collaboration hubs to circular supply chain trackers: the top tech pairings our entrepreneurs swear by.",
    excerptFr: "Des plateformes collaboratives ouvertes aux outils de traçabilité circulaire : le socle technologique recommandé pour les projets à impact.",
    excerptAr: "من منصات التعاون المفتوحة إلى أدوات التتبع الدائري: المنظومة التقنية المثلى للمشاريع الريادية الاجتماعية.",
    category: "Tech Inclusive",
    categoryFr: "Tech Inclusive",
    categoryAr: "تكنولوجيا شاملة",
    author: "Elena Rostova",
    dateEn: "8 MAY",
    dateFr: "8 MAI",
    dateAr: "8 مايو",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    ratio: "aspect-[4/3]"
  },
  {
    id: "grid-3",
    slug: "struggle-to-hit-your-goals-try-this",
    titleEn: "If You Struggle to Hit Your Goals, Try This Instead",
    titleFr: "Atteindre ses objectifs d'impact : la force des micro-actions collectives",
    titleAr: "تحقيق أهداف الأثر الاجتماعي: قوة المبادرات التشاركية",
    excerptEn: "This year, instead of setting grand, lofty goals and broad resolutions, learn how micro-sprints and peer accountability check-ins deliver daily momentum.",
    excerptFr: "Plutôt que des résolutions abstraites, découvrez comment les cercles de pairs et les sprints solidaires créent un élan quotidien durable.",
    excerptAr: "بدلاً من القرارات النظرية، اكتشف كيف تخلق حلقات الدعم والخطوات العملية زخماً مستمراً ومثمراً.",
    category: "Impact Social",
    categoryFr: "Impact Social",
    categoryAr: "الأثر الاجتماعي",
    author: "Murielle A.",
    dateEn: "8 MAY",
    dateFr: "8 MAI",
    dateAr: "8 مايو",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    ratio: "aspect-[4/3]"
  },
  {
    id: "grid-4",
    slug: "high-impact-resource-finds",
    titleEn: "These High-Impact Resource Finds Will Transform Your Project",
    titleFr: "Ressources et opportunités d'impact pour propulser vos projets",
    titleAr: "الموارد والفرص المحفزة لتعزيز نمو المشاريع الواعدة",
    excerptEn: "A curated selection of grant registries, open-source diagnostic templates, and collaborative funding networks available right now.",
    excerptFr: "Une sélection de répertoires de subventions, de modèles diagnostics libres et de réseaux d'entraide accessibles à notre communauté.",
    excerptAr: "دليل مختار من سجلات المنح ونماذج التقييم مفتوحة المصدر وشبكات التمويل التضامني المتاحة لمجتمعنا.",
    category: "Mentorat",
    categoryFr: "Mentorat",
    categoryAr: "الإرشاد",
    author: "Aminata Diallo",
    dateEn: "8 MAY",
    dateFr: "8 MAI",
    dateAr: "8 مايو",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    ratio: "aspect-[3/4]"
  },
  {
    id: "grid-5",
    slug: "bridging-digital-divide-inclusive-technologies",
    titleEn: "How to Build Sustainable Digital Futures Across Canada and Global Hubs",
    titleFr: "Bâtir des avenirs numériques durables et universellement inclusifs",
    titleAr: "بناء مستقبل رقمي مستدام وشامل في كندا والمراكز الدولية",
    excerptEn: "How collaborative laboratories and inclusive hardware refurbishment empower underserved communities across Canada and emerging markets.",
    excerptFr: "Comment le reconditionnement d'équipements et l'accessibilité universelle réduisent durablement la fracture numérique au Canada et à l'international.",
    excerptAr: "كيف يسهم تجديد الأجهزة والإتاحة التكنولوجية في تقليص الفجوة الرقمية وتمكين المجتمعات المحلية.",
    category: "Circularity",
    categoryFr: "Circularité",
    categoryAr: "اقتصاد دائري",
    author: "Sarah Jenkins & Murielle A.",
    dateEn: "8 MAY",
    dateFr: "8 MAI",
    dateAr: "8 مايو",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
    ratio: "aspect-[4/3]"
  },
  {
    id: "grid-6",
    slug: "cute-jewelry-ideas-for-any-occasion",
    titleEn: "Ethical Sourcing & Creative Design for Global Markets",
    titleFr: "Sourcing éthique et valorisation créative pour les marchés solidaires",
    titleAr: "التوريد الأخلاقي والتصميم الإبداعي للأسواق الدولية العادلة",
    excerptEn: "Connecting African creative talents and Quebec designers with sustainable buyers worldwide through our premier sourcing programme.",
    excerptFr: "Relier les talents créatifs africains et les designers du Québec aux acheteurs éthiques à travers notre programme de sourcing international.",
    excerptAr: "ربط المواهب الإبداعية الإفريقية والمصممين في كيبيك بالمشترين الدوليين المسؤولين عبر برنامج التوريد العالمي.",
    category: "International",
    categoryFr: "International",
    categoryAr: "دولي",
    author: "Murielle A. & Conseil Créatif",
    dateEn: "8 MAY",
    dateFr: "8 MAI",
    dateAr: "8 مايو",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
    ratio: "aspect-[3/4]"
  }
];

const TRENDING_SIDEBAR_POSTS = [
  {
    slug: "the-strategic-blueprint-non-stop",
    title: "The Strategic Blueprint I'll Be Using Non-Stop This Season",
    date: "8 MAY",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
  },
  {
    slug: "cute-jewelry-ideas-for-any-occasion",
    title: "6 Reasons to Build Cross-Border Partnerships Early",
    date: "5 MAY",
    image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80"
  },
  {
    slug: "bridging-digital-divide-inclusive-technologies",
    title: "Circular Tech: Diagnostics, Repair & Community Recovery",
    date: "1 APR",
    image: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=200&q=80"
  }
];

export default function Blog() {
  const { lang } = useLang();
  const [posts, setPosts] = useState(CURATED_EDITORIAL_POSTS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const isFrench = lang === "fr";
  const isArabic = lang === "ar";

  const getPostTitle = (post) => {
    if (!post) return "";
    if (isFrench && post.titleFr) return post.titleFr;
    if (isArabic && post.titleAr) return post.titleAr;
    return post.title || post.titleEn || "";
  };

  const getPostExcerpt = (post) => {
    if (!post) return "";
    if (isFrench && post.excerptFr) return post.excerptFr;
    if (isArabic && post.excerptAr) return post.excerptAr;
    return post.excerpt || post.excerptEn || "";
  };

  const getPostDate = (post) => {
    if (!post) return "";
    if (isFrench && post.dateFr) return post.dateFr;
    if (isArabic && post.dateAr) return post.dateAr;
    return post.date || post.dateEn || "8 MAY";
  };

  const getPostCategory = (post) => {
    if (!post) return "";
    if (isFrench && post.categoryFr) return post.categoryFr;
    if (isArabic && post.categoryAr) return post.categoryAr;
    return post.category || "";
  };

  useEffect(() => {
    const fetchApiPosts = async () => {
      try {
        const res = await api.get("/posts");
        const pub = (res.data || []).filter((p) => p.status === "published");
        if (pub.length > 0) {
          const apiFormatted = pub.map((p, idx) => {
            const trans = (p.translations || []).find((tr) => tr.language === lang) || p.translations?.[0] || {};
            const transFr = (p.translations || []).find((tr) => tr.language === "fr");
            const transEn = (p.translations || []).find((tr) => tr.language === "en");
            const transAr = (p.translations || []).find((tr) => tr.language === "ar");
            const fallbackCurated = CURATED_EDITORIAL_POSTS[idx % CURATED_EDITORIAL_POSTS.length];
            return {
              id: p.id,
              slug: p.slug,
              title: trans.title || p.slug,
              titleEn: transEn?.title || trans.title || p.slug,
              titleFr: transFr?.title || trans.title || p.slug,
              titleAr: transAr?.title || trans.title || p.slug,
              excerpt: trans.excerpt || "Read more about this project.",
              excerptEn: transEn?.excerpt || trans.excerpt,
              excerptFr: transFr?.excerpt || trans.excerpt,
              excerptAr: transAr?.excerpt || trans.excerpt,
              category: p.category?.name || fallbackCurated.category,
              categoryFr: p.category?.name || fallbackCurated.categoryFr,
              categoryAr: p.category?.name || fallbackCurated.categoryAr,
              author: p.author_name || "Murielle A. & Équipe éditoriale",
              date: "8 MAY",
              dateEn: "8 MAY",
              dateFr: "8 MAI",
              dateAr: "8 مايو",
              image: p.featured_image?.url || p.featured_image || fallbackCurated.image,
              ratio: idx % 2 === 0 ? "aspect-[3/4]" : "aspect-[4/3]"
            };
          });
          // Merge API posts at top, then fill with curated posts so the grid is full
          const merged = [...apiFormatted];
          for (const item of CURATED_EDITORIAL_POSTS) {
            if (!merged.some((m) => m.slug === item.slug)) {
              merged.push(item);
            }
          }
          setPosts(merged);
        }
      } catch (err) {
        console.warn("Using curated editorial blog posts:", err);
      }
    };
    fetchApiPosts();
  }, [lang]);

  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast.error(isFrench ? "Veuillez entrer une adresse courriel valide." : "Please enter a valid email address.");
      return;
    }
    setSubscribing(true);
    try {
      await api.post("/submissions", {
        type: "newsletter",
        payload: { email: newsletterEmail, name: newsletterEmail.split("@")[0] }
      });
      setSubscribed(true);
      toast.success(isFrench ? "Merci ! Vous êtes inscrit à l'infolettre." : "Thank you! You are subscribed to our newsletter.");
      setNewsletterEmail("");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : isFrench ? "Une erreur est survenue. Veuillez réessayer." : "An error occurred. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const title = getPostTitle(post);
    const excerpt = getPostExcerpt(post);
    const category = getPostCategory(post).toLowerCase();
    const matchesCategory =
      selectedCategory === "All" ||
      category.includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const heroPost = filteredPosts[0] || CURATED_EDITORIAL_POSTS[0];
  const gridPosts = filteredPosts.slice(1);

  return (
    <div data-testid="blog-page" className="min-h-screen bg-white text-[#1a1a1a] pb-32 pt-28 antialiased">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">

        {/* Minimal Search & Filter Bar */}
        <div className="mb-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
            <span className="font-montserrat text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mr-2 shrink-0">
              {isFrench ? "CATÉGORIES :" : isArabic ? "الفئات:" : "CATEGORIES:"}
            </span>
            {EDITORIAL_CATEGORIES.map((cat) => (
              <button
                key={isFrench ? cat.fr : isArabic ? cat.ar : cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`font-montserrat text-[11px] font-bold uppercase tracking-wider px-3 py-1 transition-all ${
                  selectedCategory === cat.name
                    ? "bg-[#111111] text-white"
                    : "text-neutral-500 hover:text-maple"
                }`}
              >
                {isFrench ? cat.fr : isArabic ? cat.ar : cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isFrench ? "Rechercher..." : "Search stories..."}
              className="w-full border border-neutral-200 bg-[#FAFAFA] pl-9 pr-3 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-maple focus:bg-white outline-none transition-colors"
            />
          </div>
        </div>

        {/* 2-COLUMN MAIN EDITORIAL LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16 items-start">

          {/* ===================== LEFT / MAIN COLUMN ===================== */}
          <main className="lg:col-span-8 flex flex-col gap-14">

            {/* A. FEATURED MAIN HERO POST */}
            {heroPost && (
              <Reveal>
                <article className="group flex flex-col items-center text-center">
                  <Link
                    to={`/blog/${heroPost.slug}`}
                    className="block w-full overflow-hidden bg-neutral-100 shadow-sm"
                  >
                    <img
                      src={heroPost.image}
                      alt={getPostTitle(heroPost)}
                      className="w-full aspect-[16/10] sm:aspect-[16/9] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  </Link>

                  <div className="mt-8 flex flex-col items-center max-w-2xl px-2">
                    <Link to={`/blog/${heroPost.slug}`}>
                      <h1 className="font-serif text-2xl sm:text-3xl md:text-[38px] font-normal leading-[1.25] tracking-tight text-[#1a1a1a] group-hover:text-maple transition-colors">
                        {getPostTitle(heroPost)}
                      </h1>
                    </Link>

                    <p className="mt-3 font-montserrat text-[10.5px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                      {getPostDate(heroPost)}
                    </p>

                    <p className="mt-3 font-serif text-sm sm:text-base leading-relaxed text-neutral-600 max-w-xl">
                      {getPostExcerpt(heroPost)}
                    </p>

                    <Link
                      to={`/blog/${heroPost.slug}`}
                      className="mt-4 inline-flex items-center gap-1.5 font-serif italic text-sm text-[#1a1a1a] hover:text-maple transition-colors"
                    >
                      <span>{isFrench ? "Lire l'article" : isArabic ? "اقرأ المقال" : "Read"}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            )}

            {/* B. 2-COLUMN STAGGERED MASONRY GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 lg:gap-x-10 gap-y-12 md:gap-y-16 items-start pt-10 border-t border-neutral-200/80">
              {gridPosts.map((post, index) => (
                <Reveal key={post.id || post.slug} delay={0.08 * (index % 4)}>
                  <article className="group flex flex-col items-start w-full">
                    <Link
                      to={`/blog/${post.slug}`}
                      className="block w-full overflow-hidden bg-neutral-100 shadow-sm"
                    >
                      <div className={`relative w-full ${post.ratio || "aspect-[4/3]"} overflow-hidden`}>
                        <img
                          src={post.image}
                          alt={getPostTitle(post)}
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      </div>
                    </Link>

                    <div className="mt-5 flex flex-col items-start w-full">
                      <Link to={`/blog/${post.slug}`}>
                        <h2 className="font-serif text-xl sm:text-[22px] font-normal leading-snug tracking-tight text-[#1a1a1a] group-hover:text-maple transition-colors">
                          {getPostTitle(post)}
                        </h2>
                      </Link>

                      <p className="mt-2 font-montserrat text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-400">
                        {getPostDate(post)}
                      </p>

                      <p className="mt-2.5 font-sans text-xs sm:text-[13px] leading-relaxed text-neutral-600 line-clamp-4">
                        {getPostExcerpt(post)}
                      </p>

                      <Link
                        to={`/blog/${post.slug}`}
                        className="mt-3.5 inline-flex items-center gap-1 font-serif italic text-sm text-[#1a1a1a] group-hover:text-maple transition-colors"
                      >
                        <span>{isFrench ? "Lire l'article" : isArabic ? "اقرأ المقال" : "Read"}</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

          </main>

          {/* ===================== RIGHT / SIDEBAR COLUMN ===================== */}
          <aside className="lg:col-span-4 lg:pl-6 xl:pl-10 lg:border-l lg:border-neutral-200/80 flex flex-col gap-12">

            {/* 1. AUTHOR / CURATOR PROFILE */}
            <div className="text-center pt-2">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
                alt="Murielle & Cap Team"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto object-cover ring-4 ring-[#FAF8F5] shadow-sm"
              />
              <h3 className="font-serif text-2xl font-normal text-[#1a1a1a] mt-4">
                Murielle & Cap Team
              </h3>
              <p className="font-sans text-xs text-neutral-500 max-w-[260px] mx-auto mt-2 leading-relaxed">
                {isFrench
                  ? "Ce blogue est notre espace pour partager des réflexions, des guides d'impact, des opportunités d'affaires et des inspirations quotidiennes."
                  : "This blog is our curated space to share insights, impact guides, community spotlights, and daily ecosystem inspirations."}
              </p>
            </div>

            {/* 2. NEWSLETTER BOX ("follow / NEWSLETTER") */}
            <div className="border border-neutral-200/80 bg-[#FAFAFA] p-6 sm:p-7 text-center">
              <span className="font-serif italic text-3xl sm:text-4xl text-neutral-300 block select-none mb-1">
                follow
              </span>
              <span className="font-montserrat text-[10px] font-bold uppercase tracking-[0.28em] text-[#1a1a1a] block mb-2">
                NEWSLETTER
              </span>
              <p className="font-montserrat text-[9.5px] font-semibold uppercase tracking-wider text-neutral-600 max-w-[220px] mx-auto mb-4 leading-relaxed">
                {isFrench
                  ? "LE MEILLEUR DE CAP ENTREPRENEURS DIRECTEMENT DANS VOTRE BOÎTE COURRIEL."
                  : "BEST OF CAP ENTREPRENEURS STRAIGHT TO YOUR INBOX."}
              </p>

              {subscribed ? (
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-maple py-3">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isFrench ? "Inscrit avec succès !" : "Successfully subscribed!"}</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-2.5">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={isFrench ? "Adresse courriel" : "Email"}
                    className="w-full border border-neutral-300 bg-white px-3.5 py-2.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-maple focus:outline-none transition-colors text-center"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    className="w-full bg-[#111111] hover:bg-maple text-white font-montserrat text-[10.5px] font-bold tracking-[0.22em] py-3 uppercase transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {subscribing ? (isFrench ? "ENVOI..." : "SENDING...") : (isFrench ? "S'ABONNER" : "SUBSCRIBE")}
                  </button>
                </form>
              )}
            </div>

            {/* 3. DON'T MISS (TRENDING POSTS) */}
            <div>
              <p className="font-montserrat text-[10.5px] font-bold uppercase tracking-[0.28em] text-neutral-400 text-center mb-5">
                {isFrench ? "À NE PAS MANQUER" : "DON'T MISS"}
              </p>
              <div className="flex flex-col gap-4">
                {TRENDING_SIDEBAR_POSTS.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/blog/${item.slug}`}
                    className="group flex items-center gap-3.5 transition-colors"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 object-cover shrink-0 bg-neutral-100"
                    />
                    <div className="flex flex-col">
                      <h4 className="font-serif text-xs sm:text-sm font-normal text-[#1a1a1a] group-hover:text-maple transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h4>
                      <span className="font-montserrat text-[9px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
                        {item.date}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 4. PARTNERS / ADS BANNER */}
            <div>
              <p className="font-montserrat text-[9.5px] font-bold uppercase tracking-[0.28em] text-neutral-400 text-center mb-3">
                {isFrench ? "PARTENAIRES / ANNONCES" : "PARTNERS / ADS"}
              </p>
              <Link
                to="/programs"
                className="group relative block overflow-hidden aspect-[4/5] bg-neutral-900 shadow-sm"
              >
                <img
                  src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80"
                  alt="Program Banner"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-60"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                  <span className="font-montserrat text-[9px] font-bold uppercase tracking-[0.25em] text-maple mb-1">
                    COHORTE 2026
                  </span>
                  <h4 className="font-serif text-2xl font-normal leading-tight mb-2">
                    50% OFF<br />
                    <span className="font-light italic text-lg">Bourse Mentorale</span>
                  </h4>
                  <p className="font-sans text-[11px] text-white/80 line-clamp-2 mb-3">
                    Postulez à nos programmes structurants pour propulser votre entreprise sociale.
                  </p>
                  <span className="inline-flex items-center gap-1 font-montserrat text-[10px] font-bold uppercase tracking-[0.2em] text-maple group-hover:text-white transition-colors">
                    <span>En savoir plus</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </div>

            {/* 5. CATEGORIES LIST WITH COUNTS */}
            <div>
              <p className="font-montserrat text-[10.5px] font-bold uppercase tracking-[0.28em] text-neutral-400 text-center mb-4">
                {isFrench ? "CATÉGORIES" : "CATEGORIES"}
              </p>
              <ul className="flex flex-col divide-y divide-neutral-200/80 text-xs font-medium">
                {EDITORIAL_CATEGORIES.filter((c) => c.name !== "All").map((c) => (
                  <li key={c.name}>
                    <button
                      onClick={() => setSelectedCategory(c.name)}
                      className="w-full py-2.5 flex items-center justify-between text-neutral-700 hover:text-maple transition-colors"
                    >
                      <span className="font-serif text-sm">{c.name}</span>
                      <span className="font-sans text-[11px] text-neutral-400">({c.count})</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* 6. NOW IN SHOP / EN VEDETTE */}
            <div>
              <p className="font-montserrat text-[9.5px] font-bold uppercase tracking-[0.28em] text-neutral-400 text-center mb-3">
                {isFrench ? "EN CE MOMENT" : "NOW IN SHOP"}
              </p>
              <Link
                to="/programs"
                className="group flex flex-col items-center text-center border border-neutral-200/80 p-5 bg-[#FAFAFA] hover:border-neutral-400 transition-colors"
              >
                <div className="w-32 h-44 overflow-hidden bg-white mb-3 shadow-xs">
                  <img
                    src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"
                    alt="Guide de l'impact"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h5 className="font-serif text-sm font-normal text-[#1a1a1a] group-hover:text-maple transition-colors max-w-[200px]">
                  Guide de l'Impact Entrepreneurial & Transition Numérique
                </h5>
                <span className="font-montserrat text-[11px] font-bold text-neutral-500 mt-1.5">
                  Accès Libre • PDF
                </span>
              </Link>
            </div>

          </aside>

        </div>

      </div>
    </div>
  );
}
