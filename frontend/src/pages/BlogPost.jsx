import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { Reveal } from "@/components/motion";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function BlogPost() {
  const { slug } = useParams();
  const { lang, t } = useLang();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await api.get(`/v1/admin/posts`);
        // In reality, this should be a public endpoint optimized by slug
        const found = (res.data || []).find(p => p.slug === slug || p.translations.some(t => t.slug === slug));
        setPost(found);
      } catch (err) {
        console.error("Failed to load blog post", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-bone flex items-center justify-center text-sage font-heading uppercase tracking-widest text-sm font-bold">Loading...</div>;
  }

  if (!post) {
    return <div className="min-h-screen bg-bone flex items-center justify-center text-forest text-2xl font-heading font-black">Article not found</div>;
  }

  const getTranslation = (p) => {
    if (!p.translations || p.translations.length === 0) return { title: p.slug, excerpt: '', content: '' };
    const localized = p.translations.find(t => t.language === lang);
    return localized || p.translations[0];
  };

  const trans = getTranslation(post);
  
  // SEO Meta
  const title = trans.seo_title || trans.title || "CAP Entrepreneurs Article";
  const description = trans.seo_description || trans.excerpt || "Read our latest article.";
  const canonicalUrl = trans.canonical_url || `https://capentrepreneurs.org/${lang}/news/${trans.slug || post.slug}`;
  
  const robots = `${trans.allow_index ? 'index' : 'noindex'}, ${trans.allow_follow ? 'follow' : 'nofollow'}`;

  // Structured Data (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "url": canonicalUrl,
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.updated_at || post.created_at,
    "author": {
      "@type": "Organization",
      "name": "CAP Entrepreneurs"
    },
    "publisher": {
      "@type": "Organization",
      "name": "CAP Entrepreneurs",
      "logo": {
        "@type": "ImageObject",
        "url": "https://capentrepreneurs.org/logo.png"
      }
    }
  };

  return (
    <article className="bg-bone min-h-screen pb-32 pt-32" data-testid="blog-post-page">
      <Helmet>
        <title>{title} | CAP Entrepreneurs</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content={robots} />
        
        {/* Open Graph */}
        <meta property="og:title" content={trans.og_title || title} />
        <meta property="og:description" content={trans.og_description || description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        {/* If we have og_image_id, we should theoretically resolve it, for now we leave it standard */}
        
        {/* Hreflang links for multilingual SEO */}
        {post.translations.map(t => (
          <link key={t.language} rel="alternate" hrefLang={t.language} href={`https://capentrepreneurs.org/${t.language}/news/${t.slug || post.slug}`} />
        ))}
        
        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="mx-auto max-w-[800px] px-5">
        <Reveal>
          <Link to="/news" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sage hover:text-forest transition-colors mb-12">
            <ArrowLeft className="h-4 w-4" /> Back to News
          </Link>
          
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-maple mb-6">
            <span>{new Date(post.published_at || post.created_at).toLocaleDateString()}</span>
          </div>
          
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-forest mb-8 leading-tight">
            {trans.title}
          </h1>
        </Reveal>
      </div>

      <Reveal delay={0.2}>
        <div className="mx-auto max-w-[1000px] px-5 my-12">
          {post.featured_image_id ? (
             <div className="w-full bg-forest/5 flex items-center justify-center border border-forest/15 overflow-hidden">
               {/* Note: the actual image URL should be returned in the post API response. For now we placeholder if ID exists */}
               <img src={`/api/v1/admin/media/${post.featured_image_id}`} alt="Featured" className="w-full h-auto object-cover opacity-0 transition-opacity duration-500" onLoad={(e) => e.target.style.opacity = 1} />
             </div>
          ) : (
            <div className="aspect-[21/9] w-full bg-forest/5 flex items-center justify-center border border-forest/15">
              <span className="text-forest/20 font-serif italic text-4xl">Featured Image</span>
            </div>
          )}
        </div>
      </Reveal>

      <div className="mx-auto max-w-[800px] px-5">
        <Reveal delay={0.3}>
          <div 
            className="prose prose-lg prose-headings:font-heading prose-headings:font-black prose-headings:tracking-tight prose-headings:text-forest prose-p:text-sage prose-a:text-maple prose-a:no-underline hover:prose-a:underline max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: trans.content }}
          />
        </Reveal>
        
        {post.references && post.references.length > 0 && (
          <Reveal delay={0.4}>
            <div className="mt-16 pt-8 border-t border-forest/15">
              <h3 className="font-heading text-xl font-bold text-forest mb-6">References</h3>
              <ul className="space-y-4">
                {post.references.map((ref, idx) => (
                  <li key={idx} className="text-sm text-sage flex flex-col sm:flex-row sm:gap-2">
                    <span className="font-bold text-forest">[{idx + 1}]</span>
                    <div>
                      {ref.author && <span>{ref.author}. </span>}
                      {ref.url ? (
                        <a href={ref.url} target="_blank" rel="noopener noreferrer" className="italic text-maple hover:underline">{ref.title}</a>
                      ) : (
                        <span className="italic">{ref.title}</span>
                      )}
                      {ref.publisher && <span>. {ref.publisher}</span>}
                      {ref.publication_date && <span> ({ref.publication_date})</span>}
                      {ref.description && <p className="mt-1 text-xs">{ref.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      </div>
    </article>
  );
}
