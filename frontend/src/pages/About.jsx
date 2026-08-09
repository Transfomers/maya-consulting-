import PageHero from "@/components/PageHero";
import AboutBulbs from "@/components/AboutBulbs";
import LogoSlider from "@/components/LogoSlider";
import { Reveal, ParallaxImage, EditorialMarquee } from "@/components/motion";
import TiltCard from "@/components/TiltCard";
import { IMAGES } from "@/lib/content";
import { useLang } from "@/lib/i18n";



const About = () => {
  const { t } = useLang();
  const PILLARS = [
    { num: "01", title: t.about.pillars[0].title, text: t.about.pillars[0].text },
    { num: "02", title: t.about.pillars[1].title, text: t.about.pillars[1].text },
    { num: "03", title: t.about.pillars[2].title, text: t.about.pillars[2].text },
  ];
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

    <section className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12" data-testid="about-story-section">
      <div className="lg:col-span-6">
        <Reveal>
          <h2 className="font-heading text-3xl font-black tracking-tight text-forest md:text-5xl">
            {t.about.storyTitleA}<br />{t.about.storyTitleB}
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-sage md:text-lg">
            <p>
              {t.about.storyP1}
            </p>
            <p>
              {t.about.storyP2}
            </p>
            <p>
              {t.about.storyP3}
            </p>
          </div>
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
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-sage">
            {t.about.storyCaption}
          </p>
        </Reveal>
      </div>
    </section>

    <EditorialMarquee
      testId="about-marquee"
      items={t.about.marquee}
    />

    <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32" data-testid="about-pillars-section">
      <div className="grid gap-px border border-forest/15 bg-forest/15 lg:grid-cols-3">
        {PILLARS.map((p, i) => (
          <Reveal key={p.num} delay={i * 0.12} className="bg-bone">
            <div className="flex h-full flex-col p-8 md:p-10" data-testid={`about-pillar-${p.num}`}>
              <span className="font-serif text-6xl italic leading-none text-maple md:text-7xl">{p.num}</span>
              <h3 className="mt-6 font-heading text-2xl font-bold tracking-tight text-forest md:text-3xl">{p.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-sage md:text-base">{p.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>

    {/* INTERACTIVE ECOSYSTEM MAP (Stylized as a dynamic connecting grid) */}
    <section className="bg-maple text-bone py-24 md:py-32 overflow-hidden relative">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="mx-auto max-w-[1600px] px-5 md:px-10 relative z-10">
        <Reveal>
          <h2 className="font-heading text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-center mb-16">
            The Ecosystem <span className="font-serif italic font-medium">at a glance</span>
          </h2>
        </Reveal>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Learning", text: "Foundational education and skills building.", icon: "📚" },
            { title: "Incubation", text: "Turning ideas into viable businesses.", icon: "🌱" },
            { title: "Marketplace", text: "Connecting products to real markets.", icon: "🛍️" },
            { title: "Global Reach", text: "Expanding impact across borders.", icon: "🌍" },
          ].map((node, i) => (
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

    {/* TEAM / FACES OF THE COMMUNITY */}
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <Reveal>
          <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl lg:text-6xl text-center mb-16">
            Faces of the <span className="font-serif italic font-medium text-maple">community</span>
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { img: IMAGES.portraitM, alt: "Community Member" },
            { img: IMAGES.portraitF, alt: "Community Member", delay: 0.1 },
            { img: IMAGES.team, alt: "Community Member", delay: 0.2 },
            { img: IMAGES.workshop, alt: "Community Member", delay: 0.3 },
          ].map((face, i) => (
            <Reveal key={i} delay={face.delay || 0}>
              <div className="relative aspect-square overflow-hidden rounded-xl group">
                <img src={face.img} alt={face.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-forest/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="text-bone font-heading font-bold uppercase tracking-widest text-sm">View Story</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    <AboutBulbs />
    
    <LogoSlider />

    <section className="border-t border-forest/15 bg-white" data-testid="about-future-section">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <h2 className="font-heading text-3xl font-black tracking-tight text-forest md:text-5xl">
            {t.about.futureTitle}
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <p className="font-serif text-2xl italic leading-snug text-forest md:text-3xl">
            {t.about.futureQuote}
          </p>
          <p className="mt-6 text-base leading-relaxed text-sage md:text-lg">
            {t.about.futureText}
          </p>
        </Reveal>
      </div>
    </section>
  </div>
  );
};

export default About;
