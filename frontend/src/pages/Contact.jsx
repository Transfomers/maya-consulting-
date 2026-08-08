import { Mail, MapPin, Compass } from "lucide-react";
import ContactHero from "@/components/ContactHero";
import FormShell from "@/components/FormShell";
import { Reveal } from "@/components/motion";

const Contact = () => (
  <div data-testid="contact-page">
    <ContactHero />

    <section className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-12" data-testid="contact-content">
      <div className="lg:col-span-5">
        <Reveal>
          <div className="space-y-px border border-forest/15 bg-forest/15">
            {[
              { icon: Mail, label: "Email", value: "info@capentrepreneurs.ca" },
              { icon: MapPin, label: "Based in", value: "Canada — serving communities nationwide and internationally" },
              { icon: Compass, label: "Looking for", value: "Programs, membership, partnerships, volunteering or donations" },
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
        <h2 className="font-heading text-3xl font-black tracking-tight text-forest md:text-4xl">Send us a message</h2>
        <div className="mt-8">
          <FormShell
            type="contact"
            testId="contact-form"
            submitLabel="Send Message"
            successMessage="Message sent — we'll get back to you shortly."
            fields={[
              { name: "name", label: "Full name", placeholder: "Your full name", required: true },
              { name: "email", label: "Email", kind: "email", placeholder: "you@example.com", required: true },
              {
                name: "subject",
                label: "Topic",
                kind: "select",
                placeholder: "Select a topic",
                options: ["Programs", "Membership", "Partnerships", "Donations", "Volunteering", "Media", "Other"],
                required: true,
              },
              {
                name: "message",
                label: "Message",
                kind: "textarea",
                placeholder: "How can we help?",
                required: true,
              },
            ]}
          />
        </div>
      </Reveal>
    </section>
  </div>
);

export default Contact;
