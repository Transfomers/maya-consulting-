import React, { useState, useEffect } from "react";
import { googleLogin } from "../firebase";
import {
  getCurrentClient,
  setCurrentClient,
  loginClient,
  registerClientAccount,
  getClientOrders,
  getCrmStore
} from "../utils/customerAccounts";

function ClientPortalModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState("orders"); // orders, profile, chat
  const [portalChatMessages, setPortalChatMessages] = useState([]);
  const [portalChatInput, setPortalChatInput] = useState("");
  const [portalChatSending, setPortalChatSending] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [profileSavedMsg, setProfileSavedMsg] = useState("");

  useEffect(() => {
    if (client) {
      setEditName(client.name || "");
      setEditPhone(client.phone || "");
      setEditEmail(client.email || "");
      setEditAddress(client.address || "");
      setEditCity(client.city || "Yaoundé");
    }
  }, [client]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!client) return;
    const updatedClient = {
      ...client,
      name: editName,
      phone: editPhone,
      email: editEmail,
      address: editAddress,
      city: editCity
    };
    setClient(updatedClient);
    try {
      localStorage.setItem("3m_vip_account", JSON.stringify(updatedClient));
      setProfileSavedMsg("Vos informations ont été mises à jour avec succès !");
      setTimeout(() => setProfileSavedMsg(""), 3500);
      fetch("http://127.0.0.1:5002/api/visitor-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedClient.name,
          phone: updatedClient.phone,
          location: updatedClient.address || updatedClient.city || "Yaoundé",
          city: updatedClient.city || "Yaoundé",
          email: updatedClient.email || "",
          page: "/client-portal"
        })
      }).catch(() => {});
    } catch (err) {}
  };

  const fetchPortalChat = async (accountNum) => {
    if (!accountNum) return;
    try {
      const res = await fetch(`http://127.0.0.1:5001/api/chats/${encodeURIComponent(accountNum)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.messages) {
          setPortalChatMessages(data.messages);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (client && activeTab === "chat") {
      fetchPortalChat(client.accountNumber);
      const interval = setInterval(() => {
        fetchPortalChat(client.accountNumber);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [client, activeTab]);

  const handleSendPortalChat = async (e) => {
    e.preventDefault();
    if (!portalChatInput.trim() || !client) return;

    const textToSend = portalChatInput.trim();
    setPortalChatInput("");
    setPortalChatSending(true);

    try {
      await fetch(`http://127.0.0.1:5001/api/chats/${encodeURIComponent(client.accountNumber)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSend,
          sender: "client",
          senderName: client.name,
          clientName: client.name,
          clientPhone: client.phone,
          clientEmail: client.email
        })
      });
      fetchPortalChat(client.accountNumber);
    } catch (err) {
      console.error(err);
    } finally {
      setPortalChatSending(false);
    }
  };

  const handleGoogleModalLogin = async () => {
    setLoginError("");
    try {
      const user = await googleLogin();
      const email = (user?.email || "").trim();
      const displayName = (user?.displayName || (email ? email.split("@")[0] : "Client VIP 3M")).trim();
      const phone = (user?.phoneNumber || "").trim();
      const avatar = user?.photoURL || "";
      let account = email ? loginClient(email) : null;
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
        const merged = { ...account, name: account.name || displayName, avatar: account.avatar || avatar };
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
    } catch (error) {
      if (error?.code !== "auth/popup-closed-by-user" && error?.code !== "auth/cancelled-popup-request") {
        setLoginError(`Connexion Google impossible : ${error?.message || "réessayez."}`);
      }
    }
  };

  useEffect(() => {
    // Check initial logged-in state
    const current = getCurrentClient();
    if (current) setClient(current);

    // Event listener to open modal from anywhere (Navbar, Booking modal, etc.)
    const handleOpen = (e) => {
      if (e?.detail?.client) {
        setClient(e.detail.client);
      } else {
        const c = getCurrentClient();
        if (c) setClient(c);
      }
      setIsOpen(true);
    };

    const handleAuthChange = (e) => {
      setClient(e.detail || null);
    };

    window.addEventListener("open-client-portal", handleOpen);
    window.addEventListener("3m-open-client-portal", handleOpen);
    window.addEventListener("3m-client-auth-changed", handleAuthChange);

    return () => {
      window.removeEventListener("open-client-portal", handleOpen);
      window.removeEventListener("3m-open-client-portal", handleOpen);
      window.removeEventListener("3m-client-auth-changed", handleAuthChange);
    };
  }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError("");
    if (!loginInput.trim()) {
      setLoginError("Veuillez renseigner votre numéro de téléphone ou votre adresse email.");
      return;
    }

    const found = loginClient(loginInput);
    if (found) {
      setClient(found);
      setLoginInput("");
    } else {
      // Check if any client exists or offer quick guest registration
      const store = getCrmStore();
      const existing = (store.customers || []).find(
        (c) =>
          (c.phone && c.phone.includes(loginInput.trim())) ||
          (c.email && c.email.toLowerCase() === loginInput.trim().toLowerCase())
      );
      if (existing) {
        setClient(existing);
        setCurrentClient(existing);
      } else {
        setLoginError(
          "Aucun compte client trouvé avec ces coordonnées. Passez une réservation ou utilisez l'accès démo ci-dessous."
        );
      }
    }
  };

  const handleLogout = () => {
    setCurrentClient(null);
    setClient(null);
  };

  const orders = client ? getClientOrders(client) : [];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem"
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "2rem 2.5rem",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "#fee2e2",
                color: "#E20713",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem"
              }}
            >
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, color: "#0f172a" }}>
                {client ? `Espace Client 3M VIP` : `Connexion Espace Client`}
              </h3>
              <p style={{ margin: 0, fontSize: "1.25rem", color: "#64748b" }}>
                {client
                  ? `Compte N° ${client.accountNumber || client.id} • Suivi en temps réel`
                  : `Retrouvez vos réservations, commandes et avantages VIP`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1.6rem",
              color: "#475569"
            }}
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "2.5rem" }}>
          {!client ? (
            /* Login Form */
            <div>
              <div
                style={{
                  padding: "1.4rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "2rem"
                }}
              >
                <p style={{ margin: 0, fontSize: "1.35rem", color: "#334155", lineHeight: "1.6" }}>
                  💡 <strong>Déjà client 3M SERVICES ?</strong> Entrez simplement votre numéro de téléphone ou l'email utilisé lors de votre réservation pour accéder immédiatement à votre historique, état des véhicules et contrats.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "1.3rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.6rem" }}>
                    Numéro de Téléphone / WhatsApp ou Email
                  </label>
                  <input
                    type="text"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Ex: +237 698 66 87 61 ou arnaud.mbarga@gmail.com"
                    style={{
                      width: "100%",
                      padding: "1.2rem 1.4rem",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "1.45rem",
                      boxSizing: "border-box",
                      outline: "none"
                    }}
                  />
                </div>

                {loginError && (
                  <div style={{ padding: "1rem", backgroundColor: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "1.3rem" }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: "0.5rem" }}></i>
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    backgroundColor: "#E20713",
                    color: "#ffffff",
                    border: "none",
                    padding: "1.3rem",
                    borderRadius: "10px",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(226, 7, 19, 0.3)",
                    transition: "all 0.2s ease"
                  }}
                >
                  Accéder à mon Espace Client
                </button>
              </form>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.6rem 0 1.2rem" }}>
                <span style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></span>
                <span style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 600 }}>ou</span>
                <span style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></span>
              </div>

              <button
                type="button"
                onClick={handleGoogleModalLogin}
                style={{
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1rem",
                  padding: "1.2rem",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <img src="/google.svg" alt="Google" width="20" height="20" />
                <span>Continuer avec Google</span>
              </button>
            </div>
          ) : (
            /* Logged-In Client Account Dashboard */
            <div>
              {/* Profile Card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#0f172a",
                  borderRadius: "16px",
                  padding: "2rem",
                  color: "#ffffff",
                  marginBottom: "2rem",
                  flexWrap: "wrap",
                  gap: "1.5rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1.4rem" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: "#E20713",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.2rem",
                      fontWeight: 800,
                      color: "#ffffff"
                    }}
                  >
                    {(client.name || "C").charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                      <h4 style={{ margin: 0, fontSize: "2rem", fontWeight: 800 }}>{client.name}</h4>
                      <span
                        style={{
                          backgroundColor: "#f59e0b",
                          color: "#78350f",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          textTransform: "uppercase"
                        }}
                      >
                        ⭐ {client.tier || "Bronze VIP"}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.4rem", fontSize: "1.25rem", color: "#94a3b8" }}>
                      <span><i className="fa-solid fa-phone" style={{ marginRight: "4px" }}></i> {client.phone}</span>
                      {client.email && <span><i className="fa-solid fa-envelope" style={{ marginRight: "4px" }}></i> {client.email}</span>}
                      <span><i className="fa-solid fa-location-dot" style={{ marginRight: "4px" }}></i> {client.city || "Yaoundé"}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    padding: "0.7rem 1.4rem",
                    borderRadius: "8px",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: "0.5rem" }}></i>
                  Déconnexion
                </button>
              </div>

              {/* 3 Metric Pills */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "1.2rem",
                  marginBottom: "2rem"
                }}
              >
                <div style={{ padding: "1.4rem", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <span style={{ fontSize: "1.15rem", color: "#64748b", fontWeight: 600, display: "block" }}>RÉSERVATIONS TOTALES</span>
                  <strong style={{ fontSize: "2.4rem", color: "#0f172a", fontWeight: 800 }}>{orders.length}</strong>
                </div>

                <div style={{ padding: "1.4rem", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <span style={{ fontSize: "1.15rem", color: "#64748b", fontWeight: 600, display: "block" }}>DÉPENSES CUMULÉES</span>
                  <strong style={{ fontSize: "2.1rem", color: "#E20713", fontWeight: 800 }}>
                    {(client.totalSpent || orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0)).toLocaleString("fr-FR")} FCFA
                  </strong>
                </div>

                <div style={{ padding: "1.4rem", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <span style={{ fontSize: "1.15rem", color: "#64748b", fontWeight: 600, display: "block" }}>STATUT DU COMPTE</span>
                  <strong style={{ fontSize: "1.8rem", color: "#16a34a", fontWeight: 800 }}>Actif VIP</strong>
                </div>
              </div>

              {/* Tabs Switcher: Orders vs Profile */}
              <div style={{ display: "flex", gap: "1rem", borderBottom: "2px solid #e2e8f0", marginBottom: "2rem" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === "orders" ? "3px solid #E20713" : "3px solid transparent",
                    padding: "0.8rem 1.4rem",
                    fontSize: "1.45rem",
                    fontWeight: 700,
                    color: activeTab === "orders" ? "#E20713" : "#64748b",
                    cursor: "pointer",
                    marginBottom: "-2px"
                  }}
                >
                  <i className="fa-solid fa-list-check" style={{ marginRight: "6px" }}></i>
                  Mes Commandes & Réservations ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === "profile" ? "3px solid #E20713" : "3px solid transparent",
                    padding: "0.8rem 1.4rem",
                    fontSize: "1.45rem",
                    fontWeight: 700,
                    color: activeTab === "profile" ? "#E20713" : "#64748b",
                    cursor: "pointer",
                    marginBottom: "-2px"
                  }}
                >
                  <i className="fa-solid fa-id-card" style={{ marginRight: "6px" }}></i>
                  Mon Profil & Avantages VIP
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: activeTab === "chat" ? "3px solid #E20713" : "3px solid transparent",
                    padding: "0.8rem 1.4rem",
                    fontSize: "1.45rem",
                    fontWeight: 700,
                    color: activeTab === "chat" ? "#E20713" : "#64748b",
                    cursor: "pointer",
                    marginBottom: "-2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <i className="fa-solid fa-comments text-danger"></i>
                  Chat Privé Conciergerie
                </button>
              </div>

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
                  
                  {/* Standalone Chat Launch Banner */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #881337 100%)",
                      borderRadius: "12px",
                      padding: "1.4rem",
                      color: "#ffffff",
                      marginBottom: "1.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1rem"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
                        <i className="fa-solid fa-comments text-danger"></i> Messagerie VIP Standalone
                      </div>
                      <div style={{ fontSize: "1.2rem", opacity: 0.85, marginTop: "4px" }}>
                        Échangez en direct avec nos conseillers 3M sur une page dédiée en plein écran.
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a
                        href="/chat"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: "#E20713",
                          color: "#ffffff",
                          padding: "0.6rem 1.4rem",
                          borderRadius: "30px",
                          fontWeight: 700,
                          fontSize: "1.3rem",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 4px 10px rgba(226, 7, 19, 0.4)"
                        }}
                      >
                        <i className="fa-solid fa-up-right-from-square"></i> Ouvrir le Chat Dédié
                      </a>
                    </div>
                  </div>

                  {/* Form to fill/edit profile */}
                  <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                    <h4 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
                      <i className="fa-solid fa-user-pen text-danger" style={{ marginRight: "8px" }}></i>
                      Remplir & Mettre à jour mon Profil
                    </h4>
                    <p style={{ color: "#64748b", fontSize: "1.2rem", marginBottom: "1.2rem" }}>
                      Complétez vos coordonnées pour faciliter vos prochaines réservations de véhicules VIP et résidences meublées.
                    </p>

                    {profileSavedMsg && (
                      <div style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "0.8rem 1.2rem", borderRadius: "8px", marginBottom: "1.2rem", fontSize: "1.3rem", fontWeight: 600 }}>
                        <i className="fa-solid fa-check-circle" style={{ marginRight: "6px" }}></i> {profileSavedMsg}
                      </div>
                    )}

                    <form onSubmit={handleSaveProfile}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "1.2rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                            Nom Complet
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Votre nom et prénom"
                            style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1.3rem" }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "1.2rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                            Numéro de Téléphone
                          </label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="+237 6XX XX XX XX"
                            style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1.3rem" }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "1.2rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                            Adresse Email
                          </label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="votre-email@domaine.com"
                            style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1.3rem" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "1.2rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                            Ville de Résidence
                          </label>
                          <input
                            type="text"
                            value={editCity}
                            onChange={(e) => setEditCity(e.target.value)}
                            placeholder="Yaoundé, Douala..."
                            style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1.3rem" }}
                          />
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={{ display: "block", fontSize: "1.2rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                            Adresse Résidentielle / Quartier
                          </label>
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder="Ex: Bastos, Rue 1.834 / Tsinga"
                            style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1.3rem" }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        style={{
                          backgroundColor: "#0f172a",
                          color: "#ffffff",
                          border: "none",
                          padding: "0.8rem 2rem",
                          borderRadius: "30px",
                          fontSize: "1.35rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px"
                        }}
                      >
                        <i className="fa-solid fa-floppy-disk"></i> Enregistrer mes modifications
                      </button>
                    </form>
                  </div>

                  <h5 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.8rem" }}>
                    Vos Privilèges Membre 3M SERVICES
                  </h5>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                    <div style={{ padding: "0.8rem", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "1.25rem", color: "#334155" }}>
                      ✅ Concierge dédié 24/7 sur WhatsApp & Chat
                    </div>
                    <div style={{ padding: "0.8rem", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "1.25rem", color: "#334155" }}>
                      ✅ Véhicules de remplacement prioritaire
                    </div>
                    <div style={{ padding: "0.8rem", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "1.25rem", color: "#334155" }}>
                      ✅ Tarifs dégressifs pour séjours longue durée
                    </div>
                    <div style={{ padding: "0.8rem", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "1.25rem", color: "#334155" }}>
                      ✅ Accueil aéroportuaire VIP à Nsimalen
                    </div>
                  </div>
                </div>
              )}

              {/* Orders List */}
              {activeTab === "orders" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem" }}>
                  <h4 style={{ margin: 0, fontSize: "1.7rem", fontWeight: 800, color: "#0f172a" }}>
                    <i className="fa-solid fa-list-check" style={{ color: "#E20713", marginRight: "0.8rem" }}></i>
                    Mes Commandes & Réservations ({orders.length})
                  </h4>

                  <a
                    href="https://wa.me/237691786447"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      color: "#16a34a",
                      fontWeight: 700,
                      fontSize: "1.3rem",
                      textDecoration: "none"
                    }}
                  >
                    <i className="fa-brands fa-whatsapp"></i> Conciergerie 24/7
                  </a>
                </div>

                {orders.length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                    <p style={{ fontSize: "1.4rem", color: "#64748b", margin: "0 0 1rem 0" }}>
                      Vous n'avez pas encore de réservation active enregistrée sur ce compte.
                    </p>
                    <a
                      href="/models"
                      style={{
                        display: "inline-block",
                        backgroundColor: "#E20713",
                        color: "#ffffff",
                        padding: "1rem 2rem",
                        borderRadius: "8px",
                        fontWeight: 700,
                        textDecoration: "none",
                        fontSize: "1.35rem"
                      }}
                    >
                      Explorer nos Véhicules & Appartements
                    </a>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1.5px solid #e2e8f0",
                          borderRadius: "14px",
                          padding: "1.6rem 2rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1rem",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.8rem" }}>
                          <div>
                            <span style={{ fontSize: "1.15rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                              RÉF: {ord.id}
                            </span>
                            <h5 style={{ margin: "0.2rem 0", fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>
                              {ord.carName || "Véhicule / Résidence 3M"}
                            </h5>
                            <span style={{ fontSize: "1.25rem", color: "#64748b" }}>
                              📍 {ord.pickUp || "Yaoundé"} • Du {ord.pickTime} au {ord.dropTime || ord.pickTime} ({ord.days || 1} jour(s))
                            </span>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "1.15rem",
                                fontWeight: 700,
                                backgroundColor:
                                  ord.status === "Confirmée"
                                    ? "#dcfce7"
                                    : ord.status === "En cours"
                                    ? "#dbeafe"
                                    : "#fef3c7",
                                color:
                                  ord.status === "Confirmée"
                                    ? "#15803d"
                                    : ord.status === "En cours"
                                    ? "#1e40af"
                                    : "#b45309"
                              }}
                            >
                              ● {ord.status || "En attente"}
                            </span>
                            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#E20713", marginTop: "0.4rem" }}>
                              {(Number(ord.totalPrice) || 0).toLocaleString("fr-FR")} FCFA
                            </div>
                          </div>
                        </div>

                        {/* Order Actions */}
                        <div style={{ display: "flex", gap: "1rem", borderTop: "1px dashed #e2e8f0", paddingTop: "1rem", flexWrap: "wrap" }}>
                          <a
                            href={`https://wa.me/237691786447?text=${encodeURIComponent(
                              `Bonjour 3M SERVICES, je suis ${client.name} (Compte N° ${client.accountNumber}). Je vous contacte au sujet de ma réservation [Réf : ${ord.id}] pour ${ord.carName}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.6rem",
                              backgroundColor: "#25D366",
                              color: "#ffffff",
                              padding: "0.8rem 1.4rem",
                              borderRadius: "8px",
                              fontSize: "1.25rem",
                              fontWeight: 700,
                              textDecoration: "none"
                            }}
                          >
                            <i className="fa-brands fa-whatsapp"></i>
                            Contacter le Concierge Dédié
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              window.print();
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.6rem",
                              backgroundColor: "#f8fafc",
                              border: "1px solid #cbd5e1",
                              color: "#334155",
                              padding: "0.8rem 1.4rem",
                              borderRadius: "8px",
                              fontSize: "1.25rem",
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            <i className="fa-solid fa-receipt"></i>
                            Imprimer Reçu
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

              {/* 3M Personal Private Chat Tab */}
              {activeTab === "chat" && (
                <div style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                      <h4 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        <i className="fa-solid fa-comments text-danger me-2"></i>
                        Chat Privé avec la Conciergerie 3M SERVICES
                      </h4>
                      <span style={{ fontSize: "1.2rem", color: "#64748b" }}>
                        Échanges en direct liés à votre compte VIP N° {client.accountNumber}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <a
                        href="/chat"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: "#E20713",
                          border: "none",
                          color: "#ffffff",
                          padding: "0.6rem 1.2rem",
                          borderRadius: "8px",
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          textDecoration: "none",
                          boxShadow: "0 2px 6px rgba(226,7,19,0.3)"
                        }}
                      >
                        <i className="fa-solid fa-up-right-from-square"></i>
                        Ouvrir en Page Standalone
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("3m-open-chat", { detail: { name: client.name, phone: client.phone } }));
                          setIsOpen(false);
                        }}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1.5px solid #cbd5e1",
                          color: "#0f172a",
                          padding: "0.6rem 1.2rem",
                          borderRadius: "8px",
                          fontSize: "1.2rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        <i className="fa-solid fa-comment-dots"></i>
                        Fenêtre Flottante
                      </button>
                    </div>
                  </div>

                  {/* Messages Stream Box */}
                  <div
                    style={{
                      height: "320px",
                      overflowY: "auto",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "1.2rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                      marginBottom: "1.2rem"
                    }}
                  >
                    {portalChatMessages.length === 0 ? (
                      <div style={{ textAlign: "center", color: "#94a3b8", margin: "auto", fontSize: "1.2rem" }}>
                        <i className="fa-solid fa-comments fs-2 d-block mb-2"></i>
                        Aucun message précédent. Envoyez un message ci-dessous pour joindre immédiatement votre concierge dédié.
                      </div>
                    ) : (
                      portalChatMessages.map((msg, i) => {
                        const isMe = msg.sender === "client";
                        return (
                          <div
                            key={msg.id || i}
                            style={{
                              alignSelf: isMe ? "flex-end" : "flex-start",
                              maxWidth: "80%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: isMe ? "flex-end" : "flex-start"
                            }}
                          >
                            {!isMe && (
                              <span style={{ fontSize: "1rem", fontWeight: 700, color: "#E20713", marginBottom: "2px" }}>
                                3M Conciergerie VIP
                              </span>
                            )}
                            <div
                              style={{
                                padding: "0.8rem 1.2rem",
                                borderRadius: "12px",
                                backgroundColor: isMe ? "#E20713" : "#f1f5f9",
                                color: isMe ? "#ffffff" : "#0f172a",
                                fontSize: "1.25rem",
                                lineHeight: 1.4,
                                borderBottomRightRadius: isMe ? "2px" : "12px",
                                borderBottomLeftRadius: isMe ? "12px" : "2px"
                              }}
                            >
                              {msg.text}
                            </div>
                            <span style={{ fontSize: "0.95rem", color: "#94a3b8", marginTop: "2px" }}>
                              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendPortalChat} style={{ display: "flex", gap: "0.8rem" }}>
                    <input
                      type="text"
                      placeholder="Posez votre question à votre conseiller VIP 3M..."
                      value={portalChatInput}
                      onChange={(e) => setPortalChatInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "1rem 1.2rem",
                        borderRadius: "8px",
                        border: "1.5px solid #cbd5e1",
                        fontSize: "1.3rem",
                        outline: "none"
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!portalChatInput.trim() || portalChatSending}
                      style={{
                        backgroundColor: "#E20713",
                        color: "#ffffff",
                        border: "none",
                        padding: "0 1.8rem",
                        borderRadius: "8px",
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        cursor: portalChatInput.trim() ? "pointer" : "not-allowed",
                        opacity: portalChatInput.trim() ? 1 : 0.6,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <i className="fa-solid fa-paper-plane"></i>
                      Envoyer
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientPortalModal;
