import React, { useState } from "react";
import Footer from "../components/Footer";
import HeroPages from "../components/HeroPages";
import { useTranslation } from "../context/LanguageContext";
import { API_BASE } from "../config/api";

function Contact() {
  const { lang } = useTranslation();
  const isFr = lang === "fr";

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    message: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          contact: formData.contact,
          message: formData.message
        })
      });
    } catch (err) {
      console.warn("Backend non joignable:", err);
    }

    const text = encodeURIComponent(
      `Bonjour 3M SERVICES,\n` +
      `Message envoyé depuis le formulaire de contact :\n` +
      `• Nom : ${formData.name}\n` +
      `• Contact : ${formData.contact}\n` +
      `• Message : ${formData.message}\n`
    );
    window.open(`https://wa.me/237691786447?text=${text}`, "_blank");
    alert(
      isFr
        ? "Votre message a été enregistré et transmis à la conciergerie 3M SERVICES !"
        : "Your message has been received and forwarded to 3M SERVICES concierge!"
    );
    setFormData({ name: "", contact: "", message: "" });
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
                      ? "Véhicule souhaité, dates de location, formule avec chauffeur..."
                      : "Desired vehicle, rental dates, chauffeur service..."
                  }
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />

                <button type="submit">
                  <i className="fa-solid fa-paper-plane"></i>&nbsp; {isFr ? "Envoyer le Message" : "Send Message"}
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
