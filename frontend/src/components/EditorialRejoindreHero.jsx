import React from "react";
import { Reveal } from "@/components/motion";

const EditorialRejoindreHero = ({
  brandName = "Cap-Entrepreneurs",
  categoryKicker = "ÉCOSYSTÈME & ENGAGEMENT",
  verticalKicker = "R E J O I N D R E",
  titleLines = ["Bâtir", "Ensemble", "Le Futur", "Durable"],
  subtitle,
  ctaLabel = "Découvrir →",
  ctaTarget,
  onCtaClick,
  bgImage,
  fgImage,
  testId = "editorial-hero"
}) => {
  const handleScroll = (e) => {
    if (onCtaClick) {
      e.preventDefault();
      onCtaClick();
      return;
    }
    if (ctaTarget && ctaTarget.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(ctaTarget);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      data-testid={testId}
      className="relative overflow-hidden bg-white text-[#0D0E0D] border-b border-[#0D0E0D]/10 pt-28 pb-16 md:pt-32 md:pb-24"
    >
      {/* 1. TOP CENTER MASTHEAD (Matching "La-féminité / LIFESTYLE") */}
      <div className="text-center pb-6 md:pb-8">
        <span className="font-serif text-lg sm:text-xl font-normal text-[#0D0E0D] tracking-wide block">
          {brandName}
        </span>
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.35em] text-maple font-montserrat block mt-0.5">
          {categoryKicker}
        </span>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 md:px-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 items-center">

          {/* 2. LEFT COLUMN: VERTICAL TEXT + MASSIVE MULTILINE SERIF TITLE + CTA (7 cols) */}
          <div className="lg:col-span-7 flex items-start gap-4 sm:gap-7 relative z-10">

            {/* Rotated vertical kicker (Matching "FASHION" in reference image) */}
            <div className="hidden sm:flex [writing-mode:vertical-rl] rotate-180 pt-6 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.45em] text-[#0D0E0D]/60 font-montserrat select-none">
              {verticalKicker}
            </div>

            <div className="flex-1">
              <Reveal>
                {/* Massive Serif Title across multiple lines */}
                <h1
                  data-testid={`${testId}-heading`}
                  className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-[84px] xl:text-[96px] font-normal leading-[0.98] text-[#0D0E0D] tracking-tight"
                >
                  {titleLines.map((line, idx) => (
                    <span key={idx} className="block">
                      {line}
                    </span>
                  ))}
                </h1>

                {/* Subtitle / Intro Narrative */}
                {subtitle && (
                  <p className="mt-6 text-sm sm:text-base leading-relaxed text-sage max-w-lg font-sans">
                    {subtitle}
                  </p>
                )}

                {/* Bottom Link (Matching "Read →" in reference image) */}
                <div className="mt-7">
                  <a
                    href={ctaTarget || "#"}
                    onClick={handleScroll}
                    className="group inline-flex items-center gap-2 font-serif italic text-base sm:text-lg text-[#0D0E0D] hover:text-maple transition-colors"
                  >
                    <span className="not-italic font-sans text-xs font-bold uppercase tracking-[0.2em]">
                      {ctaLabel}
                    </span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">
                      →
                    </span>
                  </a>
                </div>
              </Reveal>
            </div>
          </div>

          {/* 3. RIGHT COLUMN: LAYERED PHOTO COMPOSITION (5 cols) */}
          <div className="lg:col-span-5 relative">
            <Reveal delay={0.2}>
              <div className="relative mx-auto max-w-[460px] lg:max-w-none">

                {/* Main Background Lifestyle Photo (Large seated/relaxed portrait) */}
                <div className="overflow-hidden bg-[#FAF9F6] border border-[#0D0E0D]/10 shadow-sm">
                  <img
                    src={bgImage}
                    alt={titleLines.join(" ")}
                    className="aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                  />
                </div>

                {/* Foreground Overlapping Smaller Portrait Photo (Bottom right cut-out look) */}
                {fgImage && (
                  <div className="absolute -bottom-6 -right-3 sm:-bottom-10 sm:-right-6 w-[45%] max-w-[210px] overflow-hidden bg-white border-4 border-white shadow-xl">
                    <img
                      src={fgImage}
                      alt="Lookbook focus"
                      className="aspect-[3/4] w-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                )}

              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
};

export default EditorialRejoindreHero;
