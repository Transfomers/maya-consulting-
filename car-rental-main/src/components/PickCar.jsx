import { useState, useRef, useEffect } from "react";
import CarBox from "./CarBox";
import { CAR_DATA } from "./CarData";
import { useTranslation } from "../context/LanguageContext";

function PickCar() {
  const { t } = useTranslation();
  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState("next");
  const buttonRefs = useRef([]);
  const trackRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchEndRef = useRef({ x: 0, y: 0 });

  const totalCars = CAR_DATA.length;

  const goToCar = (index, direction = "next") => {
    setSlideDirection(direction);
    setActiveCarIndex(index);
  };

  const nextCar = () => {
    const nextIdx = (activeCarIndex + 1) % totalCars;
    goToCar(nextIdx, "next");
  };

  const prevCar = () => {
    const prevIdx = (activeCarIndex - 1 + totalCars) % totalCars;
    goToCar(prevIdx, "prev");
  };

  // Scroll active tab into view horizontally on mobile
  useEffect(() => {
    const activeBtn = buttonRefs.current[activeCarIndex];
    if (activeBtn && trackRef.current) {
      const track = trackRef.current;
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const trackWidth = track.offsetWidth;
      const targetScroll = btnLeft - trackWidth / 2 + btnWidth / 2;
      track.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" });
    }
  }, [activeCarIndex]);

  // Touch swipe gesture handlers
  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    };
    touchEndRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchMove = (e) => {
    touchEndRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchEnd = () => {
    const diffX = touchStartRef.current.x - touchEndRef.current.x;
    const diffY = touchStartRef.current.y - touchEndRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;

    // Minimum swipe threshold: 40px and predominantly horizontal
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) && elapsed < 800) {
      if (diffX > 0) {
        nextCar();
      } else {
        prevCar();
      }
    }
  };

  return (
    <>
      <section className="pick-section" id="pick-section">
        <div className="container">
          <div className="pick-container">
            <div className="pick-container__title">
              <h3>{t("fleet_sub")}</h3>
              <h2>{t("fleet_title")}</h2>
              <p>{t("fleet_desc")}</p>
            </div>

            <div className="pick-container__car-content">
              {/* Buttons on top on phone (order: 1) */}
              <div className="pick-box-wrapper">
                <div className="pick-box" ref={trackRef} role="tablist">
                  {CAR_DATA.map((carArr, index) => {
                    const car = carArr[0];
                    const isActive = activeCarIndex === index;
                    return (
                      <button
                        key={car.name}
                        ref={(el) => (buttonRefs.current[index] = el)}
                        role="tab"
                        aria-selected={isActive}
                        className={`pick-car-btn ${isActive ? "colored-button active-tab" : ""}`}
                        onClick={() =>
                          goToCar(index, index >= activeCarIndex ? "next" : "prev")
                        }
                      >
                        {car.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info down below on phone (order: 2) with swipe */}
              <div
                className={`pick-cars-swipe-wrapper slide-${slideDirection}`}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Mobile navigation controls (arrows + dots + swipe hint) */}
                <div className="pick-mobile-controls">
                  <button
                    type="button"
                    className="pick-swipe-arrow prev"
                    onClick={prevCar}
                    aria-label="Véhicule précédent"
                  >
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>

                  <div className="pick-swipe-dots">
                    {CAR_DATA.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Aller au véhicule ${i + 1}`}
                        className={`pick-swipe-dot ${activeCarIndex === i ? "active" : ""}`}
                        onClick={() => goToCar(i, i >= activeCarIndex ? "next" : "prev")}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="pick-swipe-arrow next"
                    onClick={nextCar}
                    aria-label="Véhicule suivant"
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>

                <div className="pick-swipe-hint">
                  <i className="fa-solid fa-hand-pointer"></i> &nbsp;
                  <span>{t("swipe_hint") || "Glissez pour changer de véhicule ⟵ ⟶"}</span>
                </div>

                <div className="pick-active-car-view">
                  <CarBox key={activeCarIndex} data={CAR_DATA} carID={activeCarIndex} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default PickCar;
