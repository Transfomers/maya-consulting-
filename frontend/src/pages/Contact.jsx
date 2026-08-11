import { Mail, MapPin, Compass } from "lucide-react";
import ContactHero from "@/components/ContactHero";
import FormShell from "@/components/FormShell";
import { Reveal } from "@/components/motion";
import { useLang } from "@/lib/i18n";
import { useSettings } from "@/lib/SettingsContext";

const Contact = () => {
  const { t } = useLang();
  const settings = useSettings();
  
  return (
  <div data-testid="contact-page">
    <ContactHero />

    <section className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12" data-testid="contact-content">
      <div className="lg:col-span-5">
        <Reveal>
          <div className="space-y-px border border-forest/15 bg-forest/15">
            {[
              { icon: Mail, label: t.contact.info[0].label, value: settings?.contact?.main_email || t.contact.info[0].value },
              { icon: MapPin, label: t.contact.info[1].label, value: settings?.contact?.address || t.contact.info[1].value },
              { icon: Compass, label: t.contact.info[2].label, value: settings?.contact?.phone || t.contact.info[2].value },
            ].map((c, i) => (
              <div key={c.label} className="flex items-start gap-5 bg-bone p-6 md:p-8" data-testid={`contact-info-${i}`}>
                <c.icon className="mt-1 h-6 w-6 shrink-0 text-maple" strokeWidth={1.5} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-sage">{c.label}</p>
                  <p className="mt-1.5 text-sm font-semibold leading-relaxed text-forest md:text-base">{c.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
        <h2 className="font-heading text-3xl font-black tracking-tight text-forest md:text-4xl">{t.contact.formTitle}</h2>
        <div className="mt-8">
          <FormShell
            type="contact"
            testId="contact-form"
            submitLabel={t.contact.submit}
            successMessage={t.contact.success}
            fields={[
              { name: "name", label: t.form.name, placeholder: t.form.namePh, required: true },
              { name: "email", label: t.form.email, kind: "email", placeholder: t.form.emailPh, required: true },
              {
                name: "subject",
                label: t.contact.topicLabel,
                kind: "select",
                placeholder: t.contact.topicPh,
                options: t.contact.topicOptions,
                required: true,
              },
              {
                name: "message",
                label: t.contact.messageLabel,
                kind: "textarea",
                placeholder: t.contact.messagePh,
                required: true,
              },
            ]}
          />
        </div>
      </Reveal>
    </section>
  </div>
  );
};

export default Contact;
