import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Footer from "../components/Footer";
import { useTranslation } from "../context/LanguageContext";
import { CARS_CATALOGUE } from "../data/carsCatalogue";
import { API_BASE } from "../config/api";
import { googleLogin } from "../firebase";
import {
  getCurrentClient,
  setCurrentClient,
  authenticateClient,
  registerClientAccount,
  updateClientProfile,
  getClientOrders,
  cancelClientOrder,
  getFavoriteCarIds,
  toggleFavoriteCar
} from "../utils/customerAccounts";
import "../styles/AccountPage.css";
import "../styles/AuthPage.css";
import ExperienceRatingCard from "../components/ExperienceRatingCard";

const VALID_TABS = ["dashboard", "profile", "orders", "favorites", "signin"];

function getInitials(name = "Client 3M") {
  const parts = String(name || "C").trim().split(/\s+/);
  return ((parts[0]?.[0] || "C") + (parts[1]?.[0] || "")).toUpperCase();
}

function getOrderStatusKind(status = "") {
  const s = String(status).toLowerCase();
  if (s.includes("termin") || s.includes("complet")) return "completed";
  if (s.includes("annul") || s.includes("rejet") || s.includes("cancel")) return "cancelled";
  return "scheduled";
}

function formatStatusLabel(kind, rawStatus, isFr) {
  if (kind === "completed") return isFr ? "Terminée" : "completed";
  if (kind === "cancelled") return isFr ? "Annulée" : "cancelled";
  if (kind === "scheduled") return isFr ? "Programmée" : "scheduled";
  return rawStatus || (isFr ? "Programmée" : "scheduled");
}

function AccountPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { lang, setLang } = useTranslation();
  const isFr = lang === "fr";

  const activeTab =
    tab === "signin" ? "dashboard" : VALID_TABS.includes(tab) ? tab : "dashboard";

  const [client, setClient] = useState(() => getCurrentClient());
  const [orders, setOrders] = useState(() =>
    getCurrentClient() ? getClientOrders(getCurrentClient()) : []
  );
  const [favoriteIds, setFavoriteIds] = useState(() => getFavoriteCarIds(getCurrentClient()));
  const [cars, setCars] = useState(CARS_CATALOGUE);

  // Auth forms state (Sign In & Create Account)
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regCity, setRegCity] = useState("Yaoundé");
  const [authError, setAuthError] = useState("");

  // Dashboard / Profile UI state
  const [profileSubTab, setProfileSubTab] = useState("profile"); // profile | notifications

  // Profile edit state (matching Screenshot 1: Username, Email, New Password, Re-enter Password, Language, Hour Format)
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [editLanguage, setEditLanguage] = useState(lang || "fr");
  const [editHourFormat, setEditHourFormat] = useState("24-hour");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("Yaoundé");
  const [editAvatar, setEditAvatar] = useState("");
  const [profileSavedMsg, setProfileSavedMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    bookingUpdates: true,
    promoOffers: true,
    chatMessages: true,
    smsWhatsapp: true
  });
  const [notifSavedMsg, setNotifSavedMsg] = useState("");

  // Load live fleet list with static fallback
  useEffect(() => {
    fetch(`${API_BASE}/cars`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCars(data);
      })
      .catch(() => {});
  }, []);

  // Sync profile inputs & orders when client changes
  useEffect(() => {
    if (client) {
      setOrders(getClientOrders(client));
      setFavoriteIds(getFavoriteCarIds(client));
      setEditUsername(client.username || client.name || "");
      setEditEmail(client.email || "");
      setEditPassword("");
      setEditConfirmPassword("");
      setEditLanguage(client.language || "system");
      setEditHourFormat(client.hourFormat || "24-hour");
      setEditPhone(client.phone || "");
      setEditCity(client.city || "Yaoundé");
      setEditAvatar(client.avatar || "");
      setNotifPrefs({
        bookingUpdates: client.notifications?.bookingUpdates ?? true,
        promoOffers: client.notifications?.promoOffers ?? true,
        chatMessages: client.notifications?.chatMessages ?? true,
        smsWhatsapp: client.notifications?.smsWhatsapp ?? true
      });
    } else {
      setOrders([]);
      setFavoriteIds(getFavoriteCarIds(null));
    }
  }, [client, lang]);

  // Listen for cross-component auth, CRM, and favorites updates
  useEffect(() => {
    const syncClient = (e) => {
      const next = e?.detail !== undefined ? e.detail : getCurrentClient();
      setClient(next);
    };
    const syncCrm = () => {
      const cur = getCurrentClient();
      if (cur) setOrders(getClientOrders(cur));
    };
    const syncFavs = () => {
      setFavoriteIds(getFavoriteCarIds(getCurrentClient()));
    };

    window.addEventListener("3m-client-auth-changed", syncClient);
    window.addEventListener("3m-crm-updated", syncCrm);
    window.addEventListener("3m-favorites-changed", syncFavs);
    return () => {
      window.removeEventListener("3m-client-auth-changed", syncClient);
      window.removeEventListener("3m-crm-updated", syncCrm);
      window.removeEventListener("3m-favorites-changed", syncFavs);
    };
  }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError("");
    if (!loginIdentifier.trim()) {
      setAuthError(
        isFr
          ? "Veuillez saisir votre nom d'utilisateur, email ou téléphone."
          : "Please enter your username, email, or phone number."
      );
      return;
    }

    const { client: found, error } = authenticateClient(loginIdentifier, loginPassword);
    if (error === "INVALID_PASSWORD") {
      setAuthError(isFr ? "Mot de passe incorrect." : "Incorrect password.");
      return;
    }
    if (!found) {
      setAuthError(
        isFr
          ? "Aucun compte trouvé avec ces coordonnées. Créez votre profil VIP ou utilisez l'accès démo."
          : "No account matched those details. Create a VIP profile or use Demo Access."
      );
      return;
    }

    if (found.language && setLang) {
      setLang(found.language);
    }
    setClient(found);
    setLoginIdentifier("");
    setLoginPassword("");
    navigate("/account/dashboard");
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setAuthError("");
    if (!regUsername.trim() || !regEmail.trim() || !regPhone.trim()) {
      setAuthError(
        isFr
          ? "Veuillez remplir le nom d'utilisateur, l'email et le téléphone."
          : "Please fill in username, email address, and phone number."
      );
      return;
    }
    if (regPassword.length < 6) {
      setAuthError(
        isFr
          ? "Le mot de passe doit contenir au moins 6 caractères."
          : "Password must be at least 6 characters long."
      );
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError(
        isFr
          ? "Les mots de passe ne correspondent pas."
          : "Passwords do not match."
      );
      return;
    }

    const created = registerClientAccount({
      name: regUsername,
      username: regUsername,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
      city: regCity,
      language: lang || "fr",
      hourFormat: "24-hour"
    });
    setClient(created);
    setRegUsername("");
    setRegEmail("");
    setRegPhone("");
    setRegPassword("");
    setRegConfirmPassword("");
    navigate("/account/dashboard");
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthError("");
    setGoogleLoading(true);
    try {
      const user = await googleLogin();
      const email = (user?.email || "").trim();
      const displayName = (user?.displayName || (email ? email.split("@")[0] : "Client VIP 3M")).trim();
      const phone = (user?.phoneNumber || "").trim();
      const avatar = user?.photoURL || "";

      let account = email ? authenticateClient(email, "") : null;
      if (!account) {
        account = registerClientAccount({
          name: displayName,
          username: displayName,
          email,
          phone,
          password: "",
          city: "Yaoundé",
          avatar,
          provider: "google",
          firebaseUid: user?.uid || "",
          language: "",
          hourFormat: "24-hour"
        });
      } else {
        const merged = {
          ...account,
          name: account.name || displayName,
          avatar: account.avatar || avatar,
          provider: account.provider || "google",
          firebaseUid: user?.uid || account.firebaseUid
        };
        setCurrentClient(merged);
        account = merged;
      }

      try {
        localStorage.setItem(
          "3m_guest_contact_info",
          JSON.stringify({ name: account.name || displayName, phone: account.phone || phone, email: account.email || email })
        );
      } catch (_) {}

      setClient(account);
      navigate("/account/dashboard");
    } catch (error) {
      if (error?.code !== "auth/popup-closed-by-user" && error?.code !== "auth/cancelled-popup-request") {
        setAuthError(
          isFr
            ? `Connexion Google impossible : ${error?.message || "réessayez."}`
            : `Google sign-in failed: ${error?.message || "please try again."}`
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignOut = () => {
    setCurrentClient(null);
    setClient(null);
    navigate("/account/signin");
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileErrorMsg("");
    setProfileSavedMsg("");

    if (editPassword || editConfirmPassword) {
      if (editPassword.length < 6) {
        setProfileErrorMsg(
          isFr
            ? "Le nouveau mot de passe doit contenir au moins 6 caractères."
            : "New password must be at least 6 characters."
        );
        return;
      }
      if (editPassword !== editConfirmPassword) {
        setProfileErrorMsg(
          isFr
            ? "Les deux mots de passe ne correspondent pas."
            : "The entered passwords do not match."
        );
        return;
      }
    }

    const updated = updateClientProfile({
      name: editUsername.trim() || client.name,
      username: editUsername.trim() || client.username || client.name,
      email: editEmail.trim(),
      phone: editPhone.trim(),
      city: editCity.trim(),
      avatar: editAvatar,
      language: editLanguage === "system" ? "" : editLanguage,
      hourFormat: editHourFormat,
      ...(editPassword ? { password: editPassword } : {})
    });

    if (updated) {
      if (editLanguage && setLang) {
        setLang(editLanguage);
      }
      setClient(updated);
      setEditPassword("");
      setEditConfirmPassword("");
      setProfileSavedMsg(
        isFr ? "Profil mis à jour avec succès !" : "Profile updated successfully!"
      );
      setTimeout(() => setProfileSavedMsg(""), 3500);
    }
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    const updated = updateClientProfile({ notifications: notifPrefs });
    if (updated) {
      setClient(updated);
      setNotifSavedMsg(
        isFr
          ? "Préférences de notification enregistrées !"
          : "Notification preferences saved!"
      );
      setTimeout(() => setNotifSavedMsg(""), 3500);
    }
  };

  const handleCancelOrder = (orderId) => {
    cancelClientOrder(orderId);
    setOrders(getClientOrders(client));
  };

  const handleChatAboutOrder = (order) => {
    window.dispatchEvent(
      new CustomEvent("3m-open-chat", {
        detail: {
          name: client?.name,
          phone: client?.phone,
          prefillText: isFr
            ? `Bonjour 3M SERVICES, concernant ma réservation #${order.id} (${order.carName}) : `
            : `Hello 3M SERVICES, regarding my order #${order.id} (${order.carName}): `
        }
      })
    );
  };


  const scheduledOrders = useMemo(
    () => orders.filter((o) => getOrderStatusKind(o.status) === "scheduled"),
    [orders]
  );
  const completedOrders = useMemo(
    () => orders.filter((o) => getOrderStatusKind(o.status) === "completed"),
    [orders]
  );
  const cancelledOrders = useMemo(
    () => orders.filter((o) => getOrderStatusKind(o.status) === "cancelled"),
    [orders]
  );

  const kpis = useMemo(
    () => ({
      upcoming: scheduledOrders.length,
      total: orders.length,
      cancelled: cancelledOrders.length
    }),
    [scheduledOrders.length, orders.length, cancelledOrders.length]
  );

  const favoriteCars = useMemo(() => {
    return favoriteIds
      .map((fid) =>
        cars.find(
          (c) =>
            String(c.id) === String(fid) ||
            (c.name && c.name.toLowerCase() === String(fid).toLowerCase())
        )
      )
      .filter(Boolean);
  }, [favoriteIds, cars]);

  const fmtCount = (n) => String(n).padStart(2, "0");

  // AAAA-MM-JJ → JJ/MM/AAAA
  const fmtDate = (v) => {
    const m = String(v || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : v || "—";
  };
  const daysBetween = (a, b) => {
    const d1 = new Date(a), d2 = new Date(b);
    if (isNaN(d1) || isNaN(d2)) return 0;
    return Math.max(0, Math.round((d2 - d1) / 86400000));
  };

  // Liste de réservations en cartes (remplace les tableaux, lisible sur mobile)
  const renderOrderCards = (list, { allowCancel = false, allowRebook = false, showActions = true } = {}) => (
    <ul className="account-order-list">
      {list.map((ord) => {
        const kind = getOrderStatusKind(ord.status);
        const pick = ord.pickUp || "Yaoundé Omnisports";
        const drop = ord.dropOff || pick;
        const start = ord.pickTime;
        const end = ord.dropTime || ord.pickTime;
        const days = daysBetween(start, end);
        return (
          <li key={ord.id} className={`account-order-card is-${kind}`}>
            <div className="account-order-card__top">
              <span className="account-order-id-pill">#{ord.id}</span>
              <span className={`account-status-pill is-${kind}`}>{formatStatusLabel(kind, ord.status, isFr)}</span>
            </div>
            <h4 className="account-order-card__car">{ord.carName}</h4>
            <div className="account-order-card__route">
              <span><i className="fa-solid fa-location-dot"></i> {pick}</span>
              {drop !== pick && (
                <>
                  <i className="fa-solid fa-arrow-right account-order-card__arrow" aria-hidden="true"></i>
                  <span><i className="fa-solid fa-flag-checkered"></i> {drop}</span>
                </>
              )}
            </div>
            <div className="account-order-card__dates">
              <i className="fa-regular fa-calendar"></i>
              <span>{fmtDate(start)}</span>
              {end && end !== start && (<><span aria-hidden="true">→</span><span>{fmtDate(end)}</span></>)}
              {days > 0 && <span className="account-order-card__days">{days} {isFr ? (days > 1 ? "jours" : "jour") : days > 1 ? "days" : "day"}</span>}
            </div>
            {showActions && (
              <div className="account-order-card__actions">
                <button type="button" className="account-mini-btn" onClick={() => handleChatAboutOrder(ord)}>
                  <i className="fa-regular fa-comment-dots"></i> {isFr ? "Discuter" : "Chat"}
                </button>
                {allowCancel && (
                  <button type="button" className="account-mini-btn is-danger" onClick={() => handleCancelOrder(ord.id)}>
                    {isFr ? "Annuler" : "Cancel"}
                  </button>
                )}
                {allowRebook && (
                  <Link to="/models" className="account-mini-btn is-primary">
                    <i className="fa-solid fa-rotate-right"></i> {isFr ? "Réserver à nouveau" : "Book again"}
                  </Link>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const renderOrdersTableSection = (title, list, kindLabel, allowCancel = false, allowRebook = false) => (
    <section className="account-panel-card">
      <div className="account-panel-header">
        <h3 className="account-panel-title">
          {title} ({list.length})
        </h3>
      </div>

      {list.length === 0 ? (
        <div className="account-empty-box" style={{ padding: "2.2rem 1rem" }}>
          {isFr
            ? `Aucune réservation dans « ${title} ».`
            : `No orders in ${title}.`}
        </div>
      ) : (
        renderOrderCards(list, { allowCancel, allowRebook })
      )}
    </section>
  );

  return (
    <>
      <div className="account-page">
        <div className="account-container">
          {!client ? (
            <div className="auth3m">
              <aside className="auth3m-visual" style={{ backgroundImage: "url(/images/cars/toyota-landcruiser-v8-black.webp)" }}>
                <span className="auth3m-tag">
                  <i className="fa-solid fa-crown"></i> {isFr ? "Espace client" : "Client area"}
                </span>
                <div>
                  <h2>{isFr ? "Vos réservations, au même endroit" : "All your bookings in one place"}</h2>
                  <ul>
                    <li><i className="fa-solid fa-calendar-check"></i> {isFr ? "Suivez vos réservations" : "Track your bookings"}</li>
                    <li><i className="fa-solid fa-heart"></i> {isFr ? "Retrouvez vos véhicules favoris" : "Keep your favourite cars"}</li>
                    <li><i className="fa-solid fa-headset"></i> {isFr ? "Conciergerie 24/7" : "24/7 concierge"} · +237 691 78 64 47</li>
                  </ul>
                </div>
              </aside>
              <div className="account-auth-shell">
              <h1 className="account-auth-title">
                {authMode === "login"
                  ? isFr
                    ? "Connexion Client"
                    : "Sign In"
                  : isFr
                  ? "Créer un compte VIP"
                  : "Create VIP Account"}
              </h1>
              <p className="account-auth-sub">
                {isFr
                  ? "Connectez-vous pour gérer votre profil, suivre vos réservations programmées, terminées ou annulées et retrouver vos véhicules favoris."
                  : "Sign in to manage your profile, track scheduled, completed, and cancelled orders, and access your favorite vehicles."}
              </p>

              <div className="account-auth-tabs">
                <button
                  type="button"
                  className={`account-auth-tab ${authMode === "login" ? "is-active" : ""}`}
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                  }}
                >
                  {isFr ? "Se connecter" : "Sign In"}
                </button>
                <button
                  type="button"
                  className={`account-auth-tab ${authMode === "register" ? "is-active" : ""}`}
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError("");
                  }}
                >
                  {isFr ? "Créer un compte" : "Sign Up"}
                </button>
              </div>

              {authError && <div className="account-alert-error">{authError}</div>}

              {authMode === "login" ? (
                <form onSubmit={handleLoginSubmit}>
                  <div className="account-form-group">
                    <label className="account-form-label">
                      {isFr
                        ? "Nom d'utilisateur, Email ou Téléphone *"
                        : "Username, Email or Phone *"}
                    </label>
                    <input
                      type="text"
                      className="account-form-input"
                      placeholder="Ex: arnaud.mbarga@gmail.com ou +237 698 66 87 61"
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      required
                    />
                  </div>
                  <div className="account-form-group">
                    <label className="account-form-label">
                      {isFr ? "Mot de passe" : "Password"}
                    </label>
                    <div className="account-password-wrap">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        className="account-form-input"
                        placeholder="*********"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="account-password-toggle"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        <i
                          className={
                            showLoginPassword ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"
                          }
                        ></i>
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="account-btn-primary">
                    <i className="fa-solid fa-right-to-bracket"></i>
                    <span>{isFr ? "Se connecter" : "Sign In"}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit}>
                  <div className="account-form-group">
                    <label className="account-form-label">
                      {isFr ? "Nom d'utilisateur / Nom complet *" : "Username / Full Name *"}
                    </label>
                    <input
                      type="text"
                      className="account-form-input"
                      placeholder="Ex: Monica Lucas"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="account-form-group">
                    <label className="account-form-label">
                      {isFr ? "Adresse Email *" : "Email Address *"}
                    </label>
                    <input
                      type="email"
                      className="account-form-input"
                      placeholder="monica@exemple.com"
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="account-form-group">
                    <label className="account-form-label">
                      {isFr ? "Téléphone / WhatsApp *" : "Phone / WhatsApp *"}
                    </label>
                    <input
                      type="tel"
                      className="account-form-input"
                      placeholder="+237 6XX XX XX XX"
                      autoComplete="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="account-profile-grid">
                    <div className="account-form-group">
                      <label className="account-form-label">
                        {isFr ? "Mot de passe *" : "Password *"}
                      </label>
                      <input
                        type="password"
                        className="account-form-input"
                        placeholder="*********"
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="account-form-group">
                      <label className="account-form-label">
                        {isFr ? "Confirmer *" : "Re-enter Password *"}
                      </label>
                      <input
                        type="password"
                        className="account-form-input"
                        placeholder="*********"
                        autoComplete="new-password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="account-form-group">
                    <label className="account-form-label">{isFr ? "Ville" : "City"}</label>
                    <input
                      type="text"
                      className="account-form-input"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="account-btn-primary">
                    <i className="fa-solid fa-user-plus"></i>
                    <span>{isFr ? "Créer mon compte VIP" : "Create VIP Account"}</span>
                  </button>
                </form>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.6rem 0 1.2rem" }}>
                <span style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></span>
                <span style={{ fontSize: "1.25rem", color: "#64748b", fontWeight: 600 }}>
                  {isFr ? "ou" : "or"}
                </span>
                <span style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                style={{
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1rem",
                  padding: "1.2rem 1.6rem",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  cursor: googleLoading ? "wait" : "pointer",
                  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.06)",
                  transition: "background-color 0.15s ease"
                }}
              >
                <img src="/google.svg" alt="Google" width="20" height="20" />
                <span>
                  {googleLoading
                    ? (isFr ? "Connexion Google..." : "Signing in with Google...")
                    : (isFr ? "Continuer avec Google" : "Continue with Google")}
                </span>
              </button>
            </div>
            </div>
          ) : (
            <div className="account-layout">
              {/* Left Sidebar Card */}
              <aside className="account-sidebar-card">
                <div className="account-profile-summary">
                  <div className="account-avatar-ring">
                    {client.avatar ? (
                      <img
                        src={client.avatar}
                        alt={client.name}
                        className="account-avatar-img"
                      />
                    ) : (
                      <div className="account-avatar-initials">
                        {getInitials(client.username || client.name)}
                      </div>
                    )}
                  </div>
                  <h2 className="account-sidebar-name">
                    {client.username || client.name || "Client 3M"}
                  </h2>
                  <p className="account-sidebar-email">
                    {client.email || client.phone || client.accountNumber}
                  </p>
                </div>

                <nav className="account-sidebar-nav" aria-label="Menu compte">
                  <button
                    type="button"
                    className={`account-nav-btn ${activeTab === "dashboard" ? "is-active" : ""}`}
                    onClick={() => navigate("/account/dashboard")}
                  >
                    <i className="fa-solid fa-house"></i>
                    <span>{isFr ? "Tableau de bord" : "Dashboard"}</span>
                  </button>

                  <button
                    type="button"
                    className={`account-nav-btn ${activeTab === "profile" ? "is-active" : ""}`}
                    onClick={() => navigate("/account/profile")}
                  >
                    <i className="fa-solid fa-user"></i>
                    <span>{isFr ? "Mon Profil" : "My Profile"}</span>
                  </button>

                  <button
                    type="button"
                    className={`account-nav-btn ${activeTab === "orders" ? "is-active" : ""}`}
                    onClick={() => navigate("/account/orders")}
                  >
                    <i className="fa-regular fa-calendar-days"></i>
                    <span>{isFr ? "Mes Réservations" : "My Orders"}</span>
                  </button>

                  <button
                    type="button"
                    className={`account-nav-btn ${activeTab === "favorites" ? "is-active" : ""}`}
                    onClick={() => navigate("/account/favorites")}
                  >
                    <i className="fa-solid fa-car"></i>
                    <span>{isFr ? "Mes Véhicules Favoris" : "My Favorite Cars"}</span>
                  </button>

                  <button
                    type="button"
                    className="account-nav-btn"
                    onClick={handleSignOut}
                  >
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <span>{isFr ? "Déconnexion" : "Sign Out"}</span>
                  </button>
                </nav>
              </aside>

              {/* Right Main Content */}
              <main className="account-main">
                {activeTab === "dashboard" && (
                  <>
                    {/* Indicateurs */}
                    <div className="account-kpi-grid">
                      <div
                        className="account-kpi-card is-clickable"
                        onClick={() => navigate("/account/orders")}
                        role="button"
                        tabIndex={0}
                      >
                        <i className="fa-regular fa-calendar-check account-kpi-icon"></i>
                        <div className="account-kpi-value">{fmtCount(kpis.upcoming)}</div>
                        <div className="account-kpi-label">
                          {isFr ? "Réservations à venir" : "Upcoming Orders"}
                        </div>
                      </div>

                      <div
                        className="account-kpi-card is-clickable"
                        onClick={() => navigate("/account/orders")}
                        role="button"
                        tabIndex={0}
                      >
                        <i className="fa-regular fa-calendar-days account-kpi-icon"></i>
                        <div className="account-kpi-value">{fmtCount(kpis.total)}</div>
                        <div className="account-kpi-label">
                          {isFr ? "Total Réservations" : "Total Orders"}
                        </div>
                      </div>

                      <div
                        className="account-kpi-card is-clickable"
                        onClick={() => navigate("/account/orders")}
                        role="button"
                        tabIndex={0}
                      >
                        <i className="fa-regular fa-calendar-xmark account-kpi-icon"></i>
                        <div className="account-kpi-value">{fmtCount(kpis.cancelled)}</div>
                        <div className="account-kpi-label">
                          {isFr ? "Annulées" : "Cancel Orders"}
                        </div>
                      </div>
                    </div>

                    {/* My Recent Orders Table */}
                    <section className="account-panel-card">
                      <div className="account-panel-header">
                        <h3 className="account-panel-title">
                          {isFr ? "Mes Réservations Récentes" : "My Recent Orders"}
                        </h3>
                        <button
                          type="button"
                          className="account-link-btn"
                          onClick={() => navigate("/account/orders")}
                        >
                          {isFr ? "Voir tout" : "View all"} &rarr;
                        </button>
                      </div>

                      {orders.length === 0 ? (
                        <div className="account-empty-box">
                          <p>
                            {isFr
                              ? "Vous n'avez pas encore de réservation enregistrée."
                              : "You don't have any bookings recorded yet."}
                          </p>
                          <Link
                            to="/models"
                            className="account-fav-btn is-primary"
                            style={{ display: "inline-flex", marginTop: "1rem" }}
                          >
                            {isFr ? "Découvrir la flotte VIP" : "Browse VIP Fleet"}
                          </Link>
                        </div>
                      ) : (
                        renderOrderCards(orders.slice(0, 4), { showActions: false })
                      )}
                    </section>

                    <ExperienceRatingCard client={client} isFr={isFr} />
                  </>
                )}

                {activeTab === "profile" && (
                  <section className="account-panel-card">
                    {/* Profile | Notifications subtabs matching Screenshot 1 */}
                    <div className="account-subtabs" role="tablist">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={profileSubTab === "profile"}
                        className={`account-subtab-btn ${profileSubTab === "profile" ? "is-active" : ""}`}
                        onClick={() => setProfileSubTab("profile")}
                      >
                        {isFr ? "Profil" : "Profile"}
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={profileSubTab === "notifications"}
                        className={`account-subtab-btn ${profileSubTab === "notifications" ? "is-active" : ""}`}
                        onClick={() => setProfileSubTab("notifications")}
                      >
                        {isFr ? "Notifications" : "Notifications"}
                      </button>
                    </div>

                    {profileSubTab === "profile" ? (
                      <form onSubmit={handleSaveProfile}>
                        {profileErrorMsg && (
                          <div className="account-alert-error">{profileErrorMsg}</div>
                        )}
                        {profileSavedMsg && (
                          <div className="account-alert-success">{profileSavedMsg}</div>
                        )}

                        <div className="account-avatar-upload-row">
                          <div
                            className="account-avatar-ring"
                            style={{ width: "7.6rem", height: "7.6rem", marginBottom: 0 }}
                          >
                            {editAvatar ? (
                              <img src={editAvatar} alt={editUsername} className="account-avatar-img" />
                            ) : (
                              <div className="account-avatar-initials" style={{ fontSize: "2.2rem" }}>
                                {getInitials(editUsername || client.name)}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="account-upload-label">
                              <i className="fa-solid fa-camera"></i>
                              <span>
                                {isFr ? "Changer la photo de profil" : "Upload profile photo"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                style={{ display: "none" }}
                              />
                            </label>
                            <div style={{ fontSize: "1.2rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                              {client.accountNumber || client.id} &bull; {client.tier || "Bronze VIP"}
                            </div>
                          </div>
                        </div>

                        <div className="account-profile-grid">
                          <div className="account-form-group">
                            <label className="account-form-label">
                              {isFr ? "Nom d'utilisateur" : "Username"}
                            </label>
                            <input
                              type="text"
                              className="account-form-input"
                              placeholder="Enter username"
                              value={editUsername}
                              onChange={(e) => setEditUsername(e.target.value)}
                              required
                            />
                          </div>

                          <div className="account-form-group">
                            <label className="account-form-label">
                              {isFr ? "Adresse Email" : "Email Address"}
                            </label>
                            <input
                              type="email"
                              className="account-form-input"
                              placeholder="Enter email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                            />
                          </div>

                          <div className="account-form-group">
                            <label className="account-form-label">
                              {isFr ? "Nouveau mot de passe" : "New Password"}
                            </label>
                            <input
                              type="password"
                              className="account-form-input"
                              placeholder="*********"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                            />
                          </div>

                          <div className="account-form-group">
                            <label className="account-form-label">
                              {isFr ? "Confirmer le mot de passe" : "Re-enter Password"}
                            </label>
                            <input
                              type="password"
                              className="account-form-input"
                              placeholder="*********"
                              value={editConfirmPassword}
                              onChange={(e) => setEditConfirmPassword(e.target.value)}
                            />
                          </div>

                          <div className="account-form-group">
                            <label className="account-form-label">
                              {isFr ? "Langue" : "Language"}
                            </label>
                            <p className="account-field-hint">
                              {isFr
                                ? "Sélectionnez votre langue préférée."
                                : "Select your preferred language."}
                            </p>
                            <select
                              className="account-form-input"
                              value={editLanguage}
                              onChange={(e) => {
                                const nextVal = e.target.value;
                                setEditLanguage(nextVal);
                                if (setLang) setLang(nextVal);
                                if (client) {
                                  const synced = updateClientProfile({
                                    language: nextVal === "system" ? "" : nextVal
                                  });
                                  if (synced) setClient(synced);
                                }
                              }}
                            >
                              <option value="system">
                                {isFr ? "Langue du système (par défaut)" : "System language (default)"}
                              </option>
                              <option value="en">English</option>
                              <option value="fr">Français</option>
                            </select>
                          </div>

                          <div className="account-form-group">
                            <label className="account-form-label">
                              {isFr ? "Format d'heure" : "Hour Format"}
                            </label>
                            <p className="account-field-hint">
                              {isFr
                                ? "Sélectionnez votre format horaire préféré."
                                : "Select your preferred hour format."}
                            </p>
                            <select
                              className="account-form-input"
                              value={editHourFormat}
                              onChange={(e) => setEditHourFormat(e.target.value)}
                            >
                              <option value="24-hour">24-hour</option>
                              <option value="12-hour">12-hour</option>
                            </select>
                          </div>

                          <div className="account-form-group">
                            <label className="account-form-label">
                              {isFr ? "Téléphone / WhatsApp" : "Phone / WhatsApp"}
                            </label>
                            <input
                              type="text"
                              className="account-form-input"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                            />
                          </div>

                          <div className="account-form-group">
                            <label className="account-form-label">
                              {isFr ? "Ville" : "City"}
                            </label>
                            <input
                              type="text"
                              className="account-form-input"
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ marginTop: "0.8rem" }}>
                          <button type="submit" className="account-btn-primary account-update-btn">
                            <span>{isFr ? "Mettre à jour le profil" : "Update profile"}</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleSaveNotifications}>
                        {notifSavedMsg && (
                          <div className="account-alert-success">{notifSavedMsg}</div>
                        )}
                        <div className="account-notif-list">
                          <div className="account-notif-row">
                            <div>
                              <h4 className="account-notif-title">
                                {isFr ? "Mises à jour des réservations" : "Booking Status Updates"}
                              </h4>
                              <p className="account-notif-desc">
                                {isFr
                                  ? "Recevez une alerte lorsque votre véhicule et chauffeur sont confirmés."
                                  : "Get notified when your vehicle and chauffeur assignment are confirmed."}
                              </p>
                            </div>
                            <label className="account-toggle-switch">
                              <input
                                type="checkbox"
                                checked={notifPrefs.bookingUpdates}
                                onChange={(e) =>
                                  setNotifPrefs((p) => ({ ...p, bookingUpdates: e.target.checked }))
                                }
                              />
                              <span className="account-toggle-slider"></span>
                            </label>
                          </div>

                          <div className="account-notif-row">
                            <div>
                              <h4 className="account-notif-title">
                                {isFr ? "Offres promotionnelles" : "Promo deals"}
                              </h4>
                              <p className="account-notif-desc">
                                {isFr
                                  ? "Profitez en avant-première des tarifs promotionnels sur la flotte 3M."
                                  : "Receive early access to promotional rates across the 3M VIP fleet."}
                              </p>
                            </div>
                            <label className="account-toggle-switch">
                              <input
                                type="checkbox"
                                checked={notifPrefs.promoOffers}
                                onChange={(e) =>
                                  setNotifPrefs((p) => ({ ...p, promoOffers: e.target.checked }))
                                }
                              />
                              <span className="account-toggle-slider"></span>
                            </label>
                          </div>

                          <div className="account-notif-row">
                            <div>
                              <h4 className="account-notif-title">
                                {isFr ? "Messages Conciergerie Privée" : "Private Concierge Chat Alerts"}
                              </h4>
                              <p className="account-notif-desc">
                                {isFr
                                  ? "Notifications en temps réel pour les réponses dans le Chat Privé 3M."
                                  : "Real-time notifications for concierge replies inside 3M Private Chat."}
                              </p>
                            </div>
                            <label className="account-toggle-switch">
                              <input
                                type="checkbox"
                                checked={notifPrefs.chatMessages}
                                onChange={(e) =>
                                  setNotifPrefs((p) => ({ ...p, chatMessages: e.target.checked }))
                                }
                              />
                              <span className="account-toggle-slider"></span>
                            </label>
                          </div>

                          <div className="account-notif-row">
                            <div>
                              <h4 className="account-notif-title">
                                {isFr ? "Rappels WhatsApp / SMS" : "WhatsApp & SMS Reminders"}
                              </h4>
                              <p className="account-notif-desc">
                                {isFr
                                  ? "Rappels de prise en charge à l'Aéroport Nsimalen ou à l'agence Omnisports."
                                  : "Pickup reminders for Nsimalen Airport or Yaoundé Omnisports agency."}
                              </p>
                            </div>
                            <label className="account-toggle-switch">
                              <input
                                type="checkbox"
                                checked={notifPrefs.smsWhatsapp}
                                onChange={(e) =>
                                  setNotifPrefs((p) => ({ ...p, smsWhatsapp: e.target.checked }))
                                }
                              />
                              <span className="account-toggle-slider"></span>
                            </label>
                          </div>
                        </div>

                        <button type="submit" className="account-btn-primary account-update-btn">
                          <span>
                            {isFr ? "Enregistrer les préférences" : "Update notifications"}
                          </span>
                        </button>
                      </form>
                    )}
                  </section>
                )}

                {activeTab === "orders" && (
                  <>
                    {renderOrdersTableSection(
                      isFr ? "Réservations Programmées" : "Scheduled Orders",
                      scheduledOrders,
                      isFr ? "Programmée" : "scheduled",
                      true,
                      false
                    )}
                    {renderOrdersTableSection(
                      isFr ? "Réservations Terminées" : "Completed Orders",
                      completedOrders,
                      isFr ? "Terminée" : "completed",
                      false,
                      true
                    )}
                    {renderOrdersTableSection(
                      isFr ? "Réservations Annulées" : "Cancelled Orders",
                      cancelledOrders,
                      isFr ? "Annulée" : "cancelled",
                      false,
                      true
                    )}
                  </>
                )}

                {activeTab === "favorites" && (
                  <section className="account-panel-card">
                    <div className="account-panel-header">
                      <h3 className="account-panel-title">
                        {isFr ? "Mes Véhicules Favoris" : "My Favorite Cars"} ({favoriteCars.length})
                      </h3>
                      <Link to="/models" className="account-link-btn">
                        {isFr ? "Explorer la flotte" : "Explore Fleet"} &rarr;
                      </Link>
                    </div>

                    {favoriteCars.length === 0 ? (
                      <div className="account-empty-box">
                        <i
                          className="fa-regular fa-heart"
                          style={{
                            fontSize: "3.4rem",
                            color: "#D62828",
                            marginBottom: "1rem",
                            display: "block"
                          }}
                        ></i>
                        <p style={{ marginBottom: "2rem" }}>
                          {isFr
                            ? "Aucun véhicule favori pour le moment. Ajoutez nos modèles phares ou cliquez sur le cœur sur n'importe quelle fiche véhicule."
                            : "No favorite vehicles yet. Add our flagship vehicles or click the heart icon on any car card."}
                        </p>
                        <div className="account-fav-grid" style={{ textAlign: "left" }}>
                          {cars.slice(0, 3).map((car) => (
                            <div key={car.id} className="account-fav-card">
                              <div className="account-fav-img-wrap">
                                <img
                                  src={car.img || car.image}
                                  alt={car.name}
                                  className="account-fav-img"
                                />
                              </div>
                              <div className="account-fav-body">
                                <h4 className="account-fav-title">{car.name}</h4>
                                <div className="account-fav-price">{car.price}</div>
                                <button
                                  type="button"
                                  className="account-fav-btn is-primary"
                                  onClick={() => setFavoriteIds(toggleFavoriteCar(car.id, client))}
                                >
                                  <i className="fa-solid fa-heart"></i>
                                  <span>{isFr ? "Ajouter aux favoris" : "Add to Favorites"}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="account-fav-grid">
                        {favoriteCars.map((car) => (
                          <div key={car.id} className="account-fav-card">
                            <div className="account-fav-img-wrap">
                              <img
                                src={car.img || car.image}
                                alt={car.name}
                                className="account-fav-img"
                              />
                              <button
                                type="button"
                                className="account-fav-heart-btn"
                                title={isFr ? "Retirer des favoris" : "Remove from favorites"}
                                onClick={() => setFavoriteIds(toggleFavoriteCar(car.id, client))}
                              >
                                <i className="fa-solid fa-heart"></i>
                              </button>
                            </div>
                            <div className="account-fav-body">
                              <h4 className="account-fav-title">{car.name}</h4>
                              <div className="account-fav-price">{car.price}</div>
                              <div className="account-fav-meta">
                                {car.seats || "7 places VIP"} &bull;{" "}
                                {car.transmission || "Automatique 4x4"}
                              </div>
                              <div className="account-fav-actions">
                                <Link
                                  to={`/models?car=${encodeURIComponent(car.id)}`}
                                  className="account-fav-btn is-primary"
                                >
                                  {isFr ? "Réserver" : "Book"}
                                </Link>
                                <button
                                  type="button"
                                  className="account-fav-btn is-secondary"
                                  onClick={() =>
                                    window.dispatchEvent(
                                      new CustomEvent("3m-open-chat", {
                                        detail: { car, name: client.name, phone: client.phone }
                                      })
                                    )
                                  }
                                >
                                  Chat 3M
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </main>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AccountPage;
