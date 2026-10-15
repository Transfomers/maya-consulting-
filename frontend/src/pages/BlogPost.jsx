import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { Reveal } from "@/components/motion";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { IMAGES } from "@/lib/content";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";

export default function BlogPost() {
  const { slug } = useParams();
  const { lang } = useLang();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const isFrench = lang === "fr";
  const isArabic = lang === "ar";

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/posts/${slug}`);
        setPost(res.data);
      } catch (err) {
        console.warn("Post not found on backend:", err);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, lang]);

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

  const getTranslation = (p) => {
    if (!p.translations || p.translations.length === 0) return { title: p.title || p.slug, excerpt: "", content: p.content || "" };
    const localized = p.translations.find((t) => t.language === lang);
    return localized || p.translations.find((t) => t.language === "fr") || p.translations[0];
  };

  const trans = getTranslation(post);
  const title = trans.seo_title || trans.title || post.slug || "CAP Entrepreneurs Story";
  const description = trans.seo_description || trans.excerpt || "Read our latest article.";
  const canonicalUrl = trans.canonical_url || `https://capentrepreneurs.org/${lang}/blog/${post.slug}`;
  const displayImage = post.featured_image?.url || post.image || IMAGES.collaboration;
  const categoryName = post.category?.name || "Communauté";
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString(isFrench ? "fr-CA" : "en-US", { day: "numeric", month: "long", year: "numeric" })
    : "";

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
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{isFrench ? "Retour au blogue" : "Back to Blog"}</span>
          </Link>

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
          </div>

          <h1 className="font-serif text-3xl md:text-5xl font-normal leading-tight tracking-tight text-forest mb-8">
            {trans.title}
          </h1>

          {/* Author Block */}
          <div className="flex items-center gap-4 border-y border-forest/10 py-5">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
              alt={post.author_name || "Murielle & Équipe éditoriale"}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-forest/10"
            />
            <div>
              <p className="font-bold text-sm text-forest">
                {isFrench ? "Rédigé par" : "Written by"} {post.author_name || "Murielle & Équipe éditoriale"}
              </p>
              <p className="text-xs text-forest/60">Cap Entrepreneurs • Écosystème Solidaire</p>
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
            className="prose prose-lg max-w-none text-forest/85 leading-relaxed font-sans prose-headings:font-serif prose-headings:font-normal prose-headings:tracking-tight prose-headings:text-forest prose-a:text-maple prose-a:font-semibold hover:prose-a:underline prose-blockquote:border-maple prose-blockquote:text-forest prose-img:rounded-2xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: trans.content }}
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
              <ArrowLeft className="h-4 w-4" />
              <span>{isFrench ? "Explorer plus d'articles" : "Explore More Articles"}</span>
            </Link>

            <Link
              to="/join"
              className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-maple transition-all"
            >
              <span>{isFrench ? "Rejoindre l'écosystème" : "Join Our Ecosystem"}</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </article>
  );
}
