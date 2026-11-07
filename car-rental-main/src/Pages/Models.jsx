import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import ShowcaseHeroHeader from "../components/ShowcaseHeroHeader";
import { useTranslation } from "../context/LanguageContext";
import { CARS_CATALOGUE } from "../data/carsCatalogue";
import defaultCarImg from "../images/cars/toyota-prado-txl-front.webp";
import { API_BASE } from "../config/api";
import "../styles/CatalogEcommerce.css";

function Models() {
  const { lang } = useTranslation();
  const isFr = lang === "fr";

  const [cars, setCars] = useState(CARS_CATALOGUE);
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCarForModal, setSelectedCarForModal] = useState(null);

  // Attempt to fetch fresh data from backend API, fall back to CARS_CATALOGUE
  useEffect(() => {
    fetch(`${API_BASE}/cars`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCars(data);
        }
      })
      .catch(() => {
        // Fallback to static catalogue silently
      });
  }, []);

  const filterTabs = [
    { label: isFr ? "Tous" : "All", value: "Tous" },
    { label: "SUV & 4x4", value: "SUV" },
    { label: "Toyota", value: "Toyota" },
    { label: "Mercedes-Benz", value: "Mercedes" },
    { label: "Kia", value: "Kia" },
    { label: "Hyundai", value: "Hyundai" },
    { label: isFr ? "Neuve (0 km)" : "Brand New (0 km)", value: "Neuve" },
  ];

  const filteredCars = cars.filter((car) => {
    const brand = (car.brand || car.mark || "").toLowerCase();
    const name = (car.name || car.model || "").toLowerCase();
    const category = (car.category || "").toLowerCase();
    const condition = (car.condition || "").toLowerCase();

    // Match filter tab
    let matchesFilter = true;
    if (selectedFilter === "Toyota") {
      matchesFilter =
        brand.includes("toyota") ||
        name.includes("toyota") ||
        name.includes("rav4") ||
        name.includes("prado") ||
        name.includes("camry") ||
        name.includes("corolla") ||
        name.includes("fortuner") ||
        name.includes("landcruiser");
    } else if (selectedFilter === "Mercedes") {
      matchesFilter =
        brand.includes("mercedes") ||
        name.includes("mercedes") ||
        name.includes("benz") ||
        name.includes("maybach") ||
        name.includes("ml350");
    } else if (selectedFilter === "Kia") {
      matchesFilter =
        brand.includes("kia") ||
        name.includes("kia") ||
        name.includes("sportage") ||
        name.includes("seltos") ||
        name.includes("sonet") ||
        name.includes("rio") ||
        name.includes("pegas") ||
        name.includes("carens") ||
        name.includes("cerato");
    } else if (selectedFilter === "Hyundai") {
      matchesFilter =
        brand.includes("hyundai") ||
        name.includes("hyundai") ||
        name.includes("santa fe") ||
        name.includes("kona");
    } else if (selectedFilter === "SUV") {
      matchesFilter =
        category.includes("suv") ||
        category.includes("4x4") ||
        name.includes("prado") ||
        name.includes("rav4") ||
        name.includes("fortuner") ||
        name.includes("sportage") ||
        name.includes("santa fe") ||
        name.includes("grand cherokee") ||
        name.includes("cherokee");
    } else if (selectedFilter === "Neuve") {
      matchesFilter =
        condition.includes("neuve") ||
        condition.includes("0 km") ||
        (car.mileage && car.mileage.includes("0 km"));
    }

    // Match search query
    let matchesSearch = true;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch =
        name.includes(q) ||
        brand.includes(q) ||
        category.includes(q) ||
        condition.includes(q) ||
        (car.year && String(car.year).includes(q));
    }

    return matchesFilter && matchesSearch;
  });

  const getWhatsAppBookingLink = (car) => {
    const carName = car.name || car.model || "Véhicule 3M";
    const carYear = car.year || "2024";
    const text = encodeURIComponent(
      `Bonjour 3M SERVICES,\n\nJe souhaite réserver le véhicule suivant :\n` +
      `• Modèle : ${carName} (${carYear})\n` +
      `• Catégorie : ${car.category || "VIP / Flotte"}\n` +
      `• État : ${car.condition || "Véhicule révisé"}\n` +
      `• Transmission : ${car.transmission || "Automatique"}\n\n` +
      `Merci de m'indiquer la disponibilité et les modalités de réservation.`
    );
    return `https://wa.me/237691786447?text=${text}`;
  };

  return (
    <>
      <section className="catalog-ecom-page">
        {/* Showcase Hero Header matching reference design */}
        <ShowcaseHeroHeader type="models" />

        <div className="catalog-ecom-wrapper">
          {/* Catalog Navigation Header (Title on Left, Filter Tabs on Right) */}
          <div className="catalog-nav-header" id="catalog-section">
            <h2 className="catalog-nav-title">
              {isFr ? "Nos Véhicules" : "Our Vehicles"}
            </h2>

            <div className="catalog-tabs-list">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`catalog-tab-item ${selectedFilter === tab.value ? "is-active" : ""}`}
                  onClick={() => setSelectedFilter(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar & vehicle count */}
          <div className="catalog-toolbar">
            <span className="catalog-count">
              {isFr ? (
                <>
                  Affichage de <strong>{filteredCars.length}</strong> véhicule{filteredCars.length > 1 ? "s" : ""}
                </>
              ) : (
                <>
                  Showing <strong>{filteredCars.length}</strong> vehicle{filteredCars.length > 1 ? "s" : ""}
                </>
              )}
            </span>

            <div className="catalog-search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder={isFr ? "Rechercher (Prado, Rav4, 2024)..." : "Search (Prado, Rav4, 2024)..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="catalog-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "1.2rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "1.4rem"
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Minimalist E-Commerce Cars Grid */}
          <div className="ecom-grid">
            {filteredCars.map((car, idx) => {
              const displayImg = car.img || car.image || defaultCarImg;
              const displayBrand = car.brand || car.mark || "3M SERVICES";
              const rawName = car.name || car.model || "Véhicule de Prestige";
              const displayName = rawName.replace(/^([A-Za-z]+)\s+\1\b/i, "$1");
              const displayPrice = car.pricePerDay
                ? `${car.pricePerDay.toLocaleString("fr-FR")} FCFA`
                : car.price && car.price.includes("FCFA")
                ? car.price.split("•")[0].replace("À partir de ", "")
                : isFr ? "Sur devis" : "On Request";

              return (
                <div key={car.id || idx} className="ecom-card">
                  {/* Centered Image */}
                  <div className="ecom-card__img-container">
                    <img
                      src={displayImg}
                      alt={displayName}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultCarImg;
                      }}
                      className="ecom-card__img"
                    />
                  </div>

                  {/* Eyebrow / Brand */}
                  <span className="ecom-card__category">
                    {displayBrand} • {car.category || "Berline / SUV"}
                  </span>

                  {/* Title */}
                  <h3 className="ecom-card__title" title={displayName}>
                    {displayName}
                  </h3>

                  {/* Price */}
                  <div className="ecom-card__price">
                    {displayPrice}
                    {displayPrice.includes("FCFA") && !displayPrice.includes("devis") && (
                      <span style={{ fontSize: "1.05rem", fontWeight: 500, color: "#64748b" }}>
                        {isFr ? " / jour" : " / day"}
                      </span>
                    )}
                  </div>

                  {/* Specs Details */}
                  <div className="ecom-card__details">
                    <span>
                      <i className="fa-solid fa-users"></i> {car.seats || (isFr ? "5 places" : "5 seats")}
                    </span>
                    <span>
                      <i className="fa-solid fa-gear"></i> {car.transmission || (isFr ? "Automatique" : "Automatic")}
                    </span>
                    <span>
                      <i className="fa-solid fa-gas-pump"></i> {car.fuel || (isFr ? "Essence" : "Petrol")}
                    </span>
                    <span>
                      <i className="fa-solid fa-calendar"></i> {car.year || "2024"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="ecom-card__actions">
                    <button
                      type="button"
                      onClick={() => setSelectedCarForModal(car)}
                      className="ecom-card__btn-book"
                    >
                      {isFr ? "Détails & Devis" : "Details & Quote"}
                    </button>
                    <a
                      href={getWhatsAppBookingLink(car)}
                      target="_blank"
                      rel="noreferrer"
                      className="ecom-card__btn-wa"
                      title={isFr ? "Réserver sur WhatsApp" : "Book on WhatsApp"}
                    >
                      <i className="fa-brands fa-whatsapp"></i>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCars.length === 0 && (
            <div style={{ textAlign: "center", padding: "6rem 2rem 8rem" }}>
              <i
                className="fa-solid fa-car"
                style={{ fontSize: "4.5rem", color: "#cbd5e1", marginBottom: "1.5rem" }}
              ></i>
              <h3 style={{ fontSize: "2rem", color: "#1e293b", marginBottom: "0.8rem" }}>
                {isFr ? "Aucun véhicule ne correspond à votre filtre" : "No vehicles match your filter"}
              </h3>
              <p style={{ fontSize: "1.5rem", color: "#64748b", marginBottom: "2rem" }}>
                {isFr ? "Réinitialisez vos filtres ou contactez notre conciergerie 24/7." : "Reset your filters or contact our 24/7 concierge."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedFilter("Tous");
                  setSearchQuery("");
                }}
                className="promo-banner-card__btn"
              >
                {isFr ? "Réinitialiser" : "Reset"}
              </button>
            </div>
          )}

          {/* Bottom 5-Column Trust & Service Banner (from screenshot) */}
          <div className="trust-banner-wrap">
            <div className="trust-banner-grid">
              {/* Pillar 1 */}
              <div className="trust-card">
                <div className="trust-card__icon">
                  <i className="fa-solid fa-truck-fast"></i>
                </div>
                <div className="trust-card__texts">
                  <h4 className="trust-card__title">
                    {isFr ? "Livraison VIP" : "VIP Delivery"}
                  </h4>
                  <p className="trust-card__subtitle">
                    {isFr ? "Aéroport Nsimalen & Hôtels" : "Nsimalen Airport & Hotels"}
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="trust-card">
                <div className="trust-card__icon">
                  <i className="fa-solid fa-users"></i>
                </div>
                <div className="trust-card__texts">
                  <h4 className="trust-card__title">99% Satisfaction</h4>
                  <p className="trust-card__subtitle">
                    {isFr ? "Avis clients vérifiés" : "Verified Customer Reviews"}
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="trust-card">
                <div className="trust-card__icon">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div className="trust-card__texts">
                  <h4 className="trust-card__title">
                    {isFr ? "Assurance Tous Risques" : "Comprehensive Insurance"}
                  </h4>
                  <p className="trust-card__subtitle">
                    {isFr ? "Assistance panne 24/7" : "24/7 Breakdown Assistance"}
                  </p>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="trust-card">
                <div className="trust-card__icon">
                  <i className="fa-solid fa-credit-card"></i>
                </div>
                <div className="trust-card__texts">
                  <h4 className="trust-card__title">
                    {isFr ? "Paiement Sécurisé" : "Secure Payment"}
                  </h4>
                  <p className="trust-card__subtitle">
                    {isFr ? "Espèces, Virement & Mobile Money" : "Cash, Wire & Mobile Money"}
                  </p>
                </div>
              </div>

              {/* Pillar 5 */}
              <div className="trust-card">
                <div className="trust-card__icon">
                  <i className="fa-solid fa-headset"></i>
                </div>
                <div className="trust-card__texts">
                  <h4 className="trust-card__title">
                    {isFr ? "Conciergerie 24/7" : "24/7 Concierge"}
                  </h4>
                  <p className="trust-card__subtitle">+237 691 78 64 47</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Quick View Modal */}
        {selectedCarForModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem"
            }}
            onClick={() => setSelectedCarForModal(null)}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                maxWidth: "600px",
                width: "100%",
                padding: "3rem",
                position: "relative",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedCarForModal(null)}
                style={{
                  position: "absolute",
                  top: "1.6rem",
                  right: "1.6rem",
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  fontSize: "1.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b"
                }}
              >
                ✕
              </button>

              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <img
                  src={selectedCarForModal.img || selectedCarForModal.image || defaultCarImg}
                  alt={selectedCarForModal.name || selectedCarForModal.model}
                  style={{
                    maxHeight: "180px",
                    maxWidth: "100%",
                    objectFit: "contain",
                    margin: "0 auto"
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: "1.2rem",
                  color: "#E20713",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                {selectedCarForModal.brand || selectedCarForModal.mark || "3M SERVICES"}
              </span>

              <h3 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#111827", margin: "0.4rem 0 1rem" }}>
                {(selectedCarForModal.name || selectedCarForModal.model || "").replace(/^([A-Za-z]+)\s+\1\b/i, "$1")}
              </h3>

              <p style={{ fontSize: "1.45rem", color: "#64748b", lineHeight: 1.6, marginBottom: "2rem" }}>
                {selectedCarForModal.description ||
                  (isFr
                    ? "Véhicule révisé et certifié conforme aux normes 3M Services. Climatisation d'origine, intérieur soigné, sécurité absolue pour vos déplacements à Yaoundé et sur tout le territoire camerounais."
                    : "Serviced and certified vehicle compliant with 3M Services quality standards. Original air conditioning, pristine interior, and total safety for your travels in Yaoundé and across Cameroon.")}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.2rem",
                  backgroundColor: "#f8fafc",
                  padding: "1.6rem",
                  borderRadius: "8px",
                  marginBottom: "2.4rem",
                  fontSize: "1.35rem"
                }}
              >
                <div>
                  <strong>{isFr ? "Places :" : "Seats:"}</strong> {selectedCarForModal.seats || (isFr ? "5 places" : "5 seats")}
                </div>
                <div>
                  <strong>{isFr ? "Transmission :" : "Transmission:"}</strong> {selectedCarForModal.transmission || (isFr ? "Automatique" : "Automatic")}
                </div>
                <div>
                  <strong>{isFr ? "Carburant :" : "Fuel:"}</strong> {selectedCarForModal.fuel || (isFr ? "Essence" : "Petrol")}
                </div>
                <div>
                  <strong>{isFr ? "Année :" : "Year:"}</strong> {selectedCarForModal.year || "2024"}
                </div>
              </div>

              <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    const carName = (selectedCarForModal.name || selectedCarForModal.model || "").replace(/^([A-Za-z]+)\s+\1\b/i, "$1");
                    sessionStorage.setItem("selected_booking_car", carName);
                    window.location.href = "/#booking-section";
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: "#D62828",
                    color: "#ffffff",
                    textAlign: "center",
                    padding: "1.2rem 1.6rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "1.4rem",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.8rem"
                  }}
                >
                  <i className="fa-solid fa-calendar-check"></i>
                  {isFr ? "Réserver en ligne" : "Book Online"}
                </button>
                <a
                  href={getWhatsAppBookingLink(selectedCarForModal)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    backgroundColor: "#25D366",
                    color: "#ffffff",
                    textAlign: "center",
                    padding: "1.2rem 1.6rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "1.4rem",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.8rem"
                  }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.8rem" }}></i>
                  {isFr ? "WhatsApp" : "WhatsApp"}
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedCarForModal(null)}
                  style={{
                    padding: "1.2rem 2rem",
                    borderRadius: "6px",
                    border: "1px solid #E5E5E5",
                    background: "#ffffff",
                    fontSize: "1.4rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#737373"
                  }}
                >
                  {isFr ? "Fermer" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </section>
    </>
  );
}

export default Models;
