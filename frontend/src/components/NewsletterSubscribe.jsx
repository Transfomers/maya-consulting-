import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, CheckCircle, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useLang } from "@/lib/i18n";

export default function NewsletterSubscribe({
  variant = "default", // default | compact | card | banner
  source = "website",
  className = ""
}) {
  const { lang } = useLang();
  const isEn = lang === "en";

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg(isEn ? "Please enter a valid email address." : "Veuillez saisir une adresse courriel valide.");
      return;
    }

    if (!consent) {
      setErrorMsg(isEn ? "Please accept the consent terms to proceed." : "Veuillez cocher la case de consentement pour continuer.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/newsletter/subscribe", {
        email: cleanEmail,
        first_name: firstName.trim() || undefined,
        consent: true,
        source: source,
        language: isEn ? "en" : "fr"
      });

      setSubmitted(true);
      setSuccessMsg(
        res.data?.message ||
        (isEn
          ? "A confirmation email has been sent to your address. Please verify your inbox to activate your subscription."
          : "Un courriel de confirmation vous a été envoyé. Veuillez cliquer sur le lien pour activer votre abonnement.")
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrorMsg(
        typeof detail === "string"
          ? detail
          : (isEn
              ? "Unable to complete subscription. Please try again later."
              : "Impossible de valider votre inscription pour l'instant. Veuillez réessayer.")
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`p-8 bg-forest text-bone border border-forest/20 text-center ${className}`}>
        <div className="mx-auto w-12 h-12 rounded-full bg-forest-light/20 flex items-center justify-center text-terracotta mb-4">
          <CheckCircle className="w-6 h-6 text-[#B84A39]" />
        </div>
        <h4 className="font-heading text-xl font-bold tracking-tight mb-2">
          {isEn ? "Almost there!" : "Plus qu'une étape !"}
        </h4>
        <p className="text-sm text-bone/80 max-w-md mx-auto leading-relaxed mb-4">
          {successMsg}
        </p>
        <span className="inline-block text-xs uppercase tracking-widest text-[#B84A39] font-bold">
          3M SERVICES • contact@3mservice.shop
        </span>
      </div>
    );
  }

  // Banner variant disabled
  if (variant === "banner") {
    return null;
  }

  // Footer compact variant
  if (variant === "footer") {
    return (
      <div className={`space-y-3 ${className}`}>
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isEn ? "Your email address..." : "Votre courriel..."}
            className="w-full bg-forest/40 border border-bone/25 px-3.5 py-2.5 text-xs text-bone placeholder:text-bone/40 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-bone font-heading text-xs font-bold uppercase tracking-wider py-2.5 transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isEn ? "Subscribe" : "S'abonner")}
          </button>
          <div className="flex items-start gap-2 pt-1 text-left">
            <input
              id={`consent-footer-${source}`}
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-bone/30 text-[#B84A39] focus:ring-[#B84A39]"
            />
            <label htmlFor={`consent-footer-${source}`} className="text-[11px] text-bone/60 leading-tight">
              {isEn ? (
                <>I agree to receive updates. <Link to="/privacy" className="underline hover:text-bone">Privacy</Link></>
              ) : (
                <>J'accepte de recevoir l'infolettre. <Link to="/privacy" className="underline hover:text-bone">Confidentialité</Link></>
              )}
            </label>
          </div>
          {errorMsg && (
            <p className="text-xs text-red-300 pt-1">{errorMsg}</p>
          )}
        </form>
      </div>
    );
  }

  // Default / Card Variant
  return (
    <div className={`bg-bone border border-forest/15 p-6 md:p-8 relative ${className}`}>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#B84A39] mb-2">
        <Mail className="w-3.5 h-3.5" />
        <span>{isEn ? "NEWSLETTER & NOTIFICATIONS" : "INFOLETTRE & PARUTIONS"}</span>
      </div>

      <h3 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-forest mb-2">
        {isEn ? "Stay connected with 3M SERVICES" : "Restez connecté avec 3M SERVICES"}
      </h3>
      <p className="text-xs md:text-sm text-forest/75 leading-relaxed mb-6">
        {isEn
          ? "Receive our latest articles, initiatives, programs, and opportunities to create meaningful impact directly in your inbox."
          : "Recevez nos derniers articles, initiatives, programmes et opportunités à impact directement dans votre boîte courriel."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1">
            {isEn ? "First name (optional)" : "Prénom (optionnel)"}
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={isEn ? "e.g. Jean" : "ex. Jean"}
            className="w-full bg-white border border-forest/20 px-3.5 py-2.5 text-sm text-forest focus:outline-none focus:border-[#B84A39]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-forest/70 mb-1">
            {isEn ? "Email address *" : "Adresse courriel *"}
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@example.org"
            className="w-full bg-white border border-forest/20 px-3.5 py-2.5 text-sm text-forest focus:outline-none focus:border-[#B84A39]"
          />
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input
            id={`consent-${source}`}
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-forest/30 text-[#B84A39] focus:ring-[#B84A39]"
          />
          <label htmlFor={`consent-${source}`} className="text-xs text-forest/70 leading-relaxed cursor-pointer">
            {isEn ? (
              <>
                I agree to receive email updates from 3M SERVICES. You may unsubscribe at any time. View our{" "}
                <Link to="/privacy" className="underline text-forest hover:text-[#B84A39]">
                  Privacy Policy
                </Link>.
              </>
            ) : (
              <>
                En vous abonnant, vous acceptez de recevoir les communications par courriel de 3M SERVICES. Vous pouvez vous désabonner à tout moment. Consultez notre{" "}
                <Link to="/privacy" className="underline text-forest hover:text-[#B84A39]">
                  Politique de confidentialité
                </Link>.
              </>
            )}
          </label>
        </div>

        {errorMsg && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest hover:bg-[#153426] text-bone font-heading text-xs font-bold uppercase tracking-[0.2em] py-3.5 px-6 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{isEn ? "Subscribe to our newsletter" : "S'abonner à l'infolettre"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
