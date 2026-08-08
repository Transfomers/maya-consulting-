import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/motion";
import { useLang } from "@/lib/i18n";
import { ExternalLink, BookOpen, HeartHandshake } from "lucide-react";

const FEATURED_ARTICLE = {
  category: "Featured Article",
  title: "Building ecosystems that last: A guide for modern nonprofits",
  excerpt: "Discover the core principles of sustainable ecosystem building and how nonprofits can shift from isolated projects to long-term collaborative networks that drive real economic impact.",
  image: "https://placehold.co/1200x800/e0f2fe/0f3b5a?text=Featured+Article",
  authorName: "Sarah Jenkins",
  authorImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  date: "08/10/26",
};

const LATEST_NEWS = [
  {
    date: "August 2026",
    category: "Program Launch",
    title: "Marketplace Lab opens applications for its fall cohort",
    desc: "Entrepreneurs ready to move from idea to market can now apply for the fall intake, including eligibility for the international exposure scholarship.",
  },
  {
    date: "September 2026",
    category: "Community Initiative",
    title: "CAP Executive governance intensive comes to Atlantic Canada",
    desc: "A regional edition of our nonprofit leadership program, co-hosted with local economic development partners.",
  },
  {
    date: "October 2026",
    category: "International Mission",
    title: "First CAP Global Mobility exchange delegation announced",
    desc: "Selected entrepreneurs and volunteers will join a collaborative mission with international partner organizations this fall.",
  },
  {
    date: "November 2026",
    category: "Partner Announcement",
    title: "New technology partnership to power digital learning",
    desc: "A technology partner joins the ecosystem to make entrepreneurial education more accessible, measurable and scalable.",
  },
  {
    date: "December 2026",
    category: "Funding Opportunity",
    title: "Year-end giving campaign fuels participant scholarships",
    desc: "Every contribution supports access to education, mentoring and professional exposure for program participants.",
  },
  {
    date: "January 2027",
    category: "Annual Report",
    title: "CAP Entrepreneurs publishes its first annual impact report",
    desc: "A transparent look at our programs, partnerships and the measurable community impact of our first year.",
  },
];

const BLOG_POSTS = [
  {
    category: "Blog",
    title: "Calls to action to shape the future of nonprofit leadership",
    image: "https://placehold.co/600x400/f8fafc/0f3b5a?text=Leadership",
    authorName: "Erin Kang",
    authorImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Erin",
    date: "07/16/26",
  },
  {
    category: "Blog",
    title: "What's in the numbers? The nonprofit impact story.",
    image: "https://placehold.co/600x400/e0f2fe/0f3b5a?text=Impact+Story",
    authorName: "Kavita",
    authorImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kavita",
    date: "07/15/26",
  },
  {
    category: "Blog",
    title: "When funding equity is a fad",
    image: "https://placehold.co/600x400/1e293b/ffffff?text=Funding+Equity",
    authorName: "Ebony Davitt",
    authorImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ebony",
    date: "07/15/26",
  },
  {
    category: "Blog",
    title: "Can nonprofits split up their board elections and financial statements?",
    image: "https://placehold.co/600x400/f8fafc/0f3b5a?text=Board+Elections",
    authorName: "Benjamin",
    authorImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Benjamin",
    date: "07/14/26",
  },
];

const Blog = () => {
  const { t } = useLang();

  return (
    <div data-testid="blog-page">
      <PageHero
        testId="blog-hero"
        eyebrow={t.blog.eyebrow}
        lines={[
          <>{t.blog.h1a} </>,
          <>
            <span className="font-serif font-medium italic text-maple">{t.blog.h1accent}</span>
          </>,
        ]}
        intro={t.blog.intro}
      />

      {/* Featured Article Section */}
      <section className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16">
        <Reveal>
          <a href="#featured" className="group relative grid overflow-hidden rounded-bl-[64px] rounded-br-2xl rounded-tl-2xl rounded-tr-[64px] bg-white shadow-sm border border-forest/10 transition-shadow hover:shadow-xl lg:grid-cols-2">
            {/* Image side */}
            <div className="relative h-64 w-full overflow-hidden lg:h-full lg:min-h-[500px]">
              <img 
                src={FEATURED_ARTICLE.image} 
                alt={FEATURED_ARTICLE.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            
            {/* Content side */}
            <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
              <div className="inline-block self-start rounded-full border border-maple px-4 py-1 text-xs font-bold text-maple">
                {FEATURED_ARTICLE.category}
              </div>
              
              <h2 className="mt-8 font-heading text-3xl font-black leading-tight text-[#0f3b5a] md:text-4xl lg:text-5xl">
                {FEATURED_ARTICLE.title}
              </h2>
              
              <p className="mt-6 text-lg leading-relaxed text-sage md:text-xl">
                {FEATURED_ARTICLE.excerpt}
              </p>
              
              <div className="mt-12 flex items-center gap-4 border-t border-forest/10 pt-6">
                <img 
                  src={FEATURED_ARTICLE.authorImg} 
                  alt={FEATURED_ARTICLE.authorName} 
                  className="h-12 w-12 rounded-full bg-gray-100 object-cover" 
                />
                <div>
                  <p className="font-bold text-forest">{FEATURED_ARTICLE.authorName}</p>
                  <p className="text-sm text-sage">{FEATURED_ARTICLE.date}</p>
                </div>
              </div>
            </div>
          </a>
        </Reveal>
      </section>

      <section className="bg-[#f2f2f2] px-5 py-24 md:px-10 md:py-32" data-testid="blog-posts-section">
        <div className="mx-auto max-w-[1600px]">
          <Reveal>
            <h2 className="mb-12 text-center font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
              Featured Stories
            </h2>
          </Reveal>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {BLOG_POSTS.map((post, i) => (
              <Reveal key={post.title} delay={i * 0.1}>
                <a
                  href="#read"
                  className="group flex h-[480px] flex-col justify-between rounded-bl-[48px] rounded-br-xl rounded-tl-xl rounded-tr-[48px] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div>
                    {/* Pill Tag */}
                    <div className="inline-block rounded-full border border-[#0f3b5a]/30 px-4 py-1 text-xs font-bold text-[#0f3b5a]">
                      {post.category}
                    </div>
                    
                    {/* Image Area */}
                    <div className="mt-4 h-32 w-full overflow-hidden rounded-bl-sm rounded-br-sm rounded-tl-sm rounded-tr-[24px]">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    </div>
                    
                    {/* Title */}
                    <h3 className="mt-6 font-heading text-lg font-bold leading-snug text-[#0f3b5a] md:text-xl">
                      {post.title}
                    </h3>
                  </div>
                  
                  {/* Footer */}
                  <div className="mt-6">
                    <div className="mb-4 h-px w-full bg-gray-200" />
                    <div className="flex items-center justify-between text-xs text-gray-500 sm:text-sm">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img 
                          src={post.authorImg} 
                          alt={post.authorName} 
                          className="h-7 w-7 rounded-full bg-gray-100 object-cover sm:h-8 sm:w-8" 
                        />
                        <span className="font-medium text-gray-700">{post.authorName}</span>
                      </div>
                      <span>{post.date}</span>
                    </div>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News Timeline */}
      <section className="mx-auto max-w-[1000px] px-5 py-24 md:px-10 md:py-32">
        <Reveal>
          <h2 className="mb-16 font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
            Latest news
          </h2>
        </Reveal>
        
        <div className="space-y-12">
          {LATEST_NEWS.map((news, i) => (
            <Reveal key={news.title} delay={i * 0.1}>
              <div className="flex flex-col gap-4 border-l-2 border-maple pl-6 md:flex-row md:gap-12 md:pl-8">
                <div className="shrink-0 md:w-48">
                  <p className="font-bold text-forest">{news.date}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-maple">{news.category}</p>
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold leading-snug text-[#0f3b5a] md:text-2xl">
                    {news.title}
                  </h3>
                  <p className="mt-3 text-sage md:text-lg">
                    {news.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-forest py-24 text-center text-white" data-testid="blog-cta">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal>
            <h2 className="font-heading text-3xl font-black md:text-5xl">
              Rejoignez notre communauté grandissante
            </h2>
            <p className="mt-6 text-lg text-white/80 md:text-xl">
              Entrepreneurs, innovateurs et leaders du monde entier.
            </p>
            <button className="mt-10 inline-flex items-center gap-2 bg-maple px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white hover:text-forest">
              S'inscrire
            </button>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Blog;
