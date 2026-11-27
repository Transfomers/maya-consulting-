import React, { useState } from "react";
import Footer from "../components/Footer";
import HeroPages from "../components/HeroPages";
import { useTranslation } from "../context/LanguageContext";
import { getCurrentClient } from "../utils/customerAccounts";
import { postContact, queueContact, flushPendingContacts } from "../utils/pendingContacts";

function Contact() {
  const { lang } = useTranslation();
  const isFr = lang === "fr";
  const currentClient = getCurrentClient();

  const [formData, setFormData] = useState({
    name: currentClient?.name || "",
    contact: currentClient?.phone || currentClient?.email || "",
    message: ""
  });
  const [isSending, setIsSending] = useState(false);
  const [submitState, setSubmitState] = useState(null); // { type: 'success'|'error', text: string, whatsappUrl?: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const trimmedContact = formData.contact.trim();
    const trimmedMessage = formData.message.trim();
    if (!trimmedName || !trimmedContact || !trimmedMessage || isSending) return;

    const isEmail = trimmedContact.includes("@");
    const phone = !isEmail ? trimmedContact : currentClient?.phone || "";
    const email = isEmail ? trimmedContact : currentClient?.email || "";

    let guestId = localStorage.getItem("3m_guest_chat_id");
    if (!guestId) {
      guestId = "GUEST-" + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem("3m_guest_chat_id", guestId);
    }
    const clientId = currentClient?.accountNumber || guestId;

    // Request browser notification permission on user gesture so concierge replies alert the client
    try {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    } catch (_) {}

    const newContact = {
      id: `ct-${Date.now()}`,
      name: trimmedName,
      contact: trimmedContact,
      phone,
      email,
      subject: "Demande Contact & Conciergerie",
      message: trimmedMessage,
      createdAt: new Date().toISOString()
    };

    // 1. Sync to local CRM store & persist guest contact info for PrivateChatWidget
    try {
      localStorage.setItem(
        "3m_guest_contact_info",
        JSON.stringify({ name: trimmedName, phone, email })
      );
      const rawStore = localStorage.getItem("3m_crm_store_v2");
      let store = {};
      if (rawStore) store = JSON.parse(rawStore);
      store.contacts = [newContact, ...(store.contacts || [])];
      localStorage.setItem("3m_crm_store_v2", JSON.stringify(store));
      localStorage.setItem("3m_last_message_ping", Date.now().toString());
      window.dispatchEvent(new CustomEvent("3m_new_contact", { detail: newContact }));
    } catch (localErr) {
      console.warn("Local notification sync error:", localErr);
    }

    // 2. Envoi à la conciergerie (Express -> chat Conciergerie + notification admin Flask)
    setIsSending(true);
    setSubmitState(null);

    const waText = encodeURIComponent(
      `Bonjour 3M SERVICES,\n` +
        `Message envoyé depuis le formulaire de contact :\n` +
        `• Nom : ${trimmedName}\n` +
        `• Contact : ${trimmedContact}\n` +
        `• Message : ${trimmedMessage}\n`
    );
    const whatsappUrl = `https://wa.me/237691786447?text=${waText}`;
    const payload = {
      requestId: `ct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName,
      contact: trimmedContact,
      phone,
      email,
      message: trimmedMessage,
      clientId,
      guestId
    };

    const result = await postContact(payload);
    setIsSending(false);

    if (result.ok) {
      setSubmitState({
        type: "success",
        text: isFr
          ? "Votre demande a été transmise à la conciergerie 3M SERVICES ! Un conseiller vous répond dans cette discussion ou vous contacte au numéro / e-mail indiqué."
          : "Your request has been sent to the 3M SERVICES concierge! An advisor will reply in this chat or contact you using the details you provided.",
        whatsappUrl
      });
      setFormData((prev) => ({ ...prev, message: "" }));
      flushPendingContacts();
      // Ouvre la discussion : le client voit sa demande et reçoit les réponses au même endroit
      window.dispatchEvent(
        new CustomEvent("3m-open-chat", { detail: { name: trimmedName, phone, email, refresh: true } })
      );
      return;
    }

    if (result.retry) {
      // Serveur injoignable : le message est gardé et renvoyé automatiquement (jamais perdu)
      queueContact(payload);
      setSubmitState({
        type: "pending",
        text: isFr
          ? "Connexion momentanément indisponible. Votre message est enregistré et sera transmis automatiquement à la conciergerie dès le retour de la connexion. Un conseiller vous contactera au numéro / e-mail indiqué. Pour une réponse immédiate, continuez sur WhatsApp."
          : "Connection temporarily unavailable. Your message is saved and will be sent to the concierge automatically as soon as the connection is back. An advisor will contact you using the details you provided. For an immediate answer, continue on WhatsApp.",
        whatsappUrl
      });
      setFormData((prev) => ({ ...prev, message: "" }));
      return;
    }

    setSubmitState({
      type: "error",
      text: result.error || (isFr ? "Veuillez vérifier les informations saisies." : "Please check the information entered.")
    });
  };

  return (
    <>
      <section className="contact-page">
        <HeroPages name={isFr ? "Contact & Conciergerie" : "Contact & Concierge"} />
        <div className="container">
          <div className="contact-div">
            <div className="contact-div__text">
              <h2>
                {isFr
                  ? "Besoin d'une information ou d'un devis ?"
                  : "Need information or a free quote?"}
              </h2>
              <p>
                {isFr
                  ? "Notre équipe est à votre écoute 24h/24 et 7j/7 pour toutes vos demandes de location de véhicules, transferts VIP à l'Aéroport de Yaoundé-Nsimalen ou réservation d'appartements meublés à Tsinga face FECAFOOT."
                  : "Our team is available 24/7 for all your vehicle rental requests, VIP airport transfers at Yaoundé-Nsimalen, or furnished apartment bookings in Tsinga opposite FECAFOOT."}
              </p>
              <a href="tel:+237691786447">
                <i className="fa-solid fa-phone"></i>&nbsp; +237 691 78 64 47
              </a>
              <a href="tel:+237653761728">
                <i className="fa-solid fa-phone"></i>&nbsp; +237 653 76 17 28
              </a>
              <a href="mailto:contact@3mservice.shop">
                <i className="fa-solid fa-envelope"></i>&nbsp; contact@3mservice.shop
              </a>
              <a href="https://maps.google.com" target="_blank" rel="noreferrer">
                <i className="fa-solid fa-location-dot"></i>&nbsp; {isFr ? "Yaoundé, Cameroun (Omnisports & Tsinga Face FECAFOOT)" : "Yaoundé, Cameroon (Omnisports & Tsinga opposite FECAFOOT)"}
              </a>
            </div>
            <div className="contact-div__form">
              <form onSubmit={handleSubmit}>
                <label>
                  {isFr ? "Nom & Prénom" : "Full Name"} <b>*</b>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isFr ? "Ex: Arnaud Mbarga" : "e.g. Arnaud Mbarga"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <label>
                  {isFr ? "Téléphone WhatsApp ou Email" : "WhatsApp Phone or Email"} <b>*</b>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isFr ? "+237 6XX XX XX XX ou email" : "+237 6XX XX XX XX or email"}
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />

                <label>
                  {isFr ? "Détails de votre demande" : "Details of your request"} <b>*</b>
                </label>
                <textarea
                  required
                  placeholder={
                    isFr
                      ? "Véhicule souhaité, dates de location, lieu de prise en charge..."
                      : "Desired vehicle, rental dates, pick-up location..."
                  }
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />

                {submitState && (
                  <div
                    role="status"
                    style={{
                      marginBottom: "1.4rem",
                      padding: "1.1rem 1.3rem",
                      borderRadius: "10px",
                      fontSize: "1.35rem",
                      lineHeight: 1.5,
                      border: { success: "1px solid #abefc6", pending: "1px solid #fedf89" }[submitState.type] || "1px solid #fecdca",
                      background: { success: "#ecfdf3", pending: "#fffaeb" }[submitState.type] || "#fef3f2",
                      color: { success: "#067647", pending: "#93370d" }[submitState.type] || "#b42318"
                    }}
                  >
                    <div>{submitState.text}</div>
                    {submitState.whatsappUrl && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                        {submitState.type === "success" && (
                        <button
                          type="button"
                          onClick={() => window.dispatchEvent(new CustomEvent("3m-open-chat", { detail: { refresh: true } }))}
                          style={{
                            padding: "7px 14px",
                            borderRadius: "8px",
                            border: "1px solid #067647",
                            background: "#067647",
                            color: "#fff",
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          <i className="fa-regular fa-comment-dots"></i>&nbsp;
                          {isFr ? "Ouvrir la discussion Conciergerie" : "Open Concierge Chat"}
                        </button>
                        )}
                        {submitState.whatsappUrl && (
                          <a
                            href={submitState.whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "7px 14px",
                              borderRadius: "8px",
                              border: "1px solid #25D366",
                              background: "#fff",
                              color: "#128c4b",
                              fontSize: "1.25rem",
                              fontWeight: 600,
                              textDecoration: "none"
                            }}
                          >
                            <i className="fa-brands fa-whatsapp"></i>&nbsp;
                            {submitState.type === "pending"
                              ? (isFr ? "Continuer sur WhatsApp" : "Continue on WhatsApp")
                              : (isFr ? "Continuer aussi sur WhatsApp" : "Also continue on WhatsApp")}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={isSending}>
                  <i className="fa-solid fa-paper-plane"></i>&nbsp;{" "}
                  {isSending
                    ? isFr
                      ? "Envoi en cours..."
                      : "Sending..."
                    : isFr
                      ? "Envoyer le Message"
                      : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </section>
    </>
  );
}

export default Contact;
