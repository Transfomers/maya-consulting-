import { motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { IMAGES } from "@/lib/content";

const ContactHero = () => {
  const { t } = useLang();
  return (
    <section className="relative overflow-hidden border-b border-forest/15 bg-forest/5 py-24 md:py-32" data-testid="contact-hero">
      <div className="mx-auto grid max-w-[1600px] gap-16 px-5 md:px-10 lg:grid-cols-2 lg:items-center">
        {/* Left side: Text */}
        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-maple">
              <span className="inline-block h-px w-10 bg-maple" />
              {t.contact.eyebrow}
            </p>
            <h1 className="mt-6 font-heading text-4xl font-black tracking-tight text-forest sm:text-5xl md:text-6xl lg:text-7xl">
              {t.contact.h1a} <span className="font-serif font-medium italic text-maple">{t.contact.h1accent}</span>
            </h1>
            <p className="mt-8 text-base leading-relaxed text-sage md:text-xl">
              {t.contact.intro}
            </p>
          </motion.div>
        </div>

        {/* Right side photo */}
        <div className="relative h-[340px] w-full lg:h-[420px] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative aspect-square w-64 lg:w-80 overflow-hidden rounded-3xl border-4 border-white shadow-2xl"
          >
            <img
              src={IMAGES.community1}
              alt="Cap Entrepreneurs Contact & Support"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactHero;
