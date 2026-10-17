import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Marquee from "react-fast-marquee";
import { Asterisk } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1];

export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      data-testid="scroll-progress"
      className="fixed left-0 top-0 z-[70] h-[3px] w-full origin-left"
      style={{ scaleX: scrollYProgress, background: "linear-gradient(90deg, #6725EB 0%, #7A3EF0 50%, #8F65DD 100%)" }}
    />
  );
};

export const Magnetic = ({ children, strength = 0.25, className = "" }) => {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    setOffset({
      x: (e.clientX - r.left - r.width / 2) * strength,
      y: (e.clientY - r.top - r.height / 2) * strength,
    });
  };
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 220, damping: 16, mass: 0.6 }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const FloatIcon = ({ Icon, className = "", delay = 0, testId }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.6 }}
    animate={{ opacity: 1, scale: 1, y: [0, -12, 0] }}
    transition={{
      opacity: { delay: delay + 0.8, duration: 0.8 },
      scale: { delay: delay + 0.8, duration: 0.8 },
      y: { delay, duration: 5, repeat: Infinity, ease: "easeInOut" },
    }}
    className={`pointer-events-none absolute ${className}`}
    data-testid={testId}
    aria-hidden="true"
  >
    <Icon className="h-10 w-10 text-forest/15" strokeWidth={1.25} />
  </motion.div>
);

export const Reveal = ({ children, delay = 0, y = 40, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.8, delay, ease: EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

export const KineticLines = ({ lines = [], className = "", lineClassName = "", delay = 0.1, testId }) => (
  <div className={className} data-testid={testId}>
    {lines.map((line, i) => (
      <div key={i} className="overflow-hidden pb-[0.08em] -mb-[0.08em]">
        <motion.div
          initial={{ y: "115%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 1, delay: delay + i * 0.13, ease: EASE }}
          className={lineClassName}
        >
          {line}
        </motion.div>
      </div>
    ))}
  </div>
);

export const ParallaxImage = ({ src, alt, className = "", speed = 0.12, testId }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${speed * 100}%`, `${speed * 100}%`]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} data-testid={testId}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y, scale: 1 + speed * 2 }}
        className="h-full w-full object-cover"
      />
    </div>
  );
};

export const EditorialMarquee = ({ items = [], dark = false, testId }) => {
  const safeItems = Array.isArray(items) && items.length > 0 ? items : [
    "PARTENARIATS STRATÉGIQUES",
    "INNOVATION SOCIALE",
    "TECH INCLUSIVE & DURABLE",
    "ÉCONOMIE CIRCULAIRE",
    "PASSERELLES MONDIALES",
    "CAP ENTREPRENEURS"
  ];
  return (
    <div
      className={`overflow-hidden border-y py-5 md:py-7 ${
        dark ? "border-bone/20 bg-forest" : "border-forest/15 bg-bone"
      }`}
      data-testid={testId}
    >
      <Marquee speed={28} gradient={false} pauseOnHover>
        {safeItems.map((item, i) => (
        <span key={i} className="mx-6 flex items-center gap-12 md:mx-10">
          <span
            className={`whitespace-nowrap font-heading text-3xl font-bold uppercase tracking-tight md:text-5xl ${
              dark ? "text-bone" : "text-outline"
            }`}
          >
            {item}
          </span>
          <Asterisk className={`h-6 w-6 md:h-8 md:w-8 ${dark ? "text-vivid" : "text-maple"}`} strokeWidth={1.5} />
        </span>
      ))}
      </Marquee>
    </div>
  );
};
