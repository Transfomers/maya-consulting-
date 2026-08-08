import PageHero from "@/components/PageHero";
import AboutBulbs from "@/components/AboutBulbs";
import LogoSlider from "@/components/LogoSlider";
import { Reveal, ParallaxImage, EditorialMarquee } from "@/components/motion";
import { IMAGES } from "@/lib/content";

const PILLARS = [
  {
    num: "01",
    title: "Our Mission",
    text: "To empower entrepreneurs and nonprofit organizations by developing innovative programs that strengthen local economies, encourage collaboration and expand international opportunities.",
  },
  {
    num: "02",
    title: "Our Vision",
    text: "To become a leading entrepreneurial ecosystem connecting communities, organizations and innovators across Canada and internationally.",
  },
  {
    num: "03",
    title: "Our Promise",
    text: "We believe entrepreneurship should create opportunity for everyone, regardless of where they live. We develop practical programs that help entrepreneurs grow their businesses, access new markets and become active contributors to stronger communities.",
  },
];

const About = () => (
  <div data-testid="about-page">
    <PageHero
      testId="about-hero"
      eyebrow="About CAP Entrepreneurs"
      lines={[
        <>Why we</>,
        <>
          <span className="font-serif font-medium italic text-maple">exist</span>
        </>,
      ]}
      intro="CAP Entrepreneurs is a Canadian nonprofit organization that designs, delivers and supports innovative entrepreneurial programs. We are not a consulting firm — we are builders of ecosystems."
    />

    <section className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12" data-testid="about-story-section">
      <div className="lg:col-span-6">
        <Reveal>
          <h2 className="font-heading text-3xl font-black tracking-tight text-forest md:text-5xl">
            An ecosystem,<br />not isolated projects
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-8 space-y-5 text-base leading-relaxed text-sage md:text-lg">
            <p>
              CAP Entrepreneurs was founded on a simple observation: talent is everywhere, but opportunity is not.
              Entrepreneurs in rural and underserved communities — and the nonprofits that support them — too often work
              alone, without the networks, markets or learning experiences that turn effort into impact.
            </p>
            <p>
              So we build the connective tissue. Through education, collaboration, innovation and international
              partnerships, our programs help participants progress from learning to implementation to measurable
              impact — and keep growing long after a program ends.
            </p>
            <p>
              Every initiative we deliver answers one question: how can CAP Entrepreneurs help people create
              opportunities for themselves and their communities?
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
            Built to connect — across Canada and beyond
          </p>
        </Reveal>
      </div>
    </section>

    <EditorialMarquee
      testId="about-marquee"
      items={["Mission", "Vision", "Promise", "Ecosystem", "Community", "Beyond Borders"]}
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

    <AboutBulbs />
    
    <LogoSlider />

    <section className="border-t border-forest/15 bg-white" data-testid="about-future-section">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <h2 className="font-heading text-3xl font-black tracking-tight text-forest md:text-5xl">
            Our digital future
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <p className="font-serif text-2xl italic leading-snug text-forest md:text-3xl">
            "As CAP Entrepreneurs expands, digital solutions will support the delivery of our programs through online
            learning, member engagement and partnership collaboration."
          </p>
          <p className="mt-6 text-base leading-relaxed text-sage md:text-lg">
            Technology will enhance our mission by making entrepreneurial support more accessible, measurable and
            scalable — while preserving the human connections that drive community impact.
          </p>
        </Reveal>
      </div>
    </section>
  </div>
);

export default About;
