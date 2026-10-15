import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Star, CheckCircle, Mail, MessageSquareQuote } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { IMAGES } from "@/lib/content";

export default function SiteModalPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("newsletter"); // "newsletter" | "review"
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("cap_modal_dismissed");
    if (!isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 4000); // Popup after 4 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    sessionStorage.setItem("cap_modal_dismissed", "true");
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Veuillez saisir une adresse courriel valide.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/submissions", {
        type: "newsletter",
        payload: {
          email: email.trim(),
          name: email.split("@")[0],
          source: "popup_modal",
        },
      });
      setSubmitted(true);
      toast.success("Merci ! Vous êtes bien inscrit(e) à nos actualités exclusives.");
      setTimeout(() => {
        closeModal();
      }, 2500);
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewMessage.trim()) {
      toast.error("Veuillez saisir votre message ou avis.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/submissions", {
        type: "review",
        payload: {
          name: name.trim() || "Visiteur engagé",
          email: email.trim() || "visiteur@capentrepreneurs.org",
          rating: rating,
          message: reviewMessage.trim(),
          source: "popup_review",
        },
      });
      setSubmitted(true);
      toast.success("Merci pour votre avis ! Votre retour a bien été transmis.");
      setTimeout(() => {
        closeModal();
      }, 2500);
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue lors de l'envoi de l'avis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher badge if closed so users can open anytime */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setSubmitted(false);
          }}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2.5 bg-white border border-[#0D0E0D]/20 px-3.5 py-2 text-xs font-semibold text-[#0D0E0D] shadow-lg transition-all hover:border-maple hover:text-maple hover:scale-105"
          aria-label="Ouvrir le formulaire d'inscription et d'avis"
        >
          <Mail className="h-3.5 w-3.5 text-maple" />
          <span>Infolettre & Avis</span>
        </button>
      )}

      {/* Modal Backdrop & Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0D0E0D]/65 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden bg-white border border-[#0D0E0D]/15 shadow-2xl grid grid-cols-1 md:grid-cols-12 animate-in zoom-in-95 duration-300"
            role="dialog"
            aria-modal="true"
          >
            {/* CLOSE BUTTON */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center border border-[#0D0E0D]/20 bg-white text-[#0D0E0D] hover:border-maple hover:text-maple transition-colors"
              aria-label="Fermer la boîte de dialogue"
            >
              <X className="h-4 w-4" />
            </button>

            {/* LEFT COLUMN: WOMAN PORTRAIT PHOTO (5 cols) */}
            <div className="hidden md:block md:col-span-5 relative bg-[#FDFCFD] overflow-hidden">
              <img
                src={IMAGES.portraitF}
                alt="Cap Entrepreneurs Community"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-white text-[11px] font-medium drop-shadow">
                Cap Entrepreneurs • Impact & Inclusion
              </div>
            </div>

            {/* RIGHT COLUMN: FORM & CONTENT (7 cols) */}
            <div className="md:col-span-7 p-7 sm:p-10 flex flex-col justify-center bg-white">

              {/* TABS: SWITCH BETWEEN NEWSLETTER & REVIEW */}
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-[#0D0E0D]/10">
                <button
                  type="button"
                  onClick={() => {
                    setMode("newsletter");
                    setSubmitted(false);
                  }}
                  className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors ${
                    mode === "newsletter"
                      ? "text-[#0D0E0D] border-b-2 border-maple"
                      : "text-sage hover:text-forest"
                  }`}
                >
                  Infolettre
                </button>
                <span className="text-sage/40">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("review");
                    setSubmitted(false);
                  }}
                  className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors flex items-center gap-1.5 ${
                    mode === "review"
                      ? "text-[#0D0E0D] border-b-2 border-maple"
                      : "text-sage hover:text-forest"
                  }`}
                >
                  <MessageSquareQuote className="w-3.5 h-3.5" />
                  Laisser un avis
                </button>
              </div>

              {submitted ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle className="h-12 w-12 text-maple mx-auto" />
                  <h3 className="font-serif text-2xl font-bold text-forest">
                    {mode === "newsletter" ? "Inscription confirmée !" : "Avis enregistré !"}
                  </h3>
                  <p className="text-sm text-sage max-w-xs mx-auto">
                    {mode === "newsletter"
                      ? "Merci de rejoindre notre réseau d'acteurs de la transition numérique durable."
                      : "Votre témoignage a bien été reçu et sera examiné par notre équipe."}
                  </p>
                </div>
              ) : mode === "newsletter" ? (
                /* NEWSLETTER TAB */
                <div>
                  <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-normal text-[#0D0E0D] leading-[1.12] tracking-tight">
                    Sign up
                    <span className="block font-serif text-2xl sm:text-3xl text-[#0D0E0D]/90 mt-1">
                      for exclusive
                    </span>
                    <span className="block font-serif text-2xl sm:text-3xl text-[#0D0E0D]/90">
                      content and updates
                    </span>
                  </h2>

                  <form onSubmit={handleNewsletterSubmit} className="mt-8">
                    <div className="flex border border-[#0D0E0D] focus-within:ring-1 focus-within:ring-maple">
                      <input
                        type="email"
                        required
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 px-4 py-3 text-sm text-[#0D0E0D] placeholder:text-sage focus:outline-none bg-white"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-[#0D0E0D] hover:bg-maple text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center justify-center"
                      >
                        {loading ? "..." : "Subscribe"}
                      </button>
                    </div>

                    <p className="mt-4 text-[11px] leading-relaxed text-sage font-sans">
                      En vous abonnant à notre infolettre, vous acceptez nos{" "}
                      <Link to="/terms" onClick={closeModal} className="underline hover:text-forest">
                        Conditions d'utilisation
                      </Link>{" "}
                      et notre{" "}
                      <Link to="/privacy" onClick={closeModal} className="underline hover:text-forest">
                        Politique de confidentialité
                      </Link>.
                    </p>
                  </form>
                </div>
              ) : (
                /* REVIEW / TESTIMONIAL FORM TAB */
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#0D0E0D] leading-[1.15] tracking-tight">
                    Votre avis compte
                    <span className="block font-serif text-xl sm:text-2xl text-sage mt-1 font-normal">
                      Partagez votre expérience avec nous
                    </span>
                  </h2>

                  <form onSubmit={handleReviewSubmit} className="mt-6 space-y-4">
                    {/* STAR RATING */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-sage mb-1.5">
                        Note globale
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-1 text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                            aria-label={`${star} étoiles`}
                          >
                            <Star
                              className={`h-5 w-5 ${
                                star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-xs font-bold text-forest">{rating} / 5</span>
                      </div>
                    </div>

                    {/* NAME & EMAIL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Votre nom"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 border border-[#0D0E0D]/20 text-xs focus:outline-none focus:border-forest"
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          placeholder="Votre courriel"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-[#0D0E0D]/20 text-xs focus:outline-none focus:border-forest"
                        />
                      </div>
                    </div>

                    {/* MESSAGE / REVIEW */}
                    <div>
                      <textarea
                        required
                        rows={3}
                        placeholder="Votre avis, retour ou témoignage sur nos programmes..."
                        value={reviewMessage}
                        onChange={(e) => setReviewMessage(e.target.value)}
                        className="w-full px-3 py-2 border border-[#0D0E0D]/20 text-xs focus:outline-none focus:border-forest resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 bg-[#0D0E0D] hover:bg-maple text-white text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      {loading ? "Envoi en cours..." : "Publier mon avis"}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
