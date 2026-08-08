import { Check } from "lucide-react";
import ProgramsHero from "@/components/ProgramsHero";
import FormShell from "@/components/FormShell";
import { Reveal, ParallaxImage } from "@/components/motion";
import { PROGRAMS } from "@/lib/content";

const Programs = () => (
  <div data-testid="programs-page">
    <ProgramsHero />

    {PROGRAMS.map((p, i) => (
      <section
        key={p.id}
        id={p.id}
        className={`border-b border-forest/15 ${i % 2 === 1 ? "bg-white" : ""}`}
        data-testid={`program-section-${p.id}`}
      >
        <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-5 py-20 md:px-10 md:py-28 lg:grid-cols-12">
          <div className={`lg:col-span-6 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
            <Reveal>
              <span className="font-serif text-7xl italic leading-none text-maple md:text-8xl">{p.number}</span>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-sage">{p.theme}</p>
              <h2 className="mt-3 font-heading text-4xl font-black tracking-tight text-forest md:text-5xl lg:text-6xl">
                {p.name}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-sage md:text-lg">{p.purpose}</p>
            </Reveal>
            <Reveal delay={0.15}>
              <ul className="mt-8 space-y-4">
                {p.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-sm leading-relaxed text-ink md:text-base">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-maple" strokeWidth={2.5} />
                    {o}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.25}>
              <a
                href="#apply"
                data-testid={`program-apply-${p.id}`}
                className="mt-9 inline-flex items-center gap-2 bg-forest px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-maple"
              >
                Apply to this program
              </a>
            </Reveal>
          </div>
          <div className={`lg:col-span-5 ${i % 2 === 1 ? "lg:order-1 lg:col-start-1" : "lg:col-start-8"}`}>
            <Reveal delay={0.2} y={60}>
              <ParallaxImage
                src={p.image}
                alt={p.name}
                testId={`program-image-${p.id}`}
                className="aspect-[4/3] w-full border border-forest/20"
                speed={0.09}
              />
            </Reveal>
          </div>
        </div>
      </section>
    ))}

    <section id="apply" className="bg-bone" data-testid="programs-apply-section">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-maple">
            <span className="inline-block h-px w-10 bg-maple" />
            Program Application
          </p>
          <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
            Start your journey
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-sage md:text-lg">
            Tell us about yourself, your organization and the program you're interested in. Our team reviews every
            application and will reach out with next steps.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <FormShell
            type="application"
            testId="program-application-form"
            submitLabel="Submit Application"
            successMessage="Application received — our team will be in touch soon."
            fields={[
              { name: "name", label: "Full name", placeholder: "Your full name", required: true },
              { name: "email", label: "Email", kind: "email", placeholder: "you@example.com", required: true },
              { name: "organization", label: "Organization / Business", placeholder: "If applicable" },
              {
                name: "program",
                label: "Program",
                kind: "select",
                placeholder: "Select a program",
                options: ["CAP Executive", "Marketplace Lab", "CAP Global Mobility"],
                required: true,
              },
              {
                name: "message",
                label: "Tell us about your goals",
                kind: "textarea",
                placeholder: "What would you like to achieve through this program?",
              },
            ]}
          />
        </Reveal>
      </div>
    </section>
  </div>
);

export default Programs;
