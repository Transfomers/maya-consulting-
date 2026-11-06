import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollReveal Component
 * Automatically observes sections, cards, and headers across the website
 * and triggers smooth slide & pop animations as they scroll into view.
 */
function ScrollReveal() {
  const location = useLocation();

  useEffect(() => {
    // If user prefers reduced motion, skip scroll animations
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("sr-visible");
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px 0px -40px 0px",
      threshold: 0.12,
    });

    // Elements to animate with different animation flavors
    const setupAnimations = () => {
      // 1. Slide Up targets
      const slideUpSelectors = [
        ".plan-container__title",
        ".choose-container__text",
        ".all-testimonials__title",
        ".faq-title",
        ".catalog-nav-header",
        ".book-banner .text-content",
        ".trust-banner-grid",
        ".about-main__text",
      ];

      // 2. Pop-in targets
      const popSelectors = [
        ".plan-container__boxes__box",
        ".trust-card",
        ".team-container__box",
        ".all-testimonials__box",
        ".faq-box",
      ];

      // 3. Slide from Left / Right
      const slideLeftSelectors = [
        ".choose-container__img",
        ".about-main__img",
      ];

      const slideRightSelectors = [
        ".choose-container__features",
      ];

      slideUpSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          if (!el.classList.contains("sr-visible")) {
            el.classList.add("sr-hidden", "sr-slide-up");
            observer.observe(el);
          }
        });
      });

      popSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          if (!el.classList.contains("sr-visible")) {
            el.classList.add("sr-hidden", "sr-pop");
            observer.observe(el);
          }
        });
      });

      slideLeftSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          if (!el.classList.contains("sr-visible")) {
            el.classList.add("sr-hidden", "sr-slide-left");
            observer.observe(el);
          }
        });
      });

      slideRightSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          if (!el.classList.contains("sr-visible")) {
            el.classList.add("sr-hidden", "sr-slide-right");
            observer.observe(el);
          }
        });
      });
    };

    // Small timeout to allow DOM mounting after route change
    const timer = setTimeout(setupAnimations, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [location.pathname]);

  return null;
}

export default ScrollReveal;

