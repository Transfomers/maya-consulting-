import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import ChatAttachment from "../components/ChatAttachment";
import { API_BASE } from "../config/api";

function playPageChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) { }
}

function ChatPage() {
  const [clientId, setClientId] = useState("");
  const [guestId, setGuestId] = useState("");
  const [clientName, setClientName] = useState("Client VIP 3M");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAvatar, setClientAvatar] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const messagesEndRef = useRef(null);
  const knownMsgIdsRef = useRef(new Set());
  const initializedRef = useRef(false);

  // Initialize & reactively sync client profile from localStorage / auth events
  useEffect(() => {
    const syncFromClient = (evtClient) => {
      let savedClient = evtClient;
      let savedGuest = null;
      try {
        if (!savedClient) {
          const rawCur = localStorage.getItem("3m_current_client") || localStorage.getItem("3m_vip_account");
          if (rawCur) savedClient = JSON.parse(rawCur);
        }
        const rawGuest = localStorage.getItem("3m_guest_contact_info");
        if (rawGuest) savedGuest = JSON.parse(rawGuest);
      } catch (e) { }

      let gid = localStorage.getItem("3m_guest_chat_id");
      if (!gid) {
        gid = "GUEST-" + Math.floor(100000 + Math.random() * 900000);
        localStorage.setItem("3m_guest_chat_id", gid);
      }
      setGuestId(gid);
      const cid = savedClient?.accountNumber || gid;
      setClientId(cid);
      if (savedClient?.name || savedGuest?.name) setClientName(savedClient?.name || savedGuest?.name);
      if (savedClient?.phone || savedGuest?.phone) setClientPhone(savedClient?.phone || savedGuest?.phone);
      if (savedClient?.email || savedGuest?.email) setClientEmail(savedClient?.email || savedGuest?.email || "");
      setClientAvatar(savedClient?.avatar || "");
    };

    syncFromClient(null);
    const onAuth = (e) => syncFromClient(e?.detail || null);
    window.addEventListener("3m-client-auth-changed", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("3m-client-auth-changed", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  // Fetch chat thread from Express backend
  const fetchMessages = async () => {
    if (!clientId) return;
    try {
      const res = await fetch(
        `${API_BASE}/chats/${encodeURIComponent(clientId)}?guestId=${encodeURIComponent(guestId)}&name=${encodeURIComponent(clientName)}&phone=${encodeURIComponent(clientPhone)}`
      );
      const data = await res.json();
      if (data && data.messages) {
        let hasNewAdmin = false;
        data.messages.forEach((m) => {
          if (!knownMsgIdsRef.current.has(m.id)) {
            knownMsgIdsRef.current.add(m.id);
            if (initializedRef.current && m.sender === "admin") hasNewAdmin = true;
          }
        });
        initializedRef.current = true;
        if (hasNewAdmin) playPageChime();

        setMessages(data.messages);
        setIsAdminTyping(Boolean(data.adminTyping));
        if (data.unreadClient) {
          fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/read`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reader: "client" })
          }).catch(() => { });
        }
        window.dispatchEvent(new CustomEvent("3m-chat-unread", { detail: 0 }));
        window.dispatchEvent(
          new CustomEvent("3m-client-notifications", {
            detail: { unreadCount: 0, items: (data.clientNotifications || []).map((n) => ({ ...n, read: true })), clientId }
          })
        );
      }
    } catch (err) {
      console.warn("Erreur fetch chat standalone:", err);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 2500);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAdminTyping]);

  // Send message
  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    setInputText("");

    // Optimistic UI append
    const tempMsg = {
      id: "temp_" + Date.now(),
      text: textToSend,
      sender: "client",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSend,
          sender: "client",
          senderName: clientName,
          clientName: clientName,
          clientPhone: clientPhone,
          clientEmail: clientEmail,
          clientAvatar: clientAvatar,
          guestId
        })
      });
      fetchMessages();
    } catch (err) {
      console.error("Erreur envoi message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Inline message edit
  const handleSaveEdit = async (msgId) => {
    if (!editingText.trim()) return;
    try {
      await fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/messages/${encodeURIComponent(msgId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editingText })
      });
      setEditingMsgId(null);
      fetchMessages();
    } catch (err) {
      console.error("Erreur edit message:", err);
    }
  };

  // Delete message
  const handleDeleteMsg = async (msgId) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      await fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/messages/${encodeURIComponent(msgId)}`, {
        method: "DELETE"
      });
      fetchMessages();
    } catch (err) {
      console.error("Erreur suppression message:", err);
    }
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingTop: "90px" }}>
      <div style={{ maxWidth: "1050px", margin: "0 auto", padding: "1.5rem 1rem" }}>

        {/* Navigation Breadcrumb Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.5rem 1.2rem",
                borderRadius: "30px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#1e293b",
                textDecoration: "none",
                fontSize: "1.25rem",
                fontWeight: 600
              }}
            >
              <i className="fa-solid fa-arrow-left"></i> Accueil
            </Link>
            <a
              href="http://127.0.0.1:5002/client/profile"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.5rem 1.2rem",
                borderRadius: "30px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#1e293b",
                textDecoration: "none",
                fontSize: "1.25rem",
                fontWeight: 600
              }}
            >
              <i className="fa-solid fa-user"></i> Mon Profil
            </a>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <span style={{ fontSize: "1.2rem", color: "#64748b", background: "#ffffff", padding: "0.4rem 1rem", borderRadius: "20px", border: "1px solid #e2e8f0" }}>
              <i className="fa-solid fa-lock text-success" style={{ marginRight: "6px" }}></i>
              Discussion Chiffrée & Confidentielle
            </span>
            <a
              href="https://wa.me/237691786447"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.5rem 1.2rem",
                borderRadius: "30px",
                backgroundColor: "#22c55e",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "1.25rem",
                fontWeight: 700
              }}
            >
              <i className="fa-brands fa-whatsapp"></i> WhatsApp Direct
            </a>
          </div>
        </div>

        {/* Main Standalone Chat Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.06)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            height: "75vh",
            minHeight: "560px"
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 70%, #881337 100%)",
              color: "#ffffff",
              padding: "1.2rem 1.8rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              borderBottom: "2px solid rgba(226, 7, 19, 0.3)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  backgroundColor: "#E20713",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  color: "#ffffff",
                  border: "2px solid #ffffff",
                  boxShadow: "0 4px 12px rgba(226, 7, 19, 0.4)"
                }}
              >
                <i className="fa-solid fa-headset"></i>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "1.7rem", fontWeight: 800, color: "#ffffff" }}>
                    Conciergerie VIP 3M SERVICES
                  </h3>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      display: "inline-block",
                      boxShadow: "0 0 8px #22c55e"
                    }}
                    title="Conseillers en ligne"
                  ></span>
                </div>
                <div style={{ fontSize: "1.2rem", color: "rgba(255, 255, 255, 0.8)", marginTop: "2px" }}>
                  Assistance VIP en direct • Réponse garantie en moins de 5 minutes
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.12)", padding: "0.5rem 1rem", borderRadius: "20px", fontSize: "1.2rem" }}>
                <i className="fa-solid fa-user-shield text-warning" style={{ marginRight: "6px" }}></i>
                <strong>{clientName}</strong> <span style={{ opacity: 0.7 }}>({clientId})</span>
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1.5rem",
              backgroundColor: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem"
            }}
          >
            {/* Timestamp Notice */}
            <div style={{ textAlign: "center", margin: "0.5rem 0" }}>
              <span style={{ fontSize: "1.1rem", background: "#e2e8f0", color: "#64748b", padding: "0.3rem 1rem", borderRadius: "15px", fontWeight: 600 }}>
                Aujourd'hui • Ligne VIP Privée
              </span>
            </div>

            {messages.length === 0 && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", alignSelf: "flex-start", maxWidth: "80%" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#0f172a", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 700, flexShrink: 0, border: "1.5px solid #fbbf24" }}>
                  3M
                </div>
                <div style={{ backgroundColor: "#ffffff", color: "#0f172a", padding: "0.9rem 1.3rem", borderRadius: "18px 18px 18px 4px", boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)", border: "1px solid #e2e8f0", fontSize: "1.35rem", lineHeight: "1.5" }}>
                  Bonjour et bienvenue sur le Chat Privé 3M SERVICES ! Notre équipe de conciergerie est à votre écoute 24/7 pour toute demande de réservation, devis personnalisé ou question sur nos véhicules VIP.
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isClient = msg.sender === "client";
              const isEditing = editingMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "8px",
                    alignSelf: isClient ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    flexDirection: isClient ? "row-reverse" : "row"
                  }}
                >
                  {/* Mini Avatar */}
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: isClient ? "#E20713" : "#0f172a",
                      color: isClient ? "#ffffff" : "#fbbf24",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      flexShrink: 0,
                      border: isClient ? "none" : "1.5px solid #fbbf24"
                    }}
                  >
                    {isClient
                      ? (clientName ? clientName[0].toUpperCase() : "C")
                      : ((msg.senderName || "3M").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "3M")}
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      backgroundColor: isClient ? "#E20713" : "#ffffff",
                      color: isClient ? "#ffffff" : "#0f172a",
                      padding: "0.9rem 1.3rem",
                      borderRadius: isClient ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
                      border: isClient ? "none" : "1px solid #e2e8f0",
                      fontSize: "1.35rem",
                      lineHeight: "1.5",
                      wordBreak: "break-word"
                    }}
                  >
                    {!isClient && msg.senderName && (
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#E20713", marginBottom: "4px" }}>
                        {msg.senderName}
                      </div>
                    )}
                    {msg.attachedCar && (
                      <div
                        style={{
                          padding: "0.4rem 0.8rem",
                          marginBottom: "0.5rem",
                          borderRadius: "6px",
                          backgroundColor: isClient ? "rgba(0,0,0,0.15)" : "#f1f5f9",
                          fontSize: "1.15rem",
                          fontWeight: 600
                        }}
                      >
                        <i className="fa-solid fa-car" style={{ marginRight: "6px" }}></i>
                        Véhicule : {msg.attachedCar}
                      </div>
                    )}

                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px",
                            borderRadius: "6px",
                            border: "1px solid #ccc",
                            fontSize: "1.3rem",
                            color: "#0f172a"
                          }}
                        />
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(msg.id)}
                            style={{
                              backgroundColor: "#22c55e",
                              color: "#fff",
                              border: "none",
                              padding: "3px 10px",
                              borderRadius: "4px",
                              fontSize: "1.1rem",
                              cursor: "pointer"
                            }}
                          >
                            Sauvegarder
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingMsgId(null)}
                            style={{
                              backgroundColor: "#94a3b8",
                              color: "#fff",
                              border: "none",
                              padding: "3px 10px",
                              borderRadius: "4px",
                              fontSize: "1.1rem",
                              cursor: "pointer"
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {msg.text && <div>{msg.text}</div>}
                        <ChatAttachment attachment={msg.attachment} />
                      </>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isClient ? "flex-end" : "flex-start",
                        gap: "6px",
                        fontSize: "1.05rem",
                        marginTop: "4px",
                        opacity: 0.8
                      }}
                    >
                      <span>{msg.time || "À l'instant"}</span>
                      {msg.edited && <em>(modifié)</em>}
                      {isClient && !isEditing && (
                        <div style={{ display: "inline-flex", gap: "6px", marginLeft: "6px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMsgId(msg.id);
                              setEditingText(msg.text);
                            }}
                            title="Modifier"
                            style={{ background: "none", border: "none", color: "#ffffff", opacity: 0.7, cursor: "pointer", padding: 0 }}
                          >
                            <i className="fa-solid fa-pen" style={{ fontSize: "1rem" }}></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMsg(msg.id)}
                            title="Supprimer"
                            style={{ background: "none", border: "none", color: "#ffffff", opacity: 0.7, cursor: "pointer", padding: 0 }}
                          >
                            <i className="fa-solid fa-trash" style={{ fontSize: "1rem" }}></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isAdminTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", alignSelf: "flex-start" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#0f172a", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                  3M
                </div>
                <div style={{ background: "#ffffff", padding: "0.6rem 1rem", borderRadius: "14px", border: "1px solid #e2e8f0", fontSize: "1.2rem", color: "#64748b" }}>
                  <i className="fa-solid fa-ellipsis fa-fade"></i> La conciergerie 3M est en train d'écrire...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              padding: "0.8rem 1.5rem",
              backgroundColor: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              overflowX: "auto"
            }}
          >
            {[
              "🚘 Disponibilité Toyota Land Cruiser V8",
              "🏢 Réservation Appartement Tsinga FECAFOOT",
              "🚘 Forfait Location VIP",
              "⏱️ Prolonger ma location en cours",
              "📄 Facture et Contrat de location"
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip)}
                style={{
                  whiteSpace: "nowrap",
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "20px",
                  padding: "0.5rem 1rem",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "#334155",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div
            style={{
              padding: "1rem 1.5rem",
              backgroundColor: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "1rem"
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Écrivez votre message à notre conciergerie VIP... (Entrée pour envoyer)"
              style={{
                flex: 1,
                padding: "0.9rem 1.3rem",
                borderRadius: "30px",
                border: "1.5px solid #cbd5e1",
                fontSize: "1.35rem",
                outline: "none"
              }}
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isSending || !inputText.trim()}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#E20713",
                color: "#ffffff",
                border: "none",
                fontSize: "1.6rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isSending || !inputText.trim() ? "not-allowed" : "pointer",
                opacity: isSending || !inputText.trim() ? 0.5 : 1,
                boxShadow: "0 4px 10px rgba(226, 7, 19, 0.3)"
              }}
              title="Envoyer"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ChatPage;
