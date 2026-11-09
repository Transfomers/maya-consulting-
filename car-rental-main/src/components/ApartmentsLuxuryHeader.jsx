import React from "react";
import { useTranslation } from "../context/LanguageContext";
import "../styles/ApartmentsLuxuryHeader.css";

export default function ApartmentsLuxuryHeader() {
  const { lang } = useTranslation();
  const isFr = lang === "fr";

  return (
    <section className="apt-luxury-hero">
      <div className="apt-luxury-hero__container">
        {/* Left Side: Overlapping Aesthetic Photo Collage */}
        <div className="apt-luxury-hero__visuals">
          <div className="apt-luxury-hero__accent-gold"></div>

          <div className="apt-luxury-hero__frame-back">
            <img
              src="/Asset/appartements/appartement-meuble-chambre-bleue.webp"
              alt="Résidence de standing 3M SERVICES"
              className="apt-luxury-hero__img-back"
              loading="lazy"
            />
          </div>

          <div className="apt-luxury-hero__frame-front">
            <img
              src="/Asset/appartements/appartement-meuble-cuisine-equipee.webp"
              alt="Cuisine moderne équipée"
              className="apt-luxury-hero__img-front"
              loading="lazy"
            />
          </div>
        </div>

        {/* Right Side: Luxury Typography & Features */}
        <div className="apt-luxury-hero__content">
          <span className="apt-luxury-hero__eyebrow">
            {isFr ? "À Propos de nos Résidences" : "About 3M Residences"}
          </span>

          <h1 className="apt-luxury-hero__title">
            {isFr
              ? "LUXURY AND BEST SERVICE APPARTEMENTS DE GRAND STANDING"
              : "LUXURY AND BEST SERVICE VILLA & APARTMENTS IN YAOUNDÉ"}
          </h1>

          <p className="apt-luxury-hero__desc">
            {isFr
              ? "Situées à Tsinga (directement en face du siège de la FECAFOOT) et dans les quartiers résidentiels de Bastos, nos résidences meublées allient raffinement contemporain, autonomie énergétique absolue (groupe électrogène automatique, réserve d'eau), climatisation intégrale et conciergerie active 24/7."
              : "Located in Tsinga (opposite FECAFOOT headquarters) and prime Bastos residential quarters, our luxury serviced residences offer complete power autonomy (automatic generator, water supply), full air-conditioning, high-speed fiber, and 24/7 dedicated concierge."}
          </p>

          <div className="apt-luxury-hero__details-grid">
            {/* Bedroom Photo Card */}
            <div className="apt-luxury-hero__bedroom-card">
              <img
                src="/Asset/appartements/appartement-meuble-suite-parentale.webp"
                alt="Suite parentale grand confort"
                className="apt-luxury-hero__bedroom-img"
                loading="lazy"
              />
            </div>

            {/* 2 Green Feature Badges matching reference */}
            <div className="apt-luxury-hero__features">
              <div className="apt-luxury-hero__feature-item">
                <div className="apt-luxury-hero__icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 2v3m0 14v3M2 12h3m14 0h3m-3.5-6.5l-2.1 2.1m-8.8 8.8l-2.1 2.1m0-13l2.1 2.1m8.8 8.8l2.1 2.1"></path>
                  </svg>
                </div>
                <div className="apt-luxury-hero__feature-text">
                  <h4>{isFr ? "Peacefull Place" : "Peacefull Place"}</h4>
                  <p>
                    {isFr
                      ? "Cadre discret, paisible et ultrasécurisé 24/7 avec parking fermé."
                      : "Peaceful, serene and secure setting with private guarded parking."}
                  </p>
                </div>
              </div>

              <div className="apt-luxury-hero__feature-item">
                <div className="apt-luxury-hero__icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div className="apt-luxury-hero__feature-text">
                  <h4>{isFr ? "Top Travel" : "Top Travel"}</h4>
                  <p>
                    {isFr
                      ? "Accueil aéroport Nsimalen, fibre optique, ménage et conciergerie VIP."
                      : "Airport pickup, high-speed fiber, housekeeping & VIP concierge."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
