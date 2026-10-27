import React, { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Check,
  MessageSquare,
  Phone,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ApartmentModal({ apartment, isOpen, onClose }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    checkIn: "",
    duration: "Quelques jours",
    guests: "1-2 personnes",
    notes: ""
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setCurrentImgIndex(0);
    setSubmitted(false);
  }, [apartment, isOpen]);

  if (!isOpen || !apartment) return null;

  const images = Array.isArray(apartment.images) && apartment.images.length > 0
    ? apartment.images
    : apartment.image ? [apartment.image] : [];

  const activeImage = images[currentImgIndex] || apartment.image;

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour 3M SERVICES,\n` +
    `Je souhaite réserver ou visiter votre appartement meublé à Yaoundé :\n` +
    `• Résidence : ${apartment.title}\n` +
    `• Type : ${apartment.type}\n` +
    `• Localisation : ${apartment.location}\n` +
    `• Tarif : ${apartment.price}\n` +
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
    api.post("/submissions", {
      type: "apartment",
      payload: {
        name: formData.name,
        phone: formData.phone,
        apartment: apartment.title,
        location: apartment.location,
        price: apartment.price,
        duration: formData.duration,
        checkIn: formData.checkIn,
        guests: formData.guests,
        notes: formData.notes
      }
    }).catch(console.warn);
    toast.success("Votre demande de réservation d'appartement a été envoyée !");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white border border-gray-200 shadow-2xl overflow-hidden my-6 rounded-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 flex h-9 w-9 items-center justify-center bg-black/70 hover:bg-[#E20713] text-white rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[90vh] overflow-y-auto">
          {/* Left Media Gallery Column (7 cols) */}
          <div className="lg:col-span-7 bg-gray-950 flex flex-col justify-between relative min-h-[320px] lg:min-h-[480px]">
            {/* Main Active Photo */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              <img
                src={activeImage}
                alt={`${apartment.title} - Photo ${currentImgIndex + 1}`}
                className="w-full h-full object-cover max-h-[440px] select-none"
              />

              {/* Prev / Next Controls if multiple photos */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-[#E20713] text-white rounded-full transition-colors"
                    aria-label="Photo précédente"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-[#E20713] text-white rounded-full transition-colors"
                    aria-label="Photo suivante"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="absolute top-3 left-3 bg-black/70 text-white text-[11px] font-mono px-2.5 py-1 rounded-xs flex items-center gap-1.5 backdrop-blur-xs">
                    <ImageIcon className="h-3.5 w-3.5 text-[#E20713]" />
                    <span>{currentImgIndex + 1} / {images.length} photos</span>
                  </div>
                </>
              )}

              {/* Type Badge */}
              <div className="absolute bottom-3 left-3 bg-[#E20713] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xs shadow-md">
                {apartment.type}
              </div>
            </div>

            {/* Clickable Thumbnail Strip */}
            {images.length > 1 && (
              <div className="bg-[#111827] p-3 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/10">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentImgIndex(idx)}
                    className={`relative flex-shrink-0 h-14 w-20 rounded-xs overflow-hidden border-2 transition-all ${
                      currentImgIndex === idx
                        ? "border-[#E20713] opacity-100 scale-105"
                        : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Details Column (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between bg-[#FDFCFD] border-t lg:border-t-0 lg:border-l border-gray-200">
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E20713] font-mono">
                  3M SERVICES IMMOBILIER
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-gray-900 mt-1 leading-tight">
                  {apartment.title}
                </h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="h-3.5 w-3.5 text-[#E20713]" />
                  <span>{apartment.location}</span>
                </p>
                <div className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-xs border border-gray-100 font-medium">
                  {apartment.rooms}
                </div>
              </div>

              {/* Description */}
              {apartment.description && (
                <p className="text-xs text-gray-600 leading-relaxed">
                  {apartment.description}
                </p>
              )}

              {/* Amenities */}
              {Array.isArray(apartment.amenities) && apartment.amenities.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-800 mb-2 font-mono">
                    Équipements & Confort inclus :
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-700">
                    {apartment.amenities.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 truncate">
                        <Check className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Callout */}
              <div className="p-3 bg-red-50 border border-red-100 rounded-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Tarif de location</span>
                  <span className="text-base font-black text-[#E20713]">{apartment.price}</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-white text-gray-700 rounded-xs border border-gray-200">
                  {apartment.status || "Disponible"}
                </span>
              </div>

              {/* Actions & Call to Action */}
              <div className="space-y-2">
                <a
                  href="tel:+237691786447"
                  className="w-full py-3.5 px-4 bg-[#E20713] hover:bg-[#b3050f] text-white text-xs font-heading font-black uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs shadow-md transition-all hover:scale-[1.01]"
                >
                  <Phone className="h-4 w-4" />
                  <span>Appelez pour réserver : +237 691 78 64 47</span>
                </a>

                <a
                  href={`https://wa.me/237691786447?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs shadow-sm transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Réserver / Dispo sur WhatsApp</span>
                </a>

                <div className="text-center">
                  <p className="text-[11px] text-gray-500 font-medium">
                    ⚡ Réponse immédiate 24/7 • Appelez directement le <strong className="text-gray-900">+237 691 78 64 47</strong>
                  </p>
                </div>
              </div>

              {/* Inquiry Form */}
              {submitted ? (
                <div className="p-4 bg-gray-900 text-white text-center text-xs rounded-xs">
                  <p className="font-bold text-sm text-[#E20713]">Demande transmise avec succès !</p>
                  <p className="text-stone-300 mt-1">Notre conciergerie 3M Services vous contactera dans l'heure.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2.5 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Votre nom complet *"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-xs focus:outline-none focus:border-[#E20713] bg-white"
                    />
                    <input
                      type="tel"
                      placeholder="Téléphone / WhatsApp *"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-xs focus:outline-none focus:border-[#E20713] bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Date d'arrivée (ex: 25 Oct)"
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-xs focus:outline-none focus:border-[#E20713] bg-white"
                    />
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-xs focus:outline-none focus:border-[#E20713] bg-white"
                    >
                      <option value="Quelques jours">1 à 6 nuits</option>
                      <option value="1 à 2 semaines">1 à 2 semaines</option>
                      <option value="1 mois et plus">1 mois et plus</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-colors"
                  >
                    Envoyer une demande de réservation
                  </button>
                </form>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500 font-mono">
              <span>Agence 3M Services • Yaoundé</span>
              <span>« Le confort de votre foyer »</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
