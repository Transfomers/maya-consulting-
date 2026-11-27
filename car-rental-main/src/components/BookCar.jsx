// Réservation d'un véhicule : aller simple, aller-retour ou mise à disposition avec chauffeur.
// Les lieux, véhicules, tarifs et disponibilités viennent du serveur ; rien n'est inventé ici.
import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../config/api";
import { useTranslation } from "../context/LanguageContext";
import { getCurrentClient } from "../utils/customerAccounts";
import NeighbourhoodPicker from "./NeighbourhoodPicker";
import "../styles/RentalBooking.css";

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
  const [dates, setDates] = useState({ depDate: "", depTime: "", retDate: "", retTime: "", hours: "8" });
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

  // Véhicule choisi depuis le catalogue (« Réserver »)
  const selectByName = (name) => {
    const n = String(name || "").toLowerCase();
    const found = options?.vehicles.find((v) => n.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(n));
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
  }, [options]); // eslint-disable-line react-hooks/exhaustive-deps

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
      durationHours: tripType === "disposal" ? dates.hours : "",
      driverRequired: false,
      stops: tripType === "disposal" ? stops : "",
      notes
    }),
    [tripType, vehicleId, pickup, destination, dates, stops, notes, needsDestination]
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
          ...payload, ...contact, requestKey: requestKey.current, guestId: guestId(),
          clientId: client?.accountNumber || guestId(), accountNumber: client?.accountNumber || ""
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.errors || {});
        setSendError(data.error || L("Envoi impossible, réessayez.", "Could not send, try again."));
        return;
      }
      setDone(data);
      requestKey.current = newKey();
    } catch (_) {
      setSendError(L("Connexion impossible. Réessayez ou contactez-nous sur WhatsApp.", "No connection. Retry or use WhatsApp."));
    } finally {
      setSending(false);
    }
  };

  const setPlace = (setter, patch) => setter((p) => ({ ...p, ...patch }));
  const err = (k) => errors[k] || quote?.errors?.[k];
  const errorLine = (k) => err(k) && <span className="rb-error" role="alert">{err(k)}</span>;

  const placeBlock = (prefix, title, place, setter) => (
    <fieldset className="rb-block">
      <legend><i className="fa-solid fa-location-dot"></i> {title}</legend>
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
          <label htmlFor={`${prefix}-address`}>{L("Précision ou repère (facultatif)", "Address or landmark (optional)")}</label>
          <input id={`${prefix}-address`} value={place.address} maxLength={200} onChange={(e) => setPlace(setter, { address: e.target.value })} placeholder={L("Hôtel, rue, face à…", "Hotel, street…")} />
        </div>
      </div>
    </fieldset>
  );

  const dateField = (id, label, type, key, extra = {}) => (
    <div className="rb-field">
      <label htmlFor={id}>{label} *</label>
      <input id={id} type={type} value={dates[key]} onChange={(e) => setDates({ ...dates, [key]: e.target.value })} {...extra} />
    </div>
  );

  const TYPES = [
    ["one_way", "fa-arrow-right-long", L("Aller simple", "One way"), L("Prise en charge → destination", "Pick-up → destination")],
    ["round_trip", "fa-right-left", L("Aller-retour", "Round trip"), L("Prise en charge et retour", "Pick-up and return")],
    ["disposal", "fa-clock", L("Mise à disposition", "Hourly / Daily"), L("Véhicule réservé à la durée", "Vehicle reserved by the hour")]
  ];

  const summaryText = done?.summary || "";

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
              <p className="rb-loading">{L("Chargement…", "Loading…")}</p>
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

                <div className="rb-grid">
                  <div className="rb-field">
                    <label htmlFor="rb-vehicle">{L("Véhicule", "Vehicle")} *</label>
                    <select id="rb-vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                      <option value="">{L("Choisir un véhicule…", "Choose a vehicle…")}</option>
                      {options.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.seats} {L("places", "seats")}</option>)}
                    </select>
                    {errorLine("vehicleId")}
                  </div>
                </div>

                {placeBlock("pickup", L("Lieu de prise en charge", "Pick-up"), pickup, setPickup)}
                {needsDestination && placeBlock("destination", L("Destination", "Destination"), destination, setDestination)}

                {tripType === "one_way" && (
                  <p className="rb-info"><i className="fa-solid fa-circle-info"></i> {L("Aller simple : le véhicule ne reste pas à destination. Son retour est pris en compte dans le tarif et le planning.", "One way: the vehicle returns to base; this is included in pricing and scheduling.")}</p>
                )}
                {tripType === "round_trip" && (
                  <p className="rb-info"><i className="fa-solid fa-circle-info"></i> {L("Le véhicule reste réservé pour toute la durée de votre aller-retour.", "The vehicle remains reserved for the full duration of your round trip.")}</p>
                )}
                {tripType === "disposal" && (
                  <div className="rb-field">
                    <label htmlFor="rb-stops">{L("Déplacements prévus (facultatif)", "Planned stops (optional)")}</label>
                    <input id="rb-stops" value={stops} maxLength={600} onChange={(e) => setStops(e.target.value)} placeholder={L("Ex : réunion à Bastos, puis aéroport", "e.g. meeting in Bastos, then airport")} />
                  </div>
                )}

                <fieldset className="rb-block">
                  <legend><i className="fa-regular fa-calendar-days"></i> {L("Dates et horaires", "Dates and times")}</legend>
                  <div className="rb-grid">
                    {dateField("rb-dd", L("Date de départ", "Departure date"), "date", "depDate", { min: today() })}
                    {dateField("rb-dt", L("Heure de départ", "Departure time"), "time", "depTime")}
                    {tripType === "round_trip" && dateField("rb-rd", L("Date de retour", "Return date"), "date", "retDate", { min: dates.depDate || today() })}
                    {tripType === "round_trip" && dateField("rb-rt", L("Heure de retour", "Return time"), "time", "retTime")}
                    {tripType === "disposal" && dateField("rb-h", L("Durée (heures)", "Duration (hours)"), "number", "hours", { min: 1, max: 240, step: 1 })}
                  </div>
                  {errorLine("departureAt")}{errorLine("returnAt")}{errorLine("durationHours")}
                </fieldset>

                <fieldset className="rb-block">
                  <legend><i className="fa-regular fa-user"></i> {L("Vos coordonnées", "Your details")}</legend>
                  <div className="rb-grid">
                    <div className="rb-field"><label htmlFor="rb-name">{L("Nom & prénom", "Full name")} *</label><input id="rb-name" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />{errorLine("name")}</div>
                    <div className="rb-field"><label htmlFor="rb-phone">{L("Téléphone / WhatsApp", "Phone / WhatsApp")} *</label><input id="rb-phone" type="tel" autoComplete="tel" placeholder="+237 6XX XX XX XX" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />{errorLine("phone")}</div>
                    <div className="rb-field"><label htmlFor="rb-email">E-mail</label><input id="rb-email" type="email" autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />{errorLine("email")}</div>
                    <div className="rb-field"><label htmlFor="rb-notes">{L("Remarque (facultatif)", "Note (optional)")}</label><input id="rb-notes" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                  </div>
                </fieldset>

                <div className="rb-footer">
                  <div className="rb-quote" aria-live="polite">
                    {!complete ? <span>{L("Complétez le trajet pour voir la disponibilité.", "Complete the trip to check availability.")}</span>
                      : !quote ? <span>{L("Vérification…", "Checking…")}</span>
                      : quote.errors ? <span className="rb-error">{Object.values(quote.errors)[0]}</span>
                      : !quote.available ? <span className="rb-error">{quote.message}</span>
                      : (<><span>{L("Véhicule disponible", "Vehicle available")} ✓</span>
                          <strong>{quote.estimate ? `${L("Estimation", "Estimate")} : ${fcfa(quote.estimate)}` : L("Tarif sur devis", "Price on request")}</strong></>)}
                  </div>
                  <button type="submit" className="rb-primary" disabled={sending || quote?.available === false}>
                    {sending ? L("Envoi…", "Sending…") : L("Envoyer ma demande", "Send my request")}
                  </button>
                </div>
                {sendError && <p className="rb-error" role="alert">{sendError}</p>}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BookCar;
