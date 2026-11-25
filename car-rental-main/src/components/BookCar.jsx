import { useEffect, useState } from "react";
import CarPrado from "../images/cars/toyota-prado-txl-front.webp";
import CarJeep from "../images/cars/jeep-grand-cherokee-front.webp";
import CarToyota from "../images/cars/toyota-camry-front.webp";
import CarFortuner from "../images/cars/toyota-fortuner-front.webp";
import CarMercedes from "../images/cars/mercedes-classe-e-front.webp";
import CarRav4 from "../images/cars/toyota-rav4-front.webp";
import { CARS_CATALOGUE } from "../data/carsCatalogue";
import { useTranslation } from "../context/LanguageContext";
import { API_BASE } from "../config/api";
import "../styles/BookingModal.css";

function BookCar() {
  const { lang, t } = useTranslation();
  const isFr = lang === "fr";

  const [modal, setModal] = useState(false);

  // Booking fields
  const [carType, setCarType] = useState("");
  const [pickUp, setPickUp] = useState("");
  const [dropOff, setDropOff] = useState("");
  const [pickTime, setPickTime] = useState("");
  const [dropTime, setDropTime] = useState("");
  const [carImg, setCarImg] = useState("");

  // Inline editing & status
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [successStatus, setSuccessStatus] = useState("");

  // Backend live data
  const [carsList, setCarsList] = useState(CARS_CATALOGUE);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [dropoffLocations, setDropoffLocations] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/cars`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (data && data.length > 0) {
          setCarsList(data);
        }
      })
      .catch((err) => console.log("Backend offline, fallback cars:", err));

    fetch(`${API_BASE}/locations`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.pickup) {
          setPickupLocations(data.pickup.filter((l) => l.active !== false));
        }
        if (data && data.dropoff) {
          setDropoffLocations(data.dropoff.filter((l) => l.active !== false));
        }
      })
      .catch((err) => console.log("Backend offline, fallback locations:", err));

    const storedCar = sessionStorage.getItem("selected_booking_car");
    if (storedCar) {
      setCarType(storedCar);
      setCarImg(storedCar);
      sessionStorage.removeItem("selected_booking_car");
    }

    const handleSelectCar = (e) => {
      if (e.detail && e.detail.carName) {
        setCarType(e.detail.carName);
        setCarImg(e.detail.carName);
        const bookingSection = document.querySelector("#booking-section");
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: "smooth" });
        }
      }
    };
    window.addEventListener("select-booking-car", handleSelectCar);
    return () => window.removeEventListener("select-booking-car", handleSelectCar);
  }, []);

  const defaultPickups = [
    "Yaoundé - Agence Omnisports (Rue Foe)",
    "Aéroport International de Yaoundé-Nsimalen (NSI)",
    "Yaoundé - Bastos (Ambassades & Hôtels)",
    "Yaoundé - Tsinga (Face FECAFOOT / 3M Services)",
    "Douala - Aéroport International de Douala (DLA)",
    "Douala - Akwa / Bonanjo (Centre d'Affaires)",
    "Kribi - Station Balnéaire & Hôtels",
    "Bafoussam - Centre-ville (Région de l'Ouest)",
    "Livraison VIP personnalisée à domicile ou hôtel"
  ];

  const defaultDropoffs = [
    "Même lieu que la prise en charge",
    "Yaoundé - Agence Omnisports (Rue Foe)",
    "Aéroport International de Yaoundé-Nsimalen (NSI)",
    "Yaoundé - Bastos",
    "Yaoundé - Tsinga (Face FECAFOOT)",
    "Douala - Aéroport International de Douala (DLA)",
    "Douala - Akwa / Bonanjo",
    "Kribi - Station Balnéaire & Hôtels",
    "Restitution personnalisée sur devis"
  ];

  // Open modal when search form is filled
  const openModal = (e) => {
    e.preventDefault();
    const errorMsg = document.querySelector(".error-message");
    if (
      pickUp === "" ||
      dropOff === "" ||
      pickTime === "" ||
      dropTime === "" ||
      carType === ""
    ) {
      if (errorMsg) errorMsg.style.display = "flex";
    } else {
      setSuccessStatus("");
      setIsEditingSummary(false);
      setModal(true);
      const modalDiv = document.querySelector(".booking-modal");
      if (modalDiv) modalDiv.scroll(0, 0);
      if (errorMsg) errorMsg.style.display = "none";
    }
  };

  const closeModal = () => {
    setModal(false);
    setIsEditingSummary(false);
  };

  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modal]);

  const calculateDays = () => {
    if (!pickTime || !dropTime) return 1;
    const p = new Date(pickTime);
    const d = new Date(dropTime);
    const diff = Math.ceil((d - p) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const formatDateReadable = (dateStr) => {
    if (!dateStr) return isFr ? "À convenir" : "To be confirmed";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isFr ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  // Determine matched car & preview image
  let imgUrl = CarPrado;
  const lowerCar = (carType || "").toLowerCase();
  const matchedCar =
    carsList.find(
      (c) =>
        c.name &&
        (c.name.toLowerCase() === lowerCar ||
          c.name.toLowerCase().includes(lowerCar) ||
          lowerCar.includes(c.name.toLowerCase()))
    ) ||
    CARS_CATALOGUE.find(
      (c) =>
        c.name &&
        (c.name.toLowerCase() === lowerCar ||
          c.name.toLowerCase().includes(lowerCar) ||
          lowerCar.includes(c.name.toLowerCase()))
    );

  if (matchedCar && (matchedCar.image || matchedCar.img)) {
    imgUrl = matchedCar.image || matchedCar.img;
  } else if (lowerCar.includes("jeep") || lowerCar.includes("cherokee") || carImg === "Jeep Grand Cherokee V6 MUPOCAM") {
    imgUrl = CarJeep;
  } else if (lowerCar.includes("mercedes") || lowerCar.includes("classe e") || carImg === "Mercedes-Benz Classe E VIP") {
    imgUrl = CarMercedes;
  } else if (lowerCar.includes("fortuner") || carImg === "Toyota Fortuner 4x4") {
    imgUrl = CarFortuner;
  } else if (lowerCar.includes("rav4") || carImg === "Toyota RAV4 4WD") {
    imgUrl = CarRav4;
  } else if (lowerCar.includes("camry") || carImg === "Toyota Camry Executive") {
    imgUrl = CarToyota;
  }

  const getCarKey = () => matchedCar?.id || carType || "prado";

  // Tarif journalier réel du véhicule (null si inconnu : pas de montant inventé)
  const dailyRate = (() => {
    const raw = matchedCar?.promoPrice || matchedCar?.pricePerDay || matchedCar?.price;
    const n = typeof raw === "number" ? raw : parseInt(String(raw || "").replace(/\D/g, ""), 10);
    return n > 0 ? n : null;
  })();
  const fmtFcfa = (n) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

  const getCarCardUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://3mservice.shop";
    return `${origin}/models?car=${encodeURIComponent(getCarKey())}`;
  };

  const buildDirectBookingMessage = () => {
    const days = calculateDays();
    const formattedPick = formatDateReadable(pickTime);
    const formattedDrop = formatDateReadable(dropTime);
    const carCardUrl = getCarCardUrl();

    return isFr
      ? `Bonjour 3M SERVICES,\n\nJe souhaite réserver ce véhicule :\n\n` +
          `🚗 Véhicule : ${carType}\n` +
          `📅 Prise en charge : ${pickUp} — ${formattedPick}\n` +
          `🏁 Restitution : ${dropOff} — ${formattedDrop}\n` +
          `⏱️ Durée estimée : ${days} jour(s)\n` +
          `🔗 Fiche du véhicule : ${carCardUrl}\n\n` +
          `Merci de me confirmer la disponibilité et les modalités.`
      : `Hello 3M SERVICES,\n\nI would like to book this vehicle:\n\n` +
          `🚗 Vehicle: ${carType}\n` +
          `📅 Pick-up: ${pickUp} — ${formattedPick}\n` +
          `🏁 Drop-off: ${dropOff} — ${formattedDrop}\n` +
          `⏱️ Estimated duration: ${days} Day(s)\n` +
          `🔗 Vehicle card link: ${carCardUrl}\n\n` +
          `Please confirm availability and rental details.`;
  };

  const handleSendViaWhatsApp = () => {
    const msg = buildDirectBookingMessage();
    window.open(`https://wa.me/237691786447?text=${encodeURIComponent(msg)}`, "_blank");
    setSuccessStatus(
      isFr
        ? "Votre demande avec le lien vers le véhicule a été préparée dans WhatsApp !"
        : "Your booking details and vehicle link have been opened in WhatsApp!"
    );
  };

  const handleSendViaAppChat = () => {
    const msg = buildDirectBookingMessage();
    const carCardUrl = getCarCardUrl();

    setModal(false);
    setIsEditingSummary(false);
    setSuccessStatus(
      isFr
        ? "Votre demande et la fiche véhicule ont été envoyées dans le Chat Privé 3M !"
        : "Your booking details and vehicle card were sent to 3M In-App Chat!"
    );

    window.dispatchEvent(
      new CustomEvent("3m-open-chat", {
        detail: {
          message: msg,
          autoSend: true,
          car: {
            id: getCarKey(),
            name: carType,
            price: dailyRate,
            image: imgUrl,
            url: carCardUrl
          }
        }
      })
    );
  };

  return (
    <>
      <section id="booking-section" className="book-section">
        <div className="container">
          <div className="book-content">
            <div className="book-content__box">
              <h2>{t("book_title")}</h2>

              <p className="error-message">
                {t("book_error")} <i className="fa-solid fa-xmark"></i>
              </p>

              {successStatus && (
                <div className="booking-success-banner">
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{successStatus}</span>
                </div>
              )}

              <form className="box-form">
                <div className="box-form__car-type">
                  <label htmlFor="cartype">
                    <i className="fa-solid fa-car" style={{ color: "#D62828", marginRight: "7px" }}></i>
                    <span>{t("book_car_type")}</span>
                  </label>
                  <input
                    id="cartype"
                    list="car-types-list"
                    type="text"
                    value={carType}
                    placeholder={t("book_car_type_placeholder") || "Select your car type"}
                    onChange={(e) => {
                      setCarType(e.target.value);
                      setCarImg(e.target.value);
                    }}
                    autoComplete="off"
                  />
                  <datalist id="car-types-list">
                    {carsList && carsList.length > 0
                      ? carsList.map((car) => (
                          <option key={car.id || car.name} value={car.name}>
                            {car.name} {car.price ? `(${car.price})` : ""}
                          </option>
                        ))
                      : CARS_CATALOGUE.map((car) => (
                          <option key={car.id} value={car.name}>
                            {car.name}
                          </option>
                        ))}
                  </datalist>
                </div>

                <div className="box-form__car-type">
                  <label htmlFor="pick">
                    <i className="fa-solid fa-location-dot" style={{ color: "#D62828", marginRight: "7px" }}></i>
                    <span>{t("book_pickup")}</span>
                  </label>
                  <input
                    id="pick"
                    list="pickup-locations-list"
                    type="text"
                    value={pickUp}
                    placeholder={t("book_pickup_placeholder") || "Select pick-up location"}
                    onChange={(e) => setPickUp(e.target.value)}
                    autoComplete="off"
                  />
                  <datalist id="pickup-locations-list">
                    {pickupLocations && pickupLocations.length > 0
                      ? pickupLocations.map((loc) => (
                          <option key={loc.id || loc.name} value={loc.name}>
                            {loc.name}
                          </option>
                        ))
                      : defaultPickups.map((loc, idx) => (
                          <option key={idx} value={loc}>
                            {loc}
                          </option>
                        ))}
                  </datalist>
                </div>

                <div className="box-form__car-type">
                  <label htmlFor="drop">
                    <i className="fa-solid fa-location-dot" style={{ color: "#D62828", marginRight: "7px" }}></i>
                    <span>{t("book_dropoff")}</span>
                  </label>
                  <input
                    id="drop"
                    list="dropoff-locations-list"
                    type="text"
                    value={dropOff}
                    placeholder={t("book_dropoff_placeholder") || "Select drop-off location"}
                    onChange={(e) => setDropOff(e.target.value)}
                    autoComplete="off"
                  />
                  <datalist id="dropoff-locations-list">
                    {dropoffLocations && dropoffLocations.length > 0
                      ? dropoffLocations.map((loc) => (
                          <option key={loc.id || loc.name} value={loc.name}>
                            {loc.name}
                          </option>
                        ))
                      : defaultDropoffs.map((loc, idx) => (
                          <option key={idx} value={loc}>
                            {loc}
                          </option>
                        ))}
                  </datalist>
                </div>

                <div className="box-form__car-time">
                  <label htmlFor="picktime">
                    <i className="fa-regular fa-calendar-days" style={{ color: "#D62828", marginRight: "7px" }}></i>
                    <span>{t("book_pickup_date")}</span>
                  </label>
                  <input
                    id="picktime"
                    value={pickTime}
                    onChange={(e) => setPickTime(e.target.value)}
                    type="date"
                    placeholder="dd/mm/yyyy"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="box-form__car-time">
                  <label htmlFor="droptime">
                    <i className="fa-regular fa-calendar-days" style={{ color: "#D62828", marginRight: "7px" }}></i>
                    <span>{t("book_dropoff_date")}</span>
                  </label>
                  <input
                    id="droptime"
                    value={dropTime}
                    onChange={(e) => setDropTime(e.target.value)}
                    type="date"
                    placeholder="dd/mm/yyyy"
                    min={pickTime || new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="box-form__btn-wrapper">
                  <label className="box-form__btn-label" aria-hidden="true">
                    &nbsp;
                  </label>
                  <button onClick={openModal} type="submit" className="book-search-btn">
                    {t("book_search") || "Search"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Backdrop Overlay */}
      {modal && (
        <div
          onClick={closeModal}
          className="modal-overlay active-modal"
          aria-hidden={!modal}
        ></div>
      )}

      {/* ==================================================================
          STREAMLINED DIRECT BOOKING MODAL (NO PERSONAL INFO REQUIRED)
          ================================================================== */}
      <div className={`booking-modal bm-v2 ${modal ? "active-modal" : ""}`} role="dialog" aria-modal="true" aria-label={isFr ? "Confirmer votre réservation" : "Confirm your reservation"}>
        {/* Modal Header */}
        <div className="booking-modal__title">
          <div className="booking-modal__title__left">
            <span className="booking-modal__brand-badge">3M SERVICES • YAOUNDÉ</span>
            <h2>{t("modal_title")}</h2>
          </div>
          <button type="button" onClick={closeModal} className="booking-modal__close-btn" aria-label="Fermer">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Success Alert */}
        {successStatus && (
          <div className="booking-modal__alert-success">
            <i className="fa-solid fa-circle-check"></i>
            <span>{successStatus}</span>
          </div>
        )}

        {/* A. BOOKING SUMMARY (WITH INLINE EDIT TOGGLE & VEHICLE CARD LINK) */}
        <div className="booking-modal__summary-card">
          <div className="booking-modal__summary-header">
            <div className="booking-modal__summary-header-left">
              <i className="fa-solid fa-clipboard-check" style={{ color: "#D62828" }}></i>
              <h3>{t("modal_summary_title") || (isFr ? "Récapitulatif de la Réservation" : "Booking Summary")}</h3>
            </div>
            <button
              type="button"
              className="booking-modal__edit-btn"
              onClick={() => setIsEditingSummary(!isEditingSummary)}
            >
              <i className={`fa-solid ${isEditingSummary ? "fa-check" : "fa-pen-to-square"}`}></i>
              <span>
                {isEditingSummary
                  ? (isFr ? "Fermer l'édition" : "Done")
                  : (isFr ? "Modifier" : "Edit")}
              </span>
            </button>
          </div>

          {isEditingSummary ? (
            <div className="booking-modal__inline-edit-panel">
              <div className="inline-edit-grid">
                <div className="inline-edit-field">
                  <label>{t("book_car_type")}</label>
                  <select
                    value={carType}
                    onChange={(e) => {
                      setCarType(e.target.value);
                      setCarImg(e.target.value);
                    }}
                  >
                    {carsList.map((car) => (
                      <option key={car.id || car.name} value={car.name}>
                        {car.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inline-edit-field">
                  <label>{t("modal_pickup_loc")}</label>
                  <select value={pickUp} onChange={(e) => setPickUp(e.target.value)}>
                    {(pickupLocations.length > 0 ? pickupLocations.map((l) => l.name) : defaultPickups).map((loc, i) => (
                      <option key={i} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inline-edit-field">
                  <label>{t("modal_dropoff_loc")}</label>
                  <select value={dropOff} onChange={(e) => setDropOff(e.target.value)}>
                    {(dropoffLocations.length > 0 ? dropoffLocations.map((l) => l.name) : defaultDropoffs).map((loc, i) => (
                      <option key={i} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inline-edit-field">
                  <label>{t("modal_pickup_date")}</label>
                  <input
                    type="date"
                    value={pickTime}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setPickTime(e.target.value)}
                  />
                </div>

                <div className="inline-edit-field">
                  <label>{t("modal_dropoff_date")}</label>
                  <input
                    type="date"
                    value={dropTime}
                    min={pickTime || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDropTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="inline-edit-actions">
                <button
                  type="button"
                  className="inline-edit-save-btn"
                  onClick={() => setIsEditingSummary(false)}
                >
                  <i className="fa-solid fa-check"></i>
                  <span>{isFr ? "Valider les modifications" : "Save Changes"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bm-summary">
              <div className="bm-vehicle">
                {imgUrl && <img src={imgUrl} alt={carType} className="bm-vehicle__img" />}
                <div className="bm-vehicle__info">
                  <span className="bm-label">{isFr ? "Véhicule" : "Vehicle"}</span>
                  <strong className="bm-vehicle__name">{carType || (isFr ? "Véhicule à choisir" : "Vehicle to choose")}</strong>
                  <a href={getCarCardUrl()} className="bm-link">
                    <i className="fa-solid fa-arrow-up-right-from-square"></i> {isFr ? "Voir la fiche du véhicule" : "View vehicle card"}
                  </a>
                </div>
              </div>

              <div className="bm-trip">
                <div className="bm-stop">
                  <span className="bm-stop__icon"><i className="fa-solid fa-location-dot"></i></span>
                  <div>
                    <span className="bm-label">{isFr ? "Prise en charge" : "Pick-up"}</span>
                    <strong>{formatDateReadable(pickTime)}</strong>
                    <span className="bm-place">{pickUp || (isFr ? "Lieu à préciser" : "Location to confirm")}</span>
                  </div>
                </div>
                <div className="bm-trip__line" aria-hidden="true">
                  <span className="bm-days">{calculateDays()} {isFr ? (calculateDays() > 1 ? "jours" : "jour") : (calculateDays() > 1 ? "days" : "day")}</span>
                </div>
                <div className="bm-stop">
                  <span className="bm-stop__icon is-end"><i className="fa-solid fa-flag-checkered"></i></span>
                  <div>
                    <span className="bm-label">{isFr ? "Restitution" : "Drop-off"}</span>
                    <strong>{formatDateReadable(dropTime)}</strong>
                    <span className="bm-place">{dropOff || (isFr ? "Lieu à préciser" : "Location to confirm")}</span>
                  </div>
                </div>
              </div>

              {dailyRate && carType && (
                <div className="bm-estimate">
                  <div>
                    <span className="bm-label">{isFr ? "Estimation" : "Estimate"}</span>
                    <small>{calculateDays()} × {fmtFcfa(dailyRate)} · {isFr ? "tarif confirmé par la conciergerie" : "rate confirmed by our concierge"}</small>
                  </div>
                  <strong>{fmtFcfa(dailyRate * calculateDays())}</strong>
                </div>
              )}
            </div>
          )}
        </div>

        {/* B. DIRECT SEND CHANNEL CHOICE (WHATSAPP OR IN-APP CHAT) */}
        <div className="bm-send">
          <h3 className="bm-send__title">{isFr ? "Envoyer ma demande" : "Send my request"}</h3>
          <p className="bm-send__hint">
            {isFr ? "Aucun formulaire : vos dates, lieux et la fiche du véhicule sont envoyés directement." : "No form: your dates, locations and vehicle card are sent directly."}
          </p>
          <div className="bm-send__options">
            <button type="button" onClick={handleSendViaAppChat} className="bm-option is-chat">
              <span className="bm-option__icon"><i className="fa-solid fa-comments"></i></span>
              <span className="bm-option__text">
                <strong>{isFr ? "Chat Privé 3M" : "3M Private Chat"}</strong>
                <small>{isFr ? "Réponse dans l'application · votre conversation est conservée" : "Reply in the app · your conversation is kept"}</small>
              </span>
              <i className="fa-solid fa-chevron-right bm-option__arrow"></i>
            </button>
            <button type="button" onClick={handleSendViaWhatsApp} className="bm-option is-wa">
              <span className="bm-option__icon"><i className="fa-brands fa-whatsapp"></i></span>
              <span className="bm-option__text">
                <strong>WhatsApp</strong>
                <small>+237 691 78 64 47</small>
              </span>
              <i className="fa-solid fa-chevron-right bm-option__arrow"></i>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default BookCar;
