import { motion } from "framer-motion";
import { Lightbulb, Settings, Network, TrendingUp, Users, Target, Globe, Zap } from "lucide-react";
import { Reveal } from "@/components/motion";

const FEATURES = [
  { icon: Network, title: "Ecosystem Building", desc: "Connect with entrepreneurs and nonprofits across the country." },
  { icon: TrendingUp, title: "Measurable Impact", desc: "Track your growth and community contributions over time." },
  { icon: Users, title: "Peer Collaboration", desc: "Learn from and collaborate with like-minded innovators." },
  { icon: Target, title: "Strategic Mentorship", desc: "Get guidance from experienced business leaders." },
  { icon: Globe, title: "Global Mobility", desc: "Expand your operations into international markets." },
  { icon: Zap, title: "Innovation Lab", desc: "Test and refine your ideas in a supportive environment." },
];

const AboutBulbs = () => {
  return (
    <div className="overflow-hidden bg-white pt-24 md:pt-32" data-testid="about-bulbs">
      {/* Lightbulb Hero Section */}
      <section className="relative mx-auto max-w-[1600px] px-5 md:px-10">
        {/* Soft blob background */}
        <div className="absolute -left-[10%] top-0 h-[600px] w-[600px] rounded-full bg-vivid/10 blur-3xl" />
        <div className="absolute -right-[10%] bottom-0 h-[500px] w-[500px] rounded-full bg-maple/10 blur-3xl" />
        
        <div className="relative grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left: Lightbulb Illustration */}
          <Reveal>
            <div className="relative mx-auto flex h-[350px] w-full max-w-md items-center justify-center rounded-3xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] p-8 shadow-2xl">
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 text-white"
              >
                <Lightbulb className="h-40 w-40" strokeWidth={1.2} />
              </motion.div>
              
              {/* Gears floating */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute left-8 top-12 text-white/40"
              >
                <Settings className="h-16 w-16" strokeWidth={1.5} />
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-12 right-12 text-white/30"
              >
                <Settings className="h-24 w-24" strokeWidth={1} />
              </motion.div>
              
              {/* Sparkles */}
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute left-1/4 top-1/4 h-3 w-3 rounded-full bg-white blur-[1px]"
              />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute bottom-1/4 right-1/4 h-2 w-2 rounded-full bg-white blur-[1px]"
              />
            </div>
          </Reveal>
          
          {/* Right: Text */}
          <Reveal delay={0.2}>
            <h2 className="font-heading text-4xl font-black tracking-tight text-forest md:text-5xl">
              What is our approach?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-sage">
              We focus on revealing insights from collaborative networks. Our programs offer powerful learning models capable of extracting real-world knowledge to help you build sustainable businesses and communities.
            </p>
            <button className="mt-8 inline-flex items-center gap-2 bg-forest px-8 py-4 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-maple">
              Explore Scalability
            </button>
          </Reveal>
        </div>
      </section>

      {/* Grid Section */}
      <section className="relative z-10 mx-auto mt-32 max-w-[1600px] px-5 pb-24 md:px-10 md:pb-32">
        <Reveal>
          <div className="text-center">
            <h2 className="font-heading text-3xl font-black tracking-tight text-forest md:text-4xl">
              What You Can Do
            </h2>
          </div>
        </Reveal>
        
        <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 0.1}>
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] transition-transform hover:scale-110">
                  <feature.icon className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-xl font-bold tracking-tight text-forest">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-sage">
                  {feature.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutBulbs;
