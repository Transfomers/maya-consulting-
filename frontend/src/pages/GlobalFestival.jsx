import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Reveal, ParallaxImage } from "@/components/motion";
import PageHero from "@/components/PageHero";
import TiltCard from "@/components/TiltCard";
import { IMAGES } from "@/lib/content";
import { useLang } from "@/lib/i18n";

const GlobalFestival = () => {
  const { t } = useLang();

  return (
    <div data-testid="festival-page">
      <PageHero
        testId="festival-hero"
        eyebrow={t.festival.eyebrow}
        lines={[
          <>{t.festival.h1a}</>,
          <>
            <span className="font-serif font-medium italic text-maple">{t.festival.h1accent}</span>{t.festival.h1post}
          </>,
        ]}
        intro={t.festival.intro}
      />

      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10 grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <TiltCard>
              <ParallaxImage
                src={IMAGES.collaboration}
                alt={t.festival.aboutTitle}
                className="aspect-[4/3] w-full border border-forest/15"
                speed={0.08}
              />
            </TiltCard>
          </Reveal>
          <Reveal delay={0.2}>
            <h2 className="mb-6 font-heading text-4xl font-black text-forest md:text-5xl">
              {t.festival.aboutTitle}
            </h2>
            <p className="text-base leading-relaxed text-sage md:text-lg">
              {t.festival.aboutCopy}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-bone py-24 md:py-32 border-y border-forest/15">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10 grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal className="lg:order-2">
            <TiltCard>
              <ParallaxImage
                src={IMAGES.workshop}
                alt={t.festival.destinationCity}
                className="aspect-[4/3] w-full border border-forest/15"
                speed={0.08}
              />
            </TiltCard>
          </Reveal>
          <Reveal delay={0.2} className="lg:order-1">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-maple">
              {t.festival.destinationTitle}
            </p>
            <h2 className="mb-6 font-serif text-5xl italic text-forest md:text-7xl">
              {t.festival.destinationCity}
            </h2>
            <p className="text-base leading-relaxed text-sage md:text-lg">
              {t.festival.destinationCopy}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-forest py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-5 text-center md:px-10">
          <Reveal>
            <h2 className="mb-10 font-heading text-4xl font-black text-bone md:text-5xl lg:text-6xl">
              {t.festival.ctaTitle}
            </h2>
            <Link
              to="/contact"
              className="group inline-flex items-center gap-2 bg-bone px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-maple hover:text-bone"
            >
              {t.festival.ctaButton}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default GlobalFestival;
