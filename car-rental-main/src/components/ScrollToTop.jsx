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

  // Scroll to hash target if present, otherwise reset scroll to top on route change
  useEffect(() => {
    if (location.hash) {
      const scrollToHash = () => {
        const target = document.querySelector(location.hash);
        if (target) {
          target.scrollIntoView({ behavior: "auto" });
          return true;
        }
        return false;
      };

      if (!scrollToHash()) {
        const interval = setInterval(() => {
          if (scrollToHash()) clearInterval(interval);
        }, 100);
        const timeout = setTimeout(() => clearInterval(interval), 1500);
        return () => {
          clearInterval(interval);
          clearTimeout(timeout);
        };
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  // Show button when user scrolls down (supports mobile touch & desktop)
  useEffect(() => {
    const handleScroll = () => {
      const pos =
        window.pageYOffset ||
        window.scrollY ||
        (document.documentElement && document.documentElement.scrollTop) ||
        (document.body && document.body.scrollTop) ||
        0;
      if (pos > 60) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });

    // Initial check on mount / route transition
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
      document.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  const scrollToTop = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    } catch {
      window.scrollTo(0, 0);
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
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

