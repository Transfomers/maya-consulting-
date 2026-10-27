import React, { useState, useEffect } from "react";
import { X, Car, MessageSquare, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SiteModalPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const isDismissed = sessionStorage.getItem("3m_modal_dismissed");
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    sessionStorage.setItem("3m_modal_dismissed", "true");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Veuillez renseigner votre numéro WhatsApp.");
      return;
    }
    toast.success("Merci ! Notre conseiller 3M SERVICES vous contactera sur WhatsApp.");
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white border border-forest/20 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center bg-forest/10 hover:bg-forest hover:text-white rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 bg-maple text-white text-[10px] font-bold uppercase tracking-widest">
            3M SERVICES • YAOUNDÉ
          </span>
          <span className="text-[10px] font-mono text-sage uppercase">Édition 2025</span>
        </div>

        <h3 className="text-2xl font-heading font-black text-forest">
          CATALOGUE AUTOMOBILE 2025
        </h3>
        
        <p className="font-serif italic text-base text-forest/80 mt-1">
          « Le confort de votre foyer, dans nos véhicules »
        </p>

        <p className="text-xs text-sage mt-2 leading-relaxed">
          Besoin d'un devis urgent pour l'achat d'un véhicule neuf ou d'occasion, ou d'une réservation de voiture ou appartement à Yaoundé ?
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
              Votre Téléphone / WhatsApp :
            </label>
            <input
              type="tel"
              required
              placeholder="+237 6..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-forest/20 focus:outline-none focus:border-maple"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Être recontacté par 3M
            </button>
            <a
              href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors"
              title="WhatsApp direct"
            >
              <MessageSquare className="h-4 w-4" />
            </a>
          </div>
        </form>

        <p className="text-[10px] text-sage text-center mt-4">
          Yaoundé, Région du Centre, Cameroun • Vente & Location
        </p>
      </div>
    </div>
  );
}
