import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IMAGES } from "@/lib/content";
import { useLang } from "@/lib/i18n";

const SLIDES = [
  { src: IMAGES.hero, alt: "Nature" },
  { src: IMAGES.workshop, alt: "Workshop" },
  { src: IMAGES.collaboration, alt: "Collaboration" },
  { src: IMAGES.building, alt: "Building" },
  { src: IMAGES.board, alt: "Board meeting" }
];

const ImageCarousel = () => {
  const { t } = useLang();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000);
    
    return () => clearInterval(autoplay);
  }, [emblaApi]);

  return (
    <section className="relative overflow-hidden bg-forest/5 py-16 md:py-24 border-y border-forest/15" data-testid="image-carousel-section">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="mb-10 flex items-center justify-between">
          <h2 className="font-heading text-3xl font-black tracking-tight text-forest md:text-5xl">
            {t.home.carouselTitle}
          </h2>
          <div className="hidden gap-3 md:flex">
            <button
              onClick={scrollPrev}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-forest/20 bg-bone text-forest transition-colors hover:bg-forest hover:text-bone"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={scrollNext}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-forest/20 bg-bone text-forest transition-colors hover:bg-forest hover:text-bone"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <div className="overflow-hidden border border-forest/15 shadow-xl" ref={emblaRef}>
            <div className="flex aspect-[16/9] md:aspect-[21/9]">
              {SLIDES.map((slide, index) => (
                <div className="relative min-w-0 flex-[0_0_100%]" key={index}>
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Mobile controls inside the image */}
          <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between md:hidden">
            <button
              onClick={scrollPrev}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-bone/90 text-forest shadow-md backdrop-blur-md"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollNext}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-bone/90 text-forest shadow-md backdrop-blur-md"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageCarousel;
