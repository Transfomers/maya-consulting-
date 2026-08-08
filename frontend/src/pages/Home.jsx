import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, BookOpen, Rocket, TrendingUp, Globe2, Sprout, Handshake } from "lucide-react";
import { KineticLines, Reveal, ParallaxImage, EditorialMarquee, Magnetic, FloatIcon } from "@/components/motion";
import Scene3D from "@/components/Scene3D";
import RotatingTagline from "@/components/RotatingTagline";
import ImageCarousel from "@/components/ImageCarousel";
import { IMAGES, PROGRAMS, STORIES } from "@/lib/content";

const CHAPTERS = [
  {
    num: "01",
    icon: BookOpen,
    title: "Learn",
    text: "Practical programs in entrepreneurial education, digital commerce and nonprofit leadership — built for real communities, not boardrooms.",
  },
  {
    num: "02",
    icon: Rocket,
    title: "Build",
    text: "Participants move from learning to implementation: launching ventures, strengthening organizations and opening new markets together.",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Impact",
    text: "Every initiative ends in measurable impact — stronger local economies, deeper collaboration and opportunity that crosses borders.",
  },
];

const AUDIENCES = [
  { label: "Entrepreneurs", to: "/programs" },
  { label: "Nonprofit organizations", to: "/programs" },
  { label: "Funders & donors", to: "/donate" },
  { label: "Volunteers", to: "/membership" },
  { label: "Institutional partners", to: "/partners" },
];

const Home = () => (
  <div data-testid="home-page">
    {/* HERO */}
    <section className="relative overflow-hidden border-b border-forest/15">
      <span
        aria-hidden="true"
        className="text-outline pointer-events-none absolute -right-10 top-16 hidden select-none font-heading text-[26vw] font-black leading-none opacity-20 lg:block"
      >
        CAP
      </span>
      <Scene3D className="absolute inset-0 z-0" />
      <FloatIcon Icon={Globe2} className="right-[36%] top-28 hidden lg:block" delay={0} testId="float-icon-globe" />
      <FloatIcon Icon={Sprout} className="right-[6%] top-48 hidden lg:block" delay={0.7} testId="float-icon-sprout" />
      <FloatIcon Icon={Handshake} className="bottom-24 right-[30%] hidden lg:block" delay={1.3} testId="float-icon-handshake" />
      <div className="relative z-10 mx-auto grid max-w-[1600px] gap-12 px-5 pb-20 pt-24 md:px-10 md:pt-32 lg:grid-cols-12 lg:gap-8 lg:pb-28">
        <div className="lg:col-span-10">
          <Reveal y={16}>
            <p className="mb-8 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-maple" data-testid="hero-eyebrow">
              <span className="inline-block h-px w-10 bg-maple" />
              A Canadian nonprofit movement
            </p>
          </Reveal>
          <KineticLines
            testId="hero-heading"
            lines={[
              <>Together, we build</>,
              <>
                <span className="font-serif font-medium italic tracking-tight text-maple">entrepreneurial</span> ecosystems
              </>,
              <>where innovation creates opportunity</>,
              <>and communities thrive.</>,
            ]}
            className="font-heading text-[13vw] font-black leading-[0.92] tracking-tighter text-forest sm:text-6xl md:text-7xl lg:text-[5.2rem] xl:text-8xl"
          />
          <Reveal delay={0.55} className="mt-10 max-w-2xl">
            <p className="text-base leading-relaxed text-sage md:text-lg" data-testid="hero-subtext">
              CAP Entrepreneurs is a nonprofit organization that designs, delivers and supports innovative entrepreneurial programs. Our programs help entrepreneurs develop sustainable businesses, strengthen nonprofit organizations and create international opportunities through technology, partnerships and community engagement.
            </p>
          </Reveal>
          <Reveal delay={0.65} className="mt-8">
            <p className="flex items-center gap-4" data-testid="hero-tagline-fr">
              <span className="inline-block h-px w-10 bg-maple" />
              <RotatingTagline className="font-serif text-3xl italic leading-none text-maple md:text-4xl" />
            </p>
          </Reveal>
          <Reveal delay={0.75} className="mt-10 flex flex-wrap gap-4">
            <Magnetic>
              <Link
                to="/programs"
                data-testid="hero-cta-programs"
                className="group inline-flex items-center gap-2 bg-forest px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-maple"
              >
                Explore Programs
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                to="/membership"
                data-testid="hero-cta-membership"
                className="inline-flex items-center gap-2 border border-forest px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-forest hover:text-bone"
              >
                Become a Member
              </Link>
            </Magnetic>
          </Reveal>
        </div>
      </div>
    </section>

    {/* MARQUEE */}
    <EditorialMarquee
      dark
      testId="home-marquee"
      items={["Créer", "Accompagner", "Propulser", "Bâtir", "Connecter", "Grandir"]}
    />

    {/* MANIFESTO CHAPTERS */}
    <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32" data-testid="manifesto-section">
      <Reveal>
        <h2 className="max-w-3xl font-heading text-4xl font-black tracking-tight text-forest md:text-5xl lg:text-6xl">
          How we turn learning into lasting impact
        </h2>
      </Reveal>
      <div className="mt-16 grid gap-px border border-forest/15 bg-forest/15 md:grid-cols-3">
        {CHAPTERS.map((c, i) => (
          <Reveal key={c.num} delay={i * 0.12} className="bg-bone">
            <div className="group flex h-full flex-col p-8 transition-colors hover:bg-forest md:p-10" data-testid={`manifesto-chapter-${c.num}`}>
              <span className="font-serif text-6xl italic leading-none text-maple md:text-7xl">{c.num}</span>
              <c.icon
                className="mt-6 h-7 w-7 text-maple transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"
                strokeWidth={1.5}
              />
              <h3 className="mt-4 font-heading text-2xl font-bold tracking-tight text-forest transition-colors group-hover:text-bone md:text-3xl">
                {c.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-sage transition-colors group-hover:text-bone/75 md:text-base">
                {c.text}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>

    {/* IMAGE SLIDER */}
    <ImageCarousel />

    {/* PROGRAMS BENTO */}
    <section className="border-y border-forest/15 bg-white" data-testid="home-programs-section">
      <div className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl lg:text-6xl">
              Programs are the heart<br />of CAP Entrepreneurs
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <Link
              to="/programs"
              data-testid="home-programs-view-all"
              className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-maple"
            >
              All programs
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <Link to="/programs#marketplace-lab" data-testid="home-program-marketplace-lab" className="group block border border-forest/15">
              <ParallaxImage
                src={PROGRAMS[1].image}
                alt={PROGRAMS[1].name}
                className="aspect-[16/9] w-full"
                speed={0.08}
              />
              <div className="flex items-start justify-between gap-4 p-7 md:p-9">
                <div>
                  <span className="font-serif text-3xl italic text-maple">{PROGRAMS[1].number}</span>
                  <h3 className="mt-2 font-heading text-3xl font-bold tracking-tight text-forest transition-colors group-hover:text-maple md:text-4xl">
                    {PROGRAMS[1].name}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-sage md:text-base">{PROGRAMS[1].theme}.</p>
                </div>
                <ArrowUpRight className="mt-2 h-7 w-7 shrink-0 text-forest transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-maple" />
              </div>
            </Link>
          </Reveal>
          <div className="grid gap-8 lg:col-span-5">
            {[PROGRAMS[0], PROGRAMS[2]].map((p, i) => (
              <Reveal key={p.id} delay={0.1 + i * 0.1}>
                <Link
                  to={`/programs#${p.id}`}
                  data-testid={`home-program-${p.id}`}
                  className="group flex h-full flex-col justify-between border border-forest/15 p-7 transition-colors hover:bg-forest md:p-9"
                >
                  <div>
                    <span className="font-serif text-3xl italic text-maple">{p.number}</span>
                    <h3 className="mt-2 font-heading text-2xl font-bold tracking-tight text-forest transition-colors group-hover:text-bone md:text-3xl">
                      {p.name}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-sage transition-colors group-hover:text-bone/75 md:text-base">
                      {p.theme}.
                    </p>
                  </div>
                  <ArrowUpRight className="mt-6 h-6 w-6 text-forest transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-maple" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* SCHOLARSHIP SPOTLIGHT */}
    <section className="bg-forest text-bone" data-testid="scholarship-section">
      <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Reveal>
            <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-vivid">
              <span className="inline-block h-px w-10 bg-vivid" />
              Exposure Scholarship
            </p>
            <h2 className="font-heading text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
              Up to <span className="font-serif italic text-vivid">CAD $8,000</span> toward an international business
              experience
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-bone/75 md:text-lg" data-testid="scholarship-copy">
              Through Marketplace Lab, selected entrepreneurs gain access to trade fairs, festivals and commercial
              opportunities across our partner network — with an exposure scholarship supporting the journey, subject to
              program eligibility and available funding.
            </p>
            <Link
              to="/programs#apply"
              data-testid="scholarship-cta"
              className="group mt-9 inline-flex items-center gap-2 bg-bone px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-maple hover:text-bone"
            >
              Apply to Marketplace Lab
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Reveal>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <Reveal delay={0.15} y={60}>
            <ParallaxImage
              src={IMAGES.collaboration}
              alt="Entrepreneurs collaborating"
              testId="scholarship-image"
              className="aspect-[4/3] w-full border border-bone/20"
              speed={0.09}
            />
          </Reveal>
        </div>
      </div>
    </section>

    {/* WHO WE SERVE */}
    <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32" data-testid="audiences-section">
      <Reveal>
        <h2 className="max-w-2xl font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
          A community built for everyone who creates opportunity
        </h2>
      </Reveal>
      <div className="mt-12 border-t border-forest/15">
        {AUDIENCES.map((a, i) => (
          <Reveal key={a.label} delay={i * 0.06} y={20}>
            <Link
              to={a.to}
              data-testid={`audience-${a.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
              className="group flex items-center justify-between border-b border-forest/15 py-6 transition-colors hover:bg-white md:py-8"
            >
              <span className="flex items-baseline gap-5">
                <span className="font-serif text-lg italic text-maple">0{i + 1}</span>
                <span className="font-heading text-2xl font-bold tracking-tight text-forest transition-colors group-hover:text-maple md:text-4xl">
                  {a.label}
                </span>
              </span>
              <ArrowUpRight className="h-6 w-6 text-forest/40 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-maple md:h-8 md:w-8" />
            </Link>
          </Reveal>
        ))}
      </div>
    </section>

    {/* STORIES PREVIEW */}
    <section className="border-t border-forest/15 bg-white" data-testid="home-stories-section">
      <div className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl lg:text-6xl">
              Stories of collaboration
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <Link
              to="/impact-stories"
              data-testid="home-stories-view-all"
              className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-maple"
            >
              All impact stories
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STORIES.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.1}>
              <Link
                to={`/impact-stories#${s.id}`}
                data-testid={`home-story-${s.id}`}
                className="group block border border-forest/15"
              >
                <div className="overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-7">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-maple">{s.place}</p>
                  <h3 className="mt-2 font-heading text-xl font-bold tracking-tight text-forest transition-colors group-hover:text-maple md:text-2xl">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-sage">{s.program}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    {/* CTA BAND */}
    <section className="border-t border-forest/15" data-testid="home-cta-section">
      <div className="mx-auto max-w-[1600px] px-5 py-24 text-center md:px-10 md:py-32">
        <Reveal>
          <h2 className="mx-auto max-w-4xl font-heading text-4xl font-black leading-[0.95] tracking-tight text-forest md:text-6xl lg:text-7xl">
            Ready to create <span className="font-serif font-medium italic text-maple">opportunity?</span>
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/membership"
              data-testid="cta-member-button"
              className="inline-flex items-center gap-2 bg-forest px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-maple"
            >
              Become a Member <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/donate"
              data-testid="cta-donate-button"
              className="inline-flex items-center gap-2 border border-forest px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-forest hover:text-bone"
            >
              Support the Mission
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  </div>
);

export default Home;
