import React, { useState, useEffect } from "react";
import Footer from "../components/Footer";
import ApartmentsLuxuryHeader from "../components/ApartmentsLuxuryHeader";
import { useTranslation } from "../context/LanguageContext";
import { API_BASE } from "../config/api";
import { saveOrderAndCustomerAccount, getCurrentClient } from "../utils/customerAccounts";
import "../styles/CatalogEcommerce.css";
import "../styles/ListingCards.css";
import "../styles/ApartmentModal.css";

// Prix par nuit formaté (FCFA) depuis nightlyRate, sinon depuis le libellé price
const formatNightly = (apt) => {
  const n = Number(apt.nightlyRate) || Number(String(apt.price || "").split("/")[0].replace(/[^0-9]/g, ""));
  return n ? `${n.toLocaleString("fr-FR")} FCFA` : apt.price || "Sur demande";
};

const plural = (n, one, many) => `${n} ${Number(n) > 1 ? many : one}`;

// Caractéristiques réelles de l'appartement (champs vides ignorés)
const getApartmentSpecs = (apt) => {
  const firstNum = (str) => (String(str || "").match(/\d+/) || [])[0];
  const parts = String(apt.rooms || "").split("•");
  const bedrooms = apt.bedrooms || firstNum(parts[0]);
  const bathrooms = apt.bathrooms || firstNum(parts.find((x) => /bain/i.test(x)));
  const specs = [
    { icon: "fa-building", label: apt.propertyType || (apt.type || "").split(" ")[0] || "Appartement" },
    apt.maxGuests && { icon: "fa-user-group", label: plural(apt.maxGuests, "personne", "personnes") },
    bedrooms && { icon: "fa-bed", label: plural(bedrooms, "chambre", "chambres") },
    bathrooms && { icon: "fa-bath", label: plural(bathrooms, "salle de bain", "salles de bain") },
    apt.livingRooms && { icon: "fa-couch", label: plural(apt.livingRooms, "salon", "salons") },
    apt.surfaceSqm && { icon: "fa-ruler-combined", label: `${apt.surfaceSqm} m²` },
  ];
  return specs.filter(Boolean).slice(0, 6);
};

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
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [stayForm, setStayForm] = useState({ checkIn: "", checkOut: "", guestName: "", guestPhone: "" });
  const [stayFeedback, setStayFeedback] = useState(null);
  const [staySubmitting, setStaySubmitting] = useState(false);

  // Fenêtre détail : Échap pour fermer + page figée derrière
  useEffect(() => {
    if (!activeModalApartment) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setActiveModalApartment(null); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [activeModalApartment]);

  const openApartmentModal = (apt) => {
    setActiveModalApartment(apt);
    setActivePhotoIdx(0);
    setStayFeedback(null);
    const current = getCurrentClient();
    setStayForm({
      checkIn: "",
      checkOut: "",
      guestName: current?.name || "",
      guestPhone: current?.phone || ""
    });
  };

  const handleDirectStaySubmit = async (e) => {
    e.preventDefault();
    if (!activeModalApartment) return;
    setStayFeedback(null);
    const { checkIn, checkOut, guestName, guestPhone } = stayForm;
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setStayFeedback({ ok: false, msg: "La date de départ doit être après la date d'arrivée." });
      return;
    }
    const booked = Array.isArray(activeModalApartment.bookedDates) ? activeModalApartment.bookedDates : [];
    const conflict = booked.find((b) => b.status !== "cancelled" && b.checkIn < checkOut && b.checkOut > checkIn);
    if (conflict) {
      setStayFeedback({ ok: false, msg: `Ces dates sont déjà réservées (${conflict.checkIn} → ${conflict.checkOut}).` });
      return;
    }
    setStaySubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/apartments/${activeModalApartment.id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIn, checkOut, guestName, guestPhone })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStayFeedback({ ok: false, msg: data.error || "Dates indisponibles." });
      } else {
        handleApartmentBookClick(activeModalApartment);
        setStayFeedback({
          ok: true,
          msg: `Réservation confirmée (${data.bookingRef}) pour ${data.nights} nuit(s) — ${Number(data.totalAmount).toLocaleString("fr-FR")} FCFA !`
        });
        const refreshed = await fetch(`${API_BASE}/apartments`).then((r) => (r.ok ? r.json() : null));
        if (Array.isArray(refreshed) && refreshed.length > 0) {
          setApartments(refreshed);
          const updatedApt = refreshed.find((x) => x.id === activeModalApartment.id);
          if (updatedApt) setActiveModalApartment(updatedApt);
        }
      }
    } catch (err) {
      setStayFeedback({ ok: false, msg: "Impossible de contacter le serveur. Utilisez le bouton WhatsApp ci-dessous." });
    } finally {
      setStaySubmitting(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("3m_crm_store_v2");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.apartments) && parsed.apartments.length > 0) {
          setApartments(parsed.apartments);
        }
      }
    } catch (e) {
      // ignore
    }

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

  const handleApartmentBookClick = (apt) => {
    try {
      const current = getCurrentClient();
      const priceNum = Number((apt.price || "65000").replace(/[^0-9]/g, "")) || 65000;
      saveOrderAndCustomerAccount({
        clientName: current?.name || "Client Résidence 3M",
        phone: current?.phone || "+237 691 78 64 47",
        email: current?.email || "",
        city: "Yaoundé",
        itemName: apt.title,
        itemCategory: "Appartement Meublé",
        itemPrice: priceNum,
        days: 1,
        totalPrice: priceNum,
        pickUp: apt.location || "Yaoundé",
        notes: `Demande de réservation appartement : ${apt.title}`
      });
    } catch (err) {
      console.warn("Could not save apartment order:", err);
    }
  };

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
                <div key={apt.id} className="listing-card">
                  <div className="listing-card__img">
                    <img
                      src={displayImg}
                      alt={apt.title}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/Asset/appartements/appartement-meuble-suite-parentale.webp";
                      }}
                    />
                    <span
                      className={`listing-card__status ${
                        (apt.status || "Disponible") === "Disponible" ? "is-free" : "is-busy"
                      }`}
                    >
                      {apt.status || "Disponible"}
                    </span>
                  </div>

                  <div className="listing-card__body">
                    <div className="listing-card__head">
                      <div className="listing-card__name">
                        <h3 title={apt.title}>{apt.title}</h3>
                        <span className="listing-card__place">
                          <i className="fa-solid fa-location-dot"></i>{" "}
                          {apt.neighborhood || apt.location?.split(",")[0] || "Yaoundé"}
                        </span>
                      </div>
                      <div className="listing-card__price">
                        <strong>{formatNightly(apt)}</strong>
                        <span>par nuit</span>
                      </div>
                    </div>

                    <ul className="listing-card__specs">
                      {getApartmentSpecs(apt).map((spec) => (
                        <li key={spec.label}>
                          <i className={`fa-solid ${spec.icon}`}></i> {spec.label}
                        </li>
                      ))}
                    </ul>

                    <div className="listing-card__footer">
                      <button
                        type="button"
                        onClick={() => openApartmentModal(apt)}
                        className="listing-card__btn"
                      >
                        Réserver <i className="fa-solid fa-circle-check"></i>
                      </button>
                    </div>
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

        {/* Fenêtre détail d'un appartement */}
        {activeModalApartment && (() => {
          const apt = activeModalApartment;
          const galleryList =
            Array.isArray(apt.gallery) && apt.gallery.length > 0
              ? apt.gallery
              : [{ url: apt.image || "/Asset/appartements/appartement-meuble-suite-parentale.webp", category: "Vue principale" }];
          const safeIdx = activePhotoIdx < galleryList.length ? activePhotoIdx : 0;
          const curPhoto = galleryList[safeIdx];
          const isAvailable = (apt.status || "Disponible") === "Disponible";
          const money = (v) => `${Number(v).toLocaleString("fr-FR")} FCFA`;
          const vipServices =
            Array.isArray(apt.vipServices) && apt.vipServices.length > 0
              ? apt.vipServices
              : [
                  "Groupe électrogène 24/7",
                  "WiFi fibre optique illimité",
                  "Climatisation intégrale",
                  "Gardiennage & sécurité 24/7",
                  "Ménage & conciergerie 3M",
                  "Cuisine équipée moderne",
                ];

          return (
            <div className="apt-modal" onClick={() => setActiveModalApartment(null)}>
              <div
                className="apt-modal__dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="apt-modal-title"
                onClick={(e) => e.stopPropagation()}
              >
                <header className="apt-modal__head">
                  <div className="apt-modal__titles">
                    <span className="apt-modal__eyebrow">
                      {apt.type}
                      {apt.neighborhood || apt.location ? ` · ${apt.neighborhood || apt.location.split(",")[0]}` : ""}
                    </span>
                    <h2 id="apt-modal-title">{apt.title}</h2>
                  </div>
                  <span className={`apt-modal__status ${isAvailable ? "is-free" : "is-busy"}`}>{apt.status || "Disponible"}</span>
                  <button type="button" className="apt-modal__close" onClick={() => setActiveModalApartment(null)} aria-label="Fermer">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </header>

                <div className="apt-modal__body">
                  {/* Colonne gauche : photos & détails */}
                  <div className="apt-modal__main">
                    <div className="apt-modal__photo">
                      <img
                        src={curPhoto.url}
                        alt={curPhoto.caption || apt.title}
                        onError={(e) => {
                          e.target.src = "/Asset/appartements/appartement-meuble-suite-parentale.webp";
                        }}
                      />
                      {curPhoto.category && <span className="apt-modal__photo-tag">{curPhoto.category}</span>}
                      {galleryList.length > 1 && (
                        <span className="apt-modal__photo-count">
                          {safeIdx + 1} / {galleryList.length}
                        </span>
                      )}
                    </div>
                    {galleryList.length > 1 && (
                      <div className="apt-modal__thumbs">
                        {galleryList.map((ph, gIdx) => (
                          <button
                            key={gIdx}
                            type="button"
                            className={gIdx === safeIdx ? "is-active" : ""}
                            onClick={() => setActivePhotoIdx(gIdx)}
                            aria-label={`Photo ${gIdx + 1}${ph.category ? ` — ${ph.category}` : ""}`}
                          >
                            <img src={ph.url} alt="" />
                          </button>
                        ))}
                      </div>
                    )}

                    <ul className="apt-modal__facts">
                      {getApartmentSpecs(apt).map((spec) => (
                        <li key={spec.label}>
                          <i className={`fa-solid ${spec.icon}`}></i> {spec.label}
                        </li>
                      ))}
                    </ul>

                    {apt.description && (
                      <section className="apt-modal__section">
                        <h3>Description</h3>
                        <p>{apt.description}</p>
                      </section>
                    )}

                    {Array.isArray(apt.equipments) && apt.equipments.length > 0 && (
                      <section className="apt-modal__section">
                        <h3>Équipements</h3>
                        <ul className="apt-modal__chips">
                          {apt.equipments.map((eq) => (
                            <li key={eq}><i className="fa-solid fa-check"></i> {eq}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    <section className="apt-modal__section">
                      <h3>Services inclus</h3>
                      <ul className="apt-modal__services">
                        {vipServices.map((vip) => (
                          <li key={vip}><i className="fa-solid fa-circle-check"></i> {vip}</li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  {/* Colonne droite : réservation */}
                  <aside className="apt-modal__booking">
                    <div className="apt-modal__price">
                      <strong>{formatNightly(apt)}</strong>
                      <span>par nuit</span>
                    </div>
                    {(apt.weeklyRate || apt.monthlyRate || Number(apt.securityDeposit) > 0 || apt.minStayNights) && (
                      <dl className="apt-modal__rates">
                        {apt.weeklyRate && (<><dt>Semaine</dt><dd>{money(apt.weeklyRate)}</dd></>)}
                        {apt.monthlyRate && (<><dt>Mois</dt><dd>{money(apt.monthlyRate)}</dd></>)}
                        {Number(apt.securityDeposit) > 0 && (<><dt>Caution</dt><dd>{money(apt.securityDeposit)}</dd></>)}
                        {Number(apt.minStayNights) > 1 && (<><dt>Séjour minimum</dt><dd>{apt.minStayNights} nuits</dd></>)}
                      </dl>
                    )}
                    {apt.longStayDiscount && <p className="apt-modal__discount"><i className="fa-solid fa-tag"></i> {apt.longStayDiscount}</p>}

                    {isAvailable ? (
                      <form onSubmit={handleDirectStaySubmit} className="apt-modal__form">
                        <h3>Réserver ce séjour</h3>
                        {Array.isArray(apt.bookedDates) && apt.bookedDates.length > 0 && (
                          <p className="apt-modal__booked">
                            <i className="fa-solid fa-calendar-xmark"></i> Déjà réservé :{" "}
                            {apt.bookedDates.map((b) => `${b.checkIn} → ${b.checkOut}`).join(" · ")}
                          </p>
                        )}
                        <div className="apt-modal__grid">
                          <label>
                            <span>Arrivée *</span>
                            <input type="date" required value={stayForm.checkIn} onChange={(e) => setStayForm({ ...stayForm, checkIn: e.target.value })} />
                          </label>
                          <label>
                            <span>Départ *</span>
                            <input type="date" required min={stayForm.checkIn || undefined} value={stayForm.checkOut} onChange={(e) => setStayForm({ ...stayForm, checkOut: e.target.value })} />
                          </label>
                          <label className="is-full">
                            <span>Nom & prénom *</span>
                            <input type="text" required autoComplete="name" placeholder="Votre nom" value={stayForm.guestName} onChange={(e) => setStayForm({ ...stayForm, guestName: e.target.value })} />
                          </label>
                          <label className="is-full">
                            <span>Téléphone / WhatsApp *</span>
                            <input type="tel" required autoComplete="tel" placeholder="+237 6XX XX XX XX" value={stayForm.guestPhone} onChange={(e) => setStayForm({ ...stayForm, guestPhone: e.target.value })} />
                          </label>
                        </div>
                        <button type="submit" className="apt-modal__submit" disabled={staySubmitting}>
                          {staySubmitting ? "Vérification…" : "Réserver mes dates"}
                        </button>
                        {stayFeedback && (
                          <div className={`apt-modal__feedback ${stayFeedback.ok ? "is-ok" : "is-error"}`} role="status">
                            {stayFeedback.msg}
                          </div>
                        )}
                      </form>
                    ) : (
                      <div className="apt-modal__unavailable" role="status">
                        <i className="fa-solid fa-circle-info"></i>
                        <div>
                          <strong>Indisponible pour le moment</strong>
                          <span>Cette résidence est en « {apt.status} ». Contactez-nous pour connaître la prochaine date libre.</span>
                        </div>
                      </div>
                    )}

                    <div className="apt-modal__contact">
                      <span>Une question ?</span>
                      <div>
                        <a className="is-wa" href={getWhatsAppLink(apt)} target="_blank" rel="noreferrer" onClick={() => handleApartmentBookClick(apt)}>
                          <i className="fa-brands fa-whatsapp"></i> WhatsApp
                        </a>
                        <a className="is-mail" href={getEmailLink(apt)} onClick={() => handleApartmentBookClick(apt)} aria-label="Envoyer un email">
                          <i className="fa-solid fa-envelope"></i>
                        </a>
                        <a className="is-tel" href="tel:+237691786447" aria-label="Appeler le +237 691 78 64 47">
                          <i className="fa-solid fa-phone"></i>
                        </a>
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          );
        })()}

        <Footer />
      </section>
    </>
  );
}

export default ApartmentsPage;
