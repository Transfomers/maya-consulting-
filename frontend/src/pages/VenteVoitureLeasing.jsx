import React from "react";
import { Link } from "react-router-dom";
import {
  Car,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  CreditCard,
  Building,
  FileText,
  BadgePercent,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function VenteVoitureLeasing() {
  const WHATSAPP_NUMBER = "237691786447";
  const PHONE_DISPLAY = "+237 691 78 64 47";

  const LEASING_STEPS = [
    {
      step: "01",
      title: "Choix du Véhicule",
      desc: "Sélectionnez le modèle neuf (0 km) ou occasion certifiée de votre choix dans notre catalogue officiel 3M SERVICES (SUV, Jeep, Toyota, Mercedes, pick-up).",
    },
    {
      step: "02",
      title: "Montage du Dossier de Financement",
      desc: "Pour les adhérents MUPOCAM (Orange Cameroun) ou entreprises partenaires : constitution simplifiée de votre dossier de leasing / crédit automobile.",
    },
    {
      step: "03",
      title: "Validation & Accord de Financement",
      desc: "Traitement prioritaire en collaboration avec les comités de crédit mutualistes pour une validation rapide et transparente de vos mensualités.",
    },
    {
      step: "04",
      title: "Livraison Clés en Main",
      desc: "Réception de votre véhicule immatriculé avec visite technique à jour et garantie 3M SERVICES à l'agence Nouvelle route - Omnisports.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Vente de Voitures & Leasing MUPOCAM à Yaoundé | 3M Services Cameroun</title>
        <meta
          name="description"
          content="Achat et vente de voitures à Yaoundé : véhicules neufs 0 km et occasions certifiées. Programme exclusif de leasing automobile et paiement échelonné conventionné MUPOCAM Orange Cameroun. Devis WhatsApp (+237 691 78 64 47)."
        />
        <meta
          name="keywords"
          content="vente de voiture Yaoundé, voiture à vendre Yaoundé, achat voiture à crédit Cameroun, vente voiture en leasing Cameroun, voiture paiement échelonné Yaoundé, véhicule en leasing Cameroun, prix voiture occasion Yaoundé, leasing MUPOCAM Orange Cameroun"
        />
        <link rel="canonical" href="https://www.3mservice.shop/vente-voiture-leasing-cameroun" />
      </Helmet>

      <div className="min-h-screen bg-[#FDFCFD] text-[#111827]">
        {/* Hero Section */}
        <section className="bg-[#111827] text-white pt-16 pb-20 px-5 sm:px-8 relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(#E20713_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
          <div className="max-w-[1440px] mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E20713] text-white text-[11px] font-bold uppercase tracking-widest rounded-xs mb-4">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Vente Automobile &amp; Solutions de Financement • Cameroun</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight max-w-4xl">
              Vente de Voitures &amp; Leasing Automobile à Yaoundé
            </h1>

            <p className="text-base sm:text-lg text-stone-300 max-w-3xl mt-4 leading-relaxed font-normal">
              Acquérez votre véhicule neuf (0 km) ou occasion certifiée avec des facilités de <strong>paiement échelonné</strong> et notre convention officielle de <strong>leasing MUPOCAM (Mutuelle du Personnel Orange Cameroun)</strong>.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3.5 mt-8">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20des%20informations%20sur%20l'achat%20d'un%20v%C3%A9hicule%20en%20leasing`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 bg-[#E20713] hover:bg-[#b3050f] text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-xl transition-all hover:scale-[1.02]"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Simuler un Financement WhatsApp ({PHONE_DISPLAY})</span>
              </a>

              <Link
                to="/boutique"
                className="px-6 py-4 bg-white text-[#111827] hover:bg-stone-100 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-all shadow-md"
              >
                <Car className="h-4 w-4 text-[#E20713]" />
                <span>Voir le Catalogue de Vente</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Le Partenariat MUPOCAM */}
        <section className="py-16 px-5 sm:px-8 max-w-[1440px] mx-auto">
          <div className="bg-stone-900 text-white rounded-sm p-8 sm:p-12 border border-stone-800 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF7900]/20 text-[#FF7900] border border-[#FF7900]/30 text-xs font-mono font-bold uppercase rounded-xs">
                <span>Partenariat Stratégique Exclusif</span>
              </div>
              <h2 className="font-heading font-black text-2xl sm:text-4xl">
                Distributeur Officiel de la MUPOCAM Orange Cameroun
              </h2>
              <p className="text-sm text-stone-300 leading-relaxed">
                Grâce à la convention de partenariat signée entre <strong>3M SERVICES</strong> et la <strong>Mutuelle du Personnel d'Orange Cameroun (MUPOCAM)</strong>, les membres bénéficient d'un accès privilégié à notre catalogue automobile avec un financement à taux bonifié et des échéances mensuelles prélevées en toute sécurité.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 shrink-0">
              <img
                src="/Asset/logo-mupocam.png"
                alt="Logo MUPOCAM"
                className="h-24 w-auto object-contain bg-white p-4 rounded-xs"
              />
              <span className="text-xs font-mono text-stone-400">
                Convention Active 2025/2026
              </span>
            </div>
          </div>
        </section>

        {/* Étapes du Leasing */}
        <section className="py-16 px-5 sm:px-8 max-w-[1440px] mx-auto border-t border-gray-200">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E20713] font-mono">
              Processus Transparent
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-gray-900 mt-2">
              Comment Acheter Votre Voiture en Leasing ?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {LEASING_STEPS.map((s) => (
              <div key={s.step} className="bg-white border border-gray-200 rounded-sm p-6 shadow-xs">
                <span className="text-3xl font-heading font-black text-[#E20713] block mb-2">
                  {s.step}
                </span>
                <h3 className="font-heading font-bold text-base text-gray-900">
                  {s.title}
                </h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
