import { Link } from "react-router-dom";
import BgShape from "../images/hero/hero-bg.png";
import HeroCar from "../images/hero/main-car.png";
import { useTranslation } from "../context/LanguageContext";

function Hero() {
  const { t } = useTranslation();

  const bookBtn = (e) => {
    e.preventDefault();
    const bookingSection = document.querySelector("#booking-section");
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <section id="home" className="hero-section">
        <div className="container">
          <img className="bg-shape" src={BgShape} alt="bg-shape" />
          <div className="hero-content">
            <div className="hero-content__text">
              <h4 className="hero-subtitle">{t("hero_sub")}</h4>
              <h1 className="hero-title">
                {t("hero_title_1") || "Voyagez en grand"}
                <br />
                {t("hero_title_2") || "avec"} <span>3M SERVICES</span>
              </h1>
              <p className="hero-description">
                {t("hero_desc")}
              </p>
              <div className="hero-content__text__btns">
                <Link
                  onClick={bookBtn}
                  className="hero-content__text__btns__book-ride hero-btn-reserve"
                  to="/"
                >
                  <span>{t("hero_book")}</span>
                  <span className="hero-btn-badge hero-btn-badge--check" aria-hidden="true">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#C92A2A"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                </Link>
                <Link
                  className="hero-content__text__btns__learn-more hero-btn-fleet"
                  to="/models"
                >
                  <span className="hero-fleet-text--desktop">{t("hero_fleet")}</span>
                  <span className="hero-fleet-text--mobile">{t("hero_fleet_mobile") || "Flotte"}</span>
                  <span className="hero-btn-badge hero-btn-badge--chevron" aria-hidden="true">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#171717"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </Link>
              </div>
            </div>

            {/* Car image (in desktop: right side; in mobile: centered directly behind text) */}
            <img
              src={HeroCar}
              alt="3M Services Car"
              className="hero-content__car-img"
            />
          </div>
        </div>
      </section>
    </>
  );
}

export default Hero;
