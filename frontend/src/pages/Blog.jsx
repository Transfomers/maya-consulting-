import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { Reveal } from "@/components/motion";
import { ArrowRight, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";

export default function Blog() {
  const { lang } = useLang();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const isFrench = lang === "fr";
  const isArabic = lang === "ar";

  const formatPostDate = (dateStr) => {
    if (!dateStr) return isFrench ? "RÉCENT" : "RECENT";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return isFrench ? "RÉCENT" : "RECENT";
      const locale = isFrench ? "fr-CA" : isArabic ? "ar" : "en-US";
      return d.toLocaleDateString(locale, { day: "numeric", month: "short" }).toUpperCase();
    } catch {
      return isFrench ? "RÉCENT" : "RECENT";
    }
  };

  useEffect(() => {
    const fetchApiPosts = async () => {
      setLoading(true);
      try {
        const res = await api.get("/posts");
        const pub = (res.data || []).filter((p) => p.status === "published");

        const formatted = pub.map((p, idx) => {
          const trans =
            (p.translations || []).find((tr) => tr.language === lang) ||
            (p.translations || []).find((tr) => tr.language === "fr") ||
            p.translations?.[0] ||
            {};
          const transFr = (p.translations || []).find((tr) => tr.language === "fr");
          const transEn = (p.translations || []).find((tr) => tr.language === "en");
          const transAr = (p.translations || []).find((tr) => tr.language === "ar");

          const defaultImages = [
            "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80"
          ];

          return {
            id: p.id,
            slug: p.slug,
            title: trans.title || p.slug,
            titleEn: transEn?.title || trans.title || p.slug,
            titleFr: transFr?.title || trans.title || p.slug,
            titleAr: transAr?.title || trans.title || p.slug,
            excerpt: trans.excerpt || "",
            excerptEn: transEn?.excerpt || trans.excerpt || "",
            excerptFr: transFr?.excerpt || trans.excerpt || "",
            excerptAr: transAr?.excerpt || trans.excerpt || "",
            category: p.category?.name || "Communauté",
            categorySlug: p.category?.slug || "",
            author: p.author_name || "Murielle A. & Équipe éditoriale",
            date: formatPostDate(p.published_at || p.created_at),
            image: p.featured_image?.url || p.featured_image || defaultImages[idx % defaultImages.length],
            ratio: idx % 2 === 0 ? "aspect-[3/4]" : "aspect-[4/3]"
          };
        });

        setPosts(formatted);
      } catch (err) {
        console.error("Error fetching posts exclusively from backend:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApiPosts();
  }, [lang]);

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

  // Derive dynamic categories with counts from backend posts
  const categoryCounts = posts.reduce((acc, p) => {
    const cat = p.category || "Communauté";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryList = ["All", ...Object.keys(categoryCounts)];

  const filteredPosts = posts.filter((post) => {
    const title = getPostTitle(post);
    const excerpt = getPostExcerpt(post);
    const cat = (post.category || "").toLowerCase();
    const matchesCategory =
      selectedCategory === "All" ||
      cat.includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const heroPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);
  const trendingPosts = posts.slice(0, 4);

  return (
    <div data-testid="blog-page" className="min-h-screen bg-white text-[#1a1a1a] pb-32 pt-28 antialiased">
      <div className="mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-12">

        {/* Minimal Search & Filter Bar */}
        <div className="mb-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
            <span className="font-montserrat text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mr-2 shrink-0">
              {isFrench ? "CATÉGORIES :" : isArabic ? "الفئات:" : "CATEGORIES:"}
            </span>
            {categoryList.map((catName) => {
              const count = catName === "All" ? posts.length : categoryCounts[catName];
              const label = catName === "All" ? (isFrench ? "Toutes" : isArabic ? "الكل" : "All") : catName;
              return (
                <button
                  key={catName}
                  onClick={() => setSelectedCategory(catName)}
                  className={`font-montserrat text-[11px] font-bold uppercase tracking-wider px-3 py-1 transition-all ${
                    selectedCategory === catName
                      ? "bg-[#111111] text-white shadow-xs"
                      : "text-neutral-500 hover:text-maple"
                  }`}
                >
                  {label} {count !== undefined && <span className="opacity-60 text-[10px]">({count})</span>}
                </button>
              );
            })}
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

            {loading ? (
              <div className="py-24 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-[#111111] border-r-transparent align-[-0.125em]" />
                <p className="mt-4 font-montserrat text-xs uppercase tracking-widest text-neutral-400">
                  {isFrench ? "Chargement des publications..." : "Loading stories..."}
                </p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-neutral-200 p-10 bg-[#FAFAFA]">
                <h3 className="font-serif text-2xl text-neutral-700">
                  {isFrench ? "Aucun article publié pour le moment" : "No published articles found"}
                </h3>
                <p className="font-sans text-xs text-neutral-500 mt-2 max-w-md mx-auto">
                  {selectedCategory !== "All" || searchQuery
                    ? (isFrench ? "Aucun résultat ne correspond à votre filtre de recherche." : "No results match your active search filter.")
                    : (isFrench ? "Les nouveaux articles rédigés dans le tableau de bord apparaîtront ici." : "New articles written in the CMS dashboard will appear here.")}
                </p>
                {(selectedCategory !== "All" || searchQuery) && (
                  <button
                    onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                    className="mt-4 font-montserrat text-xs font-bold uppercase tracking-wider text-maple hover:underline"
                  >
                    {isFrench ? "Réinitialiser les filtres" : "Reset filters"}
                  </button>
                )}
              </div>
            ) : (
              <>
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
                          {heroPost.date} • {heroPost.category}
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
                {gridPosts.length > 0 && (
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
                              {post.date} • {post.category}
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
                )}
              </>
            )}

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

            {/* 2. NEWSLETTER BOX */}
            <NewsletterSubscribe variant="card" source="blog_sidebar" className="shadow-xs" />

            {/* 3. DON'T MISS (TRENDING POSTS FROM BACKEND) */}
            {trendingPosts.length > 0 && (
              <div>
                <p className="font-montserrat text-[10.5px] font-bold uppercase tracking-[0.28em] text-neutral-400 text-center mb-5">
                  {isFrench ? "À NE PAS MANQUER" : "DON'T MISS"}
                </p>
                <div className="flex flex-col gap-4">
                  {trendingPosts.map((item) => (
                    <Link
                      key={item.slug}
                      to={`/blog/${item.slug}`}
                      className="group flex items-center gap-3.5 transition-colors"
                    >
                      <img
                        src={item.image}
                        alt={getPostTitle(item)}
                        className="w-16 h-16 object-cover shrink-0 bg-neutral-100"
                      />
                      <div className="flex flex-col">
                        <h4 className="font-serif text-xs sm:text-sm font-normal text-[#1a1a1a] group-hover:text-maple transition-colors leading-snug line-clamp-2">
                          {getPostTitle(item)}
                        </h4>
                        <span className="font-montserrat text-[9.5px] font-bold uppercase tracking-wider text-neutral-400 mt-1">
                          {item.date} • {item.category}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PARTNERS / ADS */}
            <div>
              <p className="font-montserrat text-[10.5px] font-bold uppercase tracking-[0.28em] text-neutral-400 text-center mb-3">
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

            {/* 5. CATEGORIES LIST WITH REAL COUNTS */}
            {Object.keys(categoryCounts).length > 0 && (
              <div>
                <p className="font-montserrat text-[10.5px] font-bold uppercase tracking-[0.28em] text-neutral-400 text-center mb-4">
                  {isFrench ? "CATÉGORIES" : "CATEGORIES"}
                </p>
                <ul className="flex flex-col divide-y divide-neutral-200/80 text-xs font-medium">
                  {Object.entries(categoryCounts).map(([catName, count]) => (
                    <li key={catName}>
                      <button
                        onClick={() => setSelectedCategory(catName)}
                        className="w-full py-2.5 flex items-center justify-between text-neutral-700 hover:text-maple transition-colors"
                      >
                        <span className="font-serif text-sm">{catName}</span>
                        <span className="font-sans text-[11px] text-neutral-400">({count})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 6. NOW IN SHOP / EN VEDETTE */}
            <div>
              <p className="font-montserrat text-[9.5px] font-bold uppercase tracking-[0.28em] text-neutral-400 text-center mb-3">
                {isFrench ? "EN CE MOMENT" : "NOW IN SHOP"}
              </p>
              <Link
                to="/programs#resources"
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

      {/* Full Width Newsletter Strip */}
      <NewsletterSubscribe variant="banner" source="blog_landing" />
    </div>
  );
}
