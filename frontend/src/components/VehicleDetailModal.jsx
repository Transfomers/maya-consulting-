import React, { useState } from "react";
import { X, Check, Phone, MessageSquare, Shield, Gauge, Fuel, Users, Calendar, ArrowRight, Sparkles, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import api from "@/lib/api";

export default function VehicleDetailModal({ vehicle, isOpen, onClose }) {
  const { addToCart, isInCart } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    intent: "achat", // "achat" | "location" | "info"
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !vehicle) return null;

  const whatsappMessage = encodeURIComponent(
    `Bonjour 3M SERVICES,\n` +
    `Je vous contacte concernant le véhicule du Catalogue Automobile 2025 :\n` +
    `• Modèle : ${vehicle.model}\n` +
    `• Section : ${vehicle.sectionTitle} (${vehicle.section})\n` +
    `• Moteur : ${vehicle.engine}\n` +
    `• Transmission : ${vehicle.transmission}\n` +
    `• Condition : ${vehicle.condition}\n` +
    `• Formule souhaitée : ${formData.intent === "leasing-mupocam" ? "Vente en LEASING / Paiement Échelonné (MUPOCAM Orange Cameroun)" : formData.intent.toUpperCase()}\n\n` +
    `Merci de me contacter pour les modalités et échéanciers à l'agence Nouvelle route - Omnisports, Yaoundé.`
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Veuillez renseigner votre nom et votre numéro de téléphone.");
      return;
    }
    setSubmitted(true);
    api.post("/submissions", {
      type: formData.intent === "leasing-mupocam" ? "mupocam" : "quote",
      payload: {
        name: formData.name,
        phone: formData.phone,
        vehicle: vehicle.model,
        section: vehicle.section,
        condition: vehicle.condition,
        intent: formData.intent,
        engine: vehicle.engine,
        transmission: vehicle.transmission,
        price: vehicle.price
      }
    }).catch(console.warn);
    toast.success(`Votre demande pour ${vehicle.model} a bien été transmise à l'équipe 3M SERVICES !`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white border border-forest/20 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center bg-black/60 hover:bg-black text-white rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[90vh] overflow-y-auto">
          {/* Vehicle Media Column */}
          <div className="md:col-span-6 bg-forest text-white relative flex flex-col">
            <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-forest/20">
              <img
                src={vehicle.image}
                alt={vehicle.model}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-maple text-white text-xs font-bold uppercase tracking-wider">
                  SECTION {vehicle.section} • {vehicle.sectionTitle}
                </span>
                <span className={`px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${
                  vehicle.condition === "Neuve" || vehicle.mileage === "0 km"
                    ? "bg-emerald-500 text-white" 
                    : "bg-amber-500 text-black"
                }`}>
                  {vehicle.condition || "Occasion"}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs uppercase tracking-widest text-white/70 font-mono">3M SERVICES • CATALOGUE 2025</p>
                <h3 className="text-2xl sm:text-3xl font-heading font-black text-white leading-tight mt-1">
                  {vehicle.model}
                </h3>
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="p-6 bg-[#141815] grid grid-cols-2 gap-4 border-t border-white/10 flex-1">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded bg-white/10 flex items-center justify-center text-maple-light flex-shrink-0">
                  <Fuel className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50">Moteur</p>
                  <p className="text-xs font-bold text-white">{vehicle.engine}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded bg-white/10 flex items-center justify-center text-maple-light flex-shrink-0">
                  <Gauge className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50">Transmission</p>
                  <p className="text-xs font-bold text-white">{vehicle.transmission}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded bg-white/10 flex items-center justify-center text-maple-light flex-shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50">Capacité</p>
                  <p className="text-xs font-bold text-white">{vehicle.seats || "5 places"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded bg-white/10 flex items-center justify-center text-maple-light flex-shrink-0">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50">Compteur</p>
                  <p className="text-xs font-bold text-white">{vehicle.mileage || (vehicle.condition === "Neuve" ? "0 km" : "Certifié")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form & Action Column */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-bone">
            <div>
              <div className="flex items-center justify-between gap-2 border-b border-forest/10 pb-4 mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-maple">Disponible à Yaoundé</span>
                  <h4 className="text-xl font-heading font-black text-forest">Fiche Technique & Réservation</h4>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-forest/5 text-forest font-bold text-xs">
                    Réf: {vehicle.id}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-sage leading-relaxed mb-5">
                {vehicle.description || "Ce véhicule rigoureusement sélectionné par 3M SERVICES combine confort optimal, sécurité et fiabilité pour toutes vos exigences de déplacement dans la région du Centre et à travers le Cameroun."}
              </p>

              {/* Key Features */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-forest mb-2.5">
                    Équipements & Points Forts :
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vehicle.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-forest/90">
                        <Check className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MUPOCAM Leasing Partnership Notice */}
              <div className="p-3.5 bg-[#0D0F0E] text-white rounded border border-[#FF7900]/40 flex items-center justify-between gap-3 mb-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <img
                    src="/Asset/logo-mupocam.png"
                    alt="MUPOCAM - Mutuelle du Personnel Orange Cameroun"
                    className="h-8 w-auto object-contain flex-shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-mono text-[#FF7900] font-bold uppercase tracking-wider block">
                      Partenariat Officiel MUPOCAM
                    </span>
                    <span className="text-xs text-stone-200 block">
                      Éligible à l'achat en <strong>Leasing & Paiement Échelonné</strong> (Orange Cameroun).
                    </span>
                  </div>
                </div>
                <a
                  href="/Asset/car.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-[#FF7900] hover:bg-[#E06800] text-black font-bold text-[10px] uppercase tracking-wider rounded transition-colors flex-shrink-0"
                >
                  Brochure
                </a>
              </div>

              {/* Instant WhatsApp Direct CTA */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      Réponse Immédiate par WhatsApp
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Discutez directement avec un conseiller 3M Services pour le prix et les modalités.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <a
                    href={`https://wa.me/237691786447?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm rounded-xs"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Commander sur WhatsApp</span>
                  </a>

                  {isInCart(vehicle.id) ? (
                    <button
                      onClick={() => {
                        onClose();
                        window.location.href = "/panier";
                      }}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#111827] hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xs"
                    >
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Au Panier ✓</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => addToCart(vehicle)}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#E20713] hover:bg-[#C4050F] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm rounded-xs"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Ajouter au Panier</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Direct Booking Form */}
              {submitted ? (
                <div className="p-4 bg-gray-900 text-white text-center">
                  <Check className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-bold">Demande envoyée avec succès !</p>
                  <p className="text-xs text-bone/70 mt-1">
                    Notre équipe commerciale vous contactera au {formData.phone} dans les plus brefs délais.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-3 text-xs underline text-maple hover:text-white"
                  >
                    Envoyer une autre demande
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-forest">
                    Ou laissez vos coordonnées :
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Votre nom complet *"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-forest/20 bg-white focus:outline-none focus:border-maple"
                    />
                    <input
                      type="tel"
                      placeholder="Numéro de téléphone / WhatsApp *"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-forest/20 bg-white focus:outline-none focus:border-maple"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={formData.intent}
                      onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-forest/20 bg-white focus:outline-none focus:border-maple"
                    >
                      <option value="achat">Projet d'Achat au Comptant</option>
                      <option value="leasing-mupocam">Vente en Leasing / Paiement Échelonné (MUPOCAM)</option>
                      <option value="location">Demande de Location (Courte/Longue)</option>
                      <option value="info">Renseignements techniques</option>
                      <option value="sur-mesure">Commande spéciale similaire</option>
                    </select>

                    <input
                      type="email"
                      placeholder="Adresse email (optionnel)"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-forest/20 bg-white focus:outline-none focus:border-maple"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Votre message ou question spécifique..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-forest/20 bg-white focus:outline-none focus:border-maple resize-none"
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Transmettre ma demande</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <a
                      href="tel:+237691786447"
                      className="px-4 py-3 bg-white border border-forest/20 text-forest hover:bg-forest/5 flex items-center justify-center transition-colors"
                      title="Appeler directement"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-forest/10 flex items-center justify-between text-[10px] text-sage">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-emerald-600" /> 3M SERVICES • Yaoundé, Cameroun
              </span>
              <span>"Le confort de votre foyer, dans nos véhicules"</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
