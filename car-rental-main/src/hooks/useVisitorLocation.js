import { useCallback, useEffect, useState } from "react";
import { getCurrentClient } from "../utils/customerAccounts";
import { FLASK_PUBLIC_URL } from "../config/api";

/*
 * Localisation du visiteur — logique unique du site.
 * - 1re visite : on demande l'autorisation du navigateur une seule fois (pas de fenêtre maison).
 * - Visites suivantes : si l'autorisation est accordée, la position est mise à jour en silence.
 * - Refus / indisponible : on ne redemande jamais ; un choix manuel discret est proposé.
 */
const STORE_KEY = "3m_visitor_location";
const ASKED_KEY = "3m_location_asked";
const REFRESH_MS = 30 * 60 * 1000; // mise à jour silencieuse au plus toutes les 30 min
const PING_KEY = "3m_visitor_pinged"; // une remontée vers l'admin par session

export const QUICK_LOCATIONS = [
  "Yaoundé — Tsinga (Face FECAFOOT)",
  "Yaoundé — Bastos",
  "Yaoundé — Omnisports",
  "Yaoundé — Centre-ville",
  "Douala — Bonapriso",
  "Douala — Akwa",
];

export function getVisitorLocation() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "null");
  } catch (e) {
    return null;
  }
}

function saveLocation(loc) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(loc));
  } catch (e) {
    /* stockage indisponible : on continue sans persister */
  }
  window.dispatchEvent(new CustomEvent("3m-location-changed", { detail: loc }));
}

// Distance approximative en mètres (évite de regéocoder si la personne n'a pas bougé)
function metersBetween(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return Infinity;
  const dLat = (a.lat - b.lat) * 111320;
  const dLng = (a.lng - b.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=fr`
    );
    if (!res.ok) return null;
    const a = (await res.json()).address || {};
    const area = a.suburb || a.neighbourhood || a.quarter || a.road || "";
    const city = a.city || a.town || a.village || a.state || "";
    return [city, area].filter(Boolean).join(" — ") || null;
  } catch (e) {
    return null;
  }
}

// Remonte la visite à l'admin uniquement pour un client identifié (nom + téléphone connus)
function notifyAdmin(loc) {
  const client = getCurrentClient();
  if (!FLASK_PUBLIC_URL || !client || !client.name || !client.phone || !loc) return;
  try {
    if (sessionStorage.getItem(PING_KEY)) return;
    sessionStorage.setItem(PING_KEY, "1");
  } catch (e) {
    return;
  }
  fetch(`${FLASK_PUBLIC_URL}/api/visitor-checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: client.name,
      phone: client.phone,
      email: client.email || "",
      location: loc.label,
      city: (loc.label || "").split("—")[0].trim() || "Yaoundé",
      page: window.location.pathname,
    }),
  }).catch(() => {});
}

export default function useVisitorLocation() {
  const [location, setLocation] = useState(getVisitorLocation);
  // idle | locating | ready | denied | unavailable
  const [status, setStatus] = useState(() => (getVisitorLocation() ? "ready" : "idle"));

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const prev = getVisitorLocation();
        const point = { lat: +coords.latitude.toFixed(5), lng: +coords.longitude.toFixed(5) };
        const label =
          prev && prev.source === "gps" && prev.label && metersBetween(prev, point) < 300
            ? prev.label
            : (await reverseGeocode(point.lat, point.lng)) || `Position GPS (${point.lat}, ${point.lng})`;
        const loc = { ...point, label, accuracy: Math.round(coords.accuracy), source: "gps", updatedAt: Date.now() };
        saveLocation(loc);
        setLocation(loc);
        setStatus("ready");
        notifyAdmin(loc);
      },
      (err) => {
        setStatus(err && err.code === 1 ? "denied" : getVisitorLocation() ? "ready" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  }, []);

  const setManualLocation = useCallback((label) => {
    const loc = { lat: null, lng: null, label, source: "manual", updatedAt: Date.now() };
    saveLocation(loc);
    setLocation(loc);
    setStatus("ready");
    notifyAdmin(loc);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.geolocation) {
        if (!getVisitorLocation()) setStatus("unavailable");
        return;
      }
      let perm = "unknown";
      try {
        if (navigator.permissions && navigator.permissions.query) {
          perm = (await navigator.permissions.query({ name: "geolocation" })).state;
        }
      } catch (e) {
        /* API Permissions absente (anciens Safari) */
      }
      if (cancelled) return;
      const saved = getVisitorLocation();
      const stale = !saved || saved.source !== "gps" || Date.now() - (saved.updatedAt || 0) > REFRESH_MS;

      if (perm === "granted") {
        if (stale) locate(); // mise à jour silencieuse, aucune fenêtre
        else notifyAdmin(saved);
        return;
      }
      if (perm === "denied") {
        setStatus(saved ? "ready" : "denied");
        return;
      }
      // "prompt" ou inconnu : on ne demande qu'une seule fois, à la première visite
      let asked = false;
      try {
        asked = localStorage.getItem(ASKED_KEY) === "1";
        localStorage.setItem(ASKED_KEY, "1");
      } catch (e) {
        asked = true;
      }
      if (!asked) locate();
      else if (saved) notifyAdmin(saved);
    })();
    return () => {
      cancelled = true;
    };
  }, [locate]);

  return { location, status, locate, setManualLocation };
}
