// Compact 2-row booking card matching reference design + Aller simple / Aller-retour + Ville/Arrondissement/Quartier/Repère popover
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config/api";
import { useTranslation } from "../context/LanguageContext";
import { CARS_CATALOGUE } from "../data/carsCatalogue";
import { getCurrentClient, saveOrderAndCustomerAccount } from "../utils/customerAccounts";
import "../styles/RentalBooking.css";

const EMPTY_PLACE = { cityId: "", districtId: "", neighbourhoodId: null, neighbourhoodText: "", address: "" };

const FALLBACK_CITIES = [
  {
    id: 1,
    name: "Yaoundé",
    districts: [
      { id: 1, name: "Yaoundé I" },
      { id: 2, name: "Yaoundé II" },
      { id: 3, name: "Yaoundé III" },
      { id: 4, name: "Yaoundé IV" },
      { id: 5, name: "Yaoundé V" },
      { id: 6, name: "Yaoundé VI" },
      { id: 7, name: "Yaoundé VII" }
    ],
    neighbourhoods: [
      { id: 101, name: "Omnisports", districtId: 5, aliases: [], landmarks: [] },
      { id: 102, name: "Bastos", districtId: 1, aliases: [], landmarks: [] },
      { id: 103, name: "Tsinga", districtId: 2, aliases: [], landmarks: ["FECAFOOT"] },
      { id: 104, name: "Aéroport Nsimalen", districtId: 4, aliases: ["Nsimalen"], landmarks: [] },
      { id: 105, name: "Centre-ville", districtId: 1, aliases: [], landmarks: [] },
      { id: 106, name: "Mvan", districtId: 4, aliases: [], landmarks: [] },
      { id: 107, name: "Biyem-Assi", districtId: 6, aliases: [], landmarks: [] }
    ]
  },
  {
    id: 2,
    name: "Douala",
    districts: [
      { id: 8, name: "Douala I" },
      { id: 9, name: "Douala II" },
      { id: 10, name: "Douala III" },
      { id: 11, name: "Douala IV" },
      { id: 12, name: "Douala V" }
    ],
    neighbourhoods: [
      { id: 201, name: "Akwa", districtId: 8, aliases: [], landmarks: [] },
      { id: 202, name: "Bonanjo", districtId: 8, aliases: [], landmarks: [] },
      { id: 203, name: "Bonapriso", districtId: 8, aliases: [], landmarks: [] },
      { id: 204, name: "Bali", districtId: 8, aliases: [], landmarks: [] },
      { id: 205, name: "Aéroport de Douala", districtId: 9, aliases: [], landmarks: [] },
      { id: 206, name: "Bonamoussadi", districtId: 12, aliases: [], landmarks: [] }
    ]
  }
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, h) => {
  const hh = String(h).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return { value: `${hh}:00`, labelFr: `${hh}:00`, labelEn: `${h12}:00 ${ampm}` };
});

const normText = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

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

function PlacePopoverField({ id, label, placeholder, cities, place, onChange, isOpen, onToggle, onClose, isFr, extraAction }) {
  const wrapRef = useRef(null);
  const [hoodQuery, setHoodQuery] = useState("");
  const [hoodListOpen, setHoodListOpen] = useState(false);

  const city = cities.find((c) => String(c.id) === String(place.cityId)) || null;
  const hoodName = useMemo(() => {
    if (!city) return "";
    const found = (city.neighbourhoods || []).find((n) => n.id === place.neighbourhoodId);
    return found ? found.name : place.neighbourhoodText || "";
  }, [city, place.neighbourhoodId, place.neighbourhoodText]);

  const displayText = useMemo(() => {
    const parts = [city?.name, hoodName, place.address].filter(Boolean);
    return parts.join(" — ");
  }, [city, hoodName, place.address]);

  const hoods = useMemo(() => {
    if (!city) return [];
    const all = Array.isArray(city.neighbourhoods) ? city.neighbourhoods : [];
    const scoped = place.districtId ? all.filter((n) => String(n.districtId) === String(place.districtId)) : all;
    const q = normText(hoodQuery);
    if (!q) return scoped.slice(0, 35);
    return scoped
      .filter((n) => [n.name, ...(n.aliases || []), ...(n.landmarks || [])].some((x) => normText(x).includes(q)))
      .slice(0, 35);
  }, [city, place.districtId, hoodQuery]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isOpen, onClose]);

  return (
    <div className="book-card-v2__field book-card-v2__popover-wrap" ref={wrapRef}>
      <div className="book-card-v2__label-row">
        <label htmlFor={id}>
          <i className="fa-solid fa-location-dot"></i> {label}
        </label>
        {extraAction}
      </div>

      <button
        id={id}
        type="button"
        className={`book-card-v2__trigger ${displayText ? "has-val" : ""} ${isOpen ? "is-open" : ""}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="book-card-v2__trigger-text">{displayText || placeholder}</span>
        <i className={`fa-solid fa-chevron-down book-card-v2__chev ${isOpen ? "is-open" : ""}`}></i>
      </button>

      {isOpen && (
        <div className="book-card-v2__popover" role="dialog" aria-label={label}>
          <div className="book-card-v2__pop-grid">
            <div>
              <label>{isFr ? "Ville" : "City"} *</label>
              <select
                value={place.cityId}
                onChange={(e) => {
                  onChange({ ...EMPTY_PLACE, cityId: e.target.value, address: place.address });
                  setHoodQuery("");
                }}
              >
                <option value="">{isFr ? "Choisir…" : "Choose…"}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label>{isFr ? "Arrondissement" : "District"}</label>
              <select
                value={place.districtId}
                disabled={!city?.districts?.length}
                onChange={(e) => {
                  onChange({ ...place, districtId: e.target.value, neighbourhoodId: null, neighbourhoodText: "" });
                  setHoodQuery("");
                }}
              >
                <option value="">{isFr ? "Tous" : "All"}</option>
                {(city?.districts || []).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="book-card-v2__combo">
              <label>{isFr ? "Quartier" : "Neighbourhood"} *</label>
              <input
                type="text"
                disabled={!city}
                autoComplete="off"
                placeholder={
                  !city
                    ? isFr ? "Choisissez d'abord la ville" : "Choose a city first"
                    : isFr ? "Rechercher un quartier…" : "Search a neighbourhood…"
                }
                value={hoodListOpen ? hoodQuery : hoodName}
                onFocus={() => { if (city) { setHoodListOpen(true); setHoodQuery(hoodName); } }}
                onBlur={() => setTimeout(() => setHoodListOpen(false), 150)}
                onChange={(e) => {
                  const val = e.target.value;
                  setHoodQuery(val);
                  setHoodListOpen(true);
                  onChange({ ...place, neighbourhoodId: null, neighbourhoodText: val });
                }}
              />
              {hoodListOpen && city && (
                <ul className="book-card-v2__combo-list" role="listbox">
                  {hoods.map((h) => (
                    <li
                      key={h.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onChange({ ...place, neighbourhoodId: h.id, neighbourhoodText: h.name });
                        setHoodQuery(h.name);
                        setHoodListOpen(false);
                      }}
                    >
                      {h.name}
                    </li>
                  ))}
                  {hoodQuery.trim().length >= 2 && !hoods.some((h) => normText(h.name) === normText(hoodQuery)) && (
                    <li
                      className="is-custom"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onChange({ ...place, neighbourhoodId: null, neighbourhoodText: hoodQuery.trim() });
                        setHoodListOpen(false);
                      }}
                    >
                      + {isFr ? "Utiliser" : "Use"} « {hoodQuery.trim()} »
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div>
              <label>{isFr ? "Repère (facultatif)" : "Landmark (optional)"}</label>
              <input
                type="text"
                maxLength={200}
                value={place.address}
                onChange={(e) => onChange({ ...place, address: e.target.value })}
                placeholder={isFr ? "Hôtel, rue, face à…" : "Hotel, street, near…"}
              />
            </div>
          </div>

          <div className="book-card-v2__pop-foot">
            <button type="button" className="book-card-v2__pop-ok" onClick={onClose}>
              {isFr ? "Valider" : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BookCar() {
  const { lang, t } = useTranslation();
  const isFr = lang === "fr";
  const L = (fr, en) => (isFr ? fr : en);

  const [client, setClientState] = useState(() => getCurrentClient());
  const [options, setOptions] = useState(null);
  const [catalogue, setCatalogue] = useState(CARS_CATALOGUE);

  const [tripType, setTripType] = useState("round_trip"); // "one_way" | "round_trip"
  const [vehicleKey, setVehicleKey] = useState("");
  const [pickup, setPickup] = useState(EMPTY_PLACE);
  const [destination, setDestination] = useState(EMPTY_PLACE);
  const [openPop, setOpenPop] = useState(null); // "pickup" | "dest" | null
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

  const cities = useMemo(() => {
    const apiCities = options?.cities || [];
    return apiCities.length ? apiCities : FALLBACK_CITIES;
  }, [options]);

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

  const cityOf = (place) => cities.find((c) => String(c.id) === String(place.cityId)) || null;
  const placeLabel = (place) => {
    const c = cityOf(place);
    const hood = c?.neighbourhoods?.find((n) => n.id === place.neighbourhoodId)?.name || place.neighbourhoodText;
    return [c?.name, hood, place.address].filter(Boolean).join(" — ");
  };

  const selectedVehicle = vehicles.find((v) => v.key === vehicleKey) || null;
  const isRoundTrip = tripType === "round_trip";

  const rentalDays = useMemo(() => {
    if (!pickDate || !isRoundTrip) return 1;
    const d1 = new Date(pickDate);
    const d2 = new Date(dropDate || pickDate);
    if (isNaN(d1) || isNaN(d2)) return 1;
    return Math.max(1, Math.round((d2 - d1) / 86400000));
  }, [pickDate, dropDate, isRoundTrip]);

  const estimatedTotal = selectedVehicle?.pricePerDay ? selectedVehicle.pricePerDay * rentalDays : 0;

  const swapPlaces = () => {
    setPickup(destination);
    setDestination(pickup);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFormError("");
    setOpenPop(null);
    if (!vehicleKey) {
      setFormError(L("Veuillez choisir un véhicule.", "Please select a vehicle."));
      return;
    }
    if (!pickup.cityId || (!pickup.neighbourhoodId && !pickup.neighbourhoodText.trim())) {
      setFormError(L("Veuillez choisir la ville et le quartier de prise en charge.", "Please select the pick-up city and neighbourhood."));
      setOpenPop("pickup");
      return;
    }
    if (!destination.cityId || (!destination.neighbourhoodId && !destination.neighbourhoodText.trim())) {
      setFormError(L("Veuillez choisir la ville et le quartier de destination.", "Please select the destination city and neighbourhood."));
      setOpenPop("dest");
      return;
    }
    if (!pickDate) {
      setFormError(L("Veuillez choisir la date de départ.", "Please select the pick-up date."));
      return;
    }
    if (isRoundTrip && !dropDate) {
      setFormError(L("Veuillez choisir la date de retour.", "Please select the drop-off date."));
      return;
    }
    if (isRoundTrip && dropDate < pickDate) {
      setFormError(L("La date de retour doit être postérieure ou égale à la date de départ.", "Drop-off date must be on or after the pick-up date."));
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
    const pickStr = placeLabel(pickup) || "Yaoundé";
    const destStr = placeLabel(destination) || pickStr;
    const effectiveDropDate = isRoundTrip ? (dropDate || pickDate) : pickDate;

    const payload = {
      tripType,
      vehicleId: selectedVehicle?.busId || 1,
      vehicleName: selectedVehicle?.name || "Véhicule VIP 3M",
      pickupCityId: Number(pickup.cityId) || 1,
      pickupNeighbourhoodId: pickup.neighbourhoodId || null,
      pickupNeighbourhoodText: pickup.neighbourhoodText || "",
      pickupAddress: pickup.address || "",
      destinationCityId: Number(destination.cityId) || Number(pickup.cityId) || 1,
      destinationNeighbourhoodId: destination.neighbourhoodId || null,
      destinationNeighbourhoodText: destination.neighbourhoodText || "",
      destinationAddress: destination.address || "",
      departureAt: `${pickDate}T${pickTime || "09:00"}`,
      returnAt: isRoundTrip ? `${effectiveDropDate}T${dropTime || "18:00"}` : "",
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
        city: cityOf(pickup)?.name || "Yaoundé",
        itemName: selectedVehicle?.name || "Véhicule VIP 3M",
        itemCategory: isRoundTrip ? "Aller-retour" : "Aller simple",
        itemPrice: selectedVehicle?.pricePerDay || 0,
        days: rentalDays,
        totalPrice: serverEstimate,
        pickTime: pickDate,
        dropTime: effectiveDropDate,
        pickUp: pickStr,
        dropOff: destStr,
        notes: contact.notes.trim(),
        source: "Réserver un Véhicule (Accueil)"
      });

      const finalRef = refCode || saved?.booking?.id || `3M-RES-${Date.now().toString().slice(-4)}`;
      const waText =
        summary ||
        `Bonjour 3M SERVICES,\nType : ${isRoundTrip ? "Aller-retour" : "Aller simple"}\n• Véhicule : ${selectedVehicle?.name}\n• Prise en charge : ${pickStr} (${pickDate} ${pickTime})\n• Destination : ${destStr}${isRoundTrip ? `\n• Retour : ${effectiveDropDate} ${dropTime}` : ""}\n• Nom : ${contact.name}\n• Tél : ${contact.phone}\n• Réf : ${finalRef}`;

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
            {/* Compact Header: Title + Aller simple / Aller-retour toggle */}
            <div className="book-card-v2__header">
              <h2 className="book-card-v2__title">{t("book_title")}</h2>
              <div className="book-card-v2__tabs" role="tablist" aria-label={L("Type de trajet", "Trip type")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tripType === "one_way"}
                  className={`book-card-v2__tab ${tripType === "one_way" ? "is-active" : ""}`}
                  onClick={() => { setTripType("one_way"); setFormError(""); }}
                >
                  <i className="fa-solid fa-arrow-right-long"></i>
                  <span>{L("Aller simple", "One way")}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tripType === "round_trip"}
                  className={`book-card-v2__tab ${tripType === "round_trip" ? "is-active" : ""}`}
                  onClick={() => { setTripType("round_trip"); setFormError(""); }}
                >
                  <i className="fa-solid fa-right-left"></i>
                  <span>{L("Aller-retour", "Round trip")}</span>
                </button>
              </div>
            </div>

            {formError && (
              <div className="book-card-v2__error" role="alert">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{formError}</span>
                <button type="button" onClick={() => setFormError("")} aria-label="Fermer">&times;</button>
              </div>
            )}

            <form className="book-card-v2__form" onSubmit={handleSearch} noValidate>
              {/* ROW 1 — Exactly 3 clean inputs: Car Type | Pick-up (popover) | Drop-off (popover) */}
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

                <PlacePopoverField
                  id="bc-pickup"
                  label={L("Prise en charge", "Pick-up")}
                  placeholder={L("Ville, quartier (ex. Yaoundé — Omnisports)", "City, neighbourhood…")}
                  cities={cities}
                  place={pickup}
                  onChange={(p) => { setPickup(p); setFormError(""); }}
                  isOpen={openPop === "pickup"}
                  onToggle={() => setOpenPop((cur) => (cur === "pickup" ? null : "pickup"))}
                  onClose={() => setOpenPop(null)}
                  isFr={isFr}
                />

                <PlacePopoverField
                  id="bc-dropoff"
                  label={L("Où allez-vous ?", "Where are you going?")}
                  placeholder={L("Ville, quartier de destination…", "Destination city, neighbourhood…")}
                  cities={cities}
                  place={destination}
                  onChange={(p) => { setDestination(p); setFormError(""); }}
                  isOpen={openPop === "dest"}
                  onToggle={() => setOpenPop((cur) => (cur === "dest" ? null : "dest"))}
                  onClose={() => setOpenPop(null)}
                  isFr={isFr}
                  extraAction={
                    <button type="button" className="book-card-v2__swap-mini" onClick={swapPlaces} title={L("Inverser départ et destination", "Swap pick-up and destination")}>
                      <i className="fa-solid fa-right-left"></i> {L("Inverser", "Swap")}
                    </button>
                  }
                />
              </div>

              {/* ROW 2 — Pick-up Date+Time | Drop-off Date+Time (if Aller-retour) | Red Search CTA */}
              <div className={`book-card-v2__row ${isRoundTrip ? "book-card-v2__row--bottom" : "book-card-v2__row--oneway"}`}>
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

                {isRoundTrip && (
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
                )}

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
                    <strong>{selectedVehicle?.name} · {isRoundTrip ? L("Aller-retour", "Round trip") : L("Aller simple", "One way")}</strong>
                    <p><i className="fa-solid fa-location-dot"></i> {placeLabel(pickup)} → {placeLabel(destination)}</p>
                    <p>
                      <i className="fa-regular fa-calendar"></i>{" "}
                      {pickDate} ({pickTime})
                      {isRoundTrip ? ` → ${dropDate} (${dropTime}) · ${rentalDays} ${L(rentalDays > 1 ? "jours" : "jour", rentalDays > 1 ? "days" : "day")}` : ""}
                    </p>
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
