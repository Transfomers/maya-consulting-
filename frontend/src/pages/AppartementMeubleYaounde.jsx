import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Wifi,
  Phone,
  MessageSquare,
  Sparkles,
  Zap,
  ArrowRight
} from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function AppartementMeubleYaounde() {
  const WHATSAPP_NUMBER = "237691786447";
  const PHONE_DISPLAY = "+237 691 78 64 47";

  const NEIGHBORHOODS = [
    {
      name: "Bastos — Quartier Diplomatique & Résidentiel",
      tag: "Prestige & Calme",
      price: "Dès 65 000 FCFA / nuitée",
      desc: "Idéal pour diplomates, cadres de multinationales et familles. À proximité des ambassades, supermarchés et restaurants huppés. Résidence ultra-sécurisée avec groupe électrogène automatique.",
      link: "/appartement-meuble-bastos",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=compress&cs=tinysrgb&w=800",
      features: ["T3 2 Chambres", "Wifi Fibre", "Groupe Automatique", "Gardien 24/7"],
    },
    {
      name: "Essos — Central, Vivant & Très Accessible",
      tag: "Proximité & Dynamisme",
      price: "Dès 40 000 FCFA / nuitée",
      desc: "Parfait pour les séjours professionnels et touristiques nécessitant un accès rapide à tous les points névralgiques de Yaoundé. Commerces et taxis immédiats.",
      link: "#reserver",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=compress&cs=tinysrgb&w=800",
      features: ["Studio & T2", "Climatisé", "Eau permanente", "Smart TV"],
    },
    {
      name: "Omnisports (Rue Foe) — Proche Agence 3M SERVICES",
      tag: "Affaires & Mobilité",
      price: "Dès 40 000 FCFA / nuitée",
      desc: "Situé à 2 minutes de l'agence principale 3M SERVICES et des grands axes routiers de Yaoundé. Idéal pour combiner location automobile et hébergement.",
      link: "/boutique?tab=appartements",
      image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=compress&cs=tinysrgb&w=800",
      features: ["T2 Contemporain", "Parking fermé", "Fibre optique", "Accès goudronné"],
    },
    {
      name: "Le Golfe — Hauteurs & Vue Panoramique",
      tag: "Penthouse & Luxe",
      price: "Dès 90 000 FCFA / nuitée",
      desc: "Un penthouse d'exception avec grande terrasse et vue imprenable sur Yaoundé. Finitions luxueuses, 3 chambres spacieuses et service conciergerie privée.",
      link: "/boutique?tab=appartements",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=compress&cs=tinysrgb&w=800",
      features: ["T4 Penthouse", "Terrasse Privée", "3 Salles de bain", "Service 5 étoiles"],
    },
  ];

  return (
    <>
      <Helmet>
        <title>Location Appartement Meublé Yaoundé | Bastos, Essos, Omnisports - 3M Services</title>
        <meta
          name="description"
          content="Location d'appartements et studios meublés à Yaoundé : Bastos, Essos, Omnisports, Le Golfe. Logements climatisés avec groupe électrogène permanent, Wifi fibre optique et sécurité 24/7. Réservation WhatsApp (+237 691 78 64 47)."
        />
        <meta
          name="keywords"
          content="appartement meublé Yaoundé, location appartement meublé Yaoundé, studio meublé Yaoundé, appartement meublé à louer Yaoundé, appartement meublé Essos, appartement essos, appartement meublé Bastos, appartement meublé Omnisports Yaoundé, appartement meublé courte durée Yaoundé, prix appartement meublé Yaoundé, appartement meublé par jour Yaoundé, résidence meublée Yaoundé"
        />
        <link rel="canonical" href="https://www.3mservice.shop/appartement-meuble-yaounde" />
      </Helmet>

      <div className="min-h-screen bg-[#FDFCFD] text-[#111827]">
        {/* Hero Section */}
        <section className="bg-[#111827] text-white pt-16 pb-20 px-5 sm:px-8 relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(#E20713_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
          <div className="max-w-[1440px] mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E20713] text-white text-[11px] font-bold uppercase tracking-widest rounded-xs mb-4">
              <Building2 className="h-3.5 w-3.5" />
              <span>Immobilier de Standing • Yaoundé, Cameroun</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight max-w-4xl">
              Location d'Appartements Meublés à Yaoundé
            </h1>

            <p className="text-base sm:text-lg text-stone-300 max-w-3xl mt-4 leading-relaxed font-normal">
              Vous recherchez un <strong>appartement meublé à Yaoundé</strong> pour un court séjour, un voyage d'affaires ou des vacances ? Découvrez notre sélection de logements haut standing situés dans les meilleurs quartiers : <strong>Bastos</strong>, <strong>Essos</strong>, <strong>Omnisports</strong> et <strong>Le Golfe</strong>.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3.5 mt-8">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20r%C3%A9server%20un%20appartement%20meubl%C3%A9%20%C3%A0%20Yaound%C3%A9`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 bg-[#E20713] hover:bg-[#b3050f] text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-xl transition-all hover:scale-[1.02]"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Réserver un Appartement ({PHONE_DISPLAY})</span>
              </a>

              <Link
                to="/boutique?tab=appartements"
                className="px-6 py-4 bg-white text-[#111827] hover:bg-stone-100 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-all shadow-md"
              >
                <Building2 className="h-4 w-4 text-[#E20713]" />
                <span>Voir la Galerie &amp; Disponibilités</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Quartiers de Yaoundé */}
        <section className="py-16 px-5 sm:px-8 max-w-[1440px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E20713] font-mono">
              Emplacements Stratégiques
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-gray-900 mt-2">
              Nos Résidences Meublées par Quartier
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Choisissez le quartier qui correspond le mieux à votre séjour à Yaoundé.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {NEIGHBORHOODS.map((n) => (
              <div
                key={n.name}
                className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-md flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  <img
                    src={n.image}
                    alt={n.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-[#111827]/90 text-white text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-xs">
                    {n.tag}
                  </span>
                  <span className="absolute bottom-3 right-3 bg-[#E20713] text-white text-xs font-mono font-bold px-2.5 py-1 rounded-xs shadow">
                    {n.price}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading font-extrabold text-xl text-gray-900">
                      {n.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                      {n.desc}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      {n.features.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[11px] font-mono rounded-xs">
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20r%C3%A9server%20un%20logement%20%C3%A0%20${encodeURIComponent(n.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 bg-[#E20713] hover:bg-[#b3050f] text-white text-xs font-heading font-bold uppercase tracking-wider text-center transition-colors rounded-xs flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Réserver ce Quartier</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
