import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion";
import PageHero from "@/components/PageHero";
import TiltCard from "@/components/TiltCard";
import FormShell from "@/components/FormShell";
import { useLang } from "@/lib/i18n";

const Volunteer = () => {
  const { t } = useLang();

  return (
    <div data-testid="volunteer-page">
      <PageHero
        testId="volunteer-hero"
        eyebrow={t.volunteer.eyebrow}
        lines={[
          <>{t.volunteer.h1a}</>,
          <>
            <span className="font-serif font-medium italic text-maple">{t.volunteer.h1accent}</span>
          </>,
        ]}
        intro={t.volunteer.intro}
      />

      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <Reveal>
            <h2 className="mb-16 text-center font-heading text-4xl font-black text-forest md:text-5xl">
              {t.volunteer.journeyTitle}
            </h2>
          </Reveal>
          
          <div className="grid gap-6 md:grid-cols-5">
            {t.volunteer.journeySteps.map((step, i) => (
              <Reveal key={i} delay={i * 0.1} className="relative">
                <TiltCard className="h-full">
                  <div className="flex h-full flex-col border border-forest/15 bg-forest/5 p-8 transition-colors hover:bg-forest hover:text-bone group">
                    <span className="mb-4 font-serif text-5xl italic text-maple opacity-50 transition-opacity group-hover:opacity-100">
                      0{i + 1}
                    </span>
                    <h3 className="mb-2 font-heading text-xl font-bold tracking-tight text-forest group-hover:text-bone">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-sage group-hover:text-bone/80">
                      {step.text}
                    </p>
                  </div>
                </TiltCard>
                {i < t.volunteer.journeySteps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10 w-8 items-center justify-center text-maple">
                    <ArrowRight className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                )}
                {i < t.volunteer.journeySteps.length - 1 && (
                  <div className="md:hidden mt-4 flex items-center justify-center text-maple">
                    <ArrowRight className="h-6 w-6 rotate-90" strokeWidth={1.5} />
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-forest/15 bg-white py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-5 md:px-10">
          <Reveal>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-maple">Volunteer</p>
            <h2 className="mb-10 font-heading text-3xl font-black text-forest md:text-4xl">Tell us how you can help</h2>
          </Reveal>
          <FormShell
            type="volunteer"
            testId="volunteer-page-form"
            submitLabel={t.volunteer.ctaButton}
            successMessage={t.membership.volSuccess}
            fields={[
              { name: "name", label: t.form.name, placeholder: t.form.namePh, required: true },
              { name: "email", label: t.form.email, kind: "email", placeholder: t.form.emailPh, required: true },
              {
                name: "area",
                label: t.membership.areaLabel,
                kind: "select",
                placeholder: t.membership.joinPh,
                options: t.membership.areaOptions,
              },
              { name: "availability", label: t.membership.availLabel, placeholder: t.membership.availPh },
              {
                name: "message",
                label: t.membership.skillsLabel,
                kind: "textarea",
                placeholder: t.membership.skillsPh,
              },
            ]}
          />
        </div>
      </section>

      <section className="border-t border-forest/15 bg-forest py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-5 text-center md:px-10">
          <Reveal>
            <h2 className="mb-10 font-heading text-4xl font-black text-bone md:text-5xl lg:text-6xl">
              {t.volunteer.ctaTitle}
            </h2>
            <Link
              to="/join?intent=volunteer"
              className="group inline-flex items-center gap-2 bg-bone px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-maple hover:text-bone"
            >
              {t.volunteer.ctaButton}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Volunteer;
