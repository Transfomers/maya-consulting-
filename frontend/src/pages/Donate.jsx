import PageHero from "@/components/PageHero";
import FormShell from "@/components/FormShell";
import { Reveal, ParallaxImage } from "@/components/motion";
import { IMAGES } from "@/lib/content";
import { GraduationCap, Users, Globe2 } from "lucide-react";

const IMPACTS = [
  {
    icon: GraduationCap,
    title: "Education & mentoring",
    text: "Contributions fund program access, mentoring and learning materials for entrepreneurs and nonprofit leaders.",
  },
  {
    icon: Users,
    title: "Networks & exposure",
    text: "Donations open doors to networking opportunities and professional exposure through our programs and partner network.",
  },
  {
    icon: Globe2,
    title: "International scholarships",
    text: "Support contributes toward participant scholarships for trade fairs, entrepreneurial festivals and international opportunities.",
  },
];

const Donate = () => (
  <div data-testid="donate-page">
    <PageHero
      testId="donate-hero"
      eyebrow="Donate"
      lines={[
        <>Every contribution</>,
        <>
          becomes <span className="font-serif font-medium italic text-maple">opportunity</span>
        </>,
      ]}
      intro="Every contribution helps entrepreneurs gain access to education, mentoring, networking opportunities and professional exposure through our programs."
    />

    <section className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12" data-testid="donate-impact-section">
      <div className="lg:col-span-7">
        <Reveal>
          <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
            Where your support goes
          </h2>
        </Reveal>
        <div className="mt-12 space-y-px border border-forest/15 bg-forest/15">
          {IMPACTS.map((im, i) => (
            <Reveal key={im.title} delay={i * 0.1} className="bg-bone">
              <div className="flex items-start gap-6 p-7 md:p-9" data-testid={`donate-impact-${i}`}>
                <im.icon className="mt-1 h-8 w-8 shrink-0 text-maple" strokeWidth={1.5} />
                <div>
                  <h3 className="font-heading text-xl font-bold tracking-tight text-forest md:text-2xl">{im.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sage md:text-base">{im.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="lg:col-span-4 lg:col-start-9">
        <Reveal delay={0.2} y={60}>
          <ParallaxImage
            src={IMAGES.workshop}
            alt="Participants at a professional workshop"
            testId="donate-image"
            className="aspect-[3/4] max-h-[80vh] w-full border border-forest/20"
            speed={0.1}
          />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-sage">
            100% of donations support program participants
          </p>
        </Reveal>
      </div>
    </section>

    <section className="border-t border-forest/15 bg-forest text-bone" data-testid="pledge-form-section">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-vivid">
            <span className="inline-block h-px w-10 bg-vivid" />
            Make a Pledge
          </p>
          <h2 className="font-heading text-4xl font-black tracking-tight md:text-5xl">Fuel the next story</h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-bone/75 md:text-lg">
            Leave your pledge and our team will follow up to complete your contribution. Every dollar moves an
            entrepreneur closer to education, markets and community impact.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <div className="bg-bone p-7 text-ink md:p-10">
            <FormShell
              type="pledge"
              testId="pledge-form"
              submitLabel="Pledge My Support"
              successMessage="Thank you for your pledge — we'll follow up to complete your contribution."
              fields={[
                { name: "name", label: "Full name", placeholder: "Your full name", required: true },
                { name: "email", label: "Email", kind: "email", placeholder: "you@example.com", required: true },
                {
                  name: "amount",
                  label: "Pledge amount (CAD)",
                  kind: "radio",
                  options: ["$50", "$100", "$250", "$500", "$1,000"],
                  required: true,
                },
                { name: "customAmount", label: "Or enter a custom amount", placeholder: "e.g. 750" },
                {
                  name: "message",
                  label: "A note (optional)",
                  kind: "textarea",
                  placeholder: "Dedicate your pledge, or leave a word of encouragement…",
                },
              ]}
            />
          </div>
        </Reveal>
      </div>
    </section>
  </div>
);

export default Donate;
