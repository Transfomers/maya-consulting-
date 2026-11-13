import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import { useTranslation } from "../context/LanguageContext";
import { CARS_CATALOGUE } from "../data/carsCatalogue";
import { API_BASE } from "../config/api";
import "../styles/CatalogEcommerce.css";

// Marketo visual assets
import wheelHeroImg from "../images/marketo/1-min.png";

function Models() {
  const { lang } = useTranslation();
  const isFr = lang === "fr";

  const [cars, setCars] = useState(CARS_CATALOGUE);
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [activeDealIdx, setActiveDealIdx] = useState(0); // 0 = Prado, 1 = Land Cruiser
  const [selectedCarForModal, setSelectedCarForModal] = useState(null);
  const [modalActivePhotoIdx, setModalActivePhotoIdx] = useState(0);

  // Modal reservation form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [bookingSent, setBookingSent] = useState(false);

  // Live countdown timer ticking down every second
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 35,
    seconds: 48,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return { days: 3, hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Deal of the week list (Prado TXL & Land Cruiser V8)
  const dealCars = [
    {
      car: cars.find((c) => c.id === "prado") || cars[1] || cars[0],
      discountBadge: "15% OFFRE VIP",
      oldPrice: "120 000 FCFA",
      stockLabel: isFr ? "1 Véhicule Disponible en Parc" : "1 Vehicle Available in Stock",
      progressWidth: "85%",
    },
    {
      car: cars.find((c) => c.id === "landcruiser") || cars[0],
      discountBadge: "VIP FLOTTE",
      oldPrice: "160 000 FCFA",
      stockLabel: isFr ? "Prêt pour Déplacements VIP" : "Ready for VIP Travel",
      progressWidth: "90%",
    },
  ];

  const currentDeal = dealCars[activeDealIdx] || dealCars[0];

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

  const getEmailLink = (car) => {
    const carName = car?.name || car?.model || "Véhicule 3M";
    const subject = encodeURIComponent(`Demande de Réservation 3M SERVICES : ${carName}`);
    const body = encodeURIComponent(
      `Bonjour l'équipe 3M SERVICES,\n\n` +
      `Je souhaite obtenir des informations et réserver le véhicule suivant :\n\n` +
      `• MODÈLE : ${carName}\n` +
      `• TARIF JOURNALIER : ${car?.price || "Sur demande"}\n\n` +
      `Merci de m'indiquer les disponibilités et modalités de prise en charge.\n\n` +
      `Mes coordonnées :\n` +
      `• Nom et Prénom :\n` +
      `• Téléphone / WhatsApp :\n` +
      `• Dates souhaitées :\n\n` +
      `Cordialement,`
    );
    return `mailto:contact@3Mservice.shop?subject=${subject}&body=${body}`;
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

    // Save booking to backend
    fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        carType: carName,
        name: clientName,
        phone: clientPhone,
        email: clientEmail,
        pickDate: pickupDate,
        dropDate: returnDate,
        totalPrice: selectedCarForModal.price,
      }),
    }).catch(() => {});

    setBookingSent(true);
    window.location.href = `mailto:contact@3Mservice.shop?subject=${subject}&body=${body}`;
  };

  return (
    <div className="catalog-ecom-page">
      {/* --------------------------------------------------------------------
          1. Hero Section (Marketo Parts Style with Floating Wheel)
          -------------------------------------------------------------------- */}
      <section className="marketo-hero">
        <div className="marketo-hero__container">
          {/* Left Text */}
          <div className="marketo-hero__content">
            <div className="marketo-hero__badge">
              <i className="fa-solid fa-certificate"></i>
              <span>{isFr ? "Flotte Officielle 3M SERVICES" : "Official 3M Fleet"}</span>
            </div>

            <h1 className="marketo-hero__title">
              {isFr ? (
                <>
                  DÉCOUVREZ NOTRE <em>FLOTTE VIP</em>
                  <br />À <em>YAOUNDÉ</em>
                </>
              ) : (
                <>
                  OFFICIAL <em>VIP FLEET</em>
                  <br />IN <em>YAOUNDÉ</em>
                </>
              )}
            </h1>

            <p className="marketo-hero__desc">
              {isFr
                ? "4x4 de grand prestige, pick-up double cabine tout-terrain et berlines exécutives. Disponibilité immédiate à partir de Yaoundé avec chauffeurs professionnels bilingues ou en formule autonome 24/7."
                : "Luxury VIP 4x4s, heavy-duty double cabin pickups, and executive sedans. Immediate availability from Yaoundé with bilingual chauffeurs or self-drive."}
            </p>

            <div className="marketo-hero__actions">
              <a href="#fleet-catalog" className="marketo-btn-primary">
                <i className="fa-solid fa-car"></i>
                <span>{isFr ? "Voir la Flotte" : "View Collection"}</span>
              </a>

              <a
                href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES%2C%20je%20souhaite%20r%C3%A9server%20un%20v%C3%A9hicule"
                target="_blank"
                rel="noreferrer"
                className="marketo-btn-outline"
              >
                <i className="fa-brands fa-whatsapp" style={{ color: "#25D366" }}></i>
                <span>{isFr ? "Réserver WhatsApp" : "Book WhatsApp"}</span>
              </a>
            </div>
          </div>

          {/* Right Visual (Interactive Alloy Wheel / Car like Marketo demo) */}
          <div className="marketo-hero__visual">
            <div className="marketo-hero__wheel-wrap">
              <img
                src={wheelHeroImg}
                alt="Jante Alliage Prestige 3M SERVICES"
                className="marketo-hero__wheel-img"
              />

              <div className="marketo-hero__floating-tag">
                <div className="marketo-hero__tag-icon">
                  <i className="fa-solid fa-shield-halved"></i>
                </div>
                <div className="marketo-hero__tag-text">
                  <span>{isFr ? "Entretien Certifié" : "Certified Service"}</span>
                  <strong>100% Zéro Panne</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
          3. Main 2-Column: Deals of the Week (Left) + Vehicle Grid (Right)
          -------------------------------------------------------------------- */}
      <div className="marketo-main-section" id="fleet-catalog">
        {/* Left Column: Deals of the Week Card */}
        <aside className="deal-week-card">
          <div className="deal-week-card__header">
            <h3 className="deal-week-card__title">
              <i className="fa-solid fa-fire"></i>
              <span>{isFr ? "Offre de la Semaine" : "Deal of the Week"}</span>
            </h3>

            <div className="deal-week-card__nav">
              <button
                type="button"
                className="deal-week-card__nav-btn"
                onClick={() =>
                  setActiveDealIdx((prev) => (prev === 0 ? dealCars.length - 1 : prev - 1))
                }
                aria-label="Véhicule précédent"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <button
                type="button"
                className="deal-week-card__nav-btn"
                onClick={() =>
                  setActiveDealIdx((prev) => (prev === dealCars.length - 1 ? 0 : prev + 1))
                }
                aria-label="Véhicule suivant"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>

          <div className="deal-week-card__body">
            {/* Featured Image with Discount Badge */}
            <div className="deal-week-card__img-wrap">
              <img
                src={currentDeal.car?.img || currentDeal.car?.image}
                alt={currentDeal.car?.name}
                className="deal-week-card__img"
              />
              <div className="deal-week-card__badge-discount">
                <span>-15%</span>
                <small>OFFRE</small>
              </div>
            </div>

            {/* Vehicle Name */}
            <h4 className="deal-week-card__car-title">
              {currentDeal.car?.name || "Toyota Land Cruiser Prado TXL VIP"}
            </h4>

            {/* Pricing */}
            <div className="deal-week-card__pricing">
              <span className="deal-week-card__old-price">{currentDeal.oldPrice}</span>
              <span className="deal-week-card__price">
                {currentDeal.car?.price}
              </span>
            </div>

            {/* Stock / Availability Progress */}
            <div className="deal-week-card__stock-info">
              <div className="deal-week-card__stock-text">
                <span>{currentDeal.stockLabel}</span>
                <strong style={{ color: "#16a34a" }}>Actif</strong>
              </div>
              <div className="deal-week-card__progress-bar">
                <div
                  className="deal-week-card__progress-fill"
                  style={{ width: currentDeal.progressWidth }}
                ></div>
              </div>
            </div>

            {/* Live Real-time Countdown Timer */}
            <div className="deal-week-card__countdown-wrap">
              <p className="deal-week-card__countdown-label">
                {isFr ? "Offre spéciale se termine dans :" : "Special offer ends in:"}
              </p>
              <div className="deal-week-card__timer-grid">
                <div className="deal-week-card__timer-box">
                  <span className="deal-week-card__timer-val">
                    {String(timeLeft.days).padStart(2, "0")}
                  </span>
                  <span className="deal-week-card__timer-unit">
                    {isFr ? "Jours" : "Days"}
                  </span>
                </div>
                <div className="deal-week-card__timer-box">
                  <span className="deal-week-card__timer-val">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="deal-week-card__timer-unit">
                    {isFr ? "Heures" : "Hours"}
                  </span>
                </div>
                <div className="deal-week-card__timer-box">
                  <span className="deal-week-card__timer-val">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="deal-week-card__timer-unit">Mins</span>
                </div>
                <div className="deal-week-card__timer-box">
                  <span className="deal-week-card__timer-val">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="deal-week-card__timer-unit">Secs</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              className="deal-week-card__btn-book"
              onClick={() => {
                setSelectedCarForModal(currentDeal.car);
                setModalActivePhotoIdx(0);
                setBookingSent(false);
              }}
            >
              <i className="fa-solid fa-calendar-check"></i>
              <span>{isFr ? "Réserver ce Véhicule" : "Book This Car"}</span>
            </button>
          </div>
        </aside>

        {/* Right Column: Fleet Catalog Header + 5 Cars Grid */}
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

          {/* Grid of the 5 Flyer Cars */}
          <div className="marketo-cars-grid">
            {filteredCars.map((car) => {
              const displayImg = car.img || car.image;
              const displayName = car.name || car.model;

              return (
                <div key={car.id} className="marketo-car-card">
                  {/* Category & Status Badges */}
                  <div className="marketo-car-card__category-badge">
                    {car.category || "3M VIP"}
                  </div>
                  <div className="marketo-car-card__status-badge">
                    {car.status || (isFr ? "Disponible" : "Available")}
                  </div>

                  {/* Car Image with Hover Scale & Clickable to View Different Angles */}
                  <div
                    className="marketo-car-card__img-wrap"
                    style={{ cursor: "pointer", position: "relative" }}
                    onClick={() => {
                      setSelectedCarForModal(car);
                      setModalActivePhotoIdx(0);
                      setBookingSent(false);
                    }}
                    title={isFr ? "Cliquer pour voir les détails et les différents angles" : "Click to view details and angles"}
                  >
                    <img
                      src={displayImg}
                      alt={displayName}
                      className="marketo-car-card__img"
                      loading="lazy"
                    />
                    {Array.isArray(car.photos) && car.photos.length > 1 && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          right: "8px",
                          background: "rgba(11, 15, 25, 0.8)",
                          backdropFilter: "blur(4px)",
                          color: "#ffffff",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "1.1rem",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <i className="fa-solid fa-camera" style={{ fontSize: "1rem", color: "#fca5a5" }}></i>
                        <span>{car.photos.length} angles</span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="marketo-car-card__name" title={displayName}>
                    {displayName}
                  </h3>

                  {/* Price Banner */}
                  <div className="marketo-car-card__price-box">
                    <span className="marketo-car-card__price-label">
                      {isFr ? "Tarif Journalier Officiel" : "Official Daily Rate"}
                    </span>
                    <div className="marketo-car-card__price-value">
                      {car.price}
                    </div>
                  </div>

                  {/* Specs Grid */}
                  <div className="marketo-car-card__specs-grid">
                    <div className="marketo-car-card__spec-item">
                      <i className="fa-solid fa-users"></i>
                      <span>{car.seats || "5 places"}</span>
                    </div>
                    <div className="marketo-car-card__spec-item">
                      <i className="fa-solid fa-gear"></i>
                      <span>{car.transmission || "Automatique"}</span>
                    </div>
                    <div className="marketo-car-card__spec-item">
                      <i className="fa-solid fa-snowflake"></i>
                      <span>{car.air || "Climatisé"}</span>
                    </div>
                    <div className="marketo-car-card__spec-item">
                      <i className="fa-solid fa-gas-pump"></i>
                      <span>{car.fuel || "Diesel"}</span>
                    </div>
                  </div>

                  {/* Action Buttons: Book Modal + WhatsApp Icon + Email Icon */}
                  <div className="marketo-car-card__actions">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCarForModal(car);
                        setModalActivePhotoIdx(0);
                        setBookingSent(false);
                      }}
                      className="marketo-car-card__btn-book"
                    >
                      <i className="fa-solid fa-calendar-check"></i>
                      <span>{isFr ? "Réserver en Ligne" : "Book Online"}</span>
                    </button>

                    <a
                      href={getWhatsAppLink(car)}
                      target="_blank"
                      rel="noreferrer"
                      className="marketo-car-card__btn-wa"
                      title={isFr ? "Réserver sur WhatsApp (+237 691 78 64 47)" : "Book on WhatsApp"}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                    </a>

                    <a
                      href={getEmailLink(car)}
                      className="marketo-car-card__btn-email"
                      title={isFr ? "Envoyer la demande par Email (contact@3Mservice.shop)" : "Send inquiry by Email"}
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

      {/* --------------------------------------------------------------------
          4. Trust & Service 5-Pillar Bar (Marketo Footer Style)
          -------------------------------------------------------------------- */}
      <section className="marketo-trust-bar">
        <div className="marketo-trust-grid">
          {/* Pillar 1 */}
          <div className="marketo-trust-item">
            <div className="marketo-trust-icon">
              <i className="fa-solid fa-screwdriver-wrench"></i>
            </div>
            <div className="marketo-trust-texts">
              <h4>{isFr ? "Véhicules Révisés" : "Certified Service"}</h4>
              <p>{isFr ? "Contrôle 100% zéro panne" : "Strict 0-breakdown inspection"}</p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="marketo-trust-item">
            <div className="marketo-trust-icon">
              <i className="fa-solid fa-user-tie"></i>
            </div>
            <div className="marketo-trust-texts">
              <h4>{isFr ? "Chauffeurs Bilingues" : "Bilingual Chauffeurs"}</h4>
              <p>{isFr ? "Ponctualité, discrétion & courtoisie" : "Punctuality & discretion"}</p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="marketo-trust-item">
            <div className="marketo-trust-icon">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div className="marketo-trust-texts">
              <h4>{isFr ? "Remplacement 24/7" : "24/7 Assistance"}</h4>
              <p>{isFr ? "Assistance immédiate partout" : "Immediate replacement anywhere"}</p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="marketo-trust-item">
            <div className="marketo-trust-icon">
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <div className="marketo-trust-texts">
              <h4>{isFr ? "Facture Proforma" : "Official Invoice"}</h4>
              <p>{isFr ? "Afriland, OM, MoMo & Virement" : "Afriland Bank, Mobile Money"}</p>
            </div>
          </div>

          {/* Pillar 5 */}
          <div className="marketo-trust-item">
            <div className="marketo-trust-icon">
              <i className="fa-solid fa-headset"></i>
            </div>
            <div className="marketo-trust-texts">
              <h4>{isFr ? "Conciergerie 24/7" : "24/7 Concierge"}</h4>
              <p>+237 691 78 64 47</p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          5. Complete Booking & Reservation Modal
          -------------------------------------------------------------------- */}
      {selectedCarForModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(11, 15, 25, 0.75)",
            backdropFilter: "blur(5px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setSelectedCarForModal(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              maxWidth: "680px",
              width: "100%",
              padding: "3.2rem 3rem",
              position: "relative",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
              border: "1.5px solid #e2e8f0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
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
                color: "#64748b",
              }}
            >
              ✕
            </button>

            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "1.8rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1.6rem" }}>
              <div style={{ width: "120px", height: "85px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: "8px", padding: "4px" }}>
                <img
                  src={selectedCarForModal.img || selectedCarForModal.image}
                  alt={selectedCarForModal.name}
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                />
              </div>

              <div>
                <span style={{ fontSize: "1.2rem", fontWeight: 700, textTransform: "uppercase", color: "#C92A2A", letterSpacing: "0.5px" }}>
                  {selectedCarForModal.category || "Flotte VIP 3M"}
                </span>
                <h3 style={{ fontSize: "2.1rem", fontWeight: 800, color: "#0b0f19", margin: "0.3rem 0" }}>
                  {selectedCarForModal.name}
                </h3>
                <div style={{ fontSize: "1.85rem", fontWeight: 900, color: "#C92A2A" }}>
                  {selectedCarForModal.price}
                </div>
              </div>
            </div>

            {/* MULTI-ANGLE PHOTO GALLERY & VIEWER */}
            {Array.isArray(selectedCarForModal.photos) && selectedCarForModal.photos.length > 0 && (
              <div style={{ marginBottom: "2rem", background: "#f8fafc", padding: "1.4rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0b0f19", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="fa-solid fa-camera" style={{ color: "#C92A2A" }}></i>
                    {isFr ? "Galerie Multi-Angles du Véhicule" : "Multi-Angle Vehicle Gallery"}
                  </span>
                  <span style={{ fontSize: "1.2rem", color: "#475569", fontWeight: 600, background: "#ffffff", padding: "3px 10px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                    Angle {modalActivePhotoIdx + 1} / {selectedCarForModal.photos.length}
                    {selectedCarForModal.photoLabels?.[modalActivePhotoIdx] ? ` • ${selectedCarForModal.photoLabels[modalActivePhotoIdx]}` : ""}
                  </span>
                </div>

                {/* Main Prominent Angle Photo */}
                <div style={{ position: "relative", width: "100%", height: "260px", background: "#ffffff", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" }}>
                  <img
                    src={selectedCarForModal.photos[modalActivePhotoIdx] || selectedCarForModal.img || selectedCarForModal.image}
                    alt={`${selectedCarForModal.name} - angle ${modalActivePhotoIdx + 1}`}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "all 0.3s ease" }}
                  />

                  {/* Previous / Next Arrow Controls */}
                  {selectedCarForModal.photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setModalActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : selectedCarForModal.photos.length - 1))}
                        style={{
                          position: "absolute",
                          left: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(11, 15, 25, 0.7)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "50%",
                          width: "36px",
                          height: "36px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.6rem",
                          fontWeight: 700,
                          transition: "background 0.2s",
                        }}
                        title={isFr ? "Angle précédent" : "Previous angle"}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalActivePhotoIdx((prev) => (prev < selectedCarForModal.photos.length - 1 ? prev + 1 : 0))}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(11, 15, 25, 0.7)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "50%",
                          width: "36px",
                          height: "36px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.6rem",
                          fontWeight: 700,
                          transition: "background 0.2s",
                        }}
                        title={isFr ? "Angle suivant" : "Next angle"}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails Angle Strip */}
                {selectedCarForModal.photos.length > 1 && (
                  <div style={{ display: "flex", gap: "10px", marginTop: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                    {selectedCarForModal.photos.map((pUrl, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setModalActivePhotoIdx(pIdx)}
                        style={{
                          flexShrink: 0,
                          width: "82px",
                          height: "60px",
                          borderRadius: "6px",
                          border: modalActivePhotoIdx === pIdx ? "2.5px solid #C92A2A" : "1.5px solid #cbd5e1",
                          padding: "2px",
                          background: "#ffffff",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          opacity: modalActivePhotoIdx === pIdx ? 1 : 0.65,
                          transition: "all 0.2s ease",
                        }}
                        title={selectedCarForModal.photoLabels?.[pIdx] || `Angle ${pIdx + 1}`}
                      >
                        <img
                          src={pUrl}
                          alt={`Thumbnail ${pIdx + 1}`}
                          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", background: "#f8fafc", padding: "1.4rem", borderRadius: "8px", marginBottom: "2.4rem", fontSize: "1.3rem", color: "#334155" }}>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.4rem", marginBottom: "1.4rem" }}>
                <div>
                  <label style={{ fontSize: "1.25rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.5rem" }}>
                    {isFr ? "Nom complet *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Arnaud Mbarga"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={{ width: "100%", padding: "1rem 1.2rem", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "1.4rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "1.25rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.5rem" }}>
                    {isFr ? "Téléphone / WhatsApp *" : "Phone / WhatsApp *"}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+237 6XX XX XX XX"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    style={{ width: "100%", padding: "1rem 1.2rem", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "1.4rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.4rem" }}>
                <label style={{ fontSize: "1.25rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.5rem" }}>
                  {isFr ? "Adresse Email (pour confirmation & facture) *" : "Email Address *"}
                </label>
                <input
                  type="email"
                  required
                  placeholder="votre@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  style={{ width: "100%", padding: "1rem 1.2rem", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "1.4rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.4rem", marginBottom: "2.4rem" }}>
                <div>
                  <label style={{ fontSize: "1.25rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.5rem" }}>
                    {isFr ? "Date de Prise en charge *" : "Pickup Date *"}
                  </label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    style={{ width: "100%", padding: "1rem 1.2rem", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "1.4rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "1.25rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: "0.5rem" }}>
                    {isFr ? "Date de Restitution *" : "Return Date *"}
                  </label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    style={{ width: "100%", padding: "1rem 1.2rem", borderRadius: "6px", border: "1.5px solid #cbd5e1", fontSize: "1.4rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Action Buttons: Email and WhatsApp */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: "#C92A2A",
                    color: "#ffffff",
                    padding: "1.4rem 2rem",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "1.55rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                    boxShadow: "0 6px 16px rgba(201, 42, 42, 0.3)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <i className="fa-solid fa-envelope"></i>
                  <span>{isFr ? "Envoyer par Email (contact@3Mservice.shop)" : "Send via Email (contact@3Mservice.shop)"}</span>
                </button>

                <a
                  href={getWhatsAppLink(selectedCarForModal)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    backgroundColor: "#25D366",
                    color: "#ffffff",
                    padding: "1.4rem 2rem",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "1.55rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "1rem",
                    boxShadow: "0 6px 16px rgba(37, 211, 102, 0.3)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: "2rem" }}></i>
                  <span>{isFr ? "Confirmer sur WhatsApp (+237 691 78 64 47)" : "Confirm on WhatsApp (+237 691 78 64 47)"}</span>
                </a>
              </div>

              {bookingSent && (
                <div style={{ marginTop: "1.4rem", padding: "1.2rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", color: "#166534", fontSize: "1.35rem", textAlign: "center" }}>
                  <i className="fa-solid fa-circle-check" style={{ marginRight: "0.6rem" }}></i>
                  {isFr ? "Votre demande a été préparée et transmise à contact@3Mservice.shop." : "Your request has been prepared and sent to contact@3Mservice.shop."}
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
