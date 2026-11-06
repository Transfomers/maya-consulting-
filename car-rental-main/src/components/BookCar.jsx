import { useEffect, useState } from "react";
import CarPrado from "../images/cars/toyota-prado-txl-front.webp";
import CarJeep from "../images/cars/jeep-grand-cherokee-front.webp";
import CarToyota from "../images/cars/toyota-camry-front.webp";
import CarFortuner from "../images/cars/toyota-fortuner-front.webp";
import CarMercedes from "../images/cars/mercedes-classe-e-front.webp";
import CarRav4 from "../images/cars/toyota-rav4-front.webp";
import { CARS_CATALOGUE } from "../data/carsCatalogue";
import { useTranslation } from "../context/LanguageContext";

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

  // Modal personal details
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("25");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Yaoundé");
  const [zipcode, setZipCode] = useState("");
  const [newsletter, setNewsletter] = useState(false);

  // Inline editing in modal summary
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  // Form submission and validation states
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [successStatus, setSuccessStatus] = useState("");
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Backend live data
  const [carsList, setCarsList] = useState(CARS_CATALOGUE);
  const [pickupLocations, setPickupLocations] = useState([]);
  const [dropoffLocations, setDropoffLocations] = useState([]);

  useEffect(() => {
    // 1. Fetch live fleet from backend
    fetch("http://localhost:5001/api/cars")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (data && data.length > 0) {
          setCarsList(data);
        }
      })
      .catch((err) => console.log("Backend offline, fallback cars:", err));

    // 2. Fetch live Cameroon locations from backend
    fetch("http://localhost:5001/api/locations")
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

    // 3. Listen to external vehicle selections (from Catalogue, Models, or Home)
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
      setHasSubmitted(false);
      setSuccessStatus("");
      setPdfSuccess(false);
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

  // Disable page scroll when modal is displayed
  useEffect(() => {
    if (modal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [modal]);

  // Calculate rental duration in days
  const calculateDays = () => {
    if (!pickTime || !dropTime) return 1;
    const p = new Date(pickTime);
    const d = new Date(dropTime);
    const diff = Math.ceil((d - p) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  // Format date helper for human-readable summary
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

  // Determine car preview image
  let imgUrl = CarPrado;
  const matchedBackendCar = carsList.find((c) => c.name === carType);
  if (matchedBackendCar && matchedBackendCar.image) {
    imgUrl = matchedBackendCar.image;
  } else {
    switch (carImg || carType) {
      case "Toyota Land Cruiser Prado TXL VIP":
      case "Toyota Prado VIP":
        imgUrl = CarPrado;
        break;
      case "Jeep Grand Cherokee V6 MUPOCAM":
      case "Jeep Grand Cherokee":
        imgUrl = CarJeep;
        break;
      case "Mercedes-Benz Classe E VIP":
      case "Mercedes Classe E VIP":
        imgUrl = CarMercedes;
        break;
      case "Toyota Fortuner 4x4":
        imgUrl = CarFortuner;
        break;
      case "Toyota RAV4 4WD":
        imgUrl = CarRav4;
        break;
      case "Toyota Camry Executive":
        imgUrl = CarToyota;
        break;
      default:
        imgUrl = CarPrado;
    }
  }

  // Mandatory fields validation
  const isNameValid = name.trim().length > 0;
  const isLastNameValid = lastName.trim().length > 0;
  const isPhoneValid = phone.trim().length >= 7;
  const isEmailValid = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const isFormValid = () => {
    return isNameValid && isLastNameValid && isPhoneValid && isEmailValid;
  };

  // Generate Official PDF Document with "PENDING CONCIERGE VALIDATION" notice
  const generateReservationPDF = (refId) => {
    const days = calculateDays();
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert(
        isFr
          ? "Veuillez autoriser les fenêtres pop-up pour afficher votre Bon de Réservation en PDF."
          : "Please allow pop-ups to view your reservation voucher in PDF."
      );
      return;
    }

    const formattedPickDate = formatDateReadable(pickTime);
    const formattedDropDate = formatDateReadable(dropTime);
    const currentDate = new Date().toLocaleDateString(isFr ? "fr-FR" : "en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="${isFr ? "fr" : "en"}">
      <head>
        <meta charset="UTF-8">
        <title>${isFr ? "Bon de Réservation" : "Reservation Voucher"} - 3M SERVICES (${refId})</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #171717;
            background-color: #ffffff;
            padding: 30px;
            font-size: 13px;
            line-height: 1.5;
          }
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          .voucher-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #E5E5E5;
            border-radius: 8px;
            padding: 28px;
            position: relative;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #E5E5E5;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .logo-area h1 {
            font-size: 24px;
            font-weight: 900;
            color: #D62828;
            letter-spacing: -0.5px;
          }
          .logo-area span { color: #171717; }
          .logo-area p { font-size: 11px; color: #737373; margin-top: 3px; }
          .ref-area { text-align: right; }
          .ref-badge {
            background-color: #fef2f2;
            color: #D62828;
            border: 1px solid #fecaca;
            padding: 4px 12px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 13px;
            display: inline-block;
            margin-bottom: 4px;
          }
          .ref-area p { font-size: 11px; color: #737373; }
          .status-banner {
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            color: #92400e;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .status-banner h2 {
            font-size: 13.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-badge-pending {
            background: #d97706;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 4px;
            letter-spacing: 0.5px;
          }
          .vehicle-highlight {
            border: 1px solid #E5E5E5;
            background: #fafafa;
            border-radius: 6px;
            padding: 14px 18px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .vehicle-name { font-size: 16px; font-weight: 800; color: #D62828; }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin-bottom: 20px;
          }
          .card {
            border: 1px solid #E5E5E5;
            border-radius: 6px;
            padding: 14px 16px;
            background-color: #FFFFFF;
          }
          .card h3 {
            font-size: 12px;
            font-weight: 800;
            color: #171717;
            border-bottom: 1px solid #E5E5E5;
            padding-bottom: 6px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dashed #f0f0f0;
            font-size: 12px;
          }
          .item:last-child { border-bottom: none; }
          .item span.label { color: #737373; }
          .item span.value { font-weight: 700; color: #171717; text-align: right; }
          .disclaimer {
            border: 1px solid #e5e5e5;
            border-left: 4px solid #D62828;
            border-radius: 4px;
            padding: 12px 16px;
            margin-bottom: 20px;
            background: #ffffff;
            font-size: 11.5px;
            color: #404040;
            line-height: 1.5;
          }
          .disclaimer strong {
            color: #D62828;
            display: block;
            margin-bottom: 4px;
            text-transform: uppercase;
            font-size: 11px;
          }
          .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 10px;
            padding-top: 12px;
            border-top: 1px solid #E5E5E5;
          }
          .stamp-box {
            border: 1.5px dashed #D62828;
            border-radius: 6px;
            padding: 8px 14px;
            text-align: center;
            color: #D62828;
            font-size: 11px;
            font-weight: 800;
            background: #fff5f5;
          }
          .stamp-box small {
            display: block;
            font-size: 9px;
            color: #737373;
            font-weight: 400;
            margin-top: 2px;
          }
          .signature-box { text-align: right; font-size: 11px; color: #737373; }
          .signature-box strong { display: block; color: #171717; font-size: 12px; margin-top: 20px; }
          .print-actions { margin-top: 20px; text-align: center; }
          .btn-print {
            background-color: #D62828;
            color: #ffffff;
            border: none;
            padding: 10px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }
          .btn-print:hover { background-color: #B91C1C; }
          @media print {
            body { padding: 0; }
            .print-actions { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="voucher-container">
          <div class="header">
            <div class="logo-area">
              <h1>3M <span>SERVICES</span></h1>
              <p>${isFr ? "Location Automobile de Prestige • Yaoundé, Cameroun" : "Premium Car Rental & Mobility • Yaoundé, Cameroon"}</p>
              <p>Agences : Omnisports (Rue Foe) • Tsinga (Face FECAFOOT) • Aéroport Nsimalen</p>
            </div>
            <div class="ref-area">
              <span class="ref-badge">RÉF : ${refId}</span>
              <p>${isFr ? "Émis le" : "Issued on"} : ${currentDate}</p>
              <p>${isFr ? "Statut : En attente de validation conciergerie" : "Status: Pending Concierge Validation"}</p>
            </div>
          </div>

          <div class="status-banner">
            <h2>${isFr ? "Demande de Réservation Véhicule" : "Vehicle Reservation Request"}</h2>
            <span class="status-badge-pending">${isFr ? "EN ATTENTE DE VALIDATION CONCIERGERIE" : "PENDING CONCIERGE VALIDATION"}</span>
          </div>

          <div class="vehicle-highlight">
            <div>
              <span style="font-size: 11px; color: #737373; font-weight: 600; text-transform: uppercase;">${isFr ? "Véhicule Sélectionné :" : "Selected Vehicle:"}</span>
              <div class="vehicle-name">${carType || "Véhicule de Prestige"}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 11px; color: #737373;">${isFr ? "Durée estimée :" : "Estimated duration:"}</span>
              <div style="font-size: 14px; font-weight: 800; color: #171717;">${days} ${isFr ? "Jour(s)" : "Day(s)"}</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="card">
              <h3>${isFr ? "📍 Lieux & Dates de Location" : "📍 Rental Period & Locations"}</h3>
              <div class="item">
                <span class="label">${isFr ? "Date de départ :" : "Pick-up date:"}</span>
                <span class="value">${formattedPickDate}</span>
              </div>
              <div class="item">
                <span class="label">${isFr ? "Lieu de prise en charge :" : "Pick-up location:"}</span>
                <span class="value">${pickUp || "Yaoundé"}</span>
              </div>
              <div class="item">
                <span class="label">${isFr ? "Date de retour :" : "Drop-off date:"}</span>
                <span class="value">${formattedDropDate}</span>
              </div>
              <div class="item">
                <span class="label">${isFr ? "Lieu de restitution :" : "Drop-off location:"}</span>
                <span class="value">${dropOff || "Yaoundé"}</span>
              </div>
            </div>

            <div class="card">
              <h3>${isFr ? "👤 Coordonnées du Locataire" : "👤 Customer Information"}</h3>
              <div class="item">
                <span class="label">${isFr ? "Nom complet :" : "Full Name:"}</span>
                <span class="value">${name} ${lastName}</span>
              </div>
              <div class="item">
                <span class="label">${isFr ? "Téléphone / WhatsApp :" : "Phone / WhatsApp:"}</span>
                <span class="value">${phone}</span>
              </div>
              <div class="item">
                <span class="label">${isFr ? "Email :" : "Email:"}</span>
                <span class="value">${email || (isFr ? "Non communiqué" : "N/A")}</span>
              </div>
              <div class="item">
                <span class="label">${isFr ? "Adresse / Ville :" : "Address / City:"}</span>
                <span class="value">${address || ""}, ${city || "Yaoundé"} ${zipcode ? `(${zipcode})` : ""}</span>
              </div>
            </div>
          </div>

          <div class="disclaimer">
            <strong>${isFr ? "IMPORTANT : VALIDATION CONCIERGERIE OBLIGATOIRE" : "IMPORTANT: CONCIERGE VALIDATION REQUIRED"}</strong>
            ${isFr
              ? "Ce document officiel constitue une demande de réservation préalable en attente de validation conciergerie. La mise à disposition définitive du véhicule est soumise à la validation de disponibilité et à la signature du contrat officiel par la conciergerie 3M SERVICES."
              : "This official document represents a reservation request pending concierge confirmation. Final vehicle availability is subject to verification and formal agreement by 3M SERVICES concierge."}
          </div>

          <div class="footer-section">
            <div class="stamp-box">
              DIRECTION EXPLOITATION 3M SERVICES<br>
              CONCIERGERIE OFFICIELLE YAOUNDÉ<br>
              <small>+237 691 78 64 47 • +237 653 76 17 28</small>
            </div>
            <div class="signature-box">
              ${isFr ? "Demande émise pour le client" : "Request issued for customer"} <strong>${name} ${lastName}</strong>
            </div>
          </div>
        </div>

        <div class="print-actions">
          <button class="btn-print" onclick="window.print()">${isFr ? "Imprimer ou Enregistrer en PDF" : "Print or Save as PDF"}</button>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Handle PDF Download Only
  const handleDownloadPDF = (e) => {
    if (e) e.preventDefault();
    setHasSubmitted(true);
    if (!isFormValid()) {
      return;
    }
    const refId = "3M-RES-" + Date.now().toString().slice(-4);
    generateReservationPDF(refId);
    setPdfSuccess(true);
  };

  // Handle WhatsApp Confirmation + Background Backend Sync
  const handleConfirmWhatsApp = (e) => {
    if (e) e.preventDefault();
    setHasSubmitted(true);
    if (!isFormValid()) {
      return;
    }

    const refId = "3M-RES-" + Date.now().toString().slice(-4);
    const fullName = `${name} ${lastName}`.trim();
    const days = calculateDays();
    const formattedPick = formatDateReadable(pickTime);
    const formattedDrop = formatDateReadable(dropTime);

    // 1. Send booking to backend asynchronously
    fetch("http://localhost:5001/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: fullName,
        phone,
        email: email || "",
        address: address || "Yaoundé",
        city: city || "Yaoundé",
        zipcode: zipcode || "",
        carName: carType,
        pickUp,
        dropOff,
        pickTime,
        dropTime,
        notes: `Âge: ${age || "25"} • Newsletter: ${newsletter ? "Oui" : "Non"}`
      })
    }).catch((err) => console.warn("Backend offline or network err:", err));

    // 2. Build formatted WhatsApp message
    const msg = encodeURIComponent(
      `Bonjour 3M SERVICES,\n\n` +
      `Je souhaite confirmer ma demande de réservation [Réf : ${refId}] :\n\n` +
      `🚗 Véhicule : ${carType}\n` +
      `📅 Prise en charge : ${pickUp} le ${formattedPick}\n` +
      `🏁 Restitution : ${dropOff} le ${formattedDrop}\n` +
      `⏱️ Durée estimée : ${days} jour(s)\n\n` +
      `👤 Client : ${fullName}\n` +
      `📞 Téléphone / WhatsApp : ${phone}\n` +
      (email ? `✉️ Email : ${email}\n` : "") +
      (address ? `📍 Adresse / Quartier : ${address}, ${city || "Yaoundé"}\n` : `📍 Ville : ${city || "Yaoundé"}\n`) +
      (zipcode ? `📍 Repère : ${zipcode}\n\n` : `\n`) +
      `Statut : En attente de validation conciergerie.\n` +
      `Merci de me confirmer la disponibilité du véhicule et la préparation du contrat.`
    );

    // 3. Open WhatsApp directly
    window.open(`https://wa.me/237691786447?text=${msg}`, "_blank");

    // 4. Set validation success message in green
    setSuccessStatus(
      isFr
        ? `Votre demande de réservation (${refId}) a été validée avec succès et transmise à la conciergerie 3M SERVICES sur WhatsApp (+237 691 78 64 47) !`
        : `Your reservation request (${refId}) has been successfully validated and sent to 3M SERVICES concierge on WhatsApp (+237 691 78 64 47)!`
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
                  <select
                    id="cartype"
                    value={carType}
                    onChange={(e) => {
                      setCarType(e.target.value);
                      setCarImg(e.target.value);
                    }}
                  >
                    <option value="">{t("book_car_type_placeholder") || "Select your car type"}</option>
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
                  </select>
                </div>

                <div className="box-form__car-type">
                  <label htmlFor="pick">
                    <i className="fa-solid fa-location-dot" style={{ color: "#D62828", marginRight: "7px" }}></i>
                    <span>{t("book_pickup")}</span>
                  </label>
                  <select id="pick" value={pickUp} onChange={(e) => setPickUp(e.target.value)}>
                    <option value="">{t("book_pickup_placeholder") || "Select pick-up location"}</option>
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
                  </select>
                </div>

                <div className="box-form__car-type">
                  <label htmlFor="drop">
                    <i className="fa-solid fa-location-dot" style={{ color: "#D62828", marginRight: "7px" }}></i>
                    <span>{t("book_dropoff")}</span>
                  </label>
                  <select id="drop" value={dropOff} onChange={(e) => setDropOff(e.target.value)}>
                    <option value="">{t("book_dropoff_placeholder") || "Select drop-off location"}</option>
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
                  </select>
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
          PREMIUM REDESIGNED BOOKING MODAL
          ================================================================== */}
      <div className={`booking-modal ${modal ? "active-modal" : ""}`}>
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

        {/* Global validation error alert if submit was attempted with missing info */}
        {hasSubmitted && !isFormValid() && (
          <div className="booking-modal__alert-error">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>
              {isFr
                ? "Veuillez renseigner correctement tous les champs obligatoires (*) ci-dessous."
                : "Please correctly fill all mandatory fields (*) below."}
            </span>
          </div>
        )}

        {/* Green Success Alert */}
        {successStatus && (
          <div className="booking-modal__alert-success">
            <i className="fa-solid fa-circle-check"></i>
            <span>{successStatus}</span>
          </div>
        )}

        {/* PDF Generated Indicator */}
        {pdfSuccess && !successStatus && (
          <div className="booking-modal__alert-success">
            <i className="fa-solid fa-circle-check"></i>
            <span>
              {isFr
                ? "Le Bon de Réservation officiel (PDF) a été généré avec succès !"
                : "The official Reservation Form (PDF) was successfully generated!"}
            </span>
          </div>
        )}

        {/* ==================================================================
            A. BOOKING SUMMARY (WITH INLINE EDIT TOGGLE)
            ================================================================== */}
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

          {/* Inline Edit Panel */}
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
                    {(pickupLocations.length > 0 ? pickupLocations.map(l => l.name) : defaultPickups).map((loc, i) => (
                      <option key={i} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inline-edit-field">
                  <label>{t("modal_dropoff_loc")}</label>
                  <select value={dropOff} onChange={(e) => setDropOff(e.target.value)}>
                    {(dropoffLocations.length > 0 ? dropoffLocations.map(l => l.name) : defaultDropoffs).map((loc, i) => (
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
            /* Read-only Structured Summary View */
            <div className="booking-modal__summary-content">
              <div className="summary-info-grid">
                <div className="summary-item summary-item--vehicle">
                  <span className="summary-label">{isFr ? "Véhicule :" : "Vehicle:"}</span>
                  <strong className="summary-value summary-value--highlight">{carType || "Toyota Prado VIP"}</strong>
                </div>

                <div className="summary-item">
                  <span className="summary-label">{isFr ? "Prise en charge :" : "Pick-up:"}</span>
                  <span className="summary-value">{formatDateReadable(pickTime)}</span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">{isFr ? "Restitution :" : "Drop-off:"}</span>
                  <span className="summary-value">{formatDateReadable(dropTime)}</span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">{isFr ? "Lieu de prise :" : "Pick-up location:"}</span>
                  <span className="summary-value">{pickUp}</span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">{isFr ? "Lieu de restitution :" : "Drop-off location:"}</span>
                  <span className="summary-value">{dropOff}</span>
                </div>

                <div className="summary-item summary-item--duration">
                  <span className="summary-label">{isFr ? "Durée estimée :" : "Estimated duration:"}</span>
                  <strong className="summary-value summary-duration-badge">
                    {calculateDays()} {isFr ? "Jour(s)" : "Day(s)"}
                  </strong>
                </div>
              </div>

              {imgUrl && (
                <div className="summary-vehicle-preview">
                  <img src={imgUrl} alt={carType} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ==================================================================
            B. PERSONAL INFORMATION FORM
            ================================================================== */}
        <div className="booking-modal__person-info">
          <h4 className="personal-section-title">
            <i className="fa-solid fa-user-check" style={{ color: "#D62828" }}></i>
            <span>{t("modal_personal")}</span>
          </h4>

          <form className="info-form" onSubmit={(e) => e.preventDefault()}>
            {/* Row 1: First Name * & Last Name * */}
            <div className="info-form__2col">
              <div className={`form-field ${hasSubmitted && !isNameValid ? "has-error" : isNameValid ? "is-valid" : ""}`}>
                <label>
                  <span>{t("modal_fname")} <b className="req-star">*</b></span>
                  {isNameValid && <i className="fa-solid fa-circle-check valid-icon"></i>}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="Ex: Arnaud"
                  required
                />
                {hasSubmitted && !isNameValid && (
                  <p className="field-error-text">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {isFr ? "Le prénom est obligatoire." : "First name is required."}
                  </p>
                )}
              </div>

              <div className={`form-field ${hasSubmitted && !isLastNameValid ? "has-error" : isLastNameValid ? "is-valid" : ""}`}>
                <label>
                  <span>{t("modal_lname")} <b className="req-star">*</b></span>
                  {isLastNameValid && <i className="fa-solid fa-circle-check valid-icon"></i>}
                </label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  type="text"
                  placeholder="Ex: Mbarga"
                  required
                />
                {hasSubmitted && !isLastNameValid && (
                  <p className="field-error-text">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {isFr ? "Le nom est obligatoire." : "Last name is required."}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Phone / WhatsApp * & Age */}
            <div className="info-form__2col">
              <div className={`form-field ${hasSubmitted && !isPhoneValid ? "has-error" : isPhoneValid ? "is-valid" : ""}`}>
                <label>
                  <span>{t("modal_phone")} <b className="req-star">*</b></span>
                  {isPhoneValid && <i className="fa-solid fa-circle-check valid-icon"></i>}
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  placeholder="+237 6XX XX XX XX"
                  required
                />
                {hasSubmitted && !isPhoneValid && (
                  <p className="field-error-text">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {isFr
                      ? "Numéro de téléphone / WhatsApp requis (au moins 7 chiffres)."
                      : "Valid phone / WhatsApp number required."}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label>
                  <span>{t("modal_age")}</span>
                </label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  type="number"
                  min="21"
                  max="99"
                  placeholder="25"
                />
              </div>
            </div>

            {/* Row 3: Email Address & Address / Neighborhood */}
            <div className="info-form__2col">
              <div className={`form-field ${hasSubmitted && !isEmailValid ? "has-error" : email.trim() && isEmailValid ? "is-valid" : ""}`}>
                <label>
                  <span>{t("modal_email")}</span>
                  {email.trim() && isEmailValid && <i className="fa-solid fa-circle-check valid-icon"></i>}
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="votre@email.com"
                />
                {hasSubmitted && !isEmailValid && (
                  <p className="field-error-text">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {isFr ? "Veuillez entrer une adresse email valide." : "Please enter a valid email address."}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label>
                  <span>{t("modal_address")}</span>
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  type="text"
                  placeholder="Ex: Bastos, Tsinga, ou Hôtel"
                />
              </div>
            </div>

            {/* Row 4: City & Postal Code / Landmark */}
            <div className="info-form__2col">
              <div className="form-field">
                <label>
                  <span>{t("modal_city")}</span>
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  type="text"
                  placeholder="Yaoundé"
                />
              </div>

              <div className="form-field">
                <label>
                  <span>{t("modal_postal")}</span>
                </label>
                <input
                  value={zipcode}
                  onChange={(e) => setZipCode(e.target.value)}
                  type="text"
                  placeholder="Ex: Face FECAFOOT, Carrefour Bastos..."
                />
              </div>
            </div>

            {/* ==================================================================
                C. ADDITIONAL OPTIONS
                ================================================================== */}
            <div className="booking-modal__checkbox-row">
              <input
                id="modal-offers-check"
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
              />
              <label htmlFor="modal-offers-check">
                {t("modal_newsletter") || (isFr
                  ? "Je souhaite recevoir les offres exclusives de 3M SERVICES."
                  : "I would like to receive exclusive offers from 3M SERVICES.")}
              </label>
            </div>

            {/* ==================================================================
                D. CONFIRMATION & E. PDF ACTIONS
                ================================================================== */}
            <div className="booking-modal__action-cluster">
              {/* Primary Action: Confirm via WhatsApp */}
              <button
                type="button"
                onClick={handleConfirmWhatsApp}
                className="btn-confirm-whatsapp"
                title="Valider et ouvrir la discussion WhatsApp avec la conciergerie 3M SERVICES"
              >
                <i className="fa-brands fa-whatsapp"></i>
                <div className="btn-confirm-whatsapp__content">
                  <strong>{isFr ? "Confirmer sur WhatsApp (+237 691 78 64 47)" : "Confirm via WhatsApp (+237 691 78 64 47)"}</strong>
                  <small>{isFr ? "Validation immédiate et préparation du contrat" : "Immediate validation & contract preparation"}</small>
                </div>
              </button>

              {/* Secondary Action: Download Reservation Form (PDF) */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="btn-download-pdf"
                title="Générer et télécharger votre Bon de Réservation en PDF"
              >
                <i className="fa-solid fa-file-pdf"></i>
                <span>{isFr ? "Télécharger le Bon de Réservation (PDF)" : "Download Reservation Form (PDF)"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default BookCar;
