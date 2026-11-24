import React, { useState, useEffect } from "react";
import { getCurrentClient, setCurrentClient } from "../utils/customerAccounts";
import { API_BASE } from "../config/api";

const VISITOR_STORAGE_KEY = "3m_visitor_profile";
const FLASK_CHECKIN_URL = "http://127.0.0.1:5002/api/visitor-checkin";

const QUICK_LOCATIONS = [
  "Yaoundé — Tsinga (Face FECAFOOT)",
  "Yaoundé — Bastos",
  "Yaoundé — Omnisports",
  "Douala — Bonapriso"
];

function VisitorCheckInModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(VISITOR_STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed && parsed.name && parsed.phone && parsed.location) {
          // Already identified — send silent visit heartbeat once per browser session
          if (!sessionStorage.getItem("3m_visitor_pinged")) {
            sessionStorage.setItem("3m_visitor_pinged", "1");
            fetch(FLASK_CHECKIN_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...parsed,
                page: window.location.pathname
              })
            }).catch(() => {});
          }
          return;
        }
      }

      if (sessionStorage.getItem("3m_visitor_dismissed") === "1") {
        return;
      }

      const existingClient = getCurrentClient();
      if (existingClient) {
        setName(existingClient.name || "");
        setPhone(existingClient.phone || "");
        setLocation(existingClient.address || existingClient.city || "");
      }

      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    } catch (e) {
      // ignore storage errors
    }
  }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocation("Yaoundé — Tsinga (Face FECAFOOT)");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let detected = `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const addr = geoData.address || {};
            const area = addr.suburb || addr.neighbourhood || addr.road || "";
            const city = addr.city || addr.town || addr.state || "Yaoundé";
            if (area || city) {
              detected = [city, area].filter(Boolean).join(" — ");
            }
          }
        } catch (err) {
          // keep coordinates fallback
        }
        setLocation(detected);
        setLocating(false);
      },
      () => {
        setLocation("Yaoundé — Tsinga (Face FECAFOOT)");
        setLocating(false);
      },
      { timeout: 6000 }
    );
  };

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem("3m_visitor_dismissed", "1");
    } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanLoc = location.trim();

    if (!cleanName || !cleanPhone || !cleanLoc) {
      setErrorMsg("Veuillez renseigner votre nom, numéro et localisation.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    const payload = {
      name: cleanName,
      phone: cleanPhone,
      location: cleanLoc,
      city: cleanLoc.split("—")[0].trim() || "Yaoundé",
      address: cleanLoc,
      page: window.location.pathname
    };

    try {
      localStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.setItem("3m_visitor_pinged", "1");

      const current = getCurrentClient();
      if (!current) {
        setCurrentClient({
          id: `VIS-${Date.now().toString().slice(-6)}`,
          accountNumber: `3M-CLI-${Math.floor(1000 + Math.random() * 9000)}`,
          name: cleanName,
          phone: cleanPhone,
          email: "",
          city: payload.city,
          address: cleanLoc,
          tier: "VIP Visiteur"
        });
      }

      await Promise.allSettled([
        fetch(FLASK_CHECKIN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }),
        fetch(`${API_BASE}/visitors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      ]);

      setIsOpen(false);
    } catch (err) {
      setIsOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Identification Visiteur 3M SERVICES"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.58)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #D62828 0%, #ff4d30 100%)",
            color: "#ffffff",
            padding: "1.35rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start"
          }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                fontSize: "0.95rem",
                fontWeight: 700,
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "0.2rem 0.65rem",
                borderRadius: "999px",
                marginBottom: "0.45rem"
              }}
            >
              Conciergerie VIP 3M SERVICES
            </span>
            <h3 style={{ margin: 0, fontSize: "1.85rem", fontWeight: 700, lineHeight: 1.25 }}>
              Bienvenue chez 3M SERVICES
            </h3>
            <p style={{ margin: "0.3rem 0 0", fontSize: "1.25rem", opacity: 0.92 }}>
              Indiquez vos coordonnées pour un accueil personnalisé en temps réel.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer"
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#ffffff",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "1.6rem",
              lineHeight: 1,
              flexShrink: 0
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          {errorMsg && (
            <div
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "0.65rem 0.9rem",
                fontSize: "1.25rem",
                marginBottom: "1rem"
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="visitor-name"
              style={{ display: "block", fontSize: "1.3rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.35rem" }}
            >
              Nom &amp; Prénom *
            </label>
            <input
              id="visitor-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Arnaud Mbarga"
              required
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                border: "1.5px solid #cbd5e1",
                fontSize: "1.4rem",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="visitor-phone"
              style={{ display: "block", fontSize: "1.3rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.35rem" }}
            >
              Numéro de Téléphone / WhatsApp *
            </label>
            <input
              id="visitor-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: +237 698 66 87 61"
              required
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                border: "1.5px solid #cbd5e1",
                fontSize: "1.4rem",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <label
                htmlFor="visitor-location"
                style={{ fontSize: "1.3rem", fontWeight: 600, color: "#1e293b" }}
              >
                Localisation (Ville / Quartier) *
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                style={{
                  background: "#fff1f2",
                  color: "#D62828",
                  border: "1px solid #fecdd3",
                  borderRadius: "999px",
                  padding: "0.25rem 0.7rem",
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {locating ? "Détection..." : "📍 Ma position"}
              </button>
            </div>
            <input
              id="visitor-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Yaoundé — Tsinga (Face FECAFOOT)"
              required
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                border: "1.5px solid #cbd5e1",
                fontSize: "1.4rem",
                outline: "none",
                boxSizing: "border-box"
              }}
            />

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.6rem" }}>
              {QUICK_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  style={{
                    fontSize: "1.1rem",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "999px",
                    border: location === loc ? "1px solid #D62828" : "1px solid #e2e8f0",
                    background: location === loc ? "#fff1f2" : "#f8fafc",
                    color: location === loc ? "#D62828" : "#475569",
                    cursor: "pointer"
                  }}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", marginTop: "1.35rem" }}>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                padding: "0.8rem 1.25rem",
                borderRadius: "999px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#475569",
                fontSize: "1.3rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Plus tard
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                padding: "0.85rem 1.5rem",
                borderRadius: "999px",
                border: "none",
                background: "#D62828",
                color: "#ffffff",
                fontSize: "1.35rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(214, 40, 40, 0.25)"
              }}
            >
              {submitting ? "Enregistrement..." : "Valider & Continuer →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VisitorCheckInModal;
