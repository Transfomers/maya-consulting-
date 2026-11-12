import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../context/LanguageContext";
import "../styles/ShowcaseHeroHeader.css";

// Default images
import pradoImg from "../images/cars/toyota-prado-txl-front.webp";
import benzImg from "../images/cars/mercedes-classe-e-front.webp";
import rav4Img from "../images/cars/toyota-rav4-front.webp";

function ShowcaseHeroHeader({ type = "models" }) {
  const { lang } = useTranslation();
  const isFr = lang === "fr";
  const [activeDot, setActiveDot] = useState(0);
  const isApartment = type === "apartments";

  // Configuration tailored to each page
  let config = {};

  if (type === "models") {
    config = {
      main: {
        themeClass: "showcase-main-banner__overlay--cyan",
        bgImage: "none",
        eyebrow: isFr ? "OFFRE SPÉCIALE • LOCATION VIP & FLOTTE 3M" : "SPECIAL OFFER • VIP FLEET 3M",
        title: isFr ? "VOYAGEZ EN TOUTE SÉRÉNITÉ AU CAMEROUN" : "TRAVEL WITH COMPLETE PEACE OF MIND IN CAMEROON",
        btnOutline: {
          label: isFr ? "Voir la Flotte" : "View Fleet",
          link: "#catalog-section",
          isAnchor: true,
        },
        btnSolid: {
          label: isFr ? "Réserver WhatsApp" : "Book WhatsApp",
          link: "https://wa.me/237691786447?text=Bonjour%203M%20SERVICES%2C%20je%20souhaite%20r%C3%A9server%20un%20v%C3%A9hicule",
          isExternal: true,
        },
        floatImg: pradoImg,
      },
      topCard: {
        themeClass: "showcase-side-card--orange",
        eyebrow: isFr ? "TOP ARRIVAGE • PRESTIGE" : "TOP ARRIVAL • PRESTIGE",
        title: "TOYOTA PRADO TXL VIP",
        subtext: isFr ? "Chauffeur bilingue • Accueil Nsimalen" : "Bilingual Chauffeur • Nsimalen Airport Pickup",
        img: rav4Img,
        link: "https://wa.me/237691786447?text=Demande%20Toyota%20Prado%20VIP",
      },
      bottomCard: {
        themeClass: "showcase-side-card--blue",
        eyebrow: isFr ? "BERLINE DE DIRECTION" : "EXECUTIVE SEDAN",
        title: "MERCEDES-BENZ CLASSE E",
        subtext: isFr ? "Dès 70 000 FCFA / jour avec chauffeur" : "From 70 000 FCFA / day with chauffeur",
        img: benzImg,
        link: "https://wa.me/237691786447?text=Demande%20Mercedes%20Classe%20E%20VIP",
      },
    };
  } else if (type === "apartments") {
    config = {
      main: {
        themeClass: "showcase-main-banner__overlay--cyan",
        bgImage: "url('/Asset/appartements/appartement-meuble-suite-parentale.webp')",
        eyebrow: isFr ? "GRAND STANDING • YAOUNDÉ" : "LUXURY FURNISHED RESIDENCES",
        title: isFr ? "VOS RÉSIDENCES MEUBLÉES FACE FECAFOOT" : "EXECUTIVE APARTMENTS IN TSINGA",
        btnOutline: {
          label: isFr ? "Voir les Logements" : "View Properties",
          link: "#apartments-grid-section",
          isAnchor: true,
        },
        btnSolid: {
          label: isFr ? "Réserver en 1-Clic" : "Book Instant",
          link: "https://wa.me/237691786447?text=Bonjour%203M%20SERVICES%2C%20je%20souhaite%20r%C3%A9server%20un%20appartement%20meubl%C3%A9%20%C3%A0%20Tsinga",
          isExternal: true,
        },
        floatImg: "/Asset/appartements/appartement-meuble-chambre-bleue.webp",
      },
      topCard: {
        themeClass: "showcase-side-card--orange",
        eyebrow: isFr ? "NOUVELLE RÉSIDENCE" : "NEW ARRIVAL",
        title: "SUITE COSY TSINGA",
        subtext: isFr ? "Dès 40 000 FCFA / nuit • Long séjour" : "From 40 000 FCFA / night • Long stay",
        img: "/Asset/appartements/appartement-meuble-chambre-bleue.webp",
        link: "https://wa.me/237691786447?text=Reservation%20Suite%20Cosy%20Tsinga",
      },
      bottomCard: {
        themeClass: "showcase-side-card--blue",
        eyebrow: isFr ? "SÉCURITÉ & CONFORT 24/7" : "ENJOY THE COMFORT",
        title: "GRAND STANDING T4",
        subtext: isFr ? "Groupe électrogène • WiFi Fibre" : "Auto Generator • Fiber WiFi",
        img: "/Asset/appartements/appartement-meuble-suite-parentale.webp",
        link: "https://wa.me/237691786447?text=Reservation%20Grand%20Standing%20Tsinga",
      },
    };
  } else {
    // About Page Header
    config = {
      main: {
        themeClass: "showcase-main-banner__overlay--cyan",
        bgImage: "url('/Asset/appartements/appartement-meuble-suite-parentale.webp')",
        eyebrow: isFr ? "3M SERVICES • YAOUNDÉ" : "PREMIER MOBILITY & LIVING",
        title: isFr ? "L'EXCELLENCE AUTOMOBILE ET IMMOBILIÈRE" : "EXPERIENCE EXCELLENCE IN YAOUNDÉ",
        btnOutline: {
          label: isFr ? "Notre Histoire" : "Our Story",
          link: "#about-content-section",
          isAnchor: true,
        },
        btnSolid: {
          label: isFr ? "Contacter 24/7" : "Contact 24/7",
          link: "https://wa.me/237691786447?text=Bonjour%203M%20SERVICES%2C%20je%20souhaite%20des%20informations",
          isExternal: true,
        },
        floatImg: pradoImg,
      },
      topCard: {
        themeClass: "showcase-side-card--orange",
        eyebrow: isFr ? "LOCATION & LEASING" : "FLEET & LEASING",
        title: isFr ? "LEASING AUTOMOBILE" : "AUTOMOTIVE LEASING",
        subtext: isFr ? "Conditions & formules sur demande" : "Custom terms & plans upon request",
        img: benzImg,
        link: "#leasing-section",
      },
      bottomCard: {
        themeClass: "showcase-side-card--blue",
        eyebrow: isFr ? "RÉSIDENCES & SÉJOURS" : "PRESTIGE RESIDENCES",
        title: isFr ? "NOS APPARTEMENTS MEUBLÉS" : "OUR FURNISHED APARTMENTS",
        subtext: isFr ? "Grand standing Tsinga (face FECAFOOT) & Omnisports" : "Executive suites in Tsinga & Omnisports",
        img: "/Asset/appartements/appartement-meuble-salon-standing.webp",
        link: "/apartments",
      },
    };
  }

  const handleAnchorClick = (e, targetId) => {
    e.preventDefault();
    const id = targetId.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="showcase-hero">
      <div className="showcase-hero__grid">
        {/* Left Main Large Hero Banner */}
        <div className="showcase-main-banner">
          <div className={`showcase-main-banner__overlay ${config.main.themeClass}`}></div>

          <div className="showcase-main-banner__content">
            <span className="showcase-main-banner__eyebrow">{config.main.eyebrow}</span>
            <h1 className="showcase-main-banner__title">{config.main.title}</h1>

            <div className="showcase-main-banner__buttons">
              {config.main.btnOutline.isAnchor ? (
                <a
                  href={config.main.btnOutline.link}
                  onClick={(e) => handleAnchorClick(e, config.main.btnOutline.link)}
                  className="showcase-btn showcase-btn--outline"
                >
                  {config.main.btnOutline.label}
                </a>
              ) : (
                <Link to={config.main.btnOutline.link} className="showcase-btn showcase-btn--outline">
                  {config.main.btnOutline.label}
                </Link>
              )}

              {config.main.btnSolid.isExternal ? (
                <a
                  href={config.main.btnSolid.link}
                  target="_blank"
                  rel="noreferrer"
                  className="showcase-btn showcase-btn--solid"
                >
                  {config.main.btnSolid.label}
                </a>
              ) : (
                <Link to={config.main.btnSolid.link} className="showcase-btn showcase-btn--solid">
                  {config.main.btnSolid.label}
                </Link>
              )}
            </div>

            {/* Slider Dots */}
            <div className="showcase-main-banner__dots">
              <span
                className={`showcase-dot ${activeDot === 0 ? "showcase-dot--active" : ""}`}
                onClick={() => setActiveDot(0)}
              ></span>
              <span
                className={`showcase-dot ${activeDot === 1 ? "showcase-dot--active" : ""}`}
                onClick={() => setActiveDot(1)}
              ></span>
              <span
                className={`showcase-dot ${activeDot === 2 ? "showcase-dot--active" : ""}`}
                onClick={() => setActiveDot(2)}
              ></span>
            </div>
          </div>

          {/* Floating Right Product Imagery */}
          {config.main.floatImg && (
            <img
              src={config.main.floatImg}
              alt="3M SERVICES Showcase"
              className={`showcase-main-banner__img-float ${isApartment ? "showcase-main-banner__img-float--photo" : "showcase-main-banner__img-float--framed"}`}
            />
          )}
        </div>

        {/* Right Column: 2 Stacked Feature Banners */}
        {/* Right Column: 2 Stacked Feature Banners */}
        <div className="showcase-side-column">
          {/* Top Banner (Orange / Accent) */}
          {config.topCard.link.startsWith("#") ? (
            <a
              href={config.topCard.link}
              onClick={(e) => handleAnchorClick(e, config.topCard.link)}
              className={`showcase-side-card ${config.topCard.themeClass}`}
            >
              <div className="showcase-side-card__content">
                <span className="showcase-side-card__eyebrow">{config.topCard.eyebrow}</span>
                <h3 className="showcase-side-card__title">{config.topCard.title}</h3>
                <p className="showcase-side-card__subtext">{config.topCard.subtext}</p>
                <span className="showcase-side-card__action">
                  <span>{isFr ? "En Savoir Plus" : "Explore Now"}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
              </div>
              <div className="showcase-side-card__img-wrap">
                <img
                  src={config.topCard.img}
                  alt={config.topCard.title}
                  className={`showcase-side-card__img ${isApartment ? "showcase-side-card__img--photo" : "showcase-side-card__img--car"}`}
                />
              </div>
            </a>
          ) : config.topCard.link.startsWith("/") ? (
            <Link
              to={config.topCard.link}
              className={`showcase-side-card ${config.topCard.themeClass}`}
            >
              <div className="showcase-side-card__content">
                <span className="showcase-side-card__eyebrow">{config.topCard.eyebrow}</span>
                <h3 className="showcase-side-card__title">{config.topCard.title}</h3>
                <p className="showcase-side-card__subtext">{config.topCard.subtext}</p>
                <span className="showcase-side-card__action">
                  <span>{isFr ? "En Savoir Plus" : "Explore Now"}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
              </div>
              <div className="showcase-side-card__img-wrap">
                <img
                  src={config.topCard.img}
                  alt={config.topCard.title}
                  className={`showcase-side-card__img ${isApartment ? "showcase-side-card__img--photo" : "showcase-side-card__img--car"}`}
                />
              </div>
            </Link>
          ) : (
            <a
              href={config.topCard.link}
              target={config.topCard.link.startsWith("http") ? "_blank" : undefined}
              rel={config.topCard.link.startsWith("http") ? "noreferrer" : undefined}
              className={`showcase-side-card ${config.topCard.themeClass}`}
            >
              <div className="showcase-side-card__content">
                <span className="showcase-side-card__eyebrow">{config.topCard.eyebrow}</span>
                <h3 className="showcase-side-card__title">{config.topCard.title}</h3>
                <p className="showcase-side-card__subtext">{config.topCard.subtext}</p>
                <span className="showcase-side-card__action">
                  <span>{isFr ? "En Savoir Plus" : "Explore Now"}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
              </div>
              <div className="showcase-side-card__img-wrap">
                <img
                  src={config.topCard.img}
                  alt={config.topCard.title}
                  className={`showcase-side-card__img ${isApartment ? "showcase-side-card__img--photo" : "showcase-side-card__img--car"}`}
                />
              </div>
            </a>
          )}

          {/* Bottom Banner (Blue / Navy) */}
          {config.bottomCard.link.startsWith("#") ? (
            <a
              href={config.bottomCard.link}
              onClick={(e) => handleAnchorClick(e, config.bottomCard.link)}
              className={`showcase-side-card ${config.bottomCard.themeClass}`}
            >
              <div className="showcase-side-card__content">
                <span className="showcase-side-card__eyebrow">{config.bottomCard.eyebrow}</span>
                <h3 className="showcase-side-card__title">{config.bottomCard.title}</h3>
                <p className="showcase-side-card__subtext">{config.bottomCard.subtext}</p>
                <span className="showcase-side-card__action">
                  <span>{isFr ? "Découvrir" : "Discover"}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
              </div>
              <div className="showcase-side-card__img-wrap">
                <img
                  src={config.bottomCard.img}
                  alt={config.bottomCard.title}
                  className={`showcase-side-card__img ${isApartment ? "showcase-side-card__img--photo" : "showcase-side-card__img--car"}`}
                />
              </div>
            </a>
          ) : config.bottomCard.link.startsWith("/") ? (
            <Link
              to={config.bottomCard.link}
              onClick={() => window.scrollTo(0, 0)}
              className={`showcase-side-card ${config.bottomCard.themeClass}`}
            >
              <div className="showcase-side-card__content">
                <span className="showcase-side-card__eyebrow">{config.bottomCard.eyebrow}</span>
                <h3 className="showcase-side-card__title">{config.bottomCard.title}</h3>
                <p className="showcase-side-card__subtext">{config.bottomCard.subtext}</p>
                <span className="showcase-side-card__action">
                  <span>{isFr ? "Découvrir" : "Discover"}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
              </div>
              <div className="showcase-side-card__img-wrap">
                <img
                  src={config.bottomCard.img}
                  alt={config.bottomCard.title}
                  className={`showcase-side-card__img ${isApartment || (config.bottomCard.img && config.bottomCard.img.includes("appartement")) ? "showcase-side-card__img--photo" : "showcase-side-card__img--car"}`}
                />
              </div>
            </Link>
          ) : (
            <a
              href={config.bottomCard.link}
              target={config.bottomCard.link.startsWith("http") ? "_blank" : undefined}
              rel={config.bottomCard.link.startsWith("http") ? "noreferrer" : undefined}
              className={`showcase-side-card ${config.bottomCard.themeClass}`}
            >
              <div className="showcase-side-card__content">
                <span className="showcase-side-card__eyebrow">{config.bottomCard.eyebrow}</span>
                <h3 className="showcase-side-card__title">{config.bottomCard.title}</h3>
                <p className="showcase-side-card__subtext">{config.bottomCard.subtext}</p>
                <span className="showcase-side-card__action">
                  <span>{isFr ? "Découvrir" : "Discover"}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
              </div>
              <div className="showcase-side-card__img-wrap">
                <img
                  src={config.bottomCard.img}
                  alt={config.bottomCard.title}
                  className={`showcase-side-card__img ${isApartment ? "showcase-side-card__img--photo" : "showcase-side-card__img--car"}`}
                />
              </div>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShowcaseHeroHeader;

