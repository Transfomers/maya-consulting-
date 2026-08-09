import PageHero from "@/components/PageHero";
import FormShell from "@/components/FormShell";
import { Reveal, ParallaxImage } from "@/components/motion";
import { IMAGES } from "@/lib/content";
import { GraduationCap, Users, Globe2 } from "lucide-react";
import { useLang } from "@/lib/i18n";



const Donate = () => {
  const { t } = useLang();
  const IMPACTS = [
    { icon: GraduationCap, title: t.donate.impacts[0].title, text: t.donate.impacts[0].text },
    { icon: Users, title: t.donate.impacts[1].title, text: t.donate.impacts[1].text },
    { icon: Globe2, title: t.donate.impacts[2].title, text: t.donate.impacts[2].text },
  ];
  return (
  <div data-testid="donate-page">
    <PageHero
      testId="donate-hero"
      eyebrow={t.donate.eyebrow}
      lines={[
        <>{t.donate.h1a}</>,
        <>
          {t.donate.h1pre && <span>{t.donate.h1pre}</span>}<span className="font-serif font-medium italic text-maple">{t.donate.h1accent}</span>{t.donate.h1post}
        </>,
      ]}
      intro={t.donate.intro}
    />

    <section className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12" data-testid="donate-impact-section">
      <div className="lg:col-span-7">
        <Reveal>
          <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
            {t.donate.impactTitle}
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
            {t.donate.imgCaption}
          </p>
        </Reveal>
      </div>
    </section>

    <section className="border-t border-forest/15 bg-forest text-bone" data-testid="pledge-form-section">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-vivid">
            <span className="inline-block h-px w-10 bg-vivid" />
            {t.donate.pledgeEyebrow}
          </p>
          <h2 className="font-heading text-4xl font-black tracking-tight md:text-5xl">{t.donate.pledgeTitle}</h2>
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
              submitLabel={t.donate.submit}
              successMessage={t.donate.success}
              fields={[
                { name: "name", label: t.form.name, placeholder: t.form.namePh, required: true },
                { name: "email", label: t.form.email, kind: "email", placeholder: t.form.emailPh, required: true },
                {
                  name: "amount",
                  label: t.donate.amountLabel,
                  kind: "radio",
                  options: ["$50", "$100", "$250", "$500", "$1,000"],
                  required: true,
                },
                { name: "customAmount", label: t.donate.customLabel, placeholder: t.donate.customPh },
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
};

export default Donate;
