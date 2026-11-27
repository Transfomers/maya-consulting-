// Réservation d'un véhicule : aller simple, aller-retour ou location à la durée.
// Les lieux, véhicules, tarifs et disponibilités viennent du serveur ; rien n'est inventé ici.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config/api";
import { useTranslation } from "../context/LanguageContext";
import { getCurrentClient, saveOrderAndCustomerAccount } from "../utils/customerAccounts";
import NeighbourhoodPicker from "./NeighbourhoodPicker";
import "../styles/RentalBooking.css";

const frDay = (d, isFr) => new Date(`${d}T12:00:00`).toLocaleDateString(isFr ? "fr-FR" : "en-GB", { weekday: "short", day: "numeric", month: "short" });
const plusDays = (d, n) => {
  const x = new Date(`${d}T12:00:00`);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};
const emptyPlace = { cityId: "", districtId: "", neighbourhoodId: null, neighbourhoodText: "", address: "" };
const fcfa = (n) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
const today = () => new Date(Date.now() + 3600000).toISOString().slice(0, 10); // Africa/Douala
const newKey = () => `rq-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
  const [loadError, setLoadError] = useState(false);
  const [tripType, setTripType] = useState("one_way");
  const [vehicleId, setVehicleId] = useState("");
  const [pickup, setPickup] = useState(emptyPlace);
  const [destination, setDestination] = useState(emptyPlace);
  const [dates, setDates] = useState({ depDate: "", depTime: "09:00", retDate: "", retTime: "18:00", hours: "8" });
  const [back, setBack] = useState({ address: "", notes: "" });
  const [catalogue, setCatalogue] = useState([]);
  const [stops, setStops] = useState("");
  const [notes, setNotes] = useState("");
  const [contact, setContact] = useState({ name: client?.name || "", phone: client?.phone || "", email: client?.email || "" });
  useEffect(() => {
    const onAuth = (e) => {
      const next = e?.detail !== undefined ? e.detail : getCurrentClient();
      setClientState(next);
      if (next) {
        setContact({ name: next.name || "", phone: next.phone || "", email: next.email || "" });
      }
    };
    window.addEventListener("3m-client-auth-changed", onAuth);
    return () => window.removeEventListener("3m-client-auth-changed", onAuth);
  }, []);
  const [errors, setErrors] = useState({});
  const [quote, setQuote] = useState(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);
  const [sendError, setSendError] = useState("");
  const requestKey = useRef(newKey());
  const wantedCar = useRef(sessionStorage.getItem("selected_booking_car"));

  const load = () => {
    setLoadError(false);
    fetch(`${API_BASE}/rental/options`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("options"))))
      .then(setOptions)
      .catch(() => setLoadError(true));
  };
  useEffect(load, []);
  // Photos et noms du catalogue (mêmes véhicules que « Nos Véhicules »)
  useEffect(() => {
    fetch(`${API_BASE}/cars`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCatalogue(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);
  const carOf = (id) => catalogue.find((c) => c.id === `bus-${id}`);

  // Véhicule choisi depuis le catalogue (« Réserver »)
  const selectByName = (name) => {
    const n = String(name || "").toLowerCase();
    const listed = catalogue.find((c) => String(c.name || "").toLowerCase() === n);
    const found =
      options?.vehicles.find((v) => listed && listed.id === `bus-${v.id}`) ||
      options?.vehicles.find((v) => n.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(n));
    if (found) setVehicleId(String(found.id));
  };
  useEffect(() => {
    if (options && wantedCar.current) {
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
  }, [options, catalogue]); // eslint-disable-line react-hooks/exhaustive-deps

  const cityOf = (place) => options?.cities.find((c) => c.id === Number(place.cityId));
  const needsDestination = tripType !== "disposal";
  const payload = useMemo(
    () => ({
      tripType,
      vehicleId: Number(vehicleId) || null,
      pickupCityId: Number(pickup.cityId) || null,
      pickupNeighbourhoodId: pickup.neighbourhoodId,
      pickupNeighbourhoodText: pickup.neighbourhoodText,
      pickupAddress: pickup.address,
      destinationCityId: needsDestination ? Number(destination.cityId) || null : null,
      destinationNeighbourhoodId: needsDestination ? destination.neighbourhoodId : null,
      destinationNeighbourhoodText: needsDestination ? destination.neighbourhoodText : "",
      destinationAddress: needsDestination ? destination.address : "",
      departureAt: dates.depDate && dates.depTime ? `${dates.depDate}T${dates.depTime}` : "",
      returnAt: tripType === "round_trip" && dates.retDate && dates.retTime ? `${dates.retDate}T${dates.retTime}` : "",
      returnAddress: tripType === "round_trip" ? back.address : "",
      returnNotes: tripType === "round_trip" ? back.notes : "",
      durationHours: tripType === "disposal" ? dates.hours : "",
      driverRequired: false,
      stops: tripType === "disposal" ? stops : "",
      notes
    }),
    [tripType, vehicleId, pickup, destination, dates, back, stops, notes, needsDestination]
  );

  const complete =
    payload.vehicleId && payload.pickupCityId && (payload.pickupNeighbourhoodId || payload.pickupNeighbourhoodText) &&
    payload.departureAt && (!needsDestination || (payload.destinationCityId && (payload.destinationNeighbourhoodId || payload.destinationNeighbourhoodText))) &&
    (tripType !== "round_trip" || payload.returnAt) && (tripType !== "disposal" || Number(payload.durationHours) > 0);

  // Estimation et disponibilité en direct
  useEffect(() => {
    setQuote(null);
    if (!complete) return undefined;
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/rental/quote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
        .then(({ ok, data }) => setQuote(ok ? data : { errors: data.errors || {} }))
        .catch(() => setQuote(null));
    }, 500);
    return () => clearTimeout(timer);
  }, [payload, complete]);

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const missing = {};
    const required = L("Champ obligatoire.", "Required.");
    if (!vehicleId) missing.vehicleId = L("Choisissez un véhicule.", "Choose a vehicle.");
    if (!pickup.cityId) missing.pickupCityId = required;
    if (!pickup.neighbourhoodId && !pickup.neighbourhoodText) missing.pickupNeighbourhoodId = L("Choisissez un quartier.", "Choose an area.");
    if (needsDestination && !destination.cityId) missing.destinationCityId = required;
    if (needsDestination && !destination.neighbourhoodId && !destination.neighbourhoodText) missing.destinationNeighbourhoodId = L("Choisissez un quartier.", "Choose an area.");
    if (!payload.departureAt) missing.departureAt = L("Date et heure de départ obligatoires.", "Departure date and time required.");
    if (tripType === "round_trip" && !payload.returnAt) missing.returnAt = L("Date et heure de retour obligatoires.", "Return date and time required.");
    if (contact.name.trim().length < 2) missing.name = L("Indiquez votre nom.", "Enter your name.");
    if (contact.phone.replace(/\D/g, "").length < 8) missing.phone = L("Numéro de téléphone invalide.", "Invalid phone number.");
    setErrors(missing);
    setSendError("");
    if (Object.keys(missing).length) {
      setTimeout(() => document.querySelector("#booking-section .rb-error")?.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/rental/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload, ...contact, vehicleName: chosenCar?.name || chosen?.name || "",
          requestKey: requestKey.current, guestId: guestId(),
          clientId: client?.accountNumber || guestId(), accountNumber: client?.accountNumber || ""
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.errors || {});
        setSendError(data.error || L("Envoi impossible, réessayez.", "Could not send, try again."));
        return;
      }
      // Save reservation in the client's profile so they can view & modify it anytime
      try {
        const pickedLabel = placeLabel(pickup) || cityName(pickup) || "Yaoundé";
        const destLabel = needsDestination ? (placeLabel(destination) || cityName(destination) || pickedLabel) : pickedLabel;
        const dropDateVal = tripType === "round_trip" && dates.retDate ? dates.retDate : dates.depDate;
        const d1 = new Date(dates.depDate);
        const d2 = new Date(dropDateVal || dates.depDate);
        const calcDays = !isNaN(d1) && !isNaN(d2) ? Math.max(1, Math.round((d2 - d1) / 86400000)) : 1;
        saveOrderAndCustomerAccount({
          orderId: data.reference || "",
          clientName: contact.name,
          phone: contact.phone,
          email: contact.email,
          city: cityName(pickup) || client?.city || "Yaoundé",
          itemName: chosenCar?.name || chosen?.name || "Véhicule VIP 3M",
          itemCategory: "Location Véhicule",
          totalPrice: Number(data.estimate) || 0,
          days: calcDays,
          pickTime: dates.depDate,
          dropTime: dropDateVal,
          pickUp: pickedLabel,
          dropOff: destLabel,
          notes: [notes, stops, back.notes].filter(Boolean).join(" • "),
          source: "Réserver un Véhicule (Accueil)"
        });
      } catch (_) {}
      setDone(data);
      requestKey.current = newKey();
    } catch (_) {
      setSendError(L("Connexion impossible. Réessayez ou contactez-nous sur WhatsApp.", "No connection. Retry or use WhatsApp."));
    } finally {
      setSending(false);
    }
  };

  // Une erreur disparaît dès que le champ concerné est corrigé
  useEffect(() => {
    setErrors((e) => (Object.keys(e).length ? {} : e));
  }, [vehicleId, pickup, destination, dates]);

  const setPlace = (setter, patch) => setter((p) => ({ ...p, ...patch }));
  const err = (k) => errors[k] || quote?.errors?.[k];
  const errorLine = (k) => err(k) && <span className="rb-error" role="alert">{err(k)}</span>;

  const cityName = (place) => cityOf(place)?.name || "";
  const placeLabel = (place) => {
    const hood = cityOf(place)?.neighbourhoods.find((n) => n.id === place.neighbourhoodId)?.name || place.neighbourhoodText;
    return [hood, cityName(place)].filter(Boolean).join(", ");
  };
  const fromLabel = placeLabel(pickup) || L("Prise en charge", "Pick-up");
  const toLabel = placeLabel(destination) || L("Destination", "Destination");
  const when = (date, time) => (date ? `${frDay(date, isFr)}${time ? ` · ${time}` : ""}` : L("Date à choisir", "Choose a date"));
  const swap = () => {
    setPickup(destination);
    setDestination(pickup);
  };

  const placeBlock = (prefix, title, place, setter, dot) => (
    <div className="rb-place">
      <h4><span className={`rb-dot ${dot}`} aria-hidden="true"></span>{title}</h4>
      <div className="rb-grid">
        <div className="rb-field">
          <label htmlFor={`${prefix}-city`}>{L("Ville", "City")} *</label>
          <select id={`${prefix}-city`} value={place.cityId} onChange={(e) => setPlace(setter, { ...emptyPlace, cityId: e.target.value, address: place.address })}>
            <option value="">{L("Choisir…", "Choose…")}</option>
            {options.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errorLine(`${prefix}CityId`)}
        </div>
        <div className="rb-field">
          <label htmlFor={`${prefix}-district`}>{L("Arrondissement", "District")}</label>
          <select id={`${prefix}-district`} value={place.districtId} disabled={!cityOf(place)?.districts.length} onChange={(e) => setPlace(setter, { districtId: e.target.value, neighbourhoodId: null, neighbourhoodText: "" })}>
            <option value="">{L("Tous", "All")}</option>
            {cityOf(place)?.districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <NeighbourhoodPicker
          city={cityOf(place)}
          districtId={place.districtId}
          value={place.neighbourhoodId}
          text={place.neighbourhoodText}
          onChange={({ id, text }) => setPlace(setter, { neighbourhoodId: id, neighbourhoodText: text })}
          label={L("Quartier", "Neighbourhood")}
          error={err(`${prefix}NeighbourhoodId`)}
          isFr={isFr}
        />
        <div className="rb-field">
          <label htmlFor={`${prefix}-address`}>{L("Repère (facultatif)", "Landmark (optional)")}</label>
          <input id={`${prefix}-address`} value={place.address} maxLength={200} onChange={(e) => setPlace(setter, { address: e.target.value })} placeholder={L("Hôtel, rue, face à…", "Hotel, street…")} />
        </div>
      </div>
    </div>
  );

  const dateField = (id, label, type, key, extra = {}) => (
    <div className="rb-field">
      <label htmlFor={id}>{label} *</label>
      <input id={id} type={type} value={dates[key]} onChange={(e) => setDates({ ...dates, [key]: e.target.value })} {...extra} />
    </div>
  );

  const step = (n, title) => (
    <h3 className="rb-step"><span>{n}</span>{title}</h3>
  );

  const TYPES = [
    ["one_way", "fa-arrow-right-long", L("Aller simple", "One way"), L("Prise en charge → destination", "Pick-up → destination")],
    ["round_trip", "fa-right-left", L("Aller-retour", "Round trip"), L("Prise en charge et retour", "Pick-up and return")],
    ["disposal", "fa-clock", L("Mise à disposition", "Hourly / Daily"), L("Véhicule réservé à la durée", "Vehicle reserved by the hour")]
  ];
  const typeLabel = TYPES.find(([k]) => k === tripType)[2];

  const chosen = options?.vehicles.find((v) => v.id === Number(vehicleId));
  const chosenCar = chosen && carOf(chosen.id);
  const summaryText = done?.summary || "";

  const status = !complete ? { tone: "idle", text: L("Complétez le trajet pour voir la disponibilité.", "Complete the trip to check availability.") }
    : !quote ? { tone: "idle", text: L("Vérification…", "Checking…") }
    : quote.errors ? { tone: "bad", text: Object.values(quote.errors)[0] }
    : !quote.available ? { tone: "bad", text: quote.message }
    : { tone: "ok", text: L("Véhicule disponible", "Vehicle available") };
  const price = quote?.available ? (quote.estimate ? fcfa(quote.estimate) : L("Sur devis", "On request")) : "—";

  const leg = (icon, title, from, to, time) => (
    <div className="rb-leg">
      <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
      <div>
        <strong>{title}</strong>
        <span>{from} → {to}</span>
        <small>{time}</small>
      </div>
    </div>
  );

  return (
    <section id="booking-section" className="book-section">
      <div className="container">
        <div className="book-content">
          <div className="book-content__box rb">
            <h2>{t("book_title")}</h2>

            {done ? (
              <div className="rb-done" role="status">
                <i className="fa-solid fa-circle-check"></i>
                <h3>{L("Demande envoyée", "Request sent")} — {done.reference}</h3>
                <p>{done.estimate ? `${L("Estimation", "Estimate")} : ${fcfa(done.estimate)}. ` : L("Le tarif vous sera communiqué (sur devis). ", "We will send you a quote. ")}
                  {L("Notre équipe vous contacte pour confirmer la disponibilité du véhicule.", "Our team will contact you to confirm vehicle availability.")}</p>
                <div className="rb-actions">
                  <button type="button" className="rb-primary" onClick={() => window.dispatchEvent(new CustomEvent("3m-open-chat", { detail: { refresh: true } }))}>
                    <i className="fa-regular fa-comment-dots"></i> {L("Ouvrir la discussion", "Open the chat")}
                  </button>
                  <Link className="rb-link" to="/account/orders" style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
                    <i className="fa-regular fa-calendar-check"></i> {L("Voir / Modifier dans mon Profil", "View / Edit in My Profile")}
                  </Link>
                  <a className="rb-wa" target="_blank" rel="noreferrer" href={`https://wa.me/237691786447?text=${encodeURIComponent(summaryText)}`}>
                    <i className="fa-brands fa-whatsapp"></i> WhatsApp
                  </a>
                  <button type="button" className="rb-link" onClick={() => setDone(null)}>{L("Nouvelle demande", "New request")}</button>
                </div>
              </div>
            ) : loadError ? (
              <div className="rb-done" role="alert">
                <p>{L("La réservation en ligne est momentanément indisponible.", "Online booking is temporarily unavailable.")}</p>
                <div className="rb-actions">
                  <button type="button" className="rb-primary" onClick={load}>{L("Réessayer", "Retry")}</button>
                  <a className="rb-wa" href="https://wa.me/237691786447" target="_blank" rel="noreferrer"><i className="fa-brands fa-whatsapp"></i> WhatsApp</a>
                </div>
              </div>
            ) : !options ? (
              <div className="rb-skeleton" aria-label={L("Chargement…", "Loading…")}><span></span><span></span><span></span></div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="rb-types" role="radiogroup" aria-label={L("Type de trajet", "Trip type")}>
                  {TYPES.map(([key, icon, label, help]) => (
                    <button key={key} type="button" role="radio" aria-checked={tripType === key} className={tripType === key ? "is-active" : ""} onClick={() => { setTripType(key); setErrors({}); }}>
                      <i className={`fa-solid ${icon}`}></i>
                      <strong>{label}</strong>
                      <small>{help}</small>
                    </button>
                  ))}
                </div>

                <div className="rb-layout">
                  <div className="rb-main">
                    <section className="rb-card">
                      {step(1, L("Choisissez le véhicule", "Choose your vehicle"))}
                      <div className="rb-cars" role="radiogroup" aria-label={L("Véhicule", "Vehicle")}>
                        {[...options.vehicles]
                          .sort((x, y) => {
                            const pos = (v) => { const i = catalogue.findIndex((c) => c.id === `bus-${v.id}`); return i === -1 ? catalogue.length : i; };
                            return pos(x) - pos(y);
                          })
                          .map((v) => {
                          const car = carOf(v.id);
                          const active = Number(vehicleId) === v.id;
                          return (
                            <button key={v.id} type="button" role="radio" aria-checked={active} className={`rb-car ${active ? "is-active" : ""}`} onClick={() => setVehicleId(String(v.id))}>
                              <span className="rb-car__photo">
                                {car?.image ? <img src={car.image} alt="" loading="lazy" /> : <i className="fa-solid fa-car-side"></i>}
                              </span>
                              <strong>{car?.name || v.name}</strong>
                              <small>{v.seats} {L("places", "seats")}</small>
                              {active && <i className="fa-solid fa-circle-check rb-car__check" aria-hidden="true"></i>}
                            </button>
                          );
                        })}
                      </div>
                      {errorLine("vehicleId")}
                    </section>

                    <section className="rb-card">
                      {step(2, L("Votre trajet", "Your route"))}
                      {placeBlock("pickup", L("Lieu de prise en charge", "Pick-up"), pickup, setPickup, "is-from")}
                      {needsDestination && (
                        <>
                          <div className="rb-swap">
                            <button type="button" onClick={swap} aria-label={L("Inverser le départ et la destination", "Swap pick-up and destination")}>
                              <i className="fa-solid fa-arrows-up-down"></i> {L("Inverser", "Swap")}
                            </button>
                          </div>
                          {placeBlock("destination", L("Destination", "Destination"), destination, setDestination, "is-to")}
                        </>
                      )}
                      {tripType === "one_way" && (
                        <p className="rb-info"><i className="fa-solid fa-circle-info"></i> {L("Aller simple : le véhicule ne reste pas à destination. Son retour est pris en compte dans le tarif et le planning.", "One way: the vehicle returns to base; this is included in pricing and scheduling.")}</p>
                      )}
                      {tripType === "disposal" && (
                        <div className="rb-field rb-wide">
                          <label htmlFor="rb-stops">{L("Déplacements prévus (facultatif)", "Planned stops (optional)")}</label>
                          <input id="rb-stops" value={stops} maxLength={600} onChange={(e) => setStops(e.target.value)} placeholder={L("Ex : réunion à Bastos, puis aéroport", "e.g. meeting in Bastos, then airport")} />
                        </div>
                      )}
                    </section>

                    <section className="rb-card">
                      {step(3, tripType === "round_trip" ? L("Aller", "Outbound journey") : L("Dates et horaires", "Dates and times"))}
                      <div className="rb-grid rb-grid--2">
                        {dateField("rb-dd", L("Date de départ", "Departure date"), "date", "depDate", { min: today() })}
                        {dateField("rb-dt", L("Heure de départ", "Departure time"), "time", "depTime")}
                      </div>
                      {errorLine("departureAt")}
                      {tripType === "disposal" && (
                        <div className="rb-duration">
                          <span className="rb-label">{L("Durée", "Duration")} *</span>
                          <div className="rb-chips">
                            {[["4", "4 h"], ["8", "8 h"], ["12", "12 h"], ["24", L("1 jour", "1 day")], ["48", L("2 jours", "2 days")], ["72", L("3 jours", "3 days")]].map(([h, label]) => (
                              <button key={h} type="button" className={dates.hours === h ? "is-active" : ""} onClick={() => setDates({ ...dates, hours: h })}>{label}</button>
                            ))}
                          </div>
                          <div className="rb-grid rb-grid--2">{dateField("rb-h", L("Nombre d'heures", "Number of hours"), "number", "hours", { min: 1, max: 240, step: 1 })}</div>
                          {errorLine("durationHours")}
                        </div>
                      )}
                    </section>

                    {tripType === "round_trip" && (
                      <section className="rb-card rb-card--return">
                        {step(4, L("Retour", "Return journey"))}
                        <p className="rb-route">
                          <i className="fa-solid fa-rotate-left" aria-hidden="true"></i>
                          <span><strong>{toLabel}</strong> → <strong>{fromLabel}</strong></span>
                        </p>
                        <div className="rb-chips" aria-label={L("Date de retour rapide", "Quick return date")}>
                          {[[0, L("Le même jour", "Same day")], [1, L("Le lendemain", "Next day")], [2, L("2 jours après", "2 days later")], [7, L("1 semaine après", "1 week later")]].map(([n, label]) => (
                            <button key={n} type="button" disabled={!dates.depDate} className={dates.depDate && dates.retDate === plusDays(dates.depDate, n) ? "is-active" : ""} onClick={() => setDates({ ...dates, retDate: plusDays(dates.depDate, n) })}>{label}</button>
                          ))}
                        </div>
                        <div className="rb-grid rb-grid--2">
                          {dateField("rb-rd", L("Date de retour", "Return date"), "date", "retDate", { min: dates.depDate || today() })}
                          {dateField("rb-rt", L("Heure de retour", "Return time"), "time", "retTime")}
                        </div>
                        {errorLine("returnAt")}
                        <div className="rb-grid rb-grid--2">
                          <div className="rb-field">
                            <label htmlFor="rb-ra">{L("Point de rendez-vous du retour (facultatif)", "Return meeting point (optional)")}</label>
                            <input id="rb-ra" value={back.address} maxLength={200} onChange={(e) => setBack({ ...back, address: e.target.value })} placeholder={L("Vide = même lieu que la destination", "Empty = same as destination")} />
                          </div>
                          <div className="rb-field">
                            <label htmlFor="rb-rn">{L("Précisions pour le retour (facultatif)", "Return details (optional)")}</label>
                            <input id="rb-rn" value={back.notes} maxLength={300} onChange={(e) => setBack({ ...back, notes: e.target.value })} placeholder={L("N° de vol, train, consignes…", "Flight or train number…")} />
                          </div>
                        </div>
                        <p className="rb-info"><i className="fa-solid fa-circle-info"></i> {L("Le véhicule reste réservé pour toute la durée de votre aller-retour.", "The vehicle remains reserved for the full duration of your round trip.")}</p>
                      </section>
                    )}

                    <section className="rb-card">
                      {step(tripType === "round_trip" ? 5 : 4, L("Vos coordonnées", "Your details"))}
                      <div className="rb-grid rb-grid--2">
                        <div className="rb-field"><label htmlFor="rb-name">{L("Nom & prénom", "Full name")} *</label><input id="rb-name" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />{errorLine("name")}</div>
                        <div className="rb-field"><label htmlFor="rb-phone">{L("Téléphone / WhatsApp", "Phone / WhatsApp")} *</label><input id="rb-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+237 6XX XX XX XX" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />{errorLine("phone")}</div>
                        <div className="rb-field"><label htmlFor="rb-email">E-mail</label><input id="rb-email" type="email" autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />{errorLine("email")}</div>
                        <div className="rb-field"><label htmlFor="rb-notes">{L("Remarque (facultatif)", "Note (optional)")}</label><input id="rb-notes" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                      </div>
                    </section>
                  </div>

                  <aside className="rb-summary" aria-label={L("Récapitulatif", "Summary")}>
                    <h3>{L("Récapitulatif", "Your trip")}</h3>
                    <div className="rb-summary__car">
                      {chosenCar?.image && <img src={chosenCar.image} alt="" />}
                      <div>
                        <strong>{chosen ? chosenCar?.name || chosen.name : L("Aucun véhicule choisi", "No vehicle yet")}</strong>
                        <span>{typeLabel}</span>
                      </div>
                    </div>
                    {tripType === "disposal"
                      ? leg("fa-clock", L("Location à la durée", "Hourly / daily rental"), fromLabel, `${dates.hours || "?"} h`, when(dates.depDate, dates.depTime))
                      : leg("fa-arrow-right-long", L("Aller", "Outbound"), fromLabel, toLabel, when(dates.depDate, dates.depTime))}
                    {tripType === "round_trip" && leg("fa-rotate-left", L("Retour", "Return"), toLabel, fromLabel, when(dates.retDate, dates.retTime))}
                    <div className="rb-summary__foot" aria-live="polite">
                      <p className={`rb-status is-${status.tone}`}>{status.text}</p>
                      <div className="rb-price"><span>{L("Estimation", "Estimate")}</span><strong>{price}</strong></div>
                      <button type="submit" className="rb-primary" disabled={sending || quote?.available === false}>
                        {sending && <span className="rb-spin" aria-hidden="true"></span>}
                        {sending ? L("Envoi…", "Sending…") : L("Envoyer ma demande", "Send my request")}
                      </button>
                      {sendError && <p className="rb-error" role="alert">{sendError}</p>}
                    </div>
                  </aside>
                </div>

                <div className="rb-mobilebar">
                  <div>
                    <span>{L("Estimation", "Estimate")}</span>
                    <strong>{price}</strong>
                    <small className={`rb-status is-${status.tone}`}>{status.tone === "idle" ? typeLabel : status.text}</small>
                  </div>
                  <button type="submit" className="rb-primary" disabled={sending || quote?.available === false}>
                    {sending ? L("Envoi…", "Sending…") : L("Envoyer", "Send")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BookCar;
