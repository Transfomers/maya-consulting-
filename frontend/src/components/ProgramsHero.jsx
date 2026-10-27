import { useLang } from "@/lib/i18n";
import { IMAGES } from "@/lib/content";
import { motion } from "framer-motion";

const ProgramsHero = () => {
  const { t } = useLang();

  return (
    <div className="relative overflow-hidden bg-bone border-b border-forest/15" data-testid="programs-hero">
      {/* Background Gradient Mesh */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[60vw] max-h-[800px] w-[60vw] max-w-[800px] rounded-full bg-purple-300/40 mix-blend-multiply blur-[120px]" />
        <div className="absolute -right-[10%] -top-[10%] h-[50vw] max-h-[700px] w-[50vw] max-w-[700px] rounded-full bg-blue-300/40 mix-blend-multiply blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] h-[60vw] max-h-[800px] w-[60vw] max-w-[800px] rounded-full bg-yellow-200/50 mix-blend-multiply blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1600px] items-center gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-2">
        {/* Left Side: Text */}
        <div className="pt-10">
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.3em] text-maple">
            {t.programs.eyebrow}
          </p>
          <h1 className="font-heading text-[11vw] font-black leading-[1.0] tracking-tight text-forest sm:text-6xl lg:text-[4.8rem] xl:text-[5.5rem]">
            {t.programs.h1a} <br />
            <span className="font-serif font-medium italic text-maple">{t.programs.h1accent}</span>
          </h1>
          <p className="mt-8 max-w-lg text-base leading-relaxed text-sage md:text-lg">
            {t.programs.intro}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#programs-list"
              className="group inline-flex items-center gap-2 bg-forest px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-maple"
            >
              {t.programs.discoverCta}
            </a>
          </div>
        </div>

        {/* Right Side: Image & Glass Cards */}
        <div className="relative mx-auto mt-12 w-full max-w-[340px] sm:max-w-md lg:mt-0 lg:max-w-lg">
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative aspect-square overflow-hidden rounded-full border-[10px] border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
          >
            <img
              src={IMAGES.workshop}
              alt="Program Workshop"
              className="h-full w-full object-cover"
            />
          </motion.div>

          {/* Glass Card 1 - 3M Services Mobilité */}
          <motion.div
            whileHover={{ scale: 1.05, zIndex: 30 }}
            className="absolute -left-6 top-[10%] rounded-2xl border border-white/60 bg-white/90 p-4 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl sm:-left-10"
          >
            <p className="text-xs font-bold text-forest sm:text-sm">3M Services Mobilité</p>
            <p className="text-[10px] font-bold text-maple uppercase tracking-wider">Circular Tech</p>
          </motion.div>

          {/* Glass Card 2 - AgriConnect */}
          <motion.div
            whileHover={{ scale: 1.05, zIndex: 30 }}
            className="absolute -left-2 bottom-[15%] rounded-2xl border border-white/60 bg-white/90 p-4 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl sm:-left-6"
          >
            <p className="text-xs font-bold text-forest sm:text-sm">AgriConnect</p>
            <p className="text-[10px] font-bold text-maple uppercase tracking-wider">Digital Agriculture</p>
          </motion.div>

          {/* Glass Card 3 - Safe Vibe */}
          <motion.div
            whileHover={{ scale: 1.05, zIndex: 30 }}
            className="absolute -bottom-6 right-[5%] rounded-2xl border border-white/60 bg-white/90 p-4 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl sm:-bottom-4 sm:right-[10%]"
          >
            <p className="text-xs font-bold text-forest sm:text-sm">Safe Vibe</p>
            <p className="text-[10px] font-bold text-maple uppercase tracking-wider">Digital Media & Edu</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProgramsHero;
