import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2, MailCheck } from "lucide-react";
import api from "@/lib/api";

export default function ConfirmSubscription() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [subscriberEmail, setSubscriberEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setSuccess(false);
      setMessage("Le jeton de confirmation est manquant ou incomplet.");
      return;
    }

    const confirm = async () => {
      try {
        const res = await api.get(`/newsletter/confirm?token=${encodeURIComponent(token)}`);
        setSuccess(true);
        setMessage(res.data?.message || "Votre inscription à l'infolettre a été confirmée avec succès !");
        setSubscriberEmail(res.data?.email || "");
      } catch (err) {
        setSuccess(false);
        const detail = err.response?.data?.detail;
        setMessage(
          typeof detail === "string"
            ? detail
            : "Ce lien de confirmation est invalide ou a expiré. Veuillez vous réinscrire."
        );
      } finally {
        setLoading(false);
      }
    };

    confirm();
  }, [token]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-20 px-4 bg-bone">
      <div className="max-w-lg w-full bg-white border border-forest/20 p-8 md:p-12 text-center shadow-sm">
        {loading ? (
          <div className="py-12 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#B84A39] mx-auto" />
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-forest/70">
              Validation de votre abonnement...
            </p>
          </div>
        ) : success ? (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-[#B84A39]/10 text-[#B84A39] rounded-full flex items-center justify-center mx-auto">
              <MailCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B84A39]">
                CONFIRMATION RÉUSSIE
              </span>
              <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-forest">
                Bienvenue dans notre réseau !
              </h1>
              {subscriberEmail && (
                <p className="text-xs font-mono text-forest/60 bg-bone py-1 px-3 inline-block">
                  {subscriberEmail}
                </p>
              )}
            </div>

            <p className="text-sm text-forest/75 leading-relaxed">
              {message}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/blog"
                className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-[#B84A39] text-bone font-heading text-xs font-bold uppercase tracking-widest px-6 py-3.5 transition-colors"
              >
                <span>Découvrir nos articles</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 border border-forest/30 hover:border-forest text-forest font-heading text-xs font-bold uppercase tracking-widest px-6 py-3.5 transition-colors"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-600">
                LIEN EXPIRÉ OU INVALIDE
              </span>
              <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-forest">
                Lien de confirmation
              </h1>
            </div>

            <p className="text-sm text-forest/75 leading-relaxed">
              {message}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/blog"
                className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-[#B84A39] text-bone font-heading text-xs font-bold uppercase tracking-widest px-6 py-3.5 transition-colors"
              >
                <span>Se réinscrire à l'infolettre</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
