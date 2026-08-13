import PageHero from "@/components/PageHero";
import FormShell from "@/components/FormShell";
import { Reveal, EditorialMarquee } from "@/components/motion";
import { PARTNER_TYPES, PARTNER_TYPES_FR, PARTNER_TYPES_AR } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { ArrowUpRight } from "lucide-react";

const Partners = () => {
  const { lang, t } = useLang();
  const currentPartnerTypes = lang === "fr" ? PARTNER_TYPES_FR : lang === "ar" ? PARTNER_TYPES_AR : PARTNER_TYPES;
  return (
  <div data-testid="partners-page">
    <PageHero
      testId="partners-hero"
      eyebrow={t.partners.eyebrow}
      lines={[
        <>{t.partners.h1a}</>,
        <>
          {t.partners.h1pre && <span>{t.partners.h1pre}</span>}<span className="font-serif font-medium italic text-maple">{t.partners.h1accent}</span>{t.partners.h1post}
        </>,
      ]}
      intro={t.partners.intro}
    />

    <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-32" data-testid="partner-types-section">
      <Reveal>
        <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">{t.partners.typesTitle}</h2>
      </Reveal>
      <div className="mt-12 border-t border-forest/15">
        {currentPartnerTypes.map((p, i) => (
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

    <section className="border-t border-forest/15 bg-forest py-24 md:py-32" data-testid="founding-partner-cta">
      <div className="mx-auto max-w-4xl px-5 text-center md:px-10">
        <Reveal>
          <h2 className="mb-6 font-heading text-4xl font-black text-bone md:text-5xl lg:text-6xl">
            {t.partners.ctaTitle}
          </h2>
          <p className="mb-10 text-base leading-relaxed text-sage md:text-lg">
            {t.partners.ctaCopy}
          </p>
          <button
            onClick={() => {
              document.getElementById("partner-form-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group inline-flex items-center gap-2 bg-bone px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-maple hover:text-bone"
          >
            {t.partners.ctaButton}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </Reveal>
      </div>
    </section>

    <EditorialMarquee
      testId="partners-marquee"
      items={t.partners.marquee}
    />

    <section className="bg-white" data-testid="partner-form-section">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-maple">
            <span className="inline-block h-px w-10 bg-maple" />
            {t.partners.formEyebrow}
          </p>
          <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
            {t.partners.formTitle}
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-sage md:text-lg">
            {t.partners.formCopy}
          </p>
        </Reveal>
        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <FormShell
            type="partner"
            testId="partner-form"
            submitLabel={t.partners.formSubmit}
            successMessage={t.partners.formSuccess}
            fields={[
              { name: "name", label: t.form.name, placeholder: t.form.namePh, required: true },
              { name: "email", label: t.form.email, kind: "email", placeholder: t.form.emailPh, required: true },
              { name: "organization", label: t.form.org, placeholder: t.form.orgPh, required: true },
              {
                name: "partnerType",
                label: t.partners.typeLabel,
                kind: "select",
                placeholder: t.partners.typePh,
                options: currentPartnerTypes.map((p) => p.name),
                required: true,
              },
              {
                name: "message",
                label: t.partners.ideaLabel,
                kind: "textarea",
                placeholder: t.partners.ideaPh,
              },
            ]}
          />
        </Reveal>
      </div>
    </section>
  </div>
  );
};

export default Partners;
