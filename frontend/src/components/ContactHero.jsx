import { motion } from "framer-motion";
import { Calendar, Clock, ClipboardList, Settings, Bell, User } from "lucide-react";

const FloatingIcon = ({ icon: Icon, delay, duration, xRange, yRange, className }) => (
  <motion.div
    animate={{
      y: yRange,
      x: xRange,
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
      delay: delay,
    }}
    className={`absolute flex items-center justify-center rounded-full bg-white shadow-xl ${className}`}
  >
    <Icon className="h-1/2 w-1/2 text-maple" strokeWidth={1.5} />
  </motion.div>
);

import { useLang } from "@/lib/i18n";

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
            <h1 className="mt-6 font-heading text-5xl font-black tracking-tight text-forest md:text-7xl">
              {t.contact.h1a} <span className="font-serif font-medium italic text-maple">{t.contact.h1accent}</span>
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-sage md:text-xl">
              {t.contact.intro}
            </p>
          </motion.div>
        </div>

        {/* Right side: Playful floating icons illustration */}
        <div className="relative h-[400px] w-full lg:h-[500px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="absolute inset-0 m-auto flex h-56 w-56 items-center justify-center rounded-full border-4 border-maple bg-white text-forest shadow-2xl lg:h-72 lg:w-72"
          >
            <User className="h-1/2 w-1/2" strokeWidth={1} />
          </motion.div>
          
          <FloatingIcon
            icon={Calendar}
            delay={0}
            duration={4}
            xRange={["-10%", "10%"]}
            yRange={["-15%", "15%"]}
            className="left-[5%] top-[10%] h-20 w-20 md:left-[15%] md:top-[5%]"
          />
          
          <FloatingIcon
            icon={Bell}
            delay={1.5}
            duration={3.5}
            xRange={["-15%", "15%"]}
            yRange={["10%", "-10%"]}
            className="bottom-[10%] left-[0%] h-16 w-16 md:bottom-[20%] md:left-[10%]"
          />
          
          <FloatingIcon
            icon={ClipboardList}
            delay={0.5}
            duration={5}
            xRange={["-5%", "5%"]}
            yRange={["-20%", "10%"]}
            className="right-[5%] top-[20%] h-24 w-24 md:right-[15%] md:top-[15%]"
          />
          
          <FloatingIcon
            icon={Clock}
            delay={2}
            duration={4.5}
            xRange={["-20%", "20%"]}
            yRange={["-5%", "5%"]}
            className="bottom-[30%] right-[0%] h-14 w-14 md:bottom-[35%] md:right-[15%]"
          />
          
          <FloatingIcon
            icon={Settings}
            delay={1}
            duration={4}
            xRange={["-10%", "10%"]}
            yRange={["-10%", "10%"]}
            className="bottom-[5%] right-[40%] h-16 w-16"
          />
        </div>
      </div>
    </section>
  );
};

export default ContactHero;
