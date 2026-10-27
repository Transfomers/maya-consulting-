import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2, MailX } from "lucide-react";
import api from "@/lib/api";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [manualEmail, setManualEmail] = useState(email || "");

  const handleUnsubscribe = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const params = new URLSearchParams();
      if (token) params.append("token", token);
      const targetEmail = email || manualEmail.trim().toLowerCase();
      if (targetEmail) params.append("email", targetEmail);

      const res = await api.post(`/newsletter/unsubscribe?${params.toString()}`);
      setUnsubscribed(true);
      setMessage(res.data?.message || "Vous avez été désabonné avec succès de toutes nos communications.");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setErrorMsg(
        typeof detail === "string"
          ? detail
          : "Une erreur est survenue lors du désabonnement. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  // If token is present in the URL, automatically prompt 1-click unsubscribe
  useEffect(() => {
    if (token) {
      handleUnsubscribe();
    }
  }, [token]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-20 px-4 bg-bone">
      <div className="max-w-lg w-full bg-white border border-forest/20 p-8 md:p-12 text-center shadow-sm">
        {loading ? (
          <div className="py-12 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#B84A39] mx-auto" />
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-forest/70">
              Traitement de votre désabonnement...
            </p>
          </div>
        ) : unsubscribed ? (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#B84A39]" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B84A39]">
                DÉSABONNEMENT CONFIRMÉ
              </span>
              <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-forest">
                Vous êtes désabonné
              </h1>
            </div>

            <p className="text-sm text-forest/75 leading-relaxed">
              {message} Vous ne recevrez plus les avis de parution ni l'infolettre de 3M SERVICES.
            </p>

            <div className="pt-4">
              <Link
                to="/"
                className="inline-block bg-forest hover:bg-[#B84A39] text-bone font-heading text-xs font-bold uppercase tracking-widest px-6 py-3.5 transition-colors"
              >
                Retour au site web
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-forest/5 text-forest/80 rounded-full flex items-center justify-center mx-auto">
              <MailX className="w-8 h-8 text-[#B84A39]" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-forest/60">
                GESTION DE L'ABONNEMENT
              </span>
              <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-forest">
                Se désabonner de l'infolettre
              </h1>
            </div>

            <p className="text-sm text-forest/75 leading-relaxed">
              Confirmez votre désabonnement pour ne plus recevoir les communications et alertes de publication de 3M SERVICES.
            </p>

            <form onSubmit={handleUnsubscribe} className="space-y-4 pt-2">
              {!token && (
                <div>
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="Entrez votre adresse courriel..."
                    className="w-full bg-bone border border-forest/20 px-4 py-3 text-sm text-forest focus:outline-none focus:border-[#B84A39]"
                  />
                </div>
              )}

              {errorMsg && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#B84A39] hover:bg-[#a03e30] text-bone font-heading text-xs font-bold uppercase tracking-widest py-3.5 px-6 transition-colors"
              >
                Confirmer mon désabonnement
              </button>
            </form>

            <div className="pt-2">
              <Link to="/" className="text-xs text-forest/60 hover:text-forest underline">
                Annuler et revenir à la page d'accueil
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
