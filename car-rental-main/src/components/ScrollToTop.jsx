import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * 1. Resets scroll position when route changes.
 * 2. Displays a high-contrast floating button on all pages (phone & desktop)
 *    allowing the user to smoothly scroll back to the top.
 */
function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  // Scroll to top automatically when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Show button when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`scroll-to-top-btn ${visible ? "is-visible" : ""}`}
      aria-label="Remonter en haut de page"
      title="Haut de page"
    >
      <i className="fa-solid fa-chevron-up"></i>
    </button>
  );
}

export default ScrollToTop;

