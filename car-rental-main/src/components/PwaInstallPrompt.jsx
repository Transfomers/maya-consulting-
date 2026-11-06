import React, { useState, useEffect } from "react";

function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already running standalone / installed
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(isRunningStandalone);

    if (isRunningStandalone) return;

    // Detect iOS devices
    const userAgent = window.navigator.userAgent || "";
    const isAppleDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(isAppleDevice);

    // Capture beforeinstallprompt event on Android / Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem("3m_pwa_dismissed")) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Initial brief delay for proposal if not previously dismissed
    const timer = setTimeout(() => {
      if (!isRunningStandalone && !sessionStorage.getItem("3m_pwa_dismissed")) {
        setShowPrompt(true);
      }
    }, 1800);

    // Custom trigger from navbar / footer / download section
    const handleCustomTrigger = () => {
      setShowPrompt(true);
      setShowIOSInstructions(false);
    };
    window.addEventListener("open-pwa-install", handleCustomTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("open-pwa-install", handleCustomTrigger);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } else {
      // Show compact step instructions for iOS or other browsers
      setShowIOSInstructions(!showIOSInstructions);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    sessionStorage.setItem("3m_pwa_dismissed", "true");
  };

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Installation de l'application 3M SERVICES"
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        padding: "12px 14px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2), 0 1px 4px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
        zIndex: 999999,
        fontFamily: "'Rubik', -apple-system, BlinkMacSystemFont, sans-serif",
        animation: "slideInPwa 0.25s ease-out",
        boxSizing: "border-box"
      }}
    >
      <style>{`
        @keyframes slideInPwa {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 480px) {
          .pwa-compact-bar {
            bottom: 10px !important;
            left: 10px !important;
            right: 10px !important;
            width: calc(100% - 20px) !important;
            max-width: none !important;
          }
        }
      `}</style>

      {/* Header Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
          <img
            src="/apple-touch-icon.png"
            alt="3M"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "9px",
              objectFit: "contain",
              backgroundColor: "#ffffff",
              padding: "2px",
              border: "1px solid #e5e7eb",
              flexShrink: 0
            }}
          />
          <div style={{ overflow: "hidden" }}>
            <strong style={{ fontSize: "14px", color: "#111827", lineHeight: "1.2", display: "block" }}>
              3M SERVICES
            </strong>
            <p style={{ margin: "3px 0 0 0", fontSize: "11.5px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Télécharger maintenant • Accès direct
            </p>
          </div>
        </div>

        {/* Small Close Icon */}
        <button
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            fontSize: "15px",
            cursor: "pointer",
            padding: "4px",
            lineHeight: 1
          }}
          title="Fermer"
        >
          ✕
        </button>
      </div>

      {/* iOS Instructions Collapsible */}
      {showIOSInstructions && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "8px 10px",
            marginBottom: "8px",
            fontSize: "11px",
            color: "#1f2937",
            lineHeight: "1.4"
          }}
        >
          <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: "4px" }}>
            {isIOS ? "📱 Sur iPhone / iPad (Safari) :" : "📱 Sur votre appareil :"}
          </div>
          <div>1. Appuyez sur le bouton <b>Partager</b> (carré avec flèche en bas).</div>
          <div>2. Sélectionnez <b>« Sur l'écran d'accueil »</b> puis <b>« Ajouter »</b>.</div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
        <button
          onClick={handleDismiss}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            fontSize: "11.5px",
            fontWeight: 500,
            cursor: "pointer",
            padding: "5px 8px"
          }}
        >
          Continuer sur le site web
        </button>

        <button
          onClick={handleInstallClick}
          style={{
            backgroundColor: "#C92A2A",
            color: "#ffffff",
            border: "none",
            borderRadius: "7px",
            padding: "6px 13px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.16)",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap"
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#B02525")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#C92A2A")}
          title="Télécharger maintenant l'application 3M SERVICES"
        >
          <span>📲 Télécharger maintenant</span>
        </button>
      </div>
    </div>
  );
}

export default PwaInstallPrompt;
