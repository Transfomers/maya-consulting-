import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/motion";
import { STORIES, STORIES_FR, STORIES_AR } from "@/lib/content";
import { useLang } from "@/lib/i18n";



const ImpactStories = () => {
  const { lang, t } = useLang();
  const currentStories = lang === "fr" ? STORIES_FR : lang === "ar" ? STORIES_AR : STORIES;
  return (
  <div data-testid="impact-stories-page">
    <PageHero
      testId="stories-hero"
      eyebrow={t.stories.eyebrow}
      lines={[
        <>{t.stories.h1a}</>,
        <>
          <span className="font-serif font-medium italic text-maple">{t.stories.h1accent}</span>
        </>,
      ]}
      intro={t.stories.intro}
    />

    {currentStories.map((s, i) => (
      <section
        key={s.id}
        id={s.id}
        className={`border-b border-forest/15 ${i % 2 === 1 ? "bg-white" : ""}`}
        data-testid={`story-section-${s.id}`}
      >
        <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Reveal>
                <span className="font-serif text-7xl italic leading-none text-maple md:text-8xl">0{i + 1}</span>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-sage">{s.place}</p>
                <h2 className="mt-3 font-heading text-3xl font-black tracking-tight text-forest md:text-4xl lg:text-5xl">
                  {s.title}
                </h2>
              </Reveal>
              <Reveal delay={0.15} y={40}>
                <div className="mt-8 overflow-hidden border border-forest/20">
                  <img src={s.image} alt={s.title} className="aspect-[4/3] w-full object-cover" data-testid={`story-image-${s.id}`} />
                </div>
              </Reveal>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <div className="border-t border-forest/15">
                {t.stories.parts.map(([label, key], j) => (
                  <Reveal key={key} delay={j * 0.08} y={24}>
                    <div className="grid gap-3 border-b border-forest/15 py-6 md:grid-cols-12 md:py-7" data-testid={`story-${s.id}-${key}`}>
                      <span className="text-xs font-bold uppercase tracking-[0.25em] text-maple md:col-span-3">
                        {label}
                      </span>
                      <p className="text-sm leading-relaxed text-ink md:col-span-9 md:text-base">{s[key]}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    ))}

    <section className="bg-forest text-bone" data-testid="stories-cta-section">
      <div className="mx-auto max-w-[1600px] px-5 py-20 text-center md:px-10 md:py-28">
        <Reveal>
          <h2 className="mx-auto max-w-3xl font-heading text-3xl font-black tracking-tight md:text-5xl">
            {t.stories.ctaTitle}
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="/programs#apply"
              data-testid="stories-cta-apply"
              className="inline-flex items-center gap-2 bg-bone px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-maple hover:text-bone"
            >
              Apply to a Program
            </a>
            <a
              href="/membership"
              data-testid="stories-cta-membership"
              className="inline-flex items-center gap-2 border border-bone/40 px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-bone hover:text-forest"
            >
              Join the Ecosystem
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  </div>
  );
};

export default ImpactStories;
