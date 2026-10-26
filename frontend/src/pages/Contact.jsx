import React, { useState } from "react";
import { Phone, MessageSquare, MapPin, Mail, Clock, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "Achat Véhicule",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    api.post("/submissions", {
      type: "contact",
      payload: formData
    }).catch(console.warn);
    toast.success("Votre demande a bien été envoyée à l'équipe 3M SERVICES !");
  };

  return (
    <div className="min-h-screen bg-bone text-forest pt-12 pb-24" data-testid="contact-page">
      
      {/* Header */}
      <section className="py-16 md:py-24 border-b border-forest/15 bg-gradient-to-b from-[#FAF9F5] to-bone">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-maple font-mono">
              CONTACTEZ-NOUS
            </span>
            <h1 className="font-heading font-black text-4xl sm:text-6xl text-forest tracking-tight">
              3M SERVICES YAOUNDÉ
            </h1>
            <p className="font-serif italic text-2xl text-sage">
              « Le confort de votre foyer, dans nos véhicules »
            </p>
            <p className="text-sm text-sage">
              Vente de véhicules, location automobile et d'appartements meublés. Nous sommes à votre écoute 7 jours sur 7.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Info cards (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 bg-white border border-forest/15 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-maple">
                  <MapPin className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">Siège & Showroom</span>
                </div>
                <h3 className="text-lg font-heading font-bold text-forest">Yaoundé, Région du Centre</h3>
                <p className="text-xs text-sage">
                  Cameroun • Proche des grands axes urbains, accès aisé et parking sécurisé pour nos visiteurs.
                </p>
              </div>

              <div className="p-6 bg-emerald-50 border border-emerald-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">WhatsApp 7j/7</span>
                </div>
                <h3 className="text-lg font-heading font-bold text-emerald-950">+237 691 78 64 47</h3>
                <p className="text-xs text-emerald-800">
                  Réponse instantanée de notre équipe commerciale pour tarifs, disponibilités et photos complémentaires.
                </p>
                <a
                  href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors"
                >
                  Ouvrir WhatsApp Direct
                </a>
              </div>

              <div className="p-6 bg-white border border-forest/15 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-[#E20713]">
                  <Phone className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">Lignes Téléphoniques Directes</span>
                </div>
                <div className="space-y-1.5">
                  <a href="tel:+237691786447" className="text-base font-heading font-bold text-forest hover:text-[#E20713] transition-colors flex items-center gap-2">
                    <span className="text-[#E20713]">•</span>
                    <span>+237 691 78 64 47</span>
                  </a>
                  <a href="tel:+237653761728" className="text-base font-heading font-bold text-forest hover:text-[#E20713] transition-colors flex items-center gap-2">
                    <span className="text-[#E20713]">•</span>
                    <span>+237 653 76 17 28</span>
                  </a>
                  <a href="tel:+237691786447" className="text-base font-heading font-bold text-forest hover:text-[#E20713] transition-colors flex items-center gap-2">
                    <span className="text-[#E20713]">•</span>
                    <span>+237 691 78 64 47</span>
                  </a>
                </div>
                <p className="text-xs text-sage pt-1 border-t border-gray-100">
                  Du Lundi au Samedi : 08h00 - 19h00 • Dimanche sur rendez-vous.
                </p>
              </div>
            </div>

            {/* Form (7 cols) */}
            <div className="lg:col-span-7 bg-[#FAF9F5] border border-forest/15 p-6 sm:p-10 shadow-sm">
              <h3 className="text-2xl font-heading font-bold text-forest mb-2">Formulaire de Contact Direct</h3>
              <p className="text-xs text-sage mb-6">
                Laissez-nous vos coordonnées et le motif de votre requête.
              </p>

              {submitted ? (
                <div className="p-8 bg-forest text-bone text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                  <h4 className="text-lg font-bold">Message Reçu !</h4>
                  <p className="text-xs text-bone/70 mt-2 max-w-sm mx-auto">
                    Merci {formData.name}, notre conseiller 3M SERVICES vous répondra rapidement par téléphone au {formData.phone}.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-xs underline text-maple hover:text-white"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Votre nom"
                        className="w-full px-4 py-2.5 text-xs bg-white border border-forest/20 focus:outline-none focus:border-maple"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                        Numéro Téléphone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+237 6..."
                        className="w-full px-4 py-2.5 text-xs bg-white border border-forest/20 focus:outline-none focus:border-maple"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                        Service souhaité
                      </label>
                      <select
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full px-4 py-2.5 text-xs bg-white border border-forest/20 focus:outline-none focus:border-maple"
                      >
                        <option>Achat Véhicule Neuf (0 km)</option>
                        <option>Achat Véhicule Occasion</option>
                        <option>Commande Spéciale (Section 12)</option>
                        <option>Location Véhicule</option>
                        <option>Location Appartement Meublé</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                        Email (optionnel)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="votre@email.com"
                        className="w-full px-4 py-2.5 text-xs bg-white border border-forest/20 focus:outline-none focus:border-maple"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                      Votre Message
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Détails du véhicule recherché, dates de location ou toute question..."
                      className="w-full px-4 py-2.5 text-xs bg-white border border-forest/20 focus:outline-none focus:border-maple resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 shadow"
                  >
                    <span>Envoyer à 3M SERVICES</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
