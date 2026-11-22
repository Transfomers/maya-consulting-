import React, { useState, useEffect } from "react";
import { useTranslation } from "../context/LanguageContext";
import { CARS_CATALOGUE } from "../data/carsCatalogue";
import { API_BASE } from "../config/api";
import "./PromoCars.css";

function PromoCars() {
  const { t } = useTranslation();
  const [promoCars, setPromoCars] = useState(() => {
    const defaultPromos = CARS_CATALOGUE.filter((c) => c.isPromo);
    return defaultPromos.length >= 3 ? defaultPromos.slice(0, 3) : CARS_CATALOGUE.slice(0, 3);
  });
  const [activeModalCar, setActiveModalCar] = useState(null);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryDates, setInquiryDates] = useState("");
  const [inquirySent, setInquirySent] = useState(false);

  // Fetch live promo cars from backend if available
  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE}/promo-cars`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setPromoCars(data.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn("Using fallback promo cars catalogue:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const buildWhatsAppMessage = (car, clientName = "", dates = "") => {
    const promoPriceStr = (car.promoPrice || car.pricePerDay || 0).toLocaleString("fr-FR");
    const regPriceStr = (car.regularPrice || (car.promoPrice ? car.promoPrice * 1.18 : 0)).toLocaleString("fr-FR");

    let message =
      `*3M SERVICES — DEMANDE OFFRE PROMO VIP*\n\n` +
      `Bonjour l'équipe 3M SERVICES,\n\n` +
      `Je souhaite démarrer une conversation et profiter de l'offre promotionnelle sur le véhicule :\n` +
      `🚗 *${car.name}*\n` +
      `💰 *Tarif Promo Exceptionnel :* ${promoPriceStr} FCFA / jour` +
      (car.regularPrice ? ` _(au lieu de ${regPriceStr} FCFA)_\n` : `\n`) +
      `🛡️ *Inclus :* Chauffeur VIP dédié, Climatisation intégrale, Entretien certifié\n` +
      (dates ? `📅 *Période souhaitée :* ${dates}\n` : `📅 *Période :* À convenir ensemble\n`) +
      (clientName ? `👤 *Nom / Contact :* ${clientName}\n\n` : `\n`) +
      `Ce véhicule est-il disponible pour ces dates ? Merci pour votre prise en charge rapide !`;

    return encodeURIComponent(message);
  };

  const handleOpenPrivateChat = (car) => {
    window.dispatchEvent(
      new CustomEvent("3m-open-chat", {
        detail: {
          car,
          name: inquiryName,
          phone: inquiryPhone
        }
      })
    );
  };

  const handleStartConversation = (car) => {
    // 1. Prepare message and open WhatsApp direct conciergerie
    const msg = buildWhatsAppMessage(car);
    const waUrl = `https://wa.me/237691786447?text=${msg}`;
    window.open(waUrl, "_blank");

    // 2. Open quick feedback modal on page
    setActiveModalCar(car);
    setInquirySent(false);
  };

  const handleSubmitInquiry = (e) => {
    e.preventDefault();
    if (!activeModalCar) return;

    const msg = buildWhatsAppMessage(activeModalCar, inquiryName, inquiryDates);
    const waUrl = `https://wa.me/237691786447?text=${msg}`;
    window.open(waUrl, "_blank");
    setInquirySent(true);
  };

  return (
    <section className="promo-cars-section" id="offres-promo">
      <div className="container">
        {/* Header Title */}
        <div className="promo-cars-header">
          <div className="promo-cars-header__badge">
            <i className="fa-solid fa-fire text-danger"></i>
            <span>{t("promo_badge") || "OFFRES PROMOTIONNELLES DU MOMENT"}</span>
          </div>
          <h2 className="promo-cars-header__title">
            {t("promo_title") || "Nos Véhicules en Promotion — Forfaits VIP 3M SERVICES"}
          </h2>
          <p className="promo-cars-header__desc">
            {t("promo_desc") ||
              "Bénéficiez de tarifs préférentiels exclusifs sur notre flotte VIP avec chauffeur professionnel inclus. Réservez et échangez directement avec nos conseillers."}
          </p>
        </div>

        {/* 3 Promo Cards Grid */}
        <div className="promo-cars-grid">
          {promoCars.map((car, idx) => {
            const promoPrice = car.promoPrice || car.pricePerDay || 70000;
            const regularPrice = car.regularPrice || Math.round(promoPrice * 1.18);
            const savings = Math.max(0, regularPrice - promoPrice);
            const badgeText = car.promoBadge || (idx === 0 ? "OFFRE FLASH -15%" : idx === 1 ? "PROMO DU MOIS -17%" : "TARIF PRIVILÈGE -18%");
            const carImg = car.img || car.image || "/images/cars/toyota-landcruiser-v8-black.webp";

            return (
              <div className="promo-card" key={car.id || idx}>
                {/* Top Promo Ribbon */}
                <div className="promo-card__top-ribbon">
                  <span className="promo-card__badge">
                    <i className="fa-solid fa-bolt"></i> {badgeText}
                  </span>
                  <span className="promo-card__chauffeur-badge">
                    <i className="fa-solid fa-user-tie"></i> {t("promo_driver_included") || "Chauffeur inclus"}
                  </span>
                </div>

                {/* Car Image Preview */}
                <div className="promo-card__image-wrap">
                  <img
                    src={carImg}
                    alt={car.name}
                    className="promo-card__img"
                    onError={(e) => {
                      e.currentTarget.src = "/images/cars/toyota-prado-txl-front.webp";
                    }}
                  />
                  <div className="promo-card__category-tag">
                    {car.mark || "Toyota"} • {car.category || "VIP 4x4"}
                  </div>
                </div>

                {/* Car Details */}
                <div className="promo-card__body">
                  <h3 className="promo-card__title" title={car.name}>
                    {car.name}
                  </h3>

                  {/* Quick Specs Chips */}
                  <div className="promo-card__specs">
                    <span className="spec-chip">
                      <i className="fa-solid fa-users"></i> {car.seats || "7 places VIP"}
                    </span>
                    <span className="spec-chip">
                      <i className="fa-solid fa-gear"></i> {car.transmission || "Automatique 4x4"}
                    </span>
                    <span className="spec-chip">
                      <i className="fa-solid fa-snowflake"></i> {car.air ? "Clim auto" : "Clim bi-zone"}
                    </span>
                  </div>

                  {/* Highlights description */}
                  <p className="promo-card__description">
                    {car.promoDescription ||
                      car.description ||
                      "Véhicule de grand standing, intérieur cuir prestigieux, chauffeur VIP et service conciergerie 24/7 inclus."}
                  </p>

                  {/* Price Block */}
                  <div className="promo-card__price-box">
                    <div className="price-box__prices">
                      <div className="price-box__old-price">
                        <span>{t("promo_standard_price") || "Tarif standard"} :</span>
                        <s>{regularPrice.toLocaleString("fr-FR")} FCFA</s>
                      </div>
                      <div className="price-box__new-price">
                        <span className="price-amount">{promoPrice.toLocaleString("fr-FR")}</span>
                        <span className="price-currency">FCFA</span>
                        <span className="price-period">{t("promo_per_day") || "/ jour"}</span>
                      </div>
                    </div>
                    {savings > 0 && (
                      <div className="price-box__savings-badge">
                        <i className="fa-solid fa-arrow-trend-down"></i>
                        <span>
                          {t("promo_save_badge") || "Économisez"} {savings.toLocaleString("fr-FR")} F
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Uniform Call to Action Buttons: Private Chat 3M & WhatsApp Direct */}
                  <div className="promo-card__actions-group">
                    <button
                      type="button"
                      onClick={() => handleOpenPrivateChat(car)}
                      className="promo-card__btn-private-chat"
                      title="Échanger directement dans le Chat Privé 3M SERVICES"
                    >
                      <i className="fa-solid fa-comments"></i>
                      <span>Chat Privé 3M</span>
                      <i className="fa-solid fa-arrow-right arrow-icon"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartConversation(car)}
                      className="promo-card__btn-convo"
                      title="Démarrer une conversation WhatsApp avec un conseiller 3M SERVICES"
                    >
                      <i className="fa-brands fa-whatsapp"></i>
                      <span>WhatsApp Direct</span>
                      <i className="fa-solid fa-arrow-right arrow-icon"></i>
                    </button>
                  </div>

                  {/* Micro subtext info */}
                  <div className="promo-card__micro-info">
                    <i className="fa-solid fa-shield-halved text-success"></i>
                    <span>Disponibilité vérifiée • Réponse en moins de 15 min</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Conciergerie Banner footer */}
        <div className="promo-cars-footer-cta">
          <div className="footer-cta__text">
            <h4>
              <i className="fa-solid fa-headset me-2 text-danger"></i>
              Besoin d'un devis personnalisé ou d'une flotte complète pour un événement ?
            </h4>
            <p>Notre conciergerie VIP est à votre écoute 24h/24 et 7j/7 pour vos cortèges et délégations.</p>
          </div>
          <a
            href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20un%20devis%20personnalis%C3%A9%20pour%20la%20location%20de%20v%C3%A9hicules%20VIP."
            target="_blank"
            rel="noreferrer"
            className="footer-cta__btn"
          >
            <i className="fa-brands fa-whatsapp"></i>
            <span>Échanger avec la Conciergerie</span>
          </a>
        </div>
      </div>

      {/* Quick Interactive Inquiry Modal */}
      {activeModalCar && (
        <div className="promo-modal-backdrop" onClick={() => setActiveModalCar(null)}>
          <div className="promo-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="promo-modal-close"
              onClick={() => setActiveModalCar(null)}
              aria-label="Fermer"
            >
              &times;
            </button>

            <div className="promo-modal-header">
              <span className="promo-modal-badge">
                <i className="fa-solid fa-fire text-danger"></i> OFFRE PROMO SÉLECTIONNÉE
              </span>
              <h3>{activeModalCar.name}</h3>
              <div className="promo-modal-price">
                <span className="promo-val">
                  {(activeModalCar.promoPrice || activeModalCar.pricePerDay || 70000).toLocaleString("fr-FR")} FCFA / jour
                </span>
                {activeModalCar.regularPrice && (
                  <s className="regular-val">{activeModalCar.regularPrice.toLocaleString("fr-FR")} FCFA</s>
                )}
              </div>
            </div>

            {inquirySent ? (
              <div className="promo-modal-success">
                <i className="fa-solid fa-circle-check text-success fs-1"></i>
                <h4>Discussion WhatsApp Ouverte !</h4>
                <p>
                  Votre message a été transmis à notre service conciergerie. Un conseiller VIP 3M prend en charge votre demande sans délai.
                </p>
                <button
                  type="button"
                  className="promo-modal-btn-confirm"
                  onClick={() => setActiveModalCar(null)}
                >
                  Fermer cette fenêtre
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="promo-modal-form">
                <p className="promo-modal-intro">
                  Précisez vos informations ci-dessous pour ouvrir directement la discussion avec les détails pré-remplis :
                </p>

                <div className="promo-form-group">
                  <label htmlFor="inquiry-name">Votre Nom & Prénom *</label>
                  <input
                    type="text"
                    id="inquiry-name"
                    required
                    placeholder="Ex: Paul Biya, Jean Dupont..."
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                  />
                </div>

                <div className="promo-form-group">
                  <label htmlFor="inquiry-phone">Téléphone / WhatsApp *</label>
                  <input
                    type="tel"
                    id="inquiry-phone"
                    required
                    placeholder="Ex: +237 691 78 64 47"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                  />
                </div>

                <div className="promo-form-group">
                  <label htmlFor="inquiry-dates">Dates ou Période Souhaitée</label>
                  <input
                    type="text"
                    id="inquiry-dates"
                    placeholder="Ex: Du 25 au 28 Novembre (4 jours)"
                    value={inquiryDates}
                    onChange={(e) => setInquiryDates(e.target.value)}
                  />
                </div>

                <div className="promo-modal-actions">
                  <button
                    type="button"
                    className="promo-modal-btn-chat"
                    onClick={() => {
                      handleOpenPrivateChat(activeModalCar);
                      setActiveModalCar(null);
                    }}
                    title="Ouvrir la discussion dans l'environnement 3M"
                  >
                    <i className="fa-solid fa-comments"></i> Ouvrir le Chat Privé 3M (En direct)
                  </button>
                  <button type="submit" className="promo-modal-btn-wa">
                    <i className="fa-brands fa-whatsapp"></i> Démarrer la conversation WhatsApp
                  </button>
                  <a
                    href="tel:+237691786447"
                    className="promo-modal-btn-tel"
                    title="Appeler directement le standard 3M SERVICES"
                  >
                    <i className="fa-solid fa-phone"></i> Appeler (+237 691 78 64 47)
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default PromoCars;
