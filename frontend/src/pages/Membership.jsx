import PageHero from "@/components/PageHero";
import FormShell from "@/components/FormShell";
import { Reveal } from "@/components/motion";
import { MEMBER_BENEFITS, MEMBER_BENEFITS_FR, MEMBER_BENEFITS_AR } from "@/lib/content";
import { useLang } from "@/lib/i18n";

const Membership = () => {
  const { lang, t } = useLang();
  const currentBenefits = lang === "fr" ? MEMBER_BENEFITS_FR : lang === "ar" ? MEMBER_BENEFITS_AR : MEMBER_BENEFITS;
  return (
  <div data-testid="membership-page">
    <PageHero
      testId="membership-hero"
      eyebrow={t.membership.eyebrow}
      lines={[
        <>{t.membership.h1a}</>,
        <>
          {t.membership.h1pre && <span>{t.membership.h1pre}</span>}<span className="font-serif font-medium italic text-maple">{t.membership.h1accent}</span>{t.membership.h1post}
        </>,
      ]}
      intro={t.membership.intro}
    />

    <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32" data-testid="benefits-section">
      <Reveal>
        <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">{t.membership.benefitsTitle}</h2>
      </Reveal>
      <div className="mt-14 grid gap-px border border-forest/15 bg-forest/15 sm:grid-cols-2 lg:grid-cols-4">
        {currentBenefits.map((b, i) => (
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
              {t.membership.benefitsMore}
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
            {t.membership.memberEyebrow}
          </p>
          <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
            {t.membership.memberTitle}
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-sage md:text-lg">
            {t.membership.memberCopy}
          </p>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <FormShell
            type="membership"
            testId="membership-form"
            submitLabel={t.membership.memberSubmit}
            successMessage={t.membership.memberSuccess}
            fields={[
              { name: "name", label: t.form.name, placeholder: t.form.namePh, required: true },
              { name: "email", label: t.form.email, kind: "email", placeholder: t.form.emailPh, required: true },
              { name: "organization", label: t.form.org, placeholder: t.form.orgPh },
              {
                name: "interest",
                label: t.membership.joinAsLabel,
                kind: "select",
                placeholder: t.membership.selectOne,
                options: t.membership.joinAsOptions,
                required: true,
              },
              {
                name: "message",
                label: t.membership.gainLabel,
                kind: "textarea",
                placeholder: t.membership.gainPh,
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
            {t.membership.volEyebrow}
          </p>
          <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
            {t.membership.volTitle}
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-sage md:text-lg">
            {t.membership.volEyebrow}s power our programs, events and international initiatives — including exchanges through CAP
            Global Mobility. Tell us how you'd like to contribute.
          </p>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <FormShell
            type="volunteer"
            testId="volunteer-form"
            submitLabel="{t.membership.volEyebrow} With Us"
            successMessage={t.membership.volSuccess}
            fields={[
              { name: "name", label: t.form.name, placeholder: t.form.namePh, required: true },
              { name: "email", label: t.form.email, kind: "email", placeholder: t.form.emailPh, required: true },
              {
                name: "area",
                label: t.membership.areaLabel,
                kind: "select",
                placeholder: t.membership.selectOne,
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
        </Reveal>
      </div>
    </section>
  </div>
  );
};

export default Membership;
