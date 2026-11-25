import { useState } from "react";
import useVisitorLocation, { QUICK_LOCATIONS } from "../hooks/useVisitorLocation";

const DISMISS_KEY = "3m_location_fallback_dismissed";

/**
 * Localisation automatique du visiteur, sans fenêtre bloquante.
 * N'affiche qu'un petit bouton discret si la localisation est refusée ou indisponible.
 */
export default function VisitorLocation() {
  const { status, setManualLocation } = useVisitorLocation();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch (e) {
      return true;
    }
  });

  if (dismissed || (status !== "denied" && status !== "unavailable")) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch (e) {
      /* ignore */
    }
  };

  const wrap = {
    position: "fixed", left: 16, bottom: 16, zIndex: 9990,
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
  };
  const pill = {
    display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px 8px 14px",
    borderRadius: 999, border: "1px solid #eaecf0", background: "#fff", color: "#344054",
    fontSize: 13, fontWeight: 600, boxShadow: "0 8px 20px rgba(16,24,40,.12)", cursor: "pointer",
  };

  return (
    <div style={wrap}>
      {open ? (
        <div role="dialog" aria-label="Choisir ma zone" style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 14, boxShadow: "0 16px 40px rgba(16,24,40,.16)", padding: 12, width: 260 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong style={{ fontSize: 13, color: "#101828" }}>Votre zone</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" style={{ border: 0, background: "none", fontSize: 18, lineHeight: 1, color: "#667085", cursor: "pointer" }}>×</button>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#667085" }}>
            {status === "denied" ? "La localisation est désactivée. Choisissez votre zone :" : "Position indisponible. Choisissez votre zone :"}
          </p>
          <div style={{ display: "grid", gap: 4 }}>
            {QUICK_LOCATIONS.map((label) => (
              <button key={label} type="button" onClick={() => setManualLocation(label)}
                style={{ textAlign: "left", border: "1px solid #f2f4f7", background: "#f9fafb", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: "#344054", cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <button type="button" style={pill} onClick={() => setOpen(true)}>
            <i className="fa-solid fa-location-dot" style={{ color: "#D62828" }}></i> Choisir ma zone
          </button>
          <button type="button" onClick={dismiss} aria-label="Masquer" title="Masquer"
            style={{ ...pill, padding: 0, width: 30, height: 30, justifyContent: "center", fontSize: 15 }}>×</button>
        </span>
      )}
    </div>
  );
}
