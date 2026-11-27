// Compact 2-row horizontal booking card matching the official 3M SERVICES design
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config/api";
import { useTranslation } from "../context/LanguageContext";
import { CARS_CATALOGUE } from "../data/carsCatalogue";
import { getCurrentClient, saveOrderAndCustomerAccount } from "../utils/customerAccounts";
import "../styles/RentalBooking.css";

const FALLBACK_LOCATIONS = [
  { key: "1:0:Agence Omnisports, Yaoundé", cityId: 1, neighbourhoodId: null, label: "Yaoundé — Agence Omnisports" },
  { key: "1:0:Aéroport Yaoundé-Nsimalen", cityId: 1, neighbourhoodId: null, label: "Yaoundé — Aéroport Nsimalen" },
  { key: "1:0:Bastos, Yaoundé", cityId: 1, neighbourhoodId: null, label: "Yaoundé — Bastos" },
  { key: "1:0:Tsinga (Face FECAFOOT), Yaoundé", cityId: 1, neighbourhoodId: null, label: "Yaoundé — Tsinga (Face FECAFOOT)" },
  { key: "1:0:Centre-ville, Yaoundé", cityId: 1, neighbourhoodId: null, label: "Yaoundé — Centre-ville" },
  { key: "2:0:Aéroport International de Douala", cityId: 2, neighbourhoodId: null, label: "Douala — Aéroport International" },
  { key: "2:0:Bonanjo, Douala", cityId: 2, neighbourhoodId: null, label: "Douala — Bonanjo" },
  { key: "2:0:Akwa, Douala", cityId: 2, neighbourhoodId: null, label: "Douala — Akwa" },
  { key: "2:0:Bonapriso, Douala", cityId: 2, neighbourhoodId: null, label: "Douala — Bonapriso" }
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, h) => {
  const hh = String(h).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return { value: `${hh}:00`, labelFr: `${hh}:00`, labelEn: `${h12}:00 ${ampm}` };
});

const todayStr = () => new Date(Date.now() + 3600000).toISOString().slice(0, 10);
const newKey = () => `rq-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const fcfa = (n) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

const guestId = () => {
  let id = localStorage.getItem("3m_guest_chat_id");
  if (!id) {
    id = "GUEST-" + Math.floor(100000 + Math.random() * 900000);
    localStorage.setItem("3m_guest_chat_id", id);
  }
  return id;
};

function BookCar() {
  const { lang, t } = useTranslation();
  const isFr = lang === "fr";
  const L = (fr, en) => (isFr ? fr : en);

  const [client, setClientState] = useState(() => getCurrentClient());
  const [options, setOptions] = useState(null);
  const [catalogue, setCatalogue] = useState(CARS_CATALOGUE);

  const [vehicleKey, setVehicleKey] = useState("");
  const [pickUpKey, setPickUpKey] = useState("");
  const [dropOffKey, setDropOffKey] = useState("");
  const [pickDate, setPickDate] = useState("");
  const [pickTime, setPickTime] = useState("09:00");
  const [dropDate, setDropDate] = useState("");
  const [dropTime, setDropTime] = useState("18:00");

  const [formError, setFormError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [contact, setContact] = useState({
    name: client?.name || "",
    phone: client?.phone || "",
    email: client?.email || "",
    notes: ""
  });
  const [modalError, setModalError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);

  const requestKey = useRef(newKey());
  const wantedCar = useRef(sessionStorage.getItem("selected_booking_car"));

  // Sync client profile changes reactively
  useEffect(() => {
    const onAuth = (e) => {
      const next = e?.detail !== undefined ? e.detail : getCurrentClient();
      setClientState(next);
      if (next) {
        setContact((prev) => ({
          ...prev,
          name: next.name || prev.name,
          phone: next.phone || prev.phone,
          email: next.email || prev.email
        }));
      }
    };
    window.addEventListener("3m-client-auth-changed", onAuth);
    return () => window.removeEventListener("3m-client-auth-changed", onAuth);
  }, []);

  // Load vehicles & locations from backend (non-blocking; falls back gracefully)
  useEffect(() => {
    fetch(`${API_BASE}/rental/options`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setOptions(data); })
      .catch(() => {});
    fetch(`${API_BASE}/cars`)
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => { if (Array.isArray(list) && list.length) setCatalogue(list); })
      .catch(() => {});
  }, []);

  // Build unified vehicles list (prefer backend catalogue enriched with Flask bus IDs)
  const vehicles = useMemo(() => {
    const apiVehicles = options?.vehicles || [];
    if (catalogue.length > 0) {
      return catalogue.map((c, idx) => {
        const m = String(c.id || "").match(/^bus-(\d+)$/);
        const busId = m ? Number(m[1]) : (apiVehicles[idx]?.id || idx + 1);
        return {
          key: String(busId),
          busId,
          name: c.name || c.model || `Véhicule ${idx + 1}`,
          pricePerDay: Number(c.promoPrice || c.pricePerDay) || 0,
          priceLabel: c.price || "",
          image: c.img || c.image || "/images/cars/flotte/landcruiser.webp"
        };
      });
    }
    return apiVehicles.map((v) => ({
      key: String(v.id),
      busId: v.id,
      name: v.name,
      pricePerDay: 0,
      priceLabel: "",
      image: "/images/cars/flotte/landcruiser.webp"
    }));
  }, [options, catalogue]);

  // Build unified locations list from Flask cities/neighbourhoods (with fallback)
  const locations = useMemo(() => {
    const cities = options?.cities || [];
    if (!cities.length) return FALLBACK_LOCATIONS;
    const out = [];
    cities.forEach((city) => {
      const hoods = Array.isArray(city.neighbourhoods) ? city.neighbourhoods : [];
      if (hoods.length) {
        hoods.forEach((h) => {
          out.push({
            key: `${city.id}:${h.id}:${h.name}`,
            cityId: city.id,
            neighbourhoodId: h.id,
            neighbourhoodText: h.name,
            label: `${city.name} — ${h.name}`
          });
        });
      } else {
        out.push({
          key: `${city.id}:0:${city.name}`,
          cityId: city.id,
          neighbourhoodId: null,
          neighbourhoodText: city.name,
          label: city.name
        });
      }
    });
    return out.length ? out : FALLBACK_LOCATIONS;
  }, [options]);

  // Select vehicle if triggered from elsewhere on the page
  useEffect(() => {
    const selectByName = (name) => {
      const n = String(name || "").toLowerCase();
      const found = vehicles.find((v) => n.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(n));
      if (found) setVehicleKey(found.key);
    };
    if (vehicles.length && wantedCar.current) {
      selectByName(wantedCar.current);
      sessionStorage.removeItem("selected_booking_car");
      wantedCar.current = null;
    }
    const onSelect = (e) => {
      if (!e.detail?.carName) return;
      selectByName(e.detail.carName);
      document.querySelector("#booking-section")?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("select-booking-car", onSelect);
    return () => window.removeEventListener("select-booking-car", onSelect);
  }, [vehicles]);

  const selectedVehicle = vehicles.find((v) => v.key === vehicleKey) || null;
  const selectedPickUp = locations.find((l) => l.key === pickUpKey) || null;
  const selectedDropOff = locations.find((l) => l.key === dropOffKey) || selectedPickUp || null;

  const rentalDays = useMemo(() => {
    if (!pickDate) return 1;
    const d1 = new Date(pickDate);
    const d2 = new Date(dropDate || pickDate);
    if (isNaN(d1) || isNaN(d2)) return 1;
    return Math.max(1, Math.round((d2 - d1) / 86400000));
  }, [pickDate, dropDate]);

  const estimatedTotal = selectedVehicle?.pricePerDay ? selectedVehicle.pricePerDay * rentalDays : 0;

  const handleSearch = (e) => {
    e.preventDefault();
    setFormError("");
    if (!vehicleKey || !pickUpKey || !dropOffKey || !pickDate || !dropDate) {
      setFormError(
        L("Veuillez renseigner tous les champs requis (véhicule, lieux et dates).", "Please fill in all required fields (car, locations, and dates).")
      );
      return;
    }
    if (dropDate < pickDate) {
      setFormError(
        L("La date de restitution doit être postérieure ou égale à la date de prise en charge.", "Drop-off date must be on or after the pick-up date.")
      );
      return;
    }
    setDone(null);
    setModalError("");
    setModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (sending) return;
    setModalError("");
    if (contact.name.trim().length < 2) {
      setModalError(L("Veuillez indiquer votre nom complet.", "Please enter your full name."));
      return;
    }
    if (contact.phone.replace(/\D/g, "").length < 8) {
      setModalError(L("Veuillez indiquer un numéro de téléphone valide.", "Please enter a valid phone number."));
      return;
    }

    setSending(true);
    const pickLoc = selectedPickUp || locations[0];
    const dropLoc = selectedDropOff || pickLoc;
    const isSameDay = dropDate === pickDate;
    const payload = {
      tripType: isSameDay ? "one_way" : "round_trip",
      vehicleId: selectedVehicle?.busId || 1,
      vehicleName: selectedVehicle?.name || "Véhicule VIP 3M",
      pickupCityId: pickLoc?.cityId || 1,
      pickupNeighbourhoodId: pickLoc?.neighbourhoodId || null,
      pickupNeighbourhoodText: pickLoc?.neighbourhoodText || pickLoc?.label || "Yaoundé",
      pickupAddress: pickLoc?.label || "Yaoundé",
      destinationCityId: dropLoc?.cityId || pickLoc?.cityId || 1,
      destinationNeighbourhoodId: dropLoc?.neighbourhoodId || null,
      destinationNeighbourhoodText: dropLoc?.neighbourhoodText || dropLoc?.label || "Yaoundé",
      destinationAddress: dropLoc?.label || "Yaoundé",
      departureAt: `${pickDate}T${pickTime || "09:00"}`,
      returnAt: !isSameDay ? `${dropDate}T${dropTime || "18:00"}` : "",
      driverRequired: false,
      notes: contact.notes.trim(),
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      email: contact.email.trim(),
      requestKey: requestKey.current,
      guestId: guestId(),
      clientId: client?.accountNumber || guestId(),
      accountNumber: client?.accountNumber || ""
    };

    try {
      let refCode = "";
      let summary = "";
      let serverEstimate = estimatedTotal;

      const res = await fetch(`${API_BASE}/rental/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.reference) {
        refCode = data.reference;
        summary = data.summary || "";
        if (data.estimate) serverEstimate = Number(data.estimate);
      }

      const saved = saveOrderAndCustomerAccount({
        orderId: refCode,
        clientName: contact.name.trim(),
        phone: contact.phone.trim(),
        email: contact.email.trim(),
        city: (pickLoc?.label || "Yaoundé").split("—")[0].trim(),
        itemName: selectedVehicle?.name || "Véhicule VIP 3M",
        itemCategory: "Location Véhicule",
        itemPrice: selectedVehicle?.pricePerDay || 0,
        days: rentalDays,
        totalPrice: serverEstimate,
        pickTime: pickDate,
        dropTime: dropDate,
        pickUp: pickLoc?.label || "Yaoundé",
        dropOff: dropLoc?.label || pickLoc?.label || "Yaoundé",
        notes: contact.notes.trim(),
        source: "Réserver un Véhicule (Accueil)"
      });

      const finalRef = refCode || saved?.booking?.id || `3M-RES-${Date.now().toString().slice(-4)}`;
      const waText =
        summary ||
        `Bonjour 3M SERVICES,\nJe souhaite réserver :\n• Véhicule : ${selectedVehicle?.name}\n• Prise en charge : ${pickLoc?.label} (${pickDate} ${pickTime})\n• Restitution : ${dropLoc?.label} (${dropDate} ${dropTime})\n• Nom : ${contact.name}\n• Tél : ${contact.phone}\n• Réf : ${finalRef}`;

      setDone({ reference: finalRef, estimate: serverEstimate, summary: waText });
      requestKey.current = newKey();
    } catch (_) {
      setModalError(L("Connexion impossible. Réessayez ou contactez-nous sur WhatsApp.", "Connection failed. Please retry or use WhatsApp."));
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="booking-section" className="book-section">
      <div className="container">
        <div className="book-content">
          <div className="book-card-v2">
            {/* Top-right promotional ribbon matching reference design */}
            <div className="book-card-v2__ribbon">
              <strong>{L("ÉCONOMISEZ 15%", "SAVE 15%")}</strong>{" "}
              {L("en réservant en ligne", "if you prepay your booking")}
            </div>

            <h2 className="book-card-v2__title">{t("book_title")}</h2>

            {formError && (
              <div className="book-card-v2__error" role="alert">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{formError}</span>
                <button type="button" onClick={() => setFormError("")} aria-label="Fermer">&times;</button>
              </div>
            )}

            <form className="book-card-v2__form" onSubmit={handleSearch} noValidate>
              {/* Row 1: Car Type | Pick-up | Drop-off */}
              <div className="book-card-v2__row book-card-v2__row--top">
                <div className="book-card-v2__field">
                  <label htmlFor="bc-car">
                    <i className="fa-solid fa-car"></i> {t("book_car_type")}
                  </label>
                  <select id="bc-car" value={vehicleKey} onChange={(e) => { setVehicleKey(e.target.value); setFormError(""); }}>
                    <option value="">{t("book_car_type_placeholder")}</option>
                    {vehicles.map((v) => (
                      <option key={v.key} value={v.key}>
                        {v.name}{v.priceLabel ? ` — ${v.priceLabel}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="book-card-v2__field">
                  <label htmlFor="bc-pickup">
                    <i className="fa-solid fa-location-dot"></i> {t("book_pickup")}
                  </label>
                  <select id="bc-pickup" value={pickUpKey} onChange={(e) => { setPickUpKey(e.target.value); setFormError(""); }}>
                    <option value="">{t("book_pickup_placeholder")}</option>
                    {locations.map((loc) => (
                      <option key={`pu-${loc.key}`} value={loc.key}>{loc.label}</option>
                    ))}
                  </select>
                </div>

                <div className="book-card-v2__field">
                  <label htmlFor="bc-dropoff">
                    <i className="fa-solid fa-location-dot"></i> {t("book_dropoff")}
                  </label>
                  <select id="bc-dropoff" value={dropOffKey} onChange={(e) => { setDropOffKey(e.target.value); setFormError(""); }}>
                    <option value="">{t("book_dropoff_placeholder")}</option>
                    {locations.map((loc) => (
                      <option key={`do-${loc.key}`} value={loc.key}>{loc.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Pick-up Date + Time | Drop-off Date + Time | Search CTA */}
              <div className="book-card-v2__row book-card-v2__row--bottom">
                <div className="book-card-v2__field">
                  <label htmlFor="bc-pickdate">
                    <i className="fa-regular fa-calendar-days"></i> {t("book_pickup")}
                  </label>
                  <div className="book-card-v2__datetime">
                    <input
                      id="bc-pickdate"
                      type="date"
                      min={todayStr()}
                      value={pickDate}
                      onChange={(e) => {
                        setPickDate(e.target.value);
                        if (!dropDate || e.target.value > dropDate) setDropDate(e.target.value);
                        setFormError("");
                      }}
                    />
                    <select aria-label={L("Heure de prise en charge", "Pick-up time")} value={pickTime} onChange={(e) => setPickTime(e.target.value)}>
                      {TIME_SLOTS.map((ts) => (
                        <option key={`pt-${ts.value}`} value={ts.value}>{isFr ? ts.labelFr : ts.labelEn}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="book-card-v2__field">
                  <label htmlFor="bc-dropdate">
                    <i className="fa-regular fa-calendar-days"></i> {t("book_dropoff")}
                  </label>
                  <div className="book-card-v2__datetime">
                    <input
                      id="bc-dropdate"
                      type="date"
                      min={pickDate || todayStr()}
                      value={dropDate}
                      onChange={(e) => { setDropDate(e.target.value); setFormError(""); }}
                    />
                    <select aria-label={L("Heure de restitution", "Drop-off time")} value={dropTime} onChange={(e) => setDropTime(e.target.value)}>
                      {TIME_SLOTS.map((ts) => (
                        <option key={`dt-${ts.value}`} value={ts.value}>{isFr ? ts.labelFr : ts.labelEn}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="book-card-v2__cta-wrap">
                  <button type="submit" className="book-card-v2__submit">
                    {t("book_search")}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="bc-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="bc-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="bc-modal__head">
              <h3>{done ? L("Réservation enregistrée !", "Booking Confirmed!") : t("modal_title")}</h3>
              <button type="button" className="bc-modal__close" onClick={() => setModalOpen(false)} aria-label="Fermer">&times;</button>
            </div>

            {done ? (
              <div className="bc-modal__done">
                <i className="fa-solid fa-circle-check"></i>
                <h4>{L("Référence", "Reference")} : {done.reference}</h4>
                <p>
                  {done.estimate > 0 ? `${L("Estimation", "Estimate")} : ${fcfa(done.estimate)}. ` : ""}
                  {L(
                    "Votre réservation a été enregistrée dans votre profil client et transmise à notre conciergerie 24/7.",
                    "Your booking has been saved to your client profile and sent to our 24/7 concierge."
                  )}
                </p>
                <div className="bc-modal__done-actions">
                  <Link to="/account/orders" className="bc-btn bc-btn--primary" onClick={() => setModalOpen(false)}>
                    <i className="fa-regular fa-calendar-check"></i> {L("Voir / Modifier dans mon Profil", "View / Edit in My Profile")}
                  </Link>
                  <button
                    type="button"
                    className="bc-btn bc-btn--dark"
                    onClick={() => {
                      setModalOpen(false);
                      window.dispatchEvent(new CustomEvent("3m-open-chat", { detail: { refresh: true } }));
                    }}
                  >
                    <i className="fa-regular fa-comment-dots"></i> {L("Ouvrir la discussion", "Open Chat")}
                  </button>
                  <a
                    className="bc-btn bc-btn--wa"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://wa.me/237691786447?text=${encodeURIComponent(done.summary)}`}
                  >
                    <i className="fa-brands fa-whatsapp"></i> WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <form className="bc-modal__body" onSubmit={handleConfirmBooking} noValidate>
                <div className="bc-modal__summary">
                  {selectedVehicle?.image && <img src={selectedVehicle.image} alt={selectedVehicle.name} />}
                  <div>
                    <strong>{selectedVehicle?.name}</strong>
                    <p><i className="fa-solid fa-location-dot"></i> {selectedPickUp?.label} → {selectedDropOff?.label}</p>
                    <p><i className="fa-regular fa-calendar"></i> {pickDate} ({pickTime}) → {dropDate} ({dropTime}) · {rentalDays} {L(rentalDays > 1 ? "jours" : "jour", rentalDays > 1 ? "days" : "day")}</p>
                    {estimatedTotal > 0 && <span className="bc-modal__price">{fcfa(estimatedTotal)}</span>}
                  </div>
                </div>

                {modalError && <div className="bc-modal__error" role="alert">{modalError}</div>}

                <div className="bc-modal__grid">
                  <div>
                    <label htmlFor="bcm-name">{L("Nom complet", "Full Name")} *</label>
                    <input id="bcm-name" required value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder={L("Votre nom complet", "Your full name")} />
                  </div>
                  <div>
                    <label htmlFor="bcm-phone">{L("Téléphone / WhatsApp", "Phone / WhatsApp")} *</label>
                    <input id="bcm-phone" type="tel" required value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="+237 6XX XX XX XX" />
                  </div>
                  <div>
                    <label htmlFor="bcm-email">E-mail</label>
                    <input id="bcm-email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="vous@exemple.com" />
                  </div>
                  <div>
                    <label htmlFor="bcm-notes">{L("Remarque (facultatif)", "Note (optional)")}</label>
                    <input id="bcm-notes" value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })} placeholder={L("N° de vol, point de repère…", "Flight number, landmark…")} />
                  </div>
                </div>

                <div className="bc-modal__foot">
                  <button type="button" className="bc-btn bc-btn--ghost" onClick={() => setModalOpen(false)}>
                    {L("Annuler", "Cancel")}
                  </button>
                  <button type="submit" className="bc-btn bc-btn--primary" disabled={sending}>
                    {sending ? L("Envoi…", "Sending…") : L("Confirmer la réservation", "Confirm Booking")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default BookCar;
