import PageHero from "@/components/PageHero";
import FormShell from "@/components/FormShell";
import { Reveal, EditorialMarquee } from "@/components/motion";
import { PARTNER_TYPES } from "@/lib/content";

const Partners = () => (
  <div data-testid="partners-page">
    <PageHero
      testId="partners-hero"
      eyebrow="Partners"
      lines={[
        <>Shared value,</>,
        <>
          <span className="font-serif font-medium italic text-maple">measurable</span> impact
        </>,
      ]}
      intro="Partnerships are essential to achieving our mission. Every partnership we build demonstrates shared value and measurable community impact."
    />

    <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32" data-testid="partner-types-section">
      <Reveal>
        <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">Who we partner with</h2>
      </Reveal>
      <div className="mt-12 border-t border-forest/15">
        {PARTNER_TYPES.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.05} y={20}>
            <div
              className="grid gap-2 border-b border-forest/15 py-6 transition-colors hover:bg-white md:grid-cols-12 md:items-baseline md:py-8"
              data-testid={`partner-type-${p.name.toLowerCase().replace(/[^a-z]+/g, "-")}`}
            >
              <span className="font-serif text-lg italic text-maple md:col-span-1">0{i + 1}</span>
              <h3 className="font-heading text-xl font-bold tracking-tight text-forest md:col-span-5 md:text-3xl">
                {p.name}
              </h3>
              <p className="text-sm leading-relaxed text-sage md:col-span-6 md:text-base">{p.detail}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>

    <EditorialMarquee
      testId="partners-marquee"
      items={["Co-Design", "Co-Deliver", "Co-Invest", "Grow Together"]}
    />

    <section className="bg-white" data-testid="partner-form-section">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-maple">
            <span className="inline-block h-px w-10 bg-maple" />
            Become a Partner
          </p>
          <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
            Let's build something together
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-sage md:text-lg">
            From program co-design to international missions, we build partnerships around shared goals and measurable
            outcomes. Start the conversation below.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <FormShell
            type="partner"
            testId="partner-form"
            submitLabel="Start the Conversation"
            successMessage="Thank you — our partnerships team will reach out."
            fields={[
              { name: "name", label: "Full name", placeholder: "Your full name", required: true },
              { name: "email", label: "Email", kind: "email", placeholder: "you@example.com", required: true },
              { name: "organization", label: "Organization", placeholder: "Your organization", required: true },
              {
                name: "partnerType",
                label: "Partnership type",
                kind: "select",
                placeholder: "Select one",
                options: PARTNER_TYPES.map((p) => p.name),
                required: true,
              },
              {
                name: "message",
                label: "What could we build together?",
                kind: "textarea",
                placeholder: "Share your idea, goal or opportunity…",
              },
            ]}
          />
        </Reveal>
      </div>
    </section>
  </div>
);

export default Partners;
