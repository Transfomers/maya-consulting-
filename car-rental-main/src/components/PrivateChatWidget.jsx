import React, { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentClient } from "../utils/customerAccounts";
import { API_BASE } from "../config/api";
import "./PrivateChatWidget.css";
import ChatAttachment from "./ChatAttachment";

// Web Audio Synthetic Two-Tone Notification Bell Chime
function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const playTone = (freq, startOffset, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + startOffset);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startOffset + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + startOffset);
      osc.stop(audioCtx.currentTime + startOffset + duration);
    };
    playTone(659.25, 0, 0.22); // E5
    playTone(880, 0.14, 0.3);   // A5
  } catch (e) {
    // AudioContext blocked or not supported
  }
}

function readSavedGuestContact() {
  try {
    const raw = localStorage.getItem("3m_guest_contact_info");
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function getNotifiedStorageKey(cid) {
  return `3m_notified_admin_msgs_${cid || "guest"}`;
}

function readNotifiedAdminIds(cid) {
  try {
    const raw = localStorage.getItem(getNotifiedStorageKey(cid));
    return raw ? new Set(JSON.parse(raw)) : null;
  } catch (_) {
    return null;
  }
}

function persistNotifiedAdminIds(cid, idSet) {
  try {
    localStorage.setItem(getNotifiedStorageKey(cid), JSON.stringify(Array.from(idSet).slice(-120)));
  } catch (_) {}
}

function buildClientNotificationItems(data) {
  if (Array.isArray(data?.clientNotifications) && data.clientNotifications.length > 0) {
    return data.clientNotifications;
  }
  const unreadCap = Number(data?.unreadClient || 0);
  const adminMsgs = (data?.messages || [])
    .filter((m) => m && m.sender === "admin" && !String(m.id || "").startsWith("msg-welcome"))
    .slice(-15)
    .reverse();
  return adminMsgs.map((m, idx) => ({
    id: `cnotif-msg-${m.id}`,
    msgId: m.id,
    title: m.attachment?.type === "invoice"
      ? `Facture ${m.attachment.reference || ""} reçue`.trim()
      : "Nouveau message — Conciergerie 3M",
    message: m.text || "Nouveau message reçu",
    senderName: m.senderName || "Conciergerie VIP 3M",
    type: m.attachment?.type === "invoice" ? "invoice" : "chat",
    createdAt: m.timestamp,
    read: idx >= unreadCap
  }));
}

function PrivateChatWidget() {
  const savedGuest = readSavedGuestContact();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [guestName, setGuestName] = useState(savedGuest.name || "");
  const [guestPhone, setGuestPhone] = useState(savedGuest.phone || "");
  const [guestEmail, setGuestEmail] = useState(savedGuest.email || "");
  const [attachedCar, setAttachedCar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotif, setToastNotif] = useState(null);
  const [adminIsTyping, setAdminIsTyping] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");

  const messagesEndRef = useRef(null);
  const knownMsgIdsRef = useRef(new Set());
  const hasInitializedRef = useRef(false);
  const toastTimerRef = useRef(null);
  const originalTitleRef = useRef(typeof document !== "undefined" ? document.title : "3M SERVICES");
  const typingTimeoutRef = useRef(null);
  const sendMessageRef = useRef(null);
  const [pendingAutoSend, setPendingAutoSend] = useState(null);

  // Retrieve current client or guest session
  const client = getCurrentClient();
  // Identifiant invité propre à cet appareil (conservé après connexion pour relier la conversation)
  const guestId = (function () {
    let gid = localStorage.getItem("3m_guest_chat_id");
    if (!gid) {
      gid = "GUEST-" + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem("3m_guest_chat_id", gid);
    }
    return gid;
  })();
  // Client connecté : son n° de compte (même conversation sur tous ses appareils) ; sinon l'invité
  const clientId = client?.accountNumber || guestId;

  const displayName = client?.name || guestName || "Client Invité VIP";
  const displayPhone = client?.phone || guestPhone || "";
  const displayEmail = client?.email || guestEmail || "";
  const notifEnabled = client?.notifications?.chatMessages !== false;

  // Smooth scroll
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  const showClientReplyAlert = useCallback(
    (msg) => {
      if (!notifEnabled) return;
      playChime();
      setToastNotif({
        id: msg.id,
        senderName: msg.senderName || "Conciergerie 3M SERVICES",
        text: msg.text || "Vous avez reçu un nouveau message de la conciergerie.",
        timestamp: msg.timestamp
      });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToastNotif(null);
      }, 12000);

      try {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          const n = new Notification("Conciergerie 3M SERVICES", {
            body: (msg.text || "Nouveau message reçu").slice(0, 140),
            icon: "/apple-touch-icon.png",
            tag: "3m-concierge-reply"
          });
          n.onclick = () => {
            try { window.focus(); } catch (_) {}
            setIsOpen(true);
            setToastNotif(null);
            n.close();
          };
        }
      } catch (_) {}
    },
    [notifEnabled]
  );

  // Fetch thread messages from server
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}?guestId=${encodeURIComponent(guestId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.messages) {
          const persisted = readNotifiedAdminIds(clientId);
          const notifiedSet = persisted || new Set();
          const serverUnread = Number(data.unreadClient || 0);
          const newlyArrivedAdminMsgs = [];

          data.messages.forEach((m) => {
            if (!m || !m.id) return;
            knownMsgIdsRef.current.add(m.id);
            const isRealAdminMsg = m.sender === "admin" && !String(m.id).startsWith("msg-welcome");
            if (!isRealAdminMsg) return;

            if (persisted === null && !hasInitializedRef.current && serverUnread === 0) {
              notifiedSet.add(m.id);
            } else if (!notifiedSet.has(m.id)) {
              notifiedSet.add(m.id);
              newlyArrivedAdminMsgs.push(m);
            }
          });
          hasInitializedRef.current = true;
          persistNotifiedAdminIds(clientId, notifiedSet);

          const onChatPage = typeof window !== "undefined" && /^\/(chat|messages)(\/|$)/.test(window.location.pathname);

          if (newlyArrivedAdminMsgs.length > 0) {
            const latestAdminMsg = newlyArrivedAdminMsgs[newlyArrivedAdminMsgs.length - 1];
            if (!isOpen && !onChatPage) {
              showClientReplyAlert(latestAdminMsg);
            } else if (isOpen) {
              if (notifEnabled) playChime();
              fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/read`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reader: "client" })
              }).catch(() => {});
            }
          }

          setMessages(data.messages);
          setAdminIsTyping(Boolean(data.adminTyping));

          const notifItems = buildClientNotificationItems(data);
          const notifUnread = Array.isArray(data.clientNotifications) && data.clientNotifications.length > 0
            ? data.clientNotifications.filter((n) => !n.read).length
            : serverUnread;
          const effectiveUnread = isOpen ? 0 : Math.max(serverUnread, notifUnread);

          setUnreadCount(isOpen ? 0 : serverUnread);
          window.dispatchEvent(
            new CustomEvent("3m-client-notifications", {
              detail: {
                unreadCount: effectiveUnread,
                items: isOpen ? notifItems.map((n) => ({ ...n, read: true })) : notifItems,
                clientId
              }
            })
          );
        }
      }
    } catch (err) {
      console.warn("3M Chat fetch error:", err);
    }
  }, [clientId, guestId, isOpen, notifEnabled, showClientReplyAlert]);

  // Real-Time Polling every 1.5 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 1500);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Mark notifications read from Navbar bell dropdown
  useEffect(() => {
    const handleMarkRead = async (e) => {
      const notificationId = e?.detail?.notificationId || null;
      if (!notificationId) {
        setUnreadCount(0);
        setToastNotif(null);
      }
      try {
        await fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/notifications/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId })
        });
        fetchMessages();
      } catch (_) {}
    };
    window.addEventListener("3m-mark-client-notifs-read", handleMarkRead);
    return () => window.removeEventListener("3m-mark-client-notifs-read", handleMarkRead);
  }, [clientId, fetchMessages]);

  // Handle open state change
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom(false), 80);
      setUnreadCount(0);
      setToastNotif(null);
      // Mark as read
      fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reader: "client" })
      }).catch(() => {});
    }
  }, [isOpen, clientId, scrollToBottom]);

  // Update browser tab title when unread concierge messages exist
  useEffect(() => {
    if (typeof document === "undefined") return;
    const baseTitle = originalTitleRef.current;
    if (unreadCount > 0 && !isOpen) {
      document.title = `(${unreadCount}) Nouveau message — 3M SERVICES`;
    } else {
      document.title = baseTitle;
    }
    return () => {
      document.title = baseTitle;
    };
  }, [unreadCount, isOpen]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      scrollToBottom(true);
    }
  }, [messages.length, isOpen, scrollToBottom]);

  // Sync unread count to navbar chat icon
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("3m-chat-unread", { detail: unreadCount }));
  }, [unreadCount]);

  // Global open listener from navbar, contact page, promo cards, or booking modal
  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      setToastNotif(null);
      const detail = e?.detail || {};
      if (detail.name) setGuestName(detail.name);
      if (detail.phone) setGuestPhone(detail.phone);
      if (detail.email) setGuestEmail(detail.email);
      if (detail.car) {
        setAttachedCar(detail.car);
      }
      if (detail.autoSend && detail.message) {
        setPendingAutoSend({ text: detail.message, car: detail.car || null });
      } else if (detail.message) {
        setInputText(detail.message);
      } else if (detail.car && !inputText) {
        setInputText(
          `Bonjour 3M SERVICES, je souhaite réserver ou me renseigner sur le véhicule VIP : ${detail.car.name || detail.car.model}. Est-il disponible ?`
        );
      }
      if (detail.refresh) {
        setTimeout(() => fetchMessages(), 120);
      }
    };

    window.addEventListener("3m-open-chat", handleOpenChat);
    return () => window.removeEventListener("3m-open-chat", handleOpenChat);
  }, [inputText, fetchMessages]);

  // Execute auto-send once triggered by booking modal
  useEffect(() => {
    if (isOpen && pendingAutoSend && sendMessageRef.current) {
      const { text, car } = pendingAutoSend;
      setPendingAutoSend(null);
      sendMessageRef.current(text, car);
    }
  }, [isOpen, pendingAutoSend]);

  // Client typing emitter
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    // Emit typing status
    fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "client", isTyping: true })
    }).catch(() => {});

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "client", isTyping: false })
      }).catch(() => {});
    }, 2500);
  };

  // Send message
  const handleSendMessage = async (customText = null, customCar = null) => {
    const textToSend = customText !== null ? customText : inputText;
    if (!textToSend || !textToSend.trim()) return;

    const carToSend = customCar || attachedCar;
    const tempId = "msg-client-" + Date.now();

    const optimisticMsg = {
      id: tempId,
      sender: "client",
      senderName: displayName,
      text: textToSend.trim(),
      timestamp: new Date().toISOString(),
      car: carToSend ? {
        id: carToSend.id,
        name: carToSend.name || carToSend.model,
        price: carToSend.promoPrice || carToSend.pricePerDay || carToSend.price,
        image: carToSend.img || carToSend.image,
        url: carToSend.url || null
      } : null
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    knownMsgIdsRef.current.add(tempId);
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
          guestId,
          carInfo: optimisticMsg.car
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.message) {
          knownMsgIdsRef.current.add(data.message.id);
        }
        fetchMessages();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom(true), 60);
    }
  };

  sendMessageRef.current = handleSendMessage;

  // CRUD: Edit Client Message
  const handleStartEdit = (msg) => {
    setEditingMsgId(msg.id);
    setEditText(msg.text);
  };

  const handleSaveEdit = async (msgId) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/messages/${encodeURIComponent(msgId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText.trim() })
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, text: editText.trim(), isEdited: true } : m))
        );
        setEditingMsgId(null);
        setEditText("");
      }
    } catch (err) {
      console.error("Edit message error:", err);
    }
  };

  // CRUD: Delete Client Message
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Voulez-vous supprimer ce message ?")) return;
    try {
      const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(clientId)}/messages/${encodeURIComponent(msgId)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, text: "Ce message a été supprimé.", isDeleted: true } : m))
        );
      }
    } catch (err) {
      console.error("Delete message error:", err);
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

  const renderMessageText = (text) => {
    if (!text) return null;
    const parts = String(text).split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          style={{ color: "inherit", textDecoration: "underline", wordBreak: "break-all", fontWeight: 700 }}
        >
          {part}
        </a>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  if (!isOpen) {
    if (!toastNotif && unreadCount === 0) return null;
    return (
      <div className="private-chat-notify-anchor">
        {toastNotif && (
          <div className="chat-notif-toast" role="status" aria-live="polite">
            <button
              type="button"
              className="chat-notif-toast__main"
              onClick={() => {
                setToastNotif(null);
                setIsOpen(true);
              }}
            >
              <span className="chat-notif-toast__bell" aria-hidden="true">
                <i className="fa-solid fa-bell"></i>
              </span>
              <div className="chat-notif-toast__body">
                <div className="chat-notif-toast__title">
                  <span>{toastNotif.senderName}</span>
                  <span className="chat-notif-toast__pill">Nouveau message</span>
                </div>
                <p className="chat-notif-toast__text">{toastNotif.text}</p>
                <span className="chat-notif-toast__cta">
                  Cliquez pour répondre <i className="fa-solid fa-arrow-right"></i>
                </span>
              </div>
            </button>
            <button
              type="button"
              className="chat-notif-toast__close"
              onClick={() => setToastNotif(null)}
              aria-label="Fermer la notification"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {!toastNotif && unreadCount > 0 && (
          <button
            type="button"
            className="chat-unread-fab"
            onClick={() => setIsOpen(true)}
            aria-label={`${unreadCount} message(s) non lu(s) de la conciergerie`}
          >
            <span className="chat-unread-fab__icon" aria-hidden="true">
              <i className="fa-solid fa-comment-dots"></i>
            </span>
            <span>Conciergerie 3M</span>
            <span className="chat-unread-fab__badge">{unreadCount}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="private-chat-wrapper">
      {/* ── Fenêtre de chat ── */}
      <div className="private-chat-box" role="dialog" aria-label="Conciergerie 3M SERVICES">
          {/* Header */}
          <div className="chat-box-header">
            <div className="chat-header-identity">
              <div className="chat-avatar-wrapper">
                <img
                  src="/apple-touch-icon.png"
                  alt="3M"
                  className="chat-avatar-img"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <span className="chat-online-indicator"></span>
              </div>
              <div className="chat-header-titles">
                <h5>Conciergerie 3M SERVICES</h5>
                <span className="chat-status-text">Conseiller VIP • 24/7</span>
              </div>
            </div>

            <div className="chat-header-actions">
              <a
                href="https://wa.me/237691786447"
                target="_blank"
                rel="noreferrer"
                className="chat-header-wa-btn"
                title="Continuer sur WhatsApp"
                aria-label="Continuer sur WhatsApp"
              >
                <i className="fa-brands fa-whatsapp"></i>
              </a>
              <button
                type="button"
                className="chat-header-close-btn"
                onClick={() => setIsOpen(false)}
                title="Fermer"
                aria-label="Fermer le chat"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {/* Client Profile Sub-bar */}
          <div className="chat-client-bar">
            <div className="chat-client-info">
              <i className="fa-solid fa-circle-user"></i>
              <span className="text-truncate">{displayName}</span>
              <span className="chat-client-id-badge" title="Référence à communiquer au support">{clientId}</span>
            </div>
            {client ? (
              <span className="chat-badge-vip">Compte {client.tier || "VIP"}</span>
            ) : (
              <span className="chat-badge-guest">Invité</span>
            )}
          </div>

          {/* Attached Vehicle Preview Bar */}
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
                <span className="attached-car-badge">Véhicule sélectionné</span>
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
                title="Retirer"
                aria-label="Retirer le véhicule"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}

          {/* Message Stream */}
          <div className="chat-messages-container" aria-live="polite">
            <div className="chat-timestamp-divider">
              <span>Aujourd'hui</span>
            </div>

            {messages.map((msg, idx) => {
              const isClient = msg.sender === "client";
              const isEditing = editingMsgId === msg.id;

              return (
                <div
                  key={msg.id || idx}
                  className={`chat-message-bubble-wrapper ${isClient ? "is-client" : "is-admin"}`}
                >
                  {!isClient && (
                    <span className="chat-agent-avatar" aria-hidden="true">3M</span>
                  )}
                  {!isClient && (
                    <div className="chat-bubble-author">
                      <span className="badge-3m-staff">Conciergerie 3M</span>
                    </div>
                  )}

                  <div className={`chat-bubble ${isClient ? "bubble-client" : "bubble-admin"} ${msg.isDeleted ? "bubble-deleted" : ""}`}>
                    {/* Embedded car card */}
                    {msg.car && (
                      <div className="msg-embedded-car">
                        <img
                          src={msg.car.image || "/images/cars/toyota-landcruiser-v8-black.webp"}
                          alt={msg.car.name}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                        <div className="msg-embedded-car-details">
                          <strong>{msg.car.name}</strong>
                          <span>{msg.car.price ? `${Number(msg.car.price).toLocaleString("fr-FR")} FCFA/j` : "Tarif VIP"}</span>
                          {msg.car.url && (
                            <a
                              href={msg.car.url}
                              style={{ display: "inline-block", marginTop: "3px", fontSize: "1.1rem", color: "#D62828", fontWeight: 700, textDecoration: "underline" }}
                            >
                              Voir la fiche →
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Edit mode vs normal text */}
                    {isEditing ? (
                      <div className="chat-inline-edit-box">
                        <input
                          type="text"
                          className="chat-inline-edit-input"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(msg.id);
                            if (e.key === "Escape") setEditingMsgId(null);
                          }}
                          autoFocus
                        />
                        <div className="chat-inline-edit-btns">
                          <button type="button" onClick={() => handleSaveEdit(msg.id)} title="Enregistrer">
                            <i className="fa-solid fa-check"></i>
                          </button>
                          <button type="button" onClick={() => setEditingMsgId(null)} title="Annuler">
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bubble-text" style={{ whiteSpace: "pre-line" }}>
                        {renderMessageText(msg.text)}
                        {msg.isEdited && <span className="bubble-edited-tag"> (modifié)</span>}
                      </div>
                    )}
                    <ChatAttachment attachment={msg.attachment} />

                    <div className="bubble-time">
                      {formatTime(msg.timestamp || msg.time)}
                      {isClient && (
                        <span className="bubble-checks" title="Distribué">
                          <i className="fa-solid fa-check-double ms-1"></i>
                        </span>
                      )}
                    </div>

                    {/* CRUD actions for client own messages */}
                    {isClient && !msg.isDeleted && !isEditing && (
                      <div className="chat-msg-hover-actions">
                        <button
                          type="button"
                          className="msg-action-btn"
                          title="Modifier"
                          onClick={() => handleStartEdit(msg)}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          type="button"
                          className="msg-action-btn text-danger"
                          title="Supprimer"
                          onClick={() => handleDeleteMessage(msg.id)}
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Live Typing Indicator */}
            {adminIsTyping && (
              <div className="chat-message-bubble-wrapper is-admin">
                <div className="chat-bubble bubble-admin chat-typing-bubble">
                  <span className="chat-typing-label">Un conseiller écrit</span>
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="chat-message-bubble-wrapper is-client">
                <div className="chat-bubble bubble-client sending">
                  <span className="small">Envoi…</span>
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
              <i className="fa-solid fa-tag"></i> Tarif 3 jours Yaoundé
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleSendMessage("Bonjour, vos chauffeurs VIP sont-ils bien inclus dans les forfaits promotionnels ?")}
            >
              <i className="fa-solid fa-user-tie"></i> Chauffeur VIP inclus ?
            </button>
            <button
              type="button"
              className="quick-chip"
              onClick={() => handleSendMessage("Je souhaite réserver un Toyota Land Cruiser Prado TXL pour un cortège officiel.")}
            >
              <i className="fa-solid fa-car"></i> Réserver Prado TXL
            </button>
          </div>

          {/* Input & Send Form */}
          <div className="chat-input-bar">
            <textarea
              className="chat-textarea"
              rows="1"
              placeholder="Écrivez votre message…"
              aria-label="Votre message"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
            ></textarea>
            <button
              type="button"
              className="chat-send-btn"
              disabled={!inputText.trim()}
              onClick={() => handleSendMessage()}
              title="Envoyer"
              aria-label="Envoyer le message"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
    </div>
  );
}

export default PrivateChatWidget;