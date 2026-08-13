import PageHero from "@/components/PageHero";
import { Reveal, ParallaxImage } from "@/components/motion";
import TiltCard from "@/components/TiltCard";
import { IMAGES } from "@/lib/content";
import { useLang } from "@/lib/i18n";

const About = () => {
  const { t } = useLang();
  
  return (
  <div data-testid="about-page">
    <PageHero
      testId="about-hero"
      eyebrow={t.about.eyebrow}
      lines={[
        <>{t.about.h1a}</>,
        <>
          <span className="font-serif font-medium italic text-maple">{t.about.h1accent}</span>
        </>,
      ]}
      intro={t.about.intro}
    />

    {/* WHO WE ARE & MISSION */}
    <section className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12" data-testid="about-who-section">
      <div className="lg:col-span-6">
        <Reveal>
          <h2 className="font-heading text-3xl font-black tracking-tight text-forest md:text-5xl">
            {t.about.whoTitleA} <span className="font-serif italic text-maple">{t.about.whoTitleB}</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-sage md:text-lg">
            {t.about.whoText}
          </p>
        </Reveal>
        
        <Reveal delay={0.1}>
          <h2 className="mt-16 font-heading text-3xl font-black tracking-tight text-forest md:text-5xl">
            {t.about.missionTitleA} <span className="font-serif italic text-maple">{t.about.missionTitleB}</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-sage md:text-lg font-bold">
            {t.about.missionText}
          </p>
        </Reveal>
      </div>
      <div className="lg:col-span-5 lg:col-start-8">
        <Reveal delay={0.2} y={60}>
          <ParallaxImage
            src={IMAGES.building}
            alt="Modern architecture reaching upward"
            testId="about-story-image"
            className="aspect-[3/4] max-h-[80vh] w-full border border-forest/20"
            speed={0.1}
          />
        </Reveal>
      </div>
    </section>

    {/* HOW WE WORK */}
    <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32" data-testid="about-how-section">
      <Reveal>
        <h2 className="font-heading text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-center mb-16">
          {t.about.howTitleA} <span className="font-serif italic font-medium text-maple">{t.about.howTitleB}</span>
        </h2>
      </Reveal>
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
        {t.about.howSteps.map((step, i) => (
          <Reveal key={i} delay={i * 0.1} className="flex-1 w-full relative group">
            <TiltCard>
              <div className="bg-forest/5 border border-forest/15 p-6 md:p-8 h-full rounded-xl hover:bg-forest hover:text-bone transition-colors group">
                <h3 className="font-heading text-xl font-bold tracking-tight mb-2 group-hover:text-maple transition-colors">{step.title}</h3>
                <p className="text-sm leading-relaxed text-sage group-hover:text-bone/80">{step.text}</p>
              </div>
            </TiltCard>
            {/* Arrow connecting cards on desktop */}
            {i < t.about.howSteps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10 text-maple opacity-50">
                →
              </div>
            )}
            {/* Arrow connecting cards on mobile */}
            {i < t.about.howSteps.length - 1 && (
              <div className="md:hidden text-center my-2 text-maple opacity-50">
                ↓
              </div>
            )}
          </Reveal>
        ))}
      </div>
    </section>

    {/* OUR DIGITAL ECOSYSTEM */}
    <section className="bg-maple text-bone py-24 md:py-32 overflow-hidden relative" data-testid="about-ecosystem-section">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="mx-auto max-w-[1600px] px-5 md:px-10 relative z-10">
        <Reveal>
          <h2 className="font-heading text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-center mb-6">
            {t.about.ecoTitleA} <span className="font-serif italic font-medium">{t.about.ecoTitleB}</span>
          </h2>
          <p className="text-center text-lg md:text-xl font-medium mb-16 opacity-90 max-w-2xl mx-auto">
            {t.about.ecoIntro}
          </p>
        </Reveal>
        
        <div className="grid md:grid-cols-3 gap-6">
          {t.about.ecoSteps.map((node, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <TiltCard>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-8 h-full rounded-tr-[40px] rounded-bl-[40px] hover:bg-white/20 transition-colors cursor-pointer group">
                  <div className="text-4xl mb-4 transform group-hover:scale-125 transition-transform">{node.icon}</div>
                  <h3 className="font-heading text-2xl font-bold tracking-tight mb-2">{node.title}</h3>
                  <p className="text-bone/80 text-sm leading-relaxed">{node.text}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    {/* OUR VISION */}
    <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32" data-testid="about-vision-section">
      <Reveal>
        <h2 className="font-heading text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-center mb-6 text-forest">
          {t.about.visionTitle}
        </h2>
        <p className="font-serif text-2xl italic leading-snug text-maple md:text-3xl text-center mb-16 max-w-4xl mx-auto">
          {t.about.visionQuote}
        </p>
      </Reveal>
      <div className="grid gap-px border border-forest/15 bg-forest/15 lg:grid-cols-3">
        {t.about.visionSteps.map((p, i) => (
          <Reveal key={i} delay={i * 0.12} className="bg-bone">
            <div className="flex h-full flex-col p-8 md:p-10 text-center" data-testid={`about-vision-${i}`}>
              <span className="font-serif text-6xl italic leading-none text-maple opacity-30 md:text-7xl">0{i+1}</span>
              <h3 className="mt-6 font-heading text-2xl font-bold tracking-tight text-forest md:text-3xl">{p.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-sage md:text-base">{p.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  </div>
  );
};

export default About;
