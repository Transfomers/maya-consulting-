import { useCallback, useEffect, useRef, useState } from "react";
import "../styles/HeroSlider.css";

/**
 * Bannière plein écran : les photos glissent horizontalement (flèches, points, swipe, défilement auto).
 * slides: [{ image, title, subtitle, cta: { label, href, external? } }]
 */
export default function HeroSlider({ slides, interval = 6000, ariaLabel = "Bannière" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const count = slides.length;

  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (paused || reduce || count < 2) return undefined;
    const t = setTimeout(next, interval);
    return () => clearTimeout(t);
  }, [index, paused, interval, next, count]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  return (
    <section
      className="hero-slider"
      aria-roledescription="carrousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
        touchX.current = null;
      }}
    >
      <div className="hero-slider__track" style={{ transform: `translateX(-${index * 100}%)` }}>
      {slides.map((s, i) => (
        <div
          key={s.title}
          className={`hero-slider__slide ${i === index ? "is-active" : ""}`}
          role="group"
          aria-roledescription="diapositive"
          aria-label={`${i + 1} / ${count}`}
          aria-hidden={i !== index}
        >
          <img className="hero-slider__img" src={s.image} alt="" loading={i === 0 ? "eager" : "lazy"} />
          <div className="hero-slider__overlay" />
          <div className="hero-slider__content">
            {i === 0 ? <h1>{s.title}</h1> : <h2>{s.title}</h2>}
            <p>{s.subtitle}</p>
            {s.cta && (
              <a
                className="hero-slider__btn"
                href={s.cta.href}
                tabIndex={i === index ? 0 : -1}
                {...(s.cta.external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {s.cta.label}
              </a>
            )}
          </div>
        </div>
      ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" className="hero-slider__arrow hero-slider__arrow--prev" onClick={prev} aria-label="Diapositive précédente">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button type="button" className="hero-slider__arrow hero-slider__arrow--next" onClick={next} aria-label="Diapositive suivante">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
          <div className="hero-slider__dots">
            {slides.map((s, i) => (
              <button
                key={s.title}
                type="button"
                className={i === index ? "is-active" : ""}
                onClick={() => go(i)}
                aria-label={`Aller à la diapositive ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
