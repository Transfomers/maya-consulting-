import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { Reveal } from "@/components/motion";
import { ArrowLeft, Sparkles, Loader2, Globe, Languages, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { IMAGES } from "@/lib/content";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { translateBlogPost } from "@/lib/translator";

export default function BlogPost() {
  const { slug } = useParams();
  const { lang, setLang } = useLang();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-translation states
  const [activeTranslation, setActiveTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isAutoTranslated, setIsAutoTranslated] = useState(false);
  const [originalLang, setOriginalLang] = useState("fr");

  const isFrench = lang === "fr";
  const isArabic = lang === "ar";

  useEffect(() => {
    let isCancelled = false;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/posts/${slug}`);
        if (!isCancelled) {
          setPost(res.data);
          resolveTranslation(res.data, lang);
        }
      } catch (err) {
        console.warn("Post not found on backend:", err);
        if (!isCancelled) setPost(null);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchPost();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // When language changes, update or perform instant translation
  useEffect(() => {
    if (post) {
      resolveTranslation(post, lang);
    }
  }, [lang, post]);

  const resolveTranslation = async (p, targetLang) => {
    if (!p) return;

    setShowOriginal(false);

    // 1. Check if a human translation exists for targetLang
    const native = (p.translations || []).find(
      (t) => t.language === targetLang && (t.title || t.content)
    );

    // Base fallback translation
    const fallback =
      (p.translations || []).find((t) => t.language === "fr" && (t.title || t.content)) ||
      (p.translations || []).find((t) => t.language === "en" && (t.title || t.content)) ||
      (p.translations || [])[0] || {
        title: p.title || p.slug,
        excerpt: p.excerpt || "",
        content: p.content || "",
        language: "fr",
      };

    setOriginalLang(fallback.language || "fr");

    if (native) {
      setActiveTranslation(native);
      setIsAutoTranslated(false);
      setIsTranslating(false);
      return;
    }

    // 2. No native translation: show fallback immediately, then trigger instant translation
    setActiveTranslation(fallback);
    setIsAutoTranslated(true);
    setIsTranslating(true);

    try {
      const translated = await translateBlogPost(p, targetLang, fallback.language);
      if (translated) {
        setActiveTranslation(translated);
      }
    } catch (e) {
      console.warn("Instant translation failed:", e);
    } finally {
      setIsTranslating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-forest/60 font-montserrat uppercase tracking-widest text-sm font-bold">
        {isFrench ? "Chargement de l'article..." : isArabic ? "جاري تحميل المقال..." : "Loading story..."}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center font-montserrat px-4 text-center">
        <h1 className="text-3xl font-black text-forest">
          {isFrench ? "Article non trouvé" : isArabic ? "المقال غير موجود" : "Article Not Found"}
        </h1>
        <p className="mt-2 text-sm text-forest/60 max-w-md">
          {isFrench
            ? "Cet article n'est pas disponible ou a été archivé."
            : "This article is either not published or has been moved."}
        </p>
        <Link to="/blog" className="mt-6 text-maple font-bold hover:underline uppercase tracking-wider text-xs">
          {isFrench ? "← Retourner à la liste des articles" : "← Back to all articles"}
        </Link>
      </div>
    );
  }

  // Get original fallback if user toggles "View Original"
  const originalTranslation =
    (post.translations || []).find((t) => t.language === originalLang) ||
    (post.translations || [])[0] ||
    activeTranslation;

  const currentContent = showOriginal ? originalTranslation : (activeTranslation || originalTranslation);

  const title = currentContent?.seo_title || currentContent?.title || post.slug || "CAP Entrepreneurs Story";
  const description = currentContent?.seo_description || currentContent?.excerpt || "Read our latest article.";
  const canonicalUrl = currentContent?.canonical_url || `https://capentrepreneurs.org/${lang}/blog/${post.slug}`;
  const displayImage = post.featured_image?.url || post.image || IMAGES.collaboration;
  const categoryName = post.category?.name || (isArabic ? "مجتمع" : "Communauté");
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString(isFrench ? "fr-CA" : isArabic ? "ar-EG" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const isRtl = isArabic && !showOriginal;

  return (
    <article
      className="min-h-screen bg-[#FAF9F6] font-montserrat text-forest pb-32 pt-28 antialiased"
      data-testid="blog-post-page"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Helmet>
        <title>{title} | CAP Entrepreneurs</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      {/* Header Container */}
      <div className="mx-auto max-w-[900px] px-5">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-forest/70 hover:bg-forest hover:text-white transition-all shadow-sm"
            >
              <ArrowLeft className={`h-3.5 w-3.5 ${isRtl ? "rotate-180" : ""}`} />
              <span>{isFrench ? "Retour aux articles" : isArabic ? "العودة إلى المقالات" : "Back to Blog"}</span>
            </Link>

            {/* In-Article Instant Language Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-forest/15 rounded-full px-3 py-1 shadow-xs text-xs font-semibold">
              <Languages className="h-3.5 w-3.5 text-forest/60 mr-1" />
              {[
                { code: "fr", label: "FR" },
                { code: "en", label: "EN" },
                { code: "ar", label: "عربي" },
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLang(item.code)}
                  className={`px-2 py-0.5 rounded-full transition-all ${
                    lang === item.code
                      ? "bg-forest text-white font-bold"
                      : "text-forest/60 hover:text-forest"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instant Translation Banner */}
          {isAutoTranslated && (
            <div className="mb-6 rounded-xl border border-maple/25 bg-amber-500/5 p-4 text-xs shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-full bg-maple/10 text-maple">
                    {isTranslating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-maple" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-maple" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-forest">
                      {isTranslating
                        ? isFrench
                          ? "Traduction instantanée en cours..."
                          : isArabic
                          ? "جاري الترجمة الفورية عبر الإنترنت..."
                          : "Instant online translation in progress..."
                        : isFrench
                        ? "Article traduit automatiquement en Français via le traducteur en ligne."
                        : isArabic
                        ? "تمت ترجمة هذا المقال فورياً إلى العربية بواسطة المترجم الفوري عبر الإنترنت."
                        : "This article was translated into English using our online instant translator."}
                    </p>
                    <p className="text-[11px] text-forest/60">
                      {isFrench
                        ? `Langue d'origine : ${originalLang.toUpperCase()}`
                        : isArabic
                        ? `اللغة الأصلية للمقال: ${originalLang.toUpperCase()}`
                        : `Original article language: ${originalLang.toUpperCase()}`}
                    </p>
                  </div>
                </div>

                {!isTranslating && (
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-maple/30 bg-white px-3 py-1.5 font-bold uppercase tracking-wider text-[11px] text-maple hover:bg-maple hover:text-white transition-all self-start sm:self-auto shadow-2xs"
                  >
                    <Globe className="h-3 w-3" />
                    <span>
                      {showOriginal
                        ? isFrench
                          ? "Afficher la traduction"
                          : isArabic
                          ? "عرض الترجمة"
                          : "Show Translation"
                        : isFrench
                        ? `Voir l'original (${originalLang.toUpperCase()})`
                        : isArabic
                        ? `عرض النص الأصلي (${originalLang.toUpperCase()})`
                        : `View Original (${originalLang.toUpperCase()})`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="rounded-full bg-maple/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-maple">
              {categoryName}
            </span>
            {publishedDate && (
              <span className="text-xs font-medium text-forest/50">
                {publishedDate}
              </span>
            )}
            <span className="text-xs text-forest/30">•</span>
            <span className="text-xs font-medium text-forest/50">
              5 min read
            </span>
            {isAutoTranslated && !isTranslating && (
              <span className="inline-flex items-center gap-1 rounded-full bg-forest/5 border border-forest/10 px-2.5 py-0.5 text-[10px] font-semibold text-forest/70">
                <Sparkles className="h-2.5 w-2.5 text-maple" />
                {isFrench ? "Traduit" : isArabic ? "مترجم" : "Translated"}
              </span>
            )}
          </div>

          <h1 className={`font-serif text-3xl md:text-5xl font-normal leading-tight tracking-tight text-forest mb-8 ${isRtl ? "text-right" : "text-left"}`}>
            {currentContent?.title}
          </h1>

          {/* Author Block */}
          <div className="flex items-center gap-4 border-y border-forest/10 py-5">
            <img
              src="/assets/murielle-portrait.webp"
              alt={post.author_name || "Équipe CAP"}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-forest/10"
            />
            <div>
              <p className="font-bold text-sm text-forest">
                {isFrench ? "Rédigé par" : isArabic ? "كتب بواسطة" : "Written by"} {post.author_name || "Équipe CAP"}
              </p>
              <p className="text-xs text-forest/60">
                {isArabic ? "كاب رواد الأعمال • المنظومة التضامنية" : "Cap Entrepreneurs • Écosystème Solidaire"}
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Cover Image */}
      <Reveal delay={0.15}>
        <div className="mx-auto max-w-[1100px] px-5 my-10">
          <div className="overflow-hidden rounded-2xl border border-forest/10 shadow-lg bg-forest/5 aspect-[21/10]">
            <img
              src={displayImage}
              alt={currentContent?.title || post.slug}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </Reveal>

      {/* Article Content */}
      <div className="mx-auto max-w-[840px] px-5">
        <Reveal delay={0.25}>
          <div
            className={`prose prose-lg max-w-none text-forest/85 leading-relaxed font-sans prose-headings:font-serif prose-headings:font-normal prose-headings:tracking-tight prose-headings:text-forest prose-a:text-maple prose-a:font-semibold hover:prose-a:underline prose-blockquote:border-maple prose-blockquote:text-forest prose-img:rounded-2xl prose-img:shadow-md ${
              isRtl ? "text-right" : "text-left"
            }`}
            dangerouslySetInnerHTML={{ __html: currentContent?.content || "" }}
          />
        </Reveal>

        {/* Article Newsletter Subscription */}
        <Reveal delay={0.3}>
          <div className="my-12">
            <NewsletterSubscribe variant="card" source="blog_post" />
          </div>
        </Reveal>

        {/* Share & Back Bottom Bar */}
        <Reveal delay={0.35}>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-forest/15 pt-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-forest hover:text-maple transition-colors"
            >
              <ArrowLeft className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
              <span>{isFrench ? "Explorer plus d'articles" : isArabic ? "استكشف المزيد من المقالات" : "Explore More Articles"}</span>
            </Link>

            <Link
              to="/join"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-maple transition-all"
            >
              <span>{isFrench ? "Rejoindre l'écosystème" : isArabic ? "انضم إلى المنظومة" : "Join Our Ecosystem"}</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </article>
  );
}
