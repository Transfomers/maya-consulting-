import React, { useState, useEffect } from "react";
import { useTranslation } from "../context/LanguageContext";
import { CARS_CATALOGUE } from "../data/carsCatalogue";
import { API_BASE } from "../config/api";
import { getFavoriteCarIds, toggleFavoriteCar } from "../utils/customerAccounts";
import "./PromoCars.css";

function PromoCars() {
  const { t, lang } = useTranslation();
  const isFr = lang !== "en";
  const [favoriteIds, setFavoriteIds] = useState(() => getFavoriteCarIds());
  const [promoCars, setPromoCars] = useState(() => {
    const defaultPromos = CARS_CATALOGUE.filter((c) => c.isPromo);
    return defaultPromos.length >= 3 ? defaultPromos.slice(0, 3) : CARS_CATALOGUE.slice(0, 3);
  });
  const [activeId, setActiveId] = useState(null);

  const fetchPromoCars = () => {
    fetch(`${API_BASE}/promo-cars`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPromoCars(data);
        }
      })
      .catch((err) => {
        console.warn("Using fallback promo cars catalogue:", err);
      });
  };

  useEffect(() => {
    fetchPromoCars();
    const interval = setInterval(fetchPromoCars, 5000);
    window.addEventListener("focus", fetchPromoCars);
    const syncFavs = () => setFavoriteIds(getFavoriteCarIds());
    window.addEventListener("3m-favorites-changed", syncFavs);
    window.addEventListener("3m-client-auth-changed", syncFavs);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchPromoCars);
      window.removeEventListener("3m-favorites-changed", syncFavs);
      window.removeEventListener("3m-client-auth-changed", syncFavs);
    };
  }, []);

  const handleOpenPrivateChat = (car) => {
    window.dispatchEvent(new CustomEvent("3m-open-chat", { detail: { car } }));
  };

  const whatsappLink = (car) =>
    `https://wa.me/237691786447?text=${encodeURIComponent(
      `Bonjour 3M SERVICES, je souhaite profiter de l'offre promo sur le véhicule : ${car.name}. Est-il disponible ?`
    )}`;

  // Véhicule affiché : celui de l'onglet actif, sinon le premier
  const active = promoCars.find((c) => String(c.id) === String(activeId)) || promoCars[0];

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
              "Bénéficiez de tarifs préférentiels exclusifs sur notre flotte VIP révisée et assurée. Réservez et échangez directement avec nos conseillers."}
          </p>
        </div>

        {promoCars.length > 0 && active && (() => {
          const price = Number(active.promoPrice || active.pricePerDay) || 0;
          const regular = Number(active.regularPrice) || 0;
          const isFav = favoriteIds.includes(String(active.id));
          const specs = [
            { icon: "fa-car", label: isFr ? "Catégorie" : "Category", value: active.category },
            { icon: "fa-door-open", label: isFr ? "Portes" : "Doors", value: active.doors },
            { icon: "fa-user-group", label: isFr ? "Places" : "Seats", value: active.seats },
            { icon: "fa-gear", label: "Transmission", value: active.transmission },
            { icon: "fa-gas-pump", label: isFr ? "Carburant" : "Fuel", value: active.fuel },
            { icon: "fa-snowflake", label: isFr ? "Climatisation" : "Air conditioning", value: active.air },
          ].filter((x) => x.value);

          return (
            <>
              {/* Onglets : un par véhicule en promo */}
              <div className="promo-tabs" role="tablist" aria-label={isFr ? "Véhicules en promotion" : "Promo vehicles"}>
                {promoCars.map((car) => (
                  <button
                    key={car.id}
                    type="button"
                    role="tab"
                    aria-selected={String(car.id) === String(active.id)}
                    className={`promo-tab ${String(car.id) === String(active.id) ? "is-active" : ""}`}
                    onClick={() => setActiveId(car.id)}
                  >
                    {(car.name || car.model || "").replace(/\s*\(.*\)\s*/g, " ").trim()}
                  </button>
                ))}
              </div>

              {/* Détail du véhicule sélectionné */}
              <div className="promo-panel" role="tabpanel">
                <div className="promo-panel__media">
                  {active.promoBadge && (
                    <span className="promo-panel__badge">
                      <i className="fa-solid fa-bolt"></i> {active.promoBadge}
                    </span>
                  )}
                  <button
                    type="button"
                    className={`promo-panel__fav ${isFav ? "is-on" : ""}`}
                    onClick={() => setFavoriteIds(toggleFavoriteCar(active.id))}
                    aria-pressed={isFav}
                    aria-label={isFav ? (isFr ? "Retirer des favoris" : "Remove from favorites") : (isFr ? "Ajouter aux favoris" : "Add to favorites")}
                  >
                    <i className={isFav ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                  </button>
                  <img
                    key={active.id}
                    src={active.img || active.image || "/images/cars/toyota-landcruiser-v8-black.webp"}
                    alt={active.name}
                    onError={(e) => {
                      e.currentTarget.src = "/images/cars/toyota-prado-txl-front.webp";
                    }}
                  />
                </div>

                <div className="promo-panel__info">
                  <h3 className="promo-panel__name">{active.name}</h3>
                  {regular > price && price > 0 && (
                    <del className="promo-panel__old">{regular.toLocaleString("fr-FR")} FCFA</del>
                  )}
                  <div className="promo-panel__price">
                    {price ? `${price.toLocaleString("fr-FR")} FCFA` : active.price}
                  </div>
                  <span className="promo-panel__per">{isFr ? "location par jour" : "rent per day"}</span>

                  <ul className="promo-panel__specs">
                    {specs.map((sp) => (
                      <li key={sp.icon}>
                        <i className={`fa-solid ${sp.icon}`}></i>
                        <span>{sp.label} : {sp.value}</span>
                      </li>
                    ))}
                  </ul>

                  {active.promoDescription && <p className="promo-panel__desc">{active.promoDescription}</p>}

                  <div className="promo-panel__actions">
                    <button type="button" className="promo-panel__btn" onClick={() => handleOpenPrivateChat(active)}>
                      {isFr ? "Réserver" : "Book now"} <i className="fa-solid fa-circle-check"></i>
                    </button>
                    <a className="promo-panel__phone" href="tel:+237691786447">
                      <i className="fa-solid fa-phone"></i> +237 691 78 64 47
                    </a>
                    <a
                      className="promo-panel__wa"
                      href={whatsappLink(active)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="WhatsApp"
                      title="WhatsApp"
                    >
                      <i className="fa-brands fa-whatsapp"></i>
                    </a>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

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

    </section>
  );
}

export default PromoCars;
