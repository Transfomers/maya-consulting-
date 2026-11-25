import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../images/logo/logo.png";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "../context/LanguageContext";
import { getCurrentClient, setCurrentClient } from "../utils/customerAccounts";
import "../styles/MobileNav.css";

function formatNotifAgo(iso) {
  if (!iso) return "";
  const ts = new Date(iso).getTime();
  if (!ts) return "";
  const sec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (sec < 60) return "À l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `Il y a ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `Il y a ${hrs} h`;
  return `Il y a ${Math.floor(hrs / 24)} j`;
}

function Navbar() {
  const [nav, setNav] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);
  const [clientNotifs, setClientNotifs] = useState([]);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [currentClient, setClientState] = useState(() => getCurrentClient());
  const accountMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const { lang, setLang, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const closeNav = () => {
    setNav(false);
  };

  const handleOpenChat = () => {
    closeNav();
    setAccountMenuOpen(false);
    setNotifMenuOpen(false);
    window.dispatchEvent(new CustomEvent("3m-open-chat"));
  };

  const handleMarkNotifsRead = (notificationId = null) => {
    setClientNotifs((prev) =>
      prev.map((n) => (!notificationId || n.id === notificationId ? { ...n, read: true } : n))
    );
    if (!notificationId) {
      setNotifUnread(0);
    } else {
      setNotifUnread((prev) => Math.max(0, prev - 1));
    }
    window.dispatchEvent(new CustomEvent("3m-mark-client-notifs-read", { detail: { notificationId } }));
  };

  const handleAccountNavigate = (path) => {
    setAccountMenuOpen(false);
    closeNav();
    navigate(path);
    window.scrollTo(0, 0);
  };

  const handleSignOut = () => {
    setCurrentClient(null);
    setClientState(null);
    setAccountMenuOpen(false);
    closeNav();
    if (location.pathname.startsWith("/account")) {
      navigate("/account/dashboard");
    }
  };

  useEffect(() => {
    const handleUnread = (e) => {
      setChatUnread(Number(e?.detail || 0));
    };
    const handleClientNotifs = (e) => {
      const detail = e?.detail || {};
      if (typeof detail.unreadCount === "number") {
        setNotifUnread(detail.unreadCount);
      }
      if (Array.isArray(detail.items)) {
        setClientNotifs(detail.items);
      }
    };
    const handleAuthChange = (e) => {
      setClientState(e?.detail !== undefined ? e.detail : getCurrentClient());
    };
    window.addEventListener("3m-chat-unread", handleUnread);
    window.addEventListener("3m-client-notifications", handleClientNotifs);
    window.addEventListener("3m-client-auth-changed", handleAuthChange);
    return () => {
      window.removeEventListener("3m-chat-unread", handleUnread);
      window.removeEventListener("3m-client-notifications", handleClientNotifs);
      window.removeEventListener("3m-client-auth-changed", handleAuthChange);
    };
  }, []);

  // Close account & notif dropdowns on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setAccountMenuOpen(false);
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close mobile drawer & dropdowns on route change
  useEffect(() => {
    closeNav();
    setAccountMenuOpen(false);
    setNotifMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (nav) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [nav]);

  return (
    <>
      <nav role="navigation" aria-label="Navigation principale">
        {/* Backdrop for Mobile Drawer */}
        <div
          className={`mobile-nav-backdrop ${nav ? "is-visible" : ""}`}
          onClick={closeNav}
          aria-hidden={!nav}
        ></div>

        {/* Mobile Navigation Drawer */}
        <aside
          className={`mobile-nav-drawer ${nav ? "is-open" : ""}`}
          aria-label="Menu de navigation mobile"
          aria-hidden={!nav}
        >
          {/* Drawer Header */}
          <div className="mobile-nav-drawer__header">
            <div className="mobile-nav-drawer__brand">
              <Link to="/" onClick={() => { closeNav(); window.scrollTo(0, 0); }}>
                <img
                  src={Logo}
                  alt="3M SERVICES Logo"
                  className="mobile-nav-drawer__logo"
                />
              </Link>
            </div>

            <button
              type="button"
              className="mobile-nav-drawer__close-btn"
              onClick={closeNav}
              aria-label="Fermer le menu"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="mobile-nav-drawer__body">
            {/* Nav Links Matching Reference Image 1 */}
            <ul className="mobile-nav-drawer__links">
              {/* 1. Accueil */}
              <li>
                <Link
                  to="/"
                  className="mobile-nav-drawer__link-item"
                  onClick={() => { closeNav(); window.scrollTo(0, 0); }}
                >
                  <div className="mobile-nav-drawer__link-left">
                    <span className="mobile-nav-drawer__link-icon">
                      <i className="fa-solid fa-house"></i>
                    </span>
                    <span className="mobile-nav-drawer__link-title">{t("nav_home")}</span>
                  </div>
                  <i className="fa-solid fa-chevron-right mobile-nav-drawer__link-chevron"></i>
                </Link>
              </li>

              {/* 2. Véhicules */}
              <li>
                <Link
                  to="/models"
                  className="mobile-nav-drawer__link-item"
                  onClick={() => { closeNav(); window.scrollTo(0, 0); }}
                >
                  <div className="mobile-nav-drawer__link-left">
                    <span className="mobile-nav-drawer__link-icon">
                      <i className="fa-solid fa-car-side"></i>
                    </span>
                    <span className="mobile-nav-drawer__link-title">
                      {t("nav_models")}
                    </span>
                  </div>
                  <i className="fa-solid fa-chevron-right mobile-nav-drawer__link-chevron"></i>
                </Link>
              </li>

              {/* 3. Appartements Meublés */}
              <li>
                <Link
                  to="/apartments"
                  className="mobile-nav-drawer__link-item"
                  onClick={() => { closeNav(); window.scrollTo(0, 0); }}
                >
                  <div className="mobile-nav-drawer__link-left">
                    <span className="mobile-nav-drawer__link-icon">
                      <i className="fa-solid fa-building"></i>
                    </span>
                    <span className="mobile-nav-drawer__link-title">
                      {t("nav_apartments")}
                    </span>
                  </div>
                  <div className="mobile-nav-drawer__link-right">
                    <span className="mobile-nav-drawer__link-vip-pill">VIP</span>
                    <i className="fa-solid fa-chevron-right mobile-nav-drawer__link-chevron"></i>
                  </div>
                </Link>
              </li>

              {/* 4. À Propos */}
              <li>
                <Link
                  to="/about"
                  className="mobile-nav-drawer__link-item"
                  onClick={() => { closeNav(); window.scrollTo(0, 0); }}
                >
                  <div className="mobile-nav-drawer__link-left">
                    <span className="mobile-nav-drawer__link-icon">
                      <i className="fa-solid fa-shield-halved"></i>
                    </span>
                    <span className="mobile-nav-drawer__link-title">{t("nav_about")}</span>
                  </div>
                  <i className="fa-solid fa-chevron-right mobile-nav-drawer__link-chevron"></i>
                </Link>
              </li>

              {/* 5. Notre Équipe */}
              <li>
                <Link
                  to="/team"
                  className="mobile-nav-drawer__link-item"
                  onClick={() => { closeNav(); window.scrollTo(0, 0); }}
                >
                  <div className="mobile-nav-drawer__link-left">
                    <span className="mobile-nav-drawer__link-icon">
                      <i className="fa-solid fa-users"></i>
                    </span>
                    <span className="mobile-nav-drawer__link-title">{t("nav_team")}</span>
                  </div>
                  <i className="fa-solid fa-chevron-right mobile-nav-drawer__link-chevron"></i>
                </Link>
              </li>

              {/* 6. Contact */}
              <li>
                <Link
                  to="/contact"
                  className="mobile-nav-drawer__link-item"
                  onClick={() => { closeNav(); window.scrollTo(0, 0); }}
                >
                  <div className="mobile-nav-drawer__link-left">
                    <span className="mobile-nav-drawer__link-icon">
                      <i className="fa-solid fa-envelope"></i>
                    </span>
                    <span className="mobile-nav-drawer__link-title">{t("nav_contact")}</span>
                  </div>
                  <i className="fa-solid fa-chevron-right mobile-nav-drawer__link-chevron"></i>
                </Link>
              </li>

              {/* 7. Mon Compte VIP */}
              <li>
                <Link
                  to="/account/dashboard"
                  className="mobile-nav-drawer__link-item"
                  onClick={() => { closeNav(); window.scrollTo(0, 0); }}
                >
                  <div className="mobile-nav-drawer__link-left">
                    <span className="mobile-nav-drawer__link-icon">
                      <i className="fa-solid fa-user"></i>
                    </span>
                    <span className="mobile-nav-drawer__link-title">
                      {lang === "fr" ? "Mon Compte" : "My Account"}
                    </span>
                  </div>
                  <i className="fa-solid fa-chevron-right mobile-nav-drawer__link-chevron"></i>
                </Link>
              </li>
            </ul>

            {/* Language Switcher Segmented Bar */}
            <div className="mobile-nav-drawer__lang-bar">
              <button
                type="button"
                onClick={() => setLang("fr")}
                className={`mobile-nav-drawer__lang-tab ${lang === "fr" ? "is-active" : ""}`}
              >
                <span>Français</span>
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`mobile-nav-drawer__lang-tab ${lang === "en" ? "is-active" : ""}`}
              >
                <span>English</span>
              </button>
            </div>

            {/* Bottom 6 Circular All-Black Icon Buttons Matching Reference Image 2 */}
            <div className="mobile-nav-drawer__icons-strip">
              {/* 1. WhatsApp */}
              <a
                href="https://wa.me/237691786447"
                target="_blank"
                rel="noreferrer"
                className="mobile-nav-drawer__circle-btn"
                title="WhatsApp (+237 691 78 64 47)"
                aria-label="WhatsApp"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
              </a>

              {/* Chat Privé 3M */}
              <button
                type="button"
                onClick={handleOpenChat}
                className="mobile-nav-drawer__circle-btn"
                style={{ position: "relative" }}
                title={lang === "fr" ? "Chat Privé 3M" : "3M Private Chat"}
                aria-label="Chat Privé 3M"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z"/>
                </svg>
                {chatUnread > 0 && <span className="navbar__chat-badge">{chatUnread}</span>}
              </button>

              {/* 2. Call 1 (+237 691 78 64 47) */}
              <a
                href="tel:+237691786447"
                className="mobile-nav-drawer__circle-btn"
                title="Appeler (+237 691 78 64 47)"
                aria-label="Téléphone +237 691 78 64 47"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1.01A11.36 11.36 0 0 1 8.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z"/>
                </svg>
              </a>

              {/* 3. Mobile Call 2 (+237 653 76 17 28) */}
              <a
                href="tel:+237653761728"
                className="mobile-nav-drawer__circle-btn"
                title="Appeler (+237 653 76 17 28)"
                aria-label="Téléphone +237 653 76 17 28"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                  <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                </svg>
              </a>

              {/* 4. Facebook */}
              <a
                href="https://www.facebook.com/share/1DtC9My4Be/?mibextid=wwXIfr"
                target="_blank"
                rel="noreferrer"
                className="mobile-nav-drawer__circle-btn"
                title="Page Facebook 3M SERVICES"
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* 5. TikTok */}
              <a
                href="https://vt.tiktok.com/ZSgXqMoHw/"
                target="_blank"
                rel="noreferrer"
                className="mobile-nav-drawer__circle-btn"
                title="TikTok 3M SERVICES"
                aria-label="TikTok"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>

              {/* 6. Email */}
              <a
                href="mailto:contact@3mservice.shop"
                className="mobile-nav-drawer__circle-btn"
                title="Email: contact@3mservice.shop"
                aria-label="Email"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>
            </div>
          </div>
        </aside>

        {/* Top Navbar Header (Desktop + Mobile Aligned) */}
        <div className="navbar">
          {/* Logo on Left */}
          <div className="navbar__left">
            <Link
              to="/"
              onClick={() => window.scrollTo(0, 0)}
              className="navbar__logo-link"
            >
              <img src={Logo} alt="3M SERVICES Logo" />
            </Link>
          </div>

          {/* Center Links (Desktop - Perfectly Centered on Page) */}
          <div className="navbar__center">
            <ul className="navbar__links">
              <li>
                <Link
                  className={`home-link ${location.pathname === "/" ? "active" : ""}`}
                  to="/"
                  style={location.pathname === "/" ? { color: "#E20713", fontWeight: 700 } : {}}
                >
                  {t("nav_home")}
                </Link>
              </li>
              <li>
                <Link
                  className={`about-link ${location.pathname === "/about" ? "active" : ""}`}
                  to="/about"
                  style={location.pathname === "/about" ? { color: "#E20713", fontWeight: 700 } : {}}
                >
                  {t("nav_about")}
                </Link>
              </li>
              <li>
                <Link
                  className={`models-link ${location.pathname === "/models" ? "active" : ""}`}
                  to="/models"
                  style={location.pathname === "/models" ? { color: "#E20713", fontWeight: 700 } : {}}
                >
                  {t("nav_models")}
                </Link>
              </li>
              <li>
                <Link
                  className={`testi-link ${location.pathname === "/apartments" ? "active" : ""}`}
                  to="/apartments"
                  title="Consulter nos appartements meublés de standing à Tsinga, Yaoundé"
                  style={location.pathname === "/apartments" ? { color: "#E20713", fontWeight: 700 } : {}}
                >
                  {t("nav_apartments")}
                </Link>
              </li>
              <li>
                <Link
                  className={`team-link ${location.pathname === "/team" ? "active" : ""}`}
                  to="/team"
                  style={location.pathname === "/team" ? { color: "#E20713", fontWeight: 700 } : {}}
                >
                  {t("nav_team")}
                </Link>
              </li>
              <li>
                <Link
                  className={`contact-link ${location.pathname === "/contact" ? "active" : ""}`}
                  to="/contact"
                  style={location.pathname === "/contact" ? { color: "#E20713", fontWeight: 700 } : {}}
                >
                  {t("nav_contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Right Action Cluster (Language Switch + WhatsApp + Mobile Hamb) */}
          <div className="navbar__right" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Minimalist Text-Only Language Switcher (FR / EN) - No round border, No flag */}
            <div className="navbar-lang-switch" role="group" aria-label="Sélecteur de langue">
              <button
                type="button"
                onClick={() => setLang("fr")}
                className={`navbar-lang-text-btn ${lang === "fr" ? "is-active" : ""}`}
                title="Passer en Français"
                aria-label="Français"
              >
                FR
              </button>
              <span className="navbar-lang-divider">/</span>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`navbar-lang-text-btn ${lang === "en" ? "is-active" : ""}`}
                title="Switch to English"
                aria-label="English"
              >
                EN
              </button>
            </div>

            {/* Direct WhatsApp Icon Button */}
            <a
              className="navbar__icon-btn navbar__icon-btn--whatsapp"
              href="https://wa.me/237691786447"
              target="_blank"
              rel="noreferrer"
              title="WhatsApp 24/7 (+237 691 78 64 47)"
              aria-label="Contacter sur WhatsApp 24/7"
            >
              <i className="fa-brands fa-whatsapp"></i>
            </a>

            {/* Direct In-App Private Chat Icon Button (next to WhatsApp) */}
            <button
              type="button"
              className="navbar__icon-btn navbar__icon-btn--chat"
              onClick={handleOpenChat}
              title={lang === "fr" ? "Chat Privé 3M — Conciergerie en ligne" : "3M Private Chat — Live Concierge"}
              aria-label="Chat Privé 3M"
            >
              <i className="fa-regular fa-comment-dots"></i>
              {chatUnread > 0 && <span className="navbar__chat-badge">{chatUnread}</span>}
            </button>

            {/* Client Notification Bell & Dropdown */}
            <div className="navbar__notif-wrap" ref={notifMenuRef}>
              <button
                type="button"
                className="navbar__icon-btn navbar__icon-btn--notif"
                onClick={() => {
                  setAccountMenuOpen(false);
                  setNotifMenuOpen((prev) => !prev);
                }}
                title={lang === "fr" ? "Notifications Conciergerie" : "Concierge Notifications"}
                aria-label="Notifications"
                aria-expanded={notifMenuOpen}
              >
                <i className={notifUnread > 0 ? "fa-solid fa-bell" : "fa-regular fa-bell"}></i>
                {notifUnread > 0 && <span className="navbar__chat-badge">{notifUnread}</span>}
              </button>

              {notifMenuOpen && (
                <div className="navbar__notif-menu" role="menu" aria-label="Centre de notifications">
                  <div className="navbar__notif-head">
                    <strong>{lang === "fr" ? "Notifications" : "Notifications"}</strong>
                    {notifUnread > 0 && (
                      <button
                        type="button"
                        className="navbar__notif-readall"
                        onClick={() => handleMarkNotifsRead(null)}
                      >
                        {lang === "fr" ? "Tout marquer comme lu" : "Mark all read"}
                      </button>
                    )}
                  </div>
                  <div className="navbar__notif-list">
                    {clientNotifs.length === 0 ? (
                      <div className="navbar__notif-empty">
                        <i className="fa-regular fa-bell-slash"></i>
                        <p>{lang === "fr" ? "Aucune notification pour le moment." : "No notifications yet."}</p>
                      </div>
                    ) : (
                      clientNotifs.slice(0, 12).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          className={`navbar__notif-item ${!n.read ? "is-unread" : ""}`}
                          onClick={() => {
                            if (!n.read) handleMarkNotifsRead(n.id);
                            setNotifMenuOpen(false);
                            window.dispatchEvent(new CustomEvent("3m-open-chat"));
                          }}
                        >
                          <span className="navbar__notif-icon">
                            <i className={n.type === "invoice" ? "fa-solid fa-file-invoice" : "fa-solid fa-comment-dots"}></i>
                          </span>
                          <span className="navbar__notif-body">
                            <strong>{n.title}</strong>
                            <span className="navbar__notif-msg">{n.message}</span>
                            <span className="navbar__notif-time">{formatNotifAgo(n.createdAt)}</span>
                          </span>
                          {!n.read && <span className="navbar__notif-dot" aria-label="Non lu"></span>}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Account ("Bonhomme") Icon Button + Dropdown Menu */}
            <div className="navbar__account-wrap" ref={accountMenuRef}>
              <button
                type="button"
                className="navbar__icon-btn navbar__icon-btn--account"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                title={lang === "fr" ? "Mon Compte Client 3M" : "My 3M Client Account"}
                aria-label="Mon compte"
                aria-expanded={accountMenuOpen}
              >
                <i className={currentClient ? "fa-solid fa-user" : "fa-regular fa-user"}></i>
                {currentClient && <span className="navbar__account-dot" aria-hidden="true"></span>}
              </button>

              {accountMenuOpen && (
                <div className="navbar__account-menu" role="menu" aria-label="Menu compte client">
                  <div className="navbar__account-header">
                    <div className="navbar__account-name">
                      {currentClient?.name || (lang === "fr" ? "Mon Compte 3M" : "My 3M Account")}
                    </div>
                    <div className="navbar__account-email">
                      {currentClient?.email ||
                        currentClient?.phone ||
                        (lang === "fr" ? "Accès Espace Client VIP" : "VIP Client Portal")}
                    </div>
                  </div>

                  <div className="navbar__account-divider"></div>

                  <div className="navbar__account-items">
                    <button
                      type="button"
                      role="menuitem"
                      className="navbar__account-item"
                      onClick={() => handleAccountNavigate("/account/dashboard")}
                    >
                      <i className="fa-solid fa-house"></i>
                      <span>{lang === "fr" ? "Tableau de bord" : "Dashboard"}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="navbar__account-item"
                      onClick={() => handleAccountNavigate("/account/profile")}
                    >
                      <i className="fa-solid fa-user"></i>
                      <span>{lang === "fr" ? "Mon Profil" : "My Profile"}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="navbar__account-item"
                      onClick={() => handleAccountNavigate("/account/orders")}
                    >
                      <i className="fa-regular fa-calendar-days"></i>
                      <span>{lang === "fr" ? "Mes Réservations" : "My Orders"}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="navbar__account-item"
                      onClick={() => handleAccountNavigate("/account/favorites")}
                    >
                      <i className="fa-solid fa-car"></i>
                      <span>{lang === "fr" ? "Mes Véhicules Favoris" : "My Favorite Cars"}</span>
                    </button>

                    {currentClient ? (
                      <button
                        type="button"
                        role="menuitem"
                        className="navbar__account-item"
                        onClick={handleSignOut}
                      >
                        <i className="fa-solid fa-right-from-bracket"></i>
                        <span>{lang === "fr" ? "Déconnexion" : "Sign Out"}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        role="menuitem"
                        className="navbar__account-item"
                        onClick={() => handleAccountNavigate("/account/signin")}
                      >
                        <i className="fa-solid fa-right-to-bracket"></i>
                        <span>{lang === "fr" ? "Se connecter" : "Sign In"}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hamburger Menu Button (Mobile & Tablet) */}
            <button
              type="button"
              className="navbar__hamb-btn"
              onClick={() => setNav(true)}
              aria-label="Ouvrir le menu"
              title="Menu"
            >
              <span className="navbar__hamb-icon" aria-hidden="true">
                <span className="navbar__hamb-bar"></span>
                <span className="navbar__hamb-bar"></span>
                <span className="navbar__hamb-bar"></span>
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
