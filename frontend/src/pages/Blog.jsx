import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/lib/i18n";
import api from "@/lib/api";
import { Reveal } from "@/components/motion";
import PageHero from "@/components/PageHero";

export default function Blog() {
  const { lang, t } = useLang();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // We reuse the admin posts endpoint for now, but in a real app
        // there should be a public endpoint that only returns 'published' posts
        const res = await api.get("/v1/admin/posts");
        setPosts((res.data || []).filter(p => p.status === 'published'));
      } catch (err) {
        console.error("Failed to load blog posts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const getTranslation = (post) => {
    if (!post.translations || post.translations.length === 0) return { title: post.slug, excerpt: '' };
    const localized = post.translations.find(t => t.language === lang);
    return localized || post.translations[0]; // fallback
  };

  return (
    <div className="bg-bone min-h-screen pb-24" data-testid="blog-page">
      <PageHero
        title={t.nav.newsEvents}
        subtitle="Latest insights, updates, and impact stories."
        color="forest"
      />
      
      <div className="mx-auto max-w-[1600px] px-5 pt-12 md:px-10">
        {loading ? (
          <div className="py-20 text-center text-sage font-heading uppercase tracking-widest text-sm font-bold">
            Loading articles...
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-sage">
            No articles found.
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => {
              const trans = getTranslation(post);
              return (
                <Reveal key={post.id} delay={i * 0.1}>
                  <Link to={`/news/${post.slug}`} className="group block bg-white border border-forest/15 hover:border-forest transition-colors h-full flex flex-col">
                    <div className="aspect-[16/9] w-full bg-forest/5 flex items-center justify-center overflow-hidden">
                      {/* Placeholder for featured image */}
                      <span className="text-forest/20 font-serif italic text-2xl group-hover:scale-110 transition-transform duration-700">CAP</span>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-sage mb-3">
                        <span>{new Date(post.published_at).toLocaleDateString()}</span>
                        {/* <span>•</span><span>Category</span> */}
                      </div>
                      <h3 className="font-heading text-xl font-bold tracking-tight text-forest mb-3 group-hover:text-maple transition-colors">
                        {trans.title}
                      </h3>
                      <p className="text-sage text-sm leading-relaxed mb-6 flex-1">
                        {trans.excerpt}
                      </p>
                      <span className="text-xs font-bold uppercase tracking-[0.15em] text-forest group-hover:text-maple transition-colors flex items-center gap-2 mt-auto">
                        Read More <span className="text-lg leading-none transform group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
