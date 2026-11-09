import React, { useState, useEffect } from "react";
import Footer from "../components/Footer";
import ApartmentsLuxuryHeader from "../components/ApartmentsLuxuryHeader";
import { useTranslation } from "../context/LanguageContext";
import { API_BASE } from "../config/api";
import "../styles/CatalogEcommerce.css";

const DEFAULT_APARTMENTS = [
  {
    id: "apt-01",
    title: "Appartement Prestige Tsinga (Face FECAFOOT)",
    type: "T3 Meublé Haut Standing",
    location: "Tsinga (Face FECAFOOT), Yaoundé",
    rooms: "2 Chambres • 2 Salons • 2 Salles de bain",
    price: "65 000 FCFA / nuitée (Dégressif au mois)",
    photosCount: 5,
    image: "/Asset/appartements/appartement-meuble-suite-parentale.webp",
    status: "Disponible",
    description: "Situé à Tsinga, directement en face du siège de la FECAFOOT à partir de Yaoundé, cet appartement meublé grand standing vous offre une suite parentale avec literie de luxe, une cuisine équipée moderne, salle de bain design, climatisation intégrale, groupe électrogène automatique et gardiennage permanent 24/7."
  },
  {
    id: "apt-02",
    title: "Résidence Cosy Tsinga (Face FECAFOOT)",
    type: "T2 Meublé Contemporain",
    location: "Tsinga (Face FECAFOOT), Yaoundé",
    rooms: "1 Chambre • 1 Grand Salon • 1 Salle de bain",
    price: "40 000 FCFA / nuitée (Tarif spécial long séjour)",
    photosCount: 4,
    image: "/Asset/appartements/appartement-meuble-chambre-bleue.webp",
    status: "Disponible",
    description: "Élégant et chaleureux avec salon contemporain, cuisine américaine laquée, smart TV 55 pouces et connexion fibre optique haut débit."
  },
  {
    id: "apt-03",
    title: "Grand Standing Tsinga (Face FECAFOOT)",
    type: "T4 Prestige Exécutif",
    location: "Tsinga (Face FECAFOOT), Yaoundé",
    rooms: "3 Chambres • Double Séjour • 3 Salles de bain",
    price: "90 000 FCFA / nuitée",
    photosCount: 6,
    image: "/Asset/appartements/appartement-meuble-chambre-confort.webp",
    status: "Disponible",
    description: "Spacieux appartement de grand standing pour familles, délégations d'affaires ou séjours officiels avec vue dégagée."
  },
  {
    id: "apt-04",
    title: "Studio Confort Omnisports",
    type: "Studio Meublé VIP",
    location: "Omnisports (Rue Foe), Yaoundé",
    rooms: "1 Grande Chambre Suite • Kitchenette équipée",
    price: "35 000 FCFA / nuitée",
    photosCount: 3,
    image: "/Asset/appartements/appartement-meuble-suite-parentale.webp",
    status: "Disponible",
    description: "Idéalement situé à proximité immédiate de l'agence 3M Services Omnisports. Climatisation, eau chaude et sécurité."
  }
];

function ApartmentsPage() {
  const { lang } = useTranslation();
  const [apartments, setApartments] = useState(DEFAULT_APARTMENTS);
  const [selectedLocation, setSelectedLocation] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalApartment, setActiveModalApartment] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/apartments`)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setApartments(data);
        }
      })
      .catch(() => {
        // Use default fallback silently
      });
  }, []);

  const filterTabs = [
    { label: lang === "fr" ? "Tous" : "All", value: "Tous" },
    { label: "Tsinga (Face FECAFOOT)", value: "Tsinga" },
    { label: "Omnisports (Rue Foe)", value: "Omnisports" },
    { label: lang === "fr" ? "Disponibles" : "Available", value: "Disponible" }
  ];

  const filteredApartments = apartments.filter((apt) => {
    const loc = (apt.location || "").toLowerCase();
    const title = (apt.title || "").toLowerCase();
    const type = (apt.type || "").toLowerCase();
    const status = (apt.status || "").toLowerCase();

    let matchesFilter = true;
    if (selectedLocation === "Tsinga") {
      matchesFilter = loc.includes("tsinga");
    } else if (selectedLocation === "Omnisports") {
      matchesFilter = loc.includes("omnisport");
    } else if (selectedLocation === "Disponible") {
      matchesFilter = status.includes("disponible");
    }

    let matchesSearch = true;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch =
        title.includes(q) ||
        loc.includes(q) ||
        type.includes(q) ||
        (apt.description && apt.description.toLowerCase().includes(q));
    }

    return matchesFilter && matchesSearch;
  });

  const getWhatsAppLink = (apt) => {
    const text = encodeURIComponent(
      `Bonjour 3M SERVICES,\n\nJe souhaite réserver votre appartement meublé :\n` +
      `• Logement : ${apt.title}\n` +
      `• Type : ${apt.type}\n` +
      `• Localisation : ${apt.location}\n` +
      `• Tarif indiqué : ${apt.price}\n\n` +
      `Pourriez-vous me confirmer les disponibilités actuelles et les modalités de réservation ? Merci.`
    );
    return `https://wa.me/237691786447?text=${text}`;
  };

  return (
    <>
      <section className="catalog-ecom-page">
        {/* Showcase Hero Header matching reference design */}
        <ApartmentsLuxuryHeader />

        <div className="catalog-ecom-wrapper">
          {/* Catalog Navigation Header (Title on Left, Filter Tabs on Right) */}
          <div className="catalog-nav-header" id="apartments-grid-section">
            <h2 className="catalog-nav-title">
              {lang === "fr" ? "Nos Appartements" : "Our Apartments"}
            </h2>

            <div className="catalog-tabs-list">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`catalog-tab-item ${selectedLocation === tab.value ? "is-active" : ""}`}
                  onClick={() => setSelectedLocation(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar & count */}
          <div className="catalog-toolbar">
            <span className="catalog-count">
              Affichage de <strong>{filteredApartments.length}</strong> résidence{filteredApartments.length > 1 ? "s" : ""}
            </span>

            <div className="catalog-search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder={lang === "fr" ? "Rechercher (Tsinga, Bastos, T3)..." : "Search (Tsinga, T3)..."}
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

          {/* Minimalist E-Commerce Apartments Grid */}
          <div className="ecom-grid">
            {filteredApartments.map((apt) => {
              const displayImg =
                apt.image || "/Asset/appartements/appartement-meuble-suite-parentale.webp";

              return (
                <div key={apt.id} className="ecom-card">
                  {/* Badge */}
                  <span className="ecom-card__badge ecom-card__badge--green">
                    {apt.status || "Disponible"}
                  </span>

                  {/* Centered Image Container */}
                  <div className="ecom-card__img-container">
                    <img
                      src={displayImg}
                      alt={apt.title}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/Asset/appartements/appartement-meuble-suite-parentale.webp";
                      }}
                      className="ecom-card__img"
                      style={{ objectFit: "cover", width: "100%", height: "100%", borderRadius: "4px" }}
                    />
                  </div>

                  {/* Eyebrow / Location */}
                  <span className="ecom-card__category">
                    {apt.type} • {apt.location?.split(",")[0] || "Yaoundé"}
                  </span>

                  {/* Title */}
                  <h3 className="ecom-card__title" title={apt.title}>
                    {apt.title}
                  </h3>

                  {/* Price */}
                  <div className="ecom-card__price">
                    {apt.price}
                  </div>

                  {/* Details specs */}
                  <div className="ecom-card__details">
                    <span>
                      <i className="fa-solid fa-bed"></i> {apt.rooms?.split("•")[0] || "2 Chambres"}
                    </span>
                    <span>
                      <i className="fa-solid fa-bolt"></i> Groupe 24/7
                    </span>
                    <span>
                      <i className="fa-solid fa-wifi"></i> Fibre Optique
                    </span>
                    <span>
                      <i className="fa-solid fa-snowflake"></i> Climatisé
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="ecom-card__actions">
                    <button
                      type="button"
                      onClick={() => setActiveModalApartment(apt)}
                      className="ecom-card__btn-book"
                    >
                      Détails & Photos
                    </button>
                    <a
                      href={getWhatsAppLink(apt)}
                      target="_blank"
                      rel="noreferrer"
                      className="ecom-card__btn-wa"
                      title="Réserver sur WhatsApp"
                    >
                      <i className="fa-brands fa-whatsapp"></i>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredApartments.length === 0 && (
            <div style={{ textAlign: "center", padding: "6rem 2rem 8rem" }}>
              <i
                className="fa-solid fa-building"
                style={{ fontSize: "4.5rem", color: "#cbd5e1", marginBottom: "1.5rem" }}
              ></i>
              <h3 style={{ fontSize: "2rem", color: "#1e293b", marginBottom: "0.8rem" }}>
                Aucune résidence ne correspond à vos filtres
              </h3>
              <p style={{ fontSize: "1.5rem", color: "#64748b", marginBottom: "2rem" }}>
                Réinitialisez vos filtres ou contactez notre conciergerie 24/7.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedLocation("Tous");
                  setSearchQuery("");
                }}
                className="promo-banner-card__btn"
              >
                Réinitialiser
              </button>
            </div>
          )}

          {/* Bottom 5-Column Trust & Service Banner (from screenshot) */}
          <div className="trust-banner-wrap">
            <div className="trust-banner-grid">
              {/* Pillar 1 */}
              <div className="trust-card">
                <div className="trust-card__icon">
                  <i className="fa-solid fa-bolt"></i>
                </div>
                <div className="trust-card__texts">
                  <h4 className="trust-card__title">Groupe Électrogène 24/7</h4>
                  <p className="trust-card__subtitle">Zéro coupure électrique</p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="trust-card">
                <div className="trust-card__icon">
                  <i className="fa-solid fa-wifi"></i>
                </div>
                <div className="trust-card__texts">
                  <h4 className="trust-card__title">Fibre Optique Illimitée</h4>
                  <p className="trust-card__subtitle">WiFi très haut débit</p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="trust-card">
                <div className="trust-card__icon">
                  <i className="fa-solid fa-snowflake"></i>
                </div>
                <div className="trust-card__texts">
                  <h4 className="trust-card__title">Climatisation Intégrale</h4>
                  <p className="trust-card__subtitle">Salons & chambres climatisés</p>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="trust-card">
                <div className="trust-card__icon">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div className="trust-card__texts">
                  <h4 className="trust-card__title">Gardiennage & Sécurité</h4>
                  <p className="trust-card__subtitle">Vigiles 24/7 & caméras</p>
                </div>
              </div>

              {/* Pillar 5 */}
              <div className="trust-card">
                <div className="trust-card__icon">
                  <i className="fa-solid fa-broom"></i>
                </div>
                <div className="trust-card__texts">
                  <h4 className="trust-card__title">Ménage & Conciergerie</h4>
                  <p className="trust-card__subtitle">Service hôtelier 3M</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Detailed View */}
        {activeModalApartment && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(5px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem"
            }}
            onClick={() => setActiveModalApartment(null)}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                maxWidth: "700px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                padding: "3rem"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <span style={{ fontSize: "1.3rem", color: "#E20713", fontWeight: 700 }}>
                    {activeModalApartment.type}
                  </span>
                  <h2 style={{ fontSize: "2.4rem", color: "#0f172a", marginTop: "0.4rem" }}>
                    {activeModalApartment.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModalApartment(null)}
                  style={{
                    border: "none",
                    background: "#f1f5f9",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    cursor: "pointer",
                    fontSize: "1.6rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ✕
                </button>
              </div>

              <img
                src={activeModalApartment.image || "/Asset/appartements/appartement-meuble-suite-parentale.webp"}
                alt={activeModalApartment.title}
                style={{ width: "100%", height: "280px", objectFit: "cover", borderRadius: "8px", marginBottom: "2rem" }}
              />

              <div style={{ marginBottom: "2rem" }}>
                <h4 style={{ fontSize: "1.6rem", color: "#0f172a", marginBottom: "0.8rem" }}>Description & Équipements</h4>
                <p style={{ fontSize: "1.45rem", color: "#475569", lineHeight: 1.6 }}>
                  {activeModalApartment.description}
                </p>
              </div>

              <div style={{ marginBottom: "2.5rem" }}>
                <h4 style={{ fontSize: "1.6rem", color: "#0f172a", marginBottom: "1rem" }}>Services VIP Inclus</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  <div style={{ padding: "0.8rem", background: "#f8fafc", borderRadius: "8px", fontSize: "1.35rem" }}>
                    ⚡ Groupe électrogène 24/7
                  </div>
                  <div style={{ padding: "0.8rem", background: "#f8fafc", borderRadius: "8px", fontSize: "1.35rem" }}>
                    📶 WiFi Fibre Optique
                  </div>
                  <div style={{ padding: "0.8rem", background: "#f8fafc", borderRadius: "8px", fontSize: "1.35rem" }}>
                    ❄️ Climatisation intégrale
                  </div>
                  <div style={{ padding: "0.8rem", background: "#f8fafc", borderRadius: "8px", fontSize: "1.35rem" }}>
                    🛡️ Gardiennage 24/7
                  </div>
                  <div style={{ padding: "0.8rem", background: "#f8fafc", borderRadius: "8px", fontSize: "1.35rem" }}>
                    📺 Smart TV 55" HD
                  </div>
                  <div style={{ padding: "0.8rem", background: "#f8fafc", borderRadius: "8px", fontSize: "1.35rem" }}>
                    🍳 Cuisine équipée moderne
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap" }}>
                <a
                  href={getWhatsAppLink(activeModalApartment)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    backgroundColor: "#25D366",
                    color: "#ffffff",
                    padding: "1.3rem 2rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "1.5rem",
                    textDecoration: "none"
                  }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: "2rem" }}></i>
                  <span>Confirmer sur WhatsApp</span>
                </a>

                <a
                  href="tel:+237691786447"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    padding: "1.3rem 2rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "1.5rem",
                    textDecoration: "none"
                  }}
                >
                  <i className="fa-solid fa-phone"></i>
                  <span>Appeler</span>
                </a>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </section>
    </>
  );
}

export default ApartmentsPage;
