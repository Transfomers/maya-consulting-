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

  const getEmailLink = (apt) => {
    const subject = encodeURIComponent(`Demande de Réservation Appartement Meublé : ${apt.title} - 3M SERVICES`);
    const body = encodeURIComponent(
      `Bonjour l'équipe 3M SERVICES,\n\n` +
      `Je souhaite obtenir des informations et réserver votre appartement meublé :\n\n` +
      `• RÉSIDENCE : ${apt.title}\n` +
      `• TYPE : ${apt.type}\n` +
      `• LOCALISATION : ${apt.location}\n` +
      `• TARIF : ${apt.price}\n\n` +
      `Pourriez-vous me confirmer les disponibilités pour mon séjour et les modalités de réservation ?\n\n` +
      `Mes coordonnées :\n` +
      `• Nom et Prénom :\n` +
      `• Téléphone / WhatsApp :\n` +
      `• Date d'arrivée souhaitée :\n` +
      `• Date de départ souhaitée :\n\n` +
      `Merci d'avance pour votre retour.\n\nCordialement,`
    );
    return `mailto:contact@3mservice.shop?subject=${subject}&body=${body}`;
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

                  {/* Action Buttons: Details + WhatsApp Icon + Email Icon */}
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
                      title="Réserver sur WhatsApp (+237 691 78 64 47)"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                    </a>
                    <a
                      href={getEmailLink(apt)}
                      className="ecom-card__btn-email"
                      title="Envoyer la demande par Email (contact@3mservice.shop)"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
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
                    minWidth: "180px",
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
                  <span>WhatsApp</span>
                </a>

                <a
                  href={getEmailLink(activeModalApartment)}
                  style={{
                    flex: 1,
                    minWidth: "180px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    backgroundColor: "#C92A2A",
                    color: "#ffffff",
                    padding: "1.3rem 2rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "1.5rem",
                    textDecoration: "none"
                  }}
                >
                  <i className="fa-solid fa-envelope" style={{ fontSize: "1.8rem" }}></i>
                  <span>Envoyer par Email</span>
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
