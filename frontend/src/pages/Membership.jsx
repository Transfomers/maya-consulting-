import PageHero from "@/components/PageHero";
import FormShell from "@/components/FormShell";
import { Reveal } from "@/components/motion";
import { MEMBER_BENEFITS } from "@/lib/content";

const Membership = () => (
  <div data-testid="membership-page">
    <PageHero
      testId="membership-hero"
      eyebrow="Membership"
      lines={[
        <>Join an ecosystem,</>,
        <>
          not just an <span className="font-serif font-medium italic text-maple">organization</span>
        </>,
      ]}
      intro="Members become part of a growing community of entrepreneurs, nonprofits, volunteers and partners — creating opportunity for themselves and their communities."
    />

    <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32" data-testid="benefits-section">
      <Reveal>
        <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">Member benefits</h2>
      </Reveal>
      <div className="mt-14 grid gap-px border border-forest/15 bg-forest/15 sm:grid-cols-2 lg:grid-cols-4">
        {MEMBER_BENEFITS.map((b, i) => (
          <Reveal key={b} delay={i * 0.06} className={`bg-bone ${i === 0 ? "sm:col-span-2 lg:col-span-2" : ""}`}>
            <div className="group flex h-full flex-col justify-between p-7 transition-colors hover:bg-forest md:p-9" data-testid={`benefit-${b.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
              <span className="font-serif text-4xl italic leading-none text-maple">0{i + 1}</span>
              <h3 className="mt-8 font-heading text-xl font-bold tracking-tight text-forest transition-colors group-hover:text-bone md:text-2xl">
                {b}
              </h3>
            </div>
          </Reveal>
        ))}
        <Reveal delay={0.4} className="bg-forest">
          <div className="flex h-full flex-col justify-between p-7 md:p-9">
            <span className="font-serif text-4xl italic leading-none text-maple">+</span>
            <p className="mt-8 font-heading text-xl font-bold tracking-tight text-bone md:text-2xl">
              …and a community that grows with you
            </p>
          </div>
        </Reveal>
      </div>
    </section>

    <section className="border-t border-forest/15 bg-white" data-testid="membership-form-section">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-maple">
            <span className="inline-block h-px w-10 bg-maple" />
            Become a Member
          </p>
          <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
            Take your place in the ecosystem
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-sage md:text-lg">
            Whether you're an entrepreneur, a nonprofit leader or a volunteer, membership connects you to professional
            development, networking, learning opportunities and international collaboration.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <FormShell
            type="membership"
            testId="membership-form"
            submitLabel="Request Membership"
            successMessage="Welcome aboard — we'll reach out with your membership details."
            fields={[
              { name: "name", label: "Full name", placeholder: "Your full name", required: true },
              { name: "email", label: "Email", kind: "email", placeholder: "you@example.com", required: true },
              { name: "organization", label: "Organization / Business", placeholder: "If applicable" },
              {
                name: "interest",
                label: "I'm joining as",
                kind: "select",
                placeholder: "Select one",
                options: ["Entrepreneur", "Nonprofit organization", "Volunteer", "Funder / Supporter", "Other"],
                required: true,
              },
              {
                name: "message",
                label: "What are you hoping to gain?",
                kind: "textarea",
                placeholder: "Tell us what membership means for you…",
              },
            ]}
          />
        </Reveal>
      </div>
    </section>

    <section className="border-t border-forest/15" data-testid="volunteer-form-section">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-maple">
            <span className="inline-block h-px w-10 bg-maple" />
            Volunteer
          </p>
          <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
            Give your time, grow your world
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-sage md:text-lg">
            Volunteers power our programs, events and international initiatives — including exchanges through CAP
            Global Mobility. Tell us how you'd like to contribute.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <FormShell
            type="volunteer"
            testId="volunteer-form"
            submitLabel="Volunteer With Us"
            successMessage="Thank you for raising your hand — we'll be in touch."
            fields={[
              { name: "name", label: "Full name", placeholder: "Your full name", required: true },
              { name: "email", label: "Email", kind: "email", placeholder: "you@example.com", required: true },
              {
                name: "area",
                label: "Area of interest",
                kind: "select",
                placeholder: "Select one",
                options: ["Program delivery", "Events & community", "Mentoring", "International missions", "Administration"],
              },
              { name: "availability", label: "Availability", placeholder: "e.g. evenings, weekends, one-time projects" },
              {
                name: "message",
                label: "Skills & experience",
                kind: "textarea",
                placeholder: "What would you bring to the community?",
              },
            ]}
          />
        </Reveal>
      </div>
    </section>
  </div>
);

export default Membership;
