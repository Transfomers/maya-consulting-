import React, { useState, useEffect, useRef } from "react";
import { getCurrentClient } from "../utils/customerAccounts";
import "./PrivateChatWidget.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5001/api";

function PrivateChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [attachedCar, setAttachedCar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);

  // Retrieve current client or guest session
  const client = getCurrentClient();
  const clientId = client?.accountNumber || (function() {
    let gid = localStorage.getItem("3m_guest_chat_id");
    if (!gid) {
      gid = "GUEST-" + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem("3m_guest_chat_id", gid);
    }
    return gid;
  })();

  const displayName = client?.name || guestName || "Client Invité VIP";
  const displayPhone = client?.phone || guestPhone || "";
  const displayEmail = client?.email || "";

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch thread messages from server
  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.messages) {
          setMessages(data.messages);
          if (!isOpen && data.unreadClient) {
            setUnreadCount(data.unreadClient);
          }
        }
      }
    } catch (err) {
      console.warn("3M Chat fetch error:", err);
    }
  };

  // Poll messages every 3.5 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages();
    }, 3500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
      // Mark as read
      fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reader: "client" })
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, messages.length]);

  // Listen to global open event
  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      if (e?.detail?.car) {
        setAttachedCar(e.detail.car);
        if (!inputText) {
          setInputText(
            `Bonjour 3M SERVICES, je souhaite réserver ou me renseigner sur le véhicule VIP en promotion : ${e.detail.car.name || e.detail.car.model}. Est-il disponible ?`
          );
        }
      }
      if (e?.detail?.name) setGuestName(e.detail.name);
      if (e?.detail?.phone) setGuestPhone(e.detail.phone);
    };

    window.addEventListener("3m-open-chat", handleOpenChat);
    return () => window.removeEventListener("3m-open-chat", handleOpenChat);
  }, [inputText]);

  // Send message
  const handleSendMessage = async (customText = null, customCar = null) => {
    const textToSend = customText !== null ? customText : inputText;
    if (!textToSend || !textToSend.trim()) return;

    const carToSend = customCar || attachedCar;

    const optimisticMsg = {
      id: "msg-" + Date.now(),
      sender: "client",
      senderName: displayName,
      text: textToSend.trim(),
      timestamp: new Date().toISOString(),
      car: carToSend ? {
        id: carToSend.id,
        name: carToSend.name || carToSend.model,
        price: carToSend.promoPrice || carToSend.pricePerDay || carToSend.price,
        image: carToSend.img || carToSend.image
      } : null
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    setAttachedCar(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSend.trim(),
          sender: "client",
          senderName: displayName,
          clientName: displayName,
          clientPhone: displayPhone,
          clientEmail: displayEmail,
          carInfo: optimisticMsg.car
        })
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="private-chat-wrapper">
      {/* ── 1. Floating Launch Button ── */}
      {!isOpen && (
        <button
          type="button"
          className="private-chat-floating-btn"
          onClick={() => setIsOpen(true)}
          title="Ouvrir le Chat Privé 3M SERVICES"
        >
          <div className="chat-btn-pulse"></div>
          <div className="chat-btn-icon-wrapper">
            <i className="fa-solid fa-comments"></i>
          </div>
          <div className="chat-btn-text">
            <span className="chat-btn-title">Chat Privé 3M</span>
            <span className="chat-btn-sub">Conciergerie VIP En Ligne</span>
          </div>
          {unreadCount > 0 && (
            <span className="chat-btn-badge">{unreadCount}</span>
          )}
        </button>
      )}

      {/* ── 2. Chat Window Box ── */}
      {isOpen && (
        <div className="private-chat-box">
          {/* Header */}
          <div className="chat-box-header">
            <div className="chat-header-identity">
              <div className="chat-avatar-wrapper">
                <img
                  src="/logorv.png"
                  alt="3M"
                  className="chat-avatar-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="chat-online-indicator"></span>
              </div>
              <div className="chat-header-titles">
                <h5>Conciergerie Privée 3M</h5>
                <span className="chat-status-text">
                  <i className="fa-solid fa-circle text-success" style={{ fontSize: "7px", marginRight: "4px" }}></i>
                  Conseiller VIP en direct • 24/7
                </span>
              </div>
            </div>

            <div className="chat-header-actions">
              <a
                href="https://wa.me/237691786447"
                target="_blank"
                rel="noreferrer"
                className="chat-header-wa-btn"
                title="Bascule vers WhatsApp"
              >
                <i className="fa-brands fa-whatsapp"></i>
              </a>
              <button
                type="button"
                className="chat-header-close-btn"
                onClick={() => setIsOpen(false)}
                title="Fermer la discussion"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Client Profile Sub-bar */}
          <div className="chat-client-bar">
            <div className="chat-client-info">
              <i className="fa-solid fa-user-shield me-1 text-danger"></i>
              <span className="fw-semibold text-truncate">{displayName}</span>
              <span className="chat-client-id-badge">ID: {clientId}</span>
            </div>
            {client ? (
              <span className="chat-badge-vip">Compte {client.tier || "VIP"}</span>
            ) : (
              <span className="chat-badge-guest">Session Privée Sécurisée</span>
            )}
          </div>

          {/* Attached Vehicle Preview (if initiated from promo card) */}
          {attachedCar && (
            <div className="chat-attached-car-card">
              <div className="attached-car-thumb">
                <img
                  src={attachedCar.img || attachedCar.image || "/images/cars/toyota-landcruiser-v8-black.webp"}
                  alt={attachedCar.name}
                  onError={(e) => { e.target.src = "/images/cars/toyota-landcruiser-v8-black.webp"; }}
                />
              </div>
              <div className="attached-car-info">
                <span className="attached-car-badge">OFFRE PROMO SÉLECTIONNÉE</span>
                <h6>{attachedCar.name || attachedCar.model}</h6>
                <div className="attached-car-price">
                  <strong>
                    {(attachedCar.promoPrice || attachedCar.pricePerDay || 100000).toLocaleString("fr-FR")} FCFA
                  </strong>
                  <span> / jour</span>
                </div>
              </div>
              <button
                type="button"
                className="attached-car-remove"
                onClick={() => setAttachedCar(null)}
                title="Retirer le véhicule associé"
              >
                &times;
              </button>
            </div>
          )}

          {/* Message Stream */}
          <div className="chat-messages-container">
            <div className="chat-timestamp-divider">
              <span>Aujourd'hui • Échanges Sécurisés & Chiffrés 3M</span>
            </div>

            {messages.map((msg, idx) => {
              const isClient = msg.sender === "client";
              return (
                <div
                  key={msg.id || idx}
                  className={`chat-message-bubble-wrapper ${isClient ? "is-client" : "is-admin"}`}
                >
                  {!isClient && (
                    <div className="chat-bubble-author">
                      <span className="badge-3m-staff">3M Conciergerie</span>
                    </div>
                  )}

                  <div className={`chat-bubble ${isClient ? "bubble-client" : "bubble-admin"}`}>
                    {/* Embedded car inside message if present */}
                    {msg.car && (
                      <div className="msg-embedded-car">
                        <img
                          src={msg.car.image || "/images/cars/toyota-landcruiser-v8-black.webp"}
                          alt={msg.car.name}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="msg-embedded-car-details">
                          <strong>{msg.car.name}</strong>
                          <span>{msg.car.price ? `${Number(msg.car.price).toLocaleString("fr-FR")} FCFA/j` : "Tarif VIP"}</span>
                        </div>
                      </div>
                    )}

                    <div className="bubble-text">{msg.text}</div>
                    <div className="bubble-time">
                      {formatTime(msg.timestamp || msg.time)}
                      {isClient && <i className="fa-solid fa-check-double ms-1" style={{ fontSize: "0.65rem" }}></i>}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="chat-message-bubble-wrapper is-client">
                <div className="chat-bubble bubble-client sending">
                  <span className="small">Envoi en cours...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions chips */}
          <div className="chat-quick-chips">
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleSendMessage("Bonjour, quel est le tarif et la disponibilité pour une mission de 3 jours à Yaoundé ?")}
            >
              Tarif 3 jours Yaoundé
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleSendMessage("Bonjour, vos chauffeurs VIP sont-ils bien inclus dans les forfaits promotionnels ?")}
            >
              Chauffeur VIP inclus ?
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleSendMessage("Je souhaite réserver un Toyota Land Cruiser Prado pour un cortège VIP.")}
            >
              Réserver Prado TXL
            </button>
          </div>

          {/* Input & Send Form */}
          <div className="chat-input-bar">
            <textarea
              className="chat-textarea"
              rows="1"
              placeholder="Écrivez votre message à notre conciergerie..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
            ></textarea>
            <button
              type="button"
              className="chat-send-btn"
              disabled={!inputText.trim()}
              onClick={() => handleSendMessage()}
              title="Envoyer le message"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrivateChatWidget;
