import { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";

// The slider looks for these files in the public/assets directory.
const LOGOS = [
  { id: 1, src: "/assets/brand-logo-1.png", alt: "Logo Variation 1" },
  { id: 2, src: "/assets/brand-logo-2.png", alt: "Logo Variation 2" },
  { id: 3, src: "/assets/brand-logo-3.png", alt: "Logo Variation 3" },
  { id: 4, src: "/assets/brand-logo-4.png", alt: "Logo Variation 4" },
  { id: 5, src: "/assets/brand-logo-5.png", alt: "Logo Variation 5" },
];

const LogoSlider = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });

  useEffect(() => {
    if (emblaApi) {
      // Auto-play interval
      const autoplay = setInterval(() => {
        emblaApi.scrollNext();
      }, 3000);
      return () => clearInterval(autoplay);
    }
  }, [emblaApi]);

  return (
    <section className="border-t border-forest/15 bg-white py-16" data-testid="logo-slider">
      <div className="mx-auto max-w-[1600px] px-5 text-center md:px-10">
        <h2 className="mb-10 font-heading text-2xl font-bold tracking-tight text-forest md:text-3xl">
          Our Brand Marks
        </h2>
        
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y items-center">
            {LOGOS.map((logo) => (
              <div
                key={logo.id}
                className="min-w-0 shrink-0 grow-0 basis-full px-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-forest/15 bg-forest/5 p-8 transition-colors hover:bg-forest/10">
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                    onError={(e) => {
                      // Fallback if the image doesn't exist yet
                      e.target.src = `https://placehold.co/600x400/eeeeee/999999?text=Save+as+${logo.src.split('/').pop()}`;
                      e.target.classList.remove("mix-blend-multiply");
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogoSlider;
