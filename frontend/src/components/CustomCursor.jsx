import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName.toLowerCase() === "button" ||
        target.tagName.toLowerCase() === "a" ||
        target.closest("button") ||
        target.closest("a")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isVisible]);

  // Hide cursor on touch devices to prevent annoying stuck cursors
  if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
    return null;
  }

  return (
    <>
      {/* Small dot that follows exactly */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E20713]"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          scale: isHovering ? 2.5 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 1000,
          damping: 40,
          mass: 0.1,
        }}
      />
      
      {/* Larger trailing ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[#E20713]/70 bg-[#E20713]/15 backdrop-blur-[1px]"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          scale: isHovering ? 1.5 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 250,
          damping: 20,
          mass: 0.8,
        }}
      />
    </>
  );
};

export default CustomCursor;
