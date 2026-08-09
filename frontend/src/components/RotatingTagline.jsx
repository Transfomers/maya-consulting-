import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const RotatingTagline = ({
  words = ["CREATE.", "SUPPORT.", "PROPEL."],
  className = "",
  interval = 2200,
}) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((v) => (v + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);

  return (
    <span className={`inline-flex overflow-hidden ${className}`} data-testid="rotating-tagline">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default RotatingTagline;
