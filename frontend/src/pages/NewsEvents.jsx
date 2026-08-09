import { CalendarDays, ArrowUpRight } from "lucide-react";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/motion";
import { NEWS, NEWS_FR, NEWS_AR, EVENTS, EVENTS_FR, EVENTS_AR } from "@/lib/content";
import { useLang } from "@/lib/i18n";

const NewsEvents = () => {
  const { lang, t } = useLang();
  const currentNews = lang === "fr" ? NEWS_FR : lang === "ar" ? NEWS_AR : NEWS;
  const currentEvents = lang === "fr" ? EVENTS_FR : lang === "ar" ? EVENTS_AR : EVENTS;
  return (
  <div data-testid="news-events-page">
    <PageHero
      testId="news-hero"
      eyebrow={t.news.eyebrow}
      lines={[
        <>{t.news.h1a}</>,
        <>
          {t.news.h1pre && <span>{t.news.h1pre}</span>}<span className="font-serif font-medium italic text-maple">{t.news.h1accent}</span>{t.news.h1post}
        </>,
      ]}
      intro={t.news.intro}
    />

    <section className="border-b border-forest/15 bg-white" data-testid="events-section">
      <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
        <Reveal>
          <h2 className="font-heading text-3xl font-black tracking-tight text-forest md:text-5xl">{t.news.eventsTitle}</h2>
        </Reveal>
        <div className="mt-12 grid gap-px border border-forest/15 bg-forest/15 md:grid-cols-3">
          {currentEvents.map((e, i) => (
            <Reveal key={e.title} delay={i * 0.1} className="bg-white">
              <div className="flex h-full flex-col p-7 md:p-9" data-testid={`event-${i}`}>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-maple">
                  <CalendarDays className="h-4 w-4" />
                  {e.date}
                </span>
                <h3 className="mt-4 font-heading text-xl font-bold tracking-tight text-forest md:text-2xl">{e.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-sage">{e.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28" data-testid="news-section">
      <Reveal>
        <h2 className="font-heading text-3xl font-black tracking-tight text-forest md:text-5xl">{t.news.newsTitle}</h2>
      </Reveal>
      <div className="mt-12 border-t border-forest/15">
        {currentNews.map((n, i) => (
          <Reveal key={n.title} delay={i * 0.05} y={20}>
            <article
              className="group grid cursor-pointer gap-2 border-b border-forest/15 py-7 transition-colors hover:bg-white md:grid-cols-12 md:items-baseline md:py-9"
              data-testid={`news-item-${i}`}
            >
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-sage md:col-span-2">{n.date}</span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-maple md:col-span-2">{n.tag}</span>
              <div className="md:col-span-7">
                <h3 className="font-heading text-xl font-bold tracking-tight text-forest transition-colors group-hover:text-maple md:text-2xl">
                  {n.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sage">{n.excerpt}</p>
              </div>
              <ArrowUpRight className="hidden h-6 w-6 text-forest/40 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-maple md:col-span-1 md:block" />
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  </div>
  );
};

export default NewsEvents;
