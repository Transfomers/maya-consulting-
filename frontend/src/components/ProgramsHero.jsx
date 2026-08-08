import { ArrowRight, Briefcase, MapPin, Globe2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { IMAGES } from "@/lib/content";

const ProgramsHero = () => {
  const { t } = useLang();

  return (
    <div className="relative overflow-hidden bg-bone" data-testid="programs-hero">
      {/* Background Gradient Mesh */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] top-[10%] h-[60vw] max-h-[800px] w-[60vw] max-w-[800px] rounded-full bg-purple-300/40 mix-blend-multiply blur-[120px]" />
        <div className="absolute right-[10%] top-[-10%] h-[50vw] max-h-[700px] w-[50vw] max-w-[700px] rounded-full bg-blue-300/40 mix-blend-multiply blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] h-[60vw] max-h-[800px] w-[60vw] max-w-[800px] rounded-full bg-yellow-200/50 mix-blend-multiply blur-[120px]" />
        <div className="absolute -right-[10%] bottom-[10%] h-[50vw] max-h-[700px] w-[50vw] max-w-[700px] rounded-full bg-green-200/40 mix-blend-multiply blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1600px] items-center gap-12 px-5 py-24 md:px-10 md:py-32 lg:grid-cols-2">
        {/* Left Side: Text */}
        <div className="pt-10">
          <p className="mb-6 text-xs font-bold uppercase tracking-[0.3em] text-forest/50">
            {t.programs.eyebrow}
          </p>
          <h1 className="font-heading text-[12vw] font-semibold leading-[1.05] tracking-tight text-[#1a1a1a] sm:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]">
            {t.programs.h1a} <br />
            <span className="font-serif font-medium italic text-maple">{t.programs.h1accent}</span>
            {t.programs.h1post}
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-[#555] md:text-lg">
            {t.programs.intro}
          </p>
          
          <a
            href="#apply"
            className="group mt-12 inline-flex items-center gap-2 bg-forest px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-maple"
          >
            {t.programs.applyCta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* Right Side: Image & Glass Cards */}
        <div className="relative mx-auto mt-16 w-full max-w-[320px] sm:max-w-md lg:mt-10 lg:max-w-lg">
          <motion.div 
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative aspect-square overflow-hidden rounded-full border-[10px] border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
          >
            <img 
              src={IMAGES.portraitF} 
              alt="Program Participant" 
              className="h-full w-full object-cover" 
            />
          </motion.div>
          
          {/* Glassmorphism Card 1 */}
          <motion.div
            whileHover={{ scale: 1.05, zIndex: 30 }}
            className="absolute -left-8 top-[15%] flex items-center gap-4 rounded-2xl border border-white/50 bg-white/70 p-3 pr-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl sm:-left-12 sm:p-4 sm:pr-10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-forest shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-forest sm:text-sm">CAP Executive</p>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500"></span> Active
              </div>
            </div>
          </motion.div>
          
          {/* Glassmorphism Card 2 */}
          <motion.div
            whileHover={{ scale: 1.05, zIndex: 30 }}
            className="absolute -left-2 bottom-[20%] flex items-center gap-4 rounded-2xl border border-white/50 bg-white/70 p-3 pr-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl sm:-left-4 sm:p-4 sm:pr-10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-forest shadow-sm">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-forest sm:text-sm">Marketplace Lab</p>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-500"></span> Online
              </div>
            </div>
          </motion.div>
          
          {/* Glassmorphism Card 3 */}
          <motion.div
            whileHover={{ scale: 1.05, zIndex: 30 }}
            className="absolute -bottom-8 right-[5%] flex items-center gap-4 rounded-2xl border border-white/50 bg-white/70 p-3 pr-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl sm:-bottom-6 sm:right-[15%] sm:p-4 sm:pr-10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-forest shadow-sm">
              <Globe2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-forest sm:text-sm">Global Mobility</p>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                <span className="h-2 w-2 rounded-full bg-gray-400"></span> Intake open
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProgramsHero;
