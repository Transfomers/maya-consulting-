import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import HeroSlider from "../components/HeroSlider";
import { useTranslation } from "../context/LanguageContext";
import { CARS_CATALOGUE } from "../data/carsCatalogue";
import { API_BASE } from "../config/api";
import {
  saveOrderAndCustomerAccount,
  getFavoriteCarIds,
  toggleFavoriteCar
} from "../utils/customerAccounts";
import "../styles/CatalogEcommerce.css";
import "../styles/ListingCards.css";

// Official 3M Fleet Visual Assets

function Models() {
  const { lang } = useTranslation();
  const isFr = lang === "fr";

  const [cars, setCars] = useState(CARS_CATALOGUE);
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [selectedCarForModal, setSelectedCarForModal] = useState(null);
  const [modalActivePhotoIdx, setModalActivePhotoIdx] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState(() => getFavoriteCarIds());

  useEffect(() => {
    const syncFavs = () => setFavoriteIds(getFavoriteCarIds());
    window.addEventListener("3m-favorites-changed", syncFavs);
    window.addEventListener("3m-client-auth-changed", syncFavs);
    return () => {
      window.removeEventListener("3m-favorites-changed", syncFavs);
      window.removeEventListener("3m-client-auth-changed", syncFavs);
    };
  }, []);

  // Modal reservation form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [bookingSent, setBookingSent] = useState(false);


  // Fetch cars from API (fallback to static CARS_CATALOGUE)
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
        // Fallback to static catalogue
      });
  }, []);

  // Auto-open modal if ?car= or ?id= parameter is present in URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const carId = params.get("car") || params.get("id");
      if (carId && cars.length > 0) {
        const found = cars.find(
          (c) =>
            c.id === carId ||
            (c.name && c.name.toLowerCase().includes(carId.toLowerCase()))
        );
        if (found) {
          setSelectedCarForModal(found);
          setModalActivePhotoIdx(0);
        }
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }, [cars]);


  const filterTabs = [
    { label: isFr ? "Tous" : "All", value: "Tous", count: cars.length },
    {
      label: "4x4 & SUV VIP",
      value: "SUV",
      count: cars.filter((c) => (c.category || "").includes("SUV") || c.name.includes("Land Cruiser") || c.name.includes("Prado")).length,
    },
    {
      label: "Pick-up Double Cabine",
      value: "Pickup",
      count: cars.filter((c) => (c.category || "").includes("Pick-up") || c.name.includes("Pickup") || c.name.includes("Hilux")).length,
    },
    {
      label: "Berlines",
      value: "Berline",
      count: cars.filter((c) => (c.category || "").includes("Berline") || c.name.includes("Camry") || c.name.includes("Berline")).length,
    },
  ];

  const filteredCars = cars.filter((car) => {
    const category = (car.category || "").toLowerCase();
    const name = (car.name || car.model || "").toLowerCase();

    if (selectedFilter === "SUV") {
      return category.includes("suv") || name.includes("prado") || name.includes("land cruiser") || name.includes("landcruiser");
    }
    if (selectedFilter === "Pickup") {
      return category.includes("pick-up") || name.includes("pickup") || name.includes("hilux");
    }
    if (selectedFilter === "Berline") {
      return category.includes("berline") || name.includes("camry") || name.includes("berline");
    }
    return true;
  });

  const getWhatsAppLink = (car) => {
    const carName = car?.name || car?.model || "Véhicule 3M";
    const text = encodeURIComponent(
      `Bonjour 3M SERVICES,\n\nJe souhaite réserver le véhicule suivant :\n` +
      `• Modèle : ${carName}\n` +
      `• Tarif officiel : ${car?.price || "Sur demande"}\n` +
      `• Période souhaitée : ${pickupDate || "À convenir"} au ${returnDate || "À convenir"}\n\n` +
      `Merci de me confirmer la disponibilité.`
    );
    return `https://wa.me/237691786447?text=${text}`;
  };

  const handleSendEmailReservation = (e) => {
    e.preventDefault();
    if (!selectedCarForModal) return;

    const carName = selectedCarForModal.name || selectedCarForModal.model || "Véhicule 3M";
    const subject = encodeURIComponent(`Réservation 3M SERVICES : ${carName}`);
    const body = encodeURIComponent(
      `Bonjour l'équipe 3M SERVICES,\n\n` +
      `Je vous contacte pour confirmer la réservation du véhicule suivant :\n\n` +
      `• VÉHICULE : ${carName}\n` +
      `• TARIF : ${selectedCarForModal.price}\n` +
      `• DATE DE PRISE : ${pickupDate || "À convenir"}\n` +
      `• DATE DE RESTITUTION : ${returnDate || "À convenir"}\n\n` +
      `COORDONNÉES CLIENT :\n` +
      `• Nom : ${clientName || "Non renseigné"}\n` +
      `• Téléphone / WhatsApp : ${clientPhone || "Non renseigné"}\n` +
      `• Email : ${clientEmail || "Non renseigné"}\n\n` +
      `Merci de m'adresser la confirmation et le contrat de réservation.\n\nCordialement,`
    );

    // Save booking and synchronize customer account
    const carPriceNum = Number((selectedCarForModal?.price || "120000").replace(/[^0-9]/g, "")) || 120000;
    saveOrderAndCustomerAccount({
      clientName: clientName || "Client 3M Services",
      phone: clientPhone || "+237 691 78 64 47",
      email: clientEmail || "",
      itemName: carName,
      itemCategory: selectedCarForModal?.category || "Véhicule VIP",
      itemPrice: carPriceNum,
      days: 1,
      totalPrice: carPriceNum,
      pickTime: pickupDate || new Date().toISOString().split("T")[0],
      dropTime: returnDate || pickupDate || new Date().toISOString().split("T")[0],
      notes: "Réservation via modal de détail /models",
      source: "Catalogue Véhicules (/models)"
    });

    setBookingSent(true);
    window.location.href = `mailto:contact@3mservice.shop?subject=${subject}&body=${body}`;
  };

  return (
    <div className="catalog-ecom-page">
      {/* 1. Bannière : photos de la flotte qui glissent */}
      <HeroSlider
        ariaLabel={isFr ? "Flotte VIP 3M SERVICES" : "3M SERVICES VIP fleet"}
        slides={[
          {
            image: "/images/cars/toyota-landcruiser-v8-black.webp",
            title: isFr ? "Flotte VIP" : "VIP Fleet",
            subtitle: isFr
              ? "Découvrez Yaoundé avec confort et prestige, avec ou sans chauffeur."
              : "Discover Yaoundé in comfort and style, with or without a chauffeur.",
            cta: { label: isFr ? "Découvrir" : "Discover", href: "#fleet-catalog" },
          },
          {
            image: "/images/cars/toyota-prado-txl-front.webp",
            title: isFr ? "Chauffeur dédié" : "Dedicated Chauffeur",
            subtitle: isFr
              ? "Transferts aéroport, missions et déplacements VIP avec chauffeurs professionnels bilingues."
              : "Airport transfers, missions and VIP travel with professional bilingual chauffeurs.",
            cta: {
              label: isFr ? "Réserver sur WhatsApp" : "Book on WhatsApp",
              href: "https://wa.me/237691786447?text=Bonjour%203M%20SERVICES%2C%20je%20souhaite%20un%20chauffeur%20bilingue",
              external: true,
            },
          },
          {
            image: "/images/cars/toyota-hilux-2024.webp",
            title: isFr ? "Pick-ups & Berlines" : "Pickups & Sedans",
            subtitle: isFr
              ? "Pick-up double cabine tout-terrain et berlines exécutives, disponibles 24/7."
              : "Off-road double cabin pickups and executive sedans, available 24/7.",
            cta: { label: isFr ? "Voir les tarifs" : "View rates", href: "#fleet-catalog" },
          },
        ]}
      />

      {/* --------------------------------------------------------------------
          2. Marketo 3 Feature Banners Row (White, Red, Black cards)
          -------------------------------------------------------------------- */}
      <section className="marketo-banners-row">
        {/* Card 1: White/Light */}
        <div className="marketo-banner-card marketo-banner-card--white">
          <div className="marketo-banner-card__content">
            <span className="marketo-banner-card__eyebrow">
              {isFr ? "Top Flotte • VIP" : "Top Fleet • VIP"}
            </span>
            <h3 className="marketo-banner-card__title">
              {isFr ? "SUV & 4x4 de Grand Prestige" : "Luxury 4x4 & Prestige SUVs"}
            </h3>
            <a
              href="#fleet-catalog"
              onClick={() => setSelectedFilter("SUV")}
              className="marketo-banner-card__btn"
            >
              <span>{isFr ? "Découvrir" : "Explore"}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>

        {/* Card 2: 3M Red */}
        <div className="marketo-banner-card marketo-banner-card--red">
          <div className="marketo-banner-card__content">
            <span className="marketo-banner-card__eyebrow">
              {isFr ? "Formule Sérénité" : "Full Peace of Mind"}
            </span>
            <h3 className="marketo-banner-card__title">
              {isFr ? "Chauffeur Dédié & Accueil Nsimalen" : "Dedicated Chauffeur & Airport Pickup"}
            </h3>
            <a
              href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES%2C%20je%20souhaite%20un%20chauffeur%20bilingue"
              target="_blank"
              rel="noreferrer"
              className="marketo-banner-card__btn"
            >
              <span>{isFr ? "Nous Contacter" : "Contact Us"}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>

        {/* Card 3: Dark Black */}
        <div className="marketo-banner-card marketo-banner-card--black">
          <div className="marketo-banner-card__content">
            <span className="marketo-banner-card__eyebrow">
              {isFr ? "Tarifs Officiels 3M" : "Official 3M Rates"}
            </span>
            <h3 className="marketo-banner-card__title">
              {isFr ? "Pick-up & Berlines dès 60 000 FCFA" : "Pickups & Sedans from 60 000 FCFA"}
            </h3>
            <a
              href="#fleet-catalog"
              onClick={() => setSelectedFilter("Tous")}
              className="marketo-banner-card__btn"
            >
              <span>{isFr ? "Voir Tarifs" : "View Rates"}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          3. Grille des véhicules (pleine largeur)
          -------------------------------------------------------------------- */}
      <div className="marketo-main-section" id="fleet-catalog">

        <main className="marketo-catalog-content">
          <div className="marketo-catalog-header">
            <h2 className="marketo-catalog-title">
              {isFr ? "Notre Flotte Officielle Disponible" : "Our Available Official Fleet"}
            </h2>

            {/* Filter Tabs with Downward Caret */}
            <div className="marketo-filter-tabs">
              {filterTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  className={`marketo-filter-tab ${selectedFilter === tab.value ? "is-active" : ""}`}
                  onClick={() => setSelectedFilter(tab.value)}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Grille des véhicules */}
          <div className="listing-grid">
            {filteredCars.map((car) => {
              const displayImg = car.img || car.image;
              const displayName = car.name || car.model;
              const isFav = favoriteIds.includes(String(car.id));
              const status = car.status || (isFr ? "Disponible" : "Available");
              const openCar = () => {
                setSelectedCarForModal(car);
                setModalActivePhotoIdx(0);
                setBookingSent(false);
              };
              const daily = Number(car.pricePerDay) || Number(String(car.price || "").split("/")[0].replace(/[^0-9]/g, ""));
              const regular = Number(car.regularPrice);
              const showPromo = car.isPromo && regular > daily;

              return (
                <div key={car.id} className="listing-card">
                  <div
                    className="listing-card__img"
                    onClick={openCar}
                    title={isFr ? "Voir les détails et les photos" : "View details and photos"}
                  >
                    <img src={displayImg} alt={displayName} loading="lazy" />
                    <span className={`listing-card__status ${/dispon|avail/i.test(status) ? "is-free" : "is-busy"}`}>
                      {status}
                    </span>
                    <button
                      type="button"
                      className={`listing-card__fav ${isFav ? "is-on" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFavoriteIds(toggleFavoriteCar(car.id));
                      }}
                      aria-pressed={isFav}
                      aria-label={isFav ? (isFr ? "Retirer des favoris" : "Remove from favorites") : (isFr ? "Ajouter aux favoris" : "Add to favorites")}
                    >
                      <i className={isFav ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                    </button>
                    {Array.isArray(car.photos) && car.photos.length > 1 && (
                      <span className="listing-card__photos">
                        <i className="fa-solid fa-camera"></i> {car.photos.length}
                      </span>
                    )}
                  </div>

                  <div className="listing-card__body">
                    <div className="listing-card__head">
                      <div className="listing-card__name">
                        <h3 title={displayName}>{displayName}</h3>
                        <span className="listing-card__place">
                          <i className="fa-solid fa-tag"></i> {car.category || "3M VIP"}
                        </span>
                      </div>
                      <div className="listing-card__price">
                        {showPromo && <del>{regular.toLocaleString("fr-FR")} FCFA</del>}
                        <strong className={showPromo ? "is-promo" : ""}>
                          {daily ? `${daily.toLocaleString("fr-FR")} FCFA` : car.price}
                        </strong>
                        <span>{isFr ? "par jour" : "per day"}</span>
                      </div>
                    </div>

                    <ul className="listing-card__specs">
                      {[
                        car.seats && { icon: "fa-user-group", label: car.seats },
                        car.transmission && { icon: "fa-gear", label: car.transmission },
                        car.fuel && { icon: "fa-gas-pump", label: car.fuel },
                        car.doors && { icon: "fa-door-open", label: `${car.doors} ${isFr ? "portes" : "doors"}` },
                        car.air && { icon: "fa-snowflake", label: isFr ? "Climatisé" : "Air conditioning" },
                        car.year && { icon: "fa-calendar", label: car.year },
                      ]
                        .filter(Boolean)
                        .map((spec) => (
                          <li key={spec.icon}>
                            <i className={`fa-solid ${spec.icon}`}></i> {spec.label}
                          </li>
                        ))}
                    </ul>

                    <div className="listing-card__footer">
                      <button type="button" onClick={openCar} className="listing-card__btn">
                        {isFr ? "Réserver" : "Book now"} <i className="fa-solid fa-circle-check"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCars.length === 0 && (
            <div style={{ textAlign: "center", padding: "6rem 2rem", background: "#ffffff", borderRadius: "8px" }}>
              <i className="fa-solid fa-car" style={{ fontSize: "4.5rem", color: "#cbd5e1", marginBottom: "1.5rem" }}></i>
              <h3 style={{ fontSize: "2rem", color: "#0b0f19", marginBottom: "0.8rem" }}>
                {isFr ? "Aucun véhicule dans cette catégorie" : "No vehicles in this category"}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedFilter("Tous")}
                className="marketo-btn-primary"
                style={{ marginTop: "1rem" }}
              >
                {isFr ? "Afficher Tous les Véhicules" : "Show All Vehicles"}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Bandeau d'appel à l'action */}
      <section className="listing-cta">
        <div className="listing-cta__inner">
          <div>
            <h2>{isFr ? "Réservez votre véhicule VIP en quelques minutes !" : "Book your VIP vehicle in minutes!"}</h2>
            <p>
              {isFr
                ? "Chauffeurs bilingues · Véhicules certifiés · Assistance 24/7 à Yaoundé"
                : "Bilingual chauffeurs · Certified vehicles · 24/7 assistance in Yaoundé"}
            </p>
          </div>
          <button
            type="button"
            className="listing-card__btn"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("3m-open-chat", {
                  detail: {
                    message: isFr
                      ? "Bonjour 3M SERVICES, je souhaite réserver un véhicule VIP. Quelles sont vos disponibilités ?"
                      : "Hello 3M SERVICES, I would like to book a VIP vehicle. What is your availability?",
                  },
                })
              )
            }
          >
            {isFr ? "Réserver maintenant" : "Book now"} <i className="fa-solid fa-comments"></i>
          </button>
        </div>
      </section>

      {/* 4. Nos engagements (grille 3 colonnes) */}
      <section className="service-pillars" aria-label={isFr ? "Nos engagements" : "Our commitments"}>
        <div className="service-pillars__grid">
          {[
            {
              icon: "fa-shield-halved",
              title: isFr ? "Véhicules révisés" : "Certified Service",
              text: isFr ? "Contrôle 100 % zéro panne avant chaque location." : "Strict 0-breakdown inspection before every rental.",
            },
            {
              icon: "fa-headset",
              title: isFr ? "Conciergerie 24/7" : "24/7 Concierge",
              text: isFr ? "Une équipe joignable jour et nuit au +237 691 78 64 47." : "A team available day and night on +237 691 78 64 47.",
            },
            {
              icon: "fa-user-tie",
              title: isFr ? "Chauffeurs bilingues" : "Bilingual Chauffeurs",
              text: isFr ? "Ponctualité, discrétion et courtoisie, en français et en anglais." : "Punctuality, discretion and courtesy, in French and English.",
            },
            {
              icon: "fa-rotate",
              title: isFr ? "Remplacement 24/7" : "24/7 Assistance",
              text: isFr ? "Assistance immédiate et véhicule de remplacement partout." : "Immediate assistance and replacement vehicle anywhere.",
            },
            {
              icon: "fa-file-invoice-dollar",
              title: isFr ? "Facture proforma" : "Official Invoice",
              text: isFr ? "Paiement Afriland, Orange Money, MTN MoMo ou virement." : "Pay by Afriland Bank, Orange Money, MTN MoMo or transfer.",
            },
            {
              icon: "fa-building",
              title: isFr ? "Résidences meublées" : "Furnished Apartments",
              text: isFr ? "Appartements VIP face FECAFOOT, à la nuitée ou au mois." : "VIP apartments facing FECAFOOT, by the night or month.",
              href: "/apartments",
            },
          ].map((item) => (
            <div key={item.icon} className="service-pillars__item">
              <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
              <h3>{item.href ? <a href={item.href}>{item.title}</a> : item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------------
          5. Complete Booking & Reservation Modal
          -------------------------------------------------------------------- */}
      {selectedCarForModal && (
        <div
          className="models-modal-backdrop"
          onClick={() => setSelectedCarForModal(null)}
        >
          <div
            className="models-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              className="models-modal-close-btn"
              onClick={() => setSelectedCarForModal(null)}
              aria-label="Fermer"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="models-modal-header">
              <div className="models-modal-header-thumb">
                <img
                  src={selectedCarForModal.img || selectedCarForModal.image}
                  alt={selectedCarForModal.name}
                />
              </div>

              <div className="models-modal-header-info">
                <span className="models-modal-header-badge">
                  {selectedCarForModal.category || "Flotte VIP 3M"}
                </span>
                <h3 className="models-modal-header-title">
                  {selectedCarForModal.name}
                </h3>
                <div className="models-modal-header-price">
                  {selectedCarForModal.price}
                </div>
              </div>
            </div>

            {/* MULTI-ANGLE PHOTO GALLERY & VIEWER */}
            {Array.isArray(selectedCarForModal.photos) && selectedCarForModal.photos.length > 0 && (
              <div className="models-modal-gallery">
                <div className="models-modal-gallery-header">
                  <span className="models-modal-gallery-title">
                    <i className="fa-solid fa-camera"></i>
                    {isFr ? "Galerie Multi-Angles du Véhicule" : "Multi-Angle Vehicle Gallery"}
                  </span>
                  <span className="models-modal-gallery-badge">
                    Angle {modalActivePhotoIdx + 1} / {selectedCarForModal.photos.length}
                    {selectedCarForModal.photoLabels?.[modalActivePhotoIdx] ? ` • ${selectedCarForModal.photoLabels[modalActivePhotoIdx]}` : ""}
                  </span>
                </div>

                {/* Main Prominent Angle Photo */}
                <div className="models-modal-gallery-main">
                  <img
                    src={selectedCarForModal.photos[modalActivePhotoIdx] || selectedCarForModal.img || selectedCarForModal.image}
                    alt={`${selectedCarForModal.name} - angle ${modalActivePhotoIdx + 1}`}
                  />

                  {/* Previous / Next Arrow Controls */}
                  {selectedCarForModal.photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="models-modal-gallery-nav-btn models-modal-gallery-nav-btn--prev"
                        onClick={() => setModalActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : selectedCarForModal.photos.length - 1))}
                        title={isFr ? "Angle précédent" : "Previous angle"}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="models-modal-gallery-nav-btn models-modal-gallery-nav-btn--next"
                        onClick={() => setModalActivePhotoIdx((prev) => (prev < selectedCarForModal.photos.length - 1 ? prev + 1 : 0))}
                        title={isFr ? "Angle suivant" : "Next angle"}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails Angle Strip */}
                {selectedCarForModal.photos.length > 1 && (
                  <div className="models-modal-gallery-strip">
                    {selectedCarForModal.photos.map((pUrl, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        className={`models-modal-gallery-thumb ${modalActivePhotoIdx === pIdx ? "is-active" : ""}`}
                        onClick={() => setModalActivePhotoIdx(pIdx)}
                        title={selectedCarForModal.photoLabels?.[pIdx] || `Angle ${pIdx + 1}`}
                      >
                        <img
                          src={pUrl}
                          alt={`Thumbnail ${pIdx + 1}`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description if present */}
            {selectedCarForModal.description && (
              <p style={{ fontSize: "1.35rem", color: "#475569", lineHeight: 1.6, marginBottom: "1.8rem", background: "#f8fafc", padding: "1.2rem", borderRadius: "6px" }}>
                {selectedCarForModal.description}
              </p>
            )}

            {/* Specs Summary */}
            <div className="models-modal-specs-grid">
              <div><strong>Places :</strong> {selectedCarForModal.seats || "5"}</div>
              <div><strong>Boîte :</strong> {selectedCarForModal.transmission || "Auto"}</div>
              <div><strong>Clim :</strong> {selectedCarForModal.air || "Oui"}</div>
              <div><strong>Carburant :</strong> {selectedCarForModal.fuel || "Diesel"}</div>
              <div><strong>Année :</strong> {selectedCarForModal.year || "2024"}</div>
              <div><strong>Statut :</strong> <span style={{ color: "#16a34a", fontWeight: 700 }}>Disponible</span></div>
            </div>

            {/* Reservation Form */}
            <form onSubmit={handleSendEmailReservation}>
              <h4 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0b0f19", marginBottom: "1.4rem" }}>
                {isFr ? "Vos Informations de Réservation" : "Your Booking Information"}
              </h4>

              <div className="models-modal-form-grid">
                <div>
                  <label className="models-modal-label">
                    {isFr ? "Nom complet *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Arnaud Mbarga"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="models-modal-input-field"
                  />
                </div>

                <div>
                  <label className="models-modal-label">
                    {isFr ? "Téléphone / WhatsApp *" : "Phone / WhatsApp *"}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+237 6XX XX XX XX"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="models-modal-input-field"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.4rem" }}>
                <label className="models-modal-label">
                  {isFr ? "Adresse Email (pour confirmation & facture) *" : "Email Address *"}
                </label>
                <input
                  type="email"
                  required
                  placeholder="votre@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="models-modal-input-field"
                />
              </div>

              <div className="models-modal-form-grid" style={{ marginBottom: "2.4rem" }}>
                <div>
                  <label className="models-modal-label">
                    {isFr ? "Date de Prise en charge *" : "Pickup Date *"}
                  </label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="models-modal-input-field"
                  />
                </div>

                <div>
                  <label className="models-modal-label">
                    {isFr ? "Date de Restitution *" : "Return Date *"}
                  </label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="models-modal-input-field"
                  />
                </div>
              </div>

              {/* Action Buttons: Email and WhatsApp */}
              <div className="models-modal-actions">
                <button
                  type="submit"
                  className="models-modal-btn-email"
                >
                  <i className="fa-solid fa-envelope"></i>
                  <span>{isFr ? "Envoyer par Email (contact@3mservice.shop)" : "Send via Email (contact@3mservice.shop)"}</span>
                </button>

                <a
                  href={getWhatsAppLink(selectedCarForModal)}
                  target="_blank"
                  rel="noreferrer"
                  className="models-modal-btn-wa"
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: "2rem" }}></i>
                  <span>{isFr ? "Confirmer sur WhatsApp (+237 691 78 64 47)" : "Confirm on WhatsApp (+237 691 78 64 47)"}</span>
                </a>
              </div>

              {bookingSent && (
                <div style={{ marginTop: "1.4rem", padding: "1.4rem", background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: "10px", color: "#166534", fontSize: "1.35rem", textAlign: "center" }}>
                  <i className="fa-solid fa-circle-check" style={{ marginRight: "0.6rem", fontSize: "1.6rem" }}></i>
                  <strong>{isFr ? "Réservation confirmée ! Votre Compte Client 3M a été activé." : "Booking confirmed! Your 3M Client Account has been activated."}</strong>
                  <div style={{ marginTop: "1rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCarForModal(null);
                        window.dispatchEvent(new CustomEvent("open-client-portal"));
                      }}
                      style={{
                        backgroundColor: "#16a34a",
                        color: "#ffffff",
                        border: "none",
                        padding: "0.8rem 1.6rem",
                        borderRadius: "8px",
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.6rem"
                      }}
                    >
                      <i className="fa-solid fa-circle-user"></i>
                      <span>{isFr ? "Accéder à mon Espace Client" : "Open My Account"}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Models;
