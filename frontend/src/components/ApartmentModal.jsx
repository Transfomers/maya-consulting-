import React, { useState } from "react";
import { X, Home, MapPin, Wifi, Shield, Check, MessageSquare, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function ApartmentModal({ apartment, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    checkIn: "",
    duration: "Quelques jours",
    guests: "1-2 personnes",
    notes: ""
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !apartment) return null;

  const whatsappMessage = encodeURIComponent(
    `Bonjour 3M SERVICES,\n` +
    `Je souhaite réserver ou visiter votre appartement meublé à Yaoundé :\n` +
    `• Résidence : ${apartment.title}\n` +
    `• Type : ${apartment.type}\n` +
    `• Localisation : ${apartment.location}\n` +
    `• Durée envisagée : ${formData.duration}\n` +
    `• Période souhaitée : ${formData.checkIn || "Dès que possible"}\n\n` +
    `Contact : ${formData.name || "Client"} (${formData.phone || ""})`
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Veuillez renseigner votre nom et votre numéro de téléphone.");
      return;
    }
    setSubmitted(true);
    toast.success("Votre demande de réservation d'appartement a été envoyée !");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white border border-forest/20 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center bg-black/60 hover:bg-black text-white rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[90vh] overflow-y-auto">
          {/* Left Media */}
          <div className="md:col-span-5 bg-forest relative min-h-[220px]">
            <img
              src={apartment.image}
              alt={apartment.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="px-2.5 py-1 bg-maple text-[11px] font-bold uppercase tracking-wider">
                Location Meublée Yaoundé
              </span>
              <h4 className="text-xl font-heading font-black text-white mt-2">
                {apartment.title}
              </h4>
              <p className="text-xs text-white/80 flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-maple-light" />
                {apartment.location}
              </p>
            </div>
          </div>

          {/* Right Content */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-bone">
            <div>
              <div className="border-b border-forest/10 pb-3 mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-maple">3M SERVICES IMMOBILIER</p>
                <h3 className="text-xl font-heading font-bold text-forest">{apartment.type}</h3>
                <p className="text-xs text-sage mt-1">{apartment.rooms}</p>
              </div>

              <p className="text-xs text-sage leading-relaxed mb-4">
                {apartment.description}
              </p>

              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-forest mb-2">
                  Équipements inclus :
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-forest">
                  {apartment.amenities.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 mb-5">
                <a
                  href={`https://wa.me/237677000000?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Réserver / Demander le tarif sur WhatsApp
                </a>
              </div>

              {submitted ? (
                <div className="p-4 bg-forest text-bone text-center text-xs">
                  <p className="font-bold text-sm">Demande transmise avec succès !</p>
                  <p className="text-bone/70 mt-1">Notre conciergerie 3M Services vous contactera dans l'heure.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nom complet *"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple bg-white"
                    />
                    <input
                      type="tel"
                      placeholder="Téléphone / WhatsApp *"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Date d'arrivée souhaitée"
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple bg-white"
                    />
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple bg-white"
                    >
                      <option value="Quelques jours">Quelques jours (1-6 nuits)</option>
                      <option value="1 à 2 semaines">1 à 2 semaines</option>
                      <option value="1 mois et plus">1 mois et plus (tarif dégressif)</option>
                      <option value="Long séjour">Long séjour professionnel</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    Demander une disponibilité
                  </button>
                </form>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-forest/10 flex items-center justify-between text-[10px] text-sage">
              <span>Sécurité 24/7 • Yaoundé, Cameroun</span>
              <span>"Le confort de votre foyer"</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
