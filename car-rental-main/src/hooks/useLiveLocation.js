// Partage de la position en direct avec la conciergerie, uniquement pendant l'utilisation de l'application.
// - le navigateur demande l'autorisation au client ;
// - envoi au plus toutes les 20 s, ou dès un déplacement de 30 m ;
// - arrêt automatique à l'échéance choisie, à la fermeture de la page, ou sur demande.
import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "../config/api";

const MIN_INTERVAL_MS = 20000;
const MIN_MOVE_M = 30;

function distanceM(a, b) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function useLiveLocation(clientId, guestId, contact = {}) {
  const contactRef = useRef(contact);
  contactRef.current = contact;
  const [active, setActive] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const watchRef = useRef(null);
  const lastSentRef = useRef(null);
  const durationRef = useRef(60);
  const timerRef = useRef(null);

  const url = `${API_BASE}/chats/${encodeURIComponent(clientId)}/live-location`;

  const clearWatch = () => {
    if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    lastSentRef.current = null;
    clearTimeout(timerRef.current);
  };

  const stop = useCallback(async (silent = false) => {
    clearWatch();
    setActive(false);
    setExpiresAt(null);
    if (!silent) {
      try {
        await fetch(url, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guestId }) });
      } catch (_) {}
    }
  }, [url, guestId]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = useCallback(async (pos, force = false) => {
    const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const last = lastSentRef.current;
    const now = Date.now();
    if (!force && last && now - last.t < MIN_INTERVAL_MS && distanceM(last, point) < MIN_MOVE_M) return;
    lastSentRef.current = { ...point, t: now };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...point, accuracy: pos.coords.accuracy, durationMinutes: durationRef.current, guestId, ...contactRef.current })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Position non transmise.");
      if (data.live && data.live.expiresAt) {
        setExpiresAt(data.live.expiresAt);
        clearTimeout(timerRef.current);
        const left = Date.parse(data.live.expiresAt) - Date.now();
        timerRef.current = setTimeout(() => stop(true), Math.max(0, left));
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [url, guestId, stop]);

  const start = useCallback((durationMinutes = 60) => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    durationRef.current = durationMinutes;
    setStarting(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStarting(false);
        setActive(true);
        send(pos, true);
        watchRef.current = navigator.geolocation.watchPosition(
          (p) => send(p),
          (err) => setError(err.code === 1 ? "Autorisation de localisation retirée." : "Position momentanément indisponible."),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 }
        );
      },
      (err) => {
        setStarting(false);
        setError(err.code === 1
          ? "Vous avez refusé l'accès à votre position. Autorisez-le dans les réglages du navigateur pour la partager."
          : "Impossible d'obtenir votre position. Vérifiez que la localisation est activée.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [send]);

  // La conciergerie ou l'échéance a pu arrêter le partage côté serveur
  const syncFromServer = useCallback((serverLive) => {
    if (active && !starting && serverLive === null && lastSentRef.current && Date.now() - lastSentRef.current.t > 8000) {
      stop(true);
    }
  }, [active, starting, stop]);

  // Fermeture / départ de la page : on arrête le partage (le client n'est plus dans l'application)
  useEffect(() => {
    if (!active) return undefined;
    const onLeave = () => {
      try {
        navigator.sendBeacon(`${url}/stop`, new Blob([JSON.stringify({ guestId })], { type: "text/plain" }));
      } catch (_) {}
    };
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, [active, url, guestId]);

  useEffect(() => () => clearWatch(), []);   // démontage

  return { active, starting, expiresAt, error, start, stop, syncFromServer };
}
