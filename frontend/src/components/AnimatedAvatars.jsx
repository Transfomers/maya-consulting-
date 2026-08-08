import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";
import { useLang } from "@/lib/i18n";

const AVATAR_SEEDS = [
  "Felix", "Anita", "Jasper", "Chloe", "Sam", "Zoe", 
  "Oliver", "Mia", "Leo", "Ava", "Lucas", "Emma",
  "Noah", "Isabella", "Ethan", "Sophia", "Mason", "Charlotte"
];

const AnimatedAvatars = () => {
  const { t } = useLang();
  
  return (
    <section className="overflow-hidden border-t border-forest/15 bg-forest/5 py-16" data-testid="avatar-library">
      <div className="mx-auto max-w-[1600px] px-5 pb-10 text-center md:px-10">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-forest md:text-4xl">
          {t.home.avatarsTitle}
        </h2>
        <p className="mt-4 text-sm text-sage md:text-base">
          {t.home.avatarsSub}
        </p>
      </div>
      <Marquee speed={40} gradient={false} pauseOnHover>
        <div className="flex gap-8 px-4 py-4">
          {AVATAR_SEEDS.map((seed, i) => (
            <motion.div
              key={seed}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 5) * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.15, rotate: i % 2 === 0 ? 5 : -5 }}
              className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-maple bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] md:h-28 md:w-28"
            >
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffffff&mouth=smile`} 
                alt={`Community member ${seed}`} 
                className="h-full w-full object-cover"
              />
            </motion.div>
          ))}
        </div>
      </Marquee>
    </section>
  );
};

export default AnimatedAvatars;
