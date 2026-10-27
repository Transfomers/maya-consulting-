import React, { useState } from "react";
import { X, Sparkles, MessageSquare, Phone, CheckCircle2, ShieldCheck, Car } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function CustomOrderModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    brand: "",
    model: "",
    yearMin: "2018",
    budget: "",
    fuel: "Essence",
    notes: ""
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const whatsappMessage = encodeURIComponent(
    `Bonjour 3M SERVICES,\n` +
    `Je souhaite passer une commande sur mesure pour un véhicule :\n` +
    `• Marque : ${formData.brand || "Non spécifiée"}\n` +
    `• Modèle recherché : ${formData.model || "Non spécifié"}\n` +
    `• Année min : ${formData.yearMin}\n` +
    `• Carburant : ${formData.fuel}\n` +
    `• Budget approximatif : ${formData.budget || "À discuter"}\n` +
    `• Précisions : ${formData.notes || "Aucune"}\n\n` +
    `Contact : ${formData.name || "Client"} (${formData.phone || ""})`
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.brand) {
      toast.error("Veuillez renseigner votre nom, téléphone et la marque recherchée.");
      return;
    }
    setSubmitted(true);
    api.post("/submissions", {
      type: "custom_order",
      payload: {
        name: formData.name,
        phone: formData.phone,
        brand: formData.brand,
        model: formData.model,
        year: formData.yearMin,
        fuel: formData.fuel,
        budget: formData.budget,
        notes: formData.notes
      }
    }).catch(console.warn);
    toast.success("Votre demande de commande spéciale a été enregistrée avec succès !");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white border border-forest/20 shadow-2xl p-6 sm:p-8 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center bg-forest/10 hover:bg-forest hover:text-white rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Car className="h-5 w-5 text-maple" />
          <span className="text-xs font-bold uppercase tracking-widest text-maple">SECTION 12</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-heading font-black text-forest">
          ET BIEN D'AUTRES MARQUES SUR COMMANDES...
        </h3>
        <p className="text-xs sm:text-sm text-sage mt-1 mb-6">
          Vous cherchez une marque spécifique ? Mercedes, Audi, BMW, Toyota, Land Rover, Kia, Hyundai, Lexus, Porsche, Ford... 
          3M SERVICES s'occupe du sourcing, de l'inspection technique certifiée, de l'acheminement et du dédouanement complet jusqu'à Yaoundé.
        </p>

        {submitted ? (
          <div className="p-6 bg-forest text-bone text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold">Demande de Commande Spéciale Reçue !</h4>
            <p className="text-xs text-bone/80 max-w-md mx-auto mt-2">
              Un spécialiste automobile de 3M SERVICES va étudier votre requête pour votre {formData.brand} {formData.model} et vous recontacter au {formData.phone}.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <a
                href={`https://wa.me/237691786447?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Confirmer aussi sur WhatsApp
              </a>
              <button
                onClick={onClose}
                className="py-2.5 px-4 bg-white/20 hover:bg-white/30 text-white text-xs font-bold uppercase tracking-wider"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                  Marque souhaitée *
                </label>
                <input
                  type="text"
                  placeholder="ex: BMW, Audi, Lexus, Toyota..."
                  required
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                  Modèle exact
                </label>
                <input
                  type="text"
                  placeholder="ex: X5, Q7, RX 350, Prado..."
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                  Année minimale
                </label>
                <select
                  value={formData.yearMin}
                  onChange={(e) => setFormData({ ...formData, yearMin: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple"
                >
                  <option value="2025">2025 (Neuf 0km)</option>
                  <option value="2024">2024</option>
                  <option value="2022">2022 et plus</option>
                  <option value="2020">2020 et plus</option>
                  <option value="2018">2018 et plus</option>
                  <option value="2015">2015 et plus</option>
                  <option value="Toutes">Peu importe</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                  Carburant
                </label>
                <select
                  value={formData.fuel}
                  onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple"
                >
                  <option value="Essence">Essence</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybride">Hybride</option>
                  <option value="Indifférent">Indifférent</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                  Budget estimé (FCFA)
                </label>
                <input
                  type="text"
                  placeholder="ex: 15 - 25 millions"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                  Votre nom complet *
                </label>
                <input
                  type="text"
                  placeholder="Votre nom et prénom"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                  Téléphone / WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="+237 6..."
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                Options particulières / Spécifications
              </label>
              <textarea
                rows={2}
                placeholder="Couleur souhaitée, cuir, toit ouvrant, 7 places, etc."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-forest/20 focus:outline-none focus:border-maple resize-none"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 py-3 px-6 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <span>Envoyer ma recherche personnalisée</span>
                <Sparkles className="h-4 w-4" />
              </button>

              <a
                href={`https://wa.me/237691786447?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp Direct</span>
              </a>
            </div>

            <p className="text-[10px] text-sage text-center pt-2">
              <ShieldCheck className="inline h-3.5 w-3.5 text-emerald-600 mr-1" />
              Garantie d'inspection certifiée & transparence totale 3M SERVICES à Yaoundé.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
