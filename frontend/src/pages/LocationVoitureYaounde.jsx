import React from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Key,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  Users,
  Fuel,
  Gauge,
  Plane,
  Clock,
  Sparkles,
  ArrowRight,
  FileText
} from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function LocationVoitureYaounde() {
  const WHATSAPP_NUMBER = "237691786447";
  const PHONE_DISPLAY = "+237 691 78 64 47";

  const VEHICLES = [
    {
      name: "TOYOTA LAND CRUISER PRADO TXL",
      category: "SUV 4x4 Prestige VIP",
      specs: "Automatique 4x4 • 7 Places • Cuir • Climatisation intégrale",
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=compress&cs=tinysrgb&w=800",
      useCase: "Missions officielles, délégations, cortèges, voyages interurbains (Douala, Kribi, Bafoussam)",
      tag: "Idéal VIP & Cortèges",
    },
    {
      name: "TOYOTA RAV4 (Dernière Génération)",
      category: "SUV Urbain & Familial",
      specs: "Automatique • 5 Places • Économique • Caméra de recul",
      image: "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=compress&cs=tinysrgb&w=800",
      useCase: "Déplacements urbains à Yaoundé, rendez-vous d'affaires, séjours en famille",
      tag: "Le Plus Demandé",
    },
    {
      name: "MERCEDES-BENZ CLASSE E",
      category: "Berline de Luxe & Diplomatique",
      specs: "Automatique 7G-Tronic • 5 Places • Intérieur Cuir • Insonorisation Premium",
      image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=compress&cs=tinysrgb&w=800",
      useCase: "Accueil personnalités, réceptions, déplacements d'affaires de haut standing",
      tag: "Confort Absolu",
    },
    {
      name: "PICK-UP DOUBLE CABINE 4x4",
      category: "Tout-Terrain & Missions Tout Confort",
      specs: "Diesel Turbo • 5 Places • Grande benne • Suspension renforcée",
      image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=compress&cs=tinysrgb&w=800",
      useCase: "Visites de chantiers, zones rurales, expéditions et travaux de terrain",
      tag: "Robuste & Puissant",
    },
  ];

  const FORMULAS = [
    {
      title: "Location avec Chauffeur Professionnel",
      icon: Users,
      badge: "Formule Sérénité",
      desc: "Chauffeur expérimenté, courtois, ponctuel et connaissant parfaitement le réseau routier de Yaoundé et des grands axes interurbains du Cameroun.",
      benefits: [
        "Zéro stress de conduite dans les embouteillages",
        "Disponibilité journalière flexible (courses urbaines ou longs trajets)",
        "Sécurité et discrétion assurées",
      ],
    },
    {
      title: "Location sans Chauffeur (Autonomie Totale)",
      icon: Key,
      badge: "Formule Liberté",
      desc: "Pour les professionnels et particuliers désirant une autonomie complète pendant leur séjour d'affaires ou leurs vacances à Yaoundé.",
      benefits: [
        "Véhicules récents et parfaitement révisés",
        "Contrat de location clair et transparent",
        "Assurance tous risques et assistance 24/7",
      ],
    },
    {
      title: "Navette & Transfert Aéroport Nsimalen",
      icon: Plane,
      badge: "Service Express",
      desc: "Accueil personnalisé à l'Aéroport International de Yaoundé-Nsimalen avec prise en charge de vos bagages et transfert sécurisé jusqu'à votre hôtel ou résidence.",
      benefits: [
        "Chauffeur présent à l'heure exacte de votre atterrissage",
        "Véhicule climatisé et propre dès votre arrivée",
        "Tarif fixe convenu à l'avance sans surprise",
      ],
    },
  ];

  const FAQS = [
    {
      q: "Comment réserver une voiture de location à Yaoundé chez 3M Services ?",
      a: "La réservation est simple et instantanée : contactez notre agence par WhatsApp ou appel au +237 691 78 64 47 en précisant vos dates de location, le type de véhicule souhaité (SUV, Prado, berline) et la formule (avec ou sans chauffeur). Nous vous fournissons un devis et confirmation immédiate.",
    },
    {
      q: "Quelles sont les pièces requises pour louer une voiture sans chauffeur à Yaoundé ?",
      a: "Pour louer sans chauffeur, vous devez présenter une pièce d'identité valide (CNI ou passeport), un permis de conduire valide (minimum 2 ans) et déposer une caution remboursable.",
    },
    {
      q: "Proposez-vous la location de Toyota Prado avec chauffeur à Yaoundé ?",
      a: "Oui, la location de Toyota Land Cruiser Prado TXL avec chauffeur fait partie de nos spécialités pour les délégations, VIP, mariages et missions d'entreprises à Yaoundé et partout au Cameroun.",
    },
    {
      q: "Où se situe l'agence de location 3M Services à Yaoundé ?",
      a: "Notre agence est idéalement située à la Nouvelle route - Omnisports (Rue Foe), avec une antenne à Bastos. Livraison possible du véhicule à votre hôtel, domicile ou à l'aéroport de Yaoundé-Nsimalen.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Location de Voiture à Yaoundé (Avec ou Sans Chauffeur) | 3M Services</title>
        <meta
          name="description"
          content="Agence de location de voiture à Yaoundé : Toyota Prado, SUV 4x4, berlines de luxe. Formules avec ou sans chauffeur, transfert aéroport Nsimalen. Meilleurs tarifs et réservation WhatsApp (+237 691 78 64 47)."
        />
        <meta
          name="keywords"
          content="location de voiture Yaoundé, location voiture Yaoundé, agence de location de voiture Yaoundé, louer une voiture à Yaoundé, location voiture avec chauffeur Yaoundé, location voiture sans chauffeur Yaoundé, prix location voiture Yaoundé, location voiture pas chère Yaoundé, location Prado Yaoundé, location 4x4 Yaoundé, location voiture aéroport Nsimalen"
        />
        <link rel="canonical" href="https://www.3mservice.shop/location-voiture-yaounde" />
      </Helmet>

      <div className="min-h-screen bg-[#FDFCFD] text-[#111827]">
        {/* Hero Section */}
        <section className="bg-[#111827] text-white pt-16 pb-20 px-5 sm:px-8 relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(#E20713_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
          <div className="max-w-[1440px] mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E20713] text-white text-[11px] font-bold uppercase tracking-widest rounded-xs mb-4">
              <Car className="h-3.5 w-3.5" />
              <span>Agence de Location Automobile • Yaoundé, Cameroun</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight max-w-4xl">
              Location de Voiture à Yaoundé avec ou sans Chauffeur
            </h1>

            <p className="text-base sm:text-lg text-stone-300 max-w-3xl mt-4 leading-relaxed font-normal">
              Vous cherchez à <strong>louer une voiture à Yaoundé</strong> ? <strong>3M SERVICES</strong> met à votre disposition une flotte premium de <strong>SUV 4x4 (Toyota Prado, RAV4)</strong>, berlines de luxe et véhicules citadins récents, parfaitement climatisés et entretenus. Réservation immédiate, tarifs transparents et service de prestige.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mt-8">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20louer%20un%20v%C3%A9hicule%20%C3%A0%20Yaound%C3%A9`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 bg-[#E20713] hover:bg-[#b3050f] text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-xl transition-all hover:scale-[1.02]"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Réserver sur WhatsApp ({PHONE_DISPLAY})</span>
              </a>

              <a
                href={`tel:+${WHATSAPP_NUMBER}`}
                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-all border border-white/20"
              >
                <Phone className="h-4 w-4 text-[#FF7900]" />
                <span>Appel Direct : {PHONE_DISPLAY}</span>
              </a>

              <Link
                to="/boutique"
                className="px-6 py-4 bg-white text-[#111827] hover:bg-stone-100 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-all shadow-md"
              >
                <Car className="h-4 w-4 text-[#E20713]" />
                <span>Voir le Catalogue Complet</span>
              </Link>
            </div>

            {/* Key Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10 text-xs font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-stone-300">Véhicules Révisés &amp; Climatisés</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-stone-300">Chauffeurs VIP Expérimentés</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-stone-300">Transfert Nsimalen 24h/24</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-stone-300">Tarif Dégressif à la Semaine</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Formules de Location */}
        <section className="py-16 px-5 sm:px-8 max-w-[1440px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E20713] font-mono">
              Nos Solutions de Mobilité
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-gray-900 mt-2">
              Formules de Location Adaptées à Vos Besoins
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Que ce soit pour une journée, une semaine de mission professionnelle ou un déplacement officiel au Cameroun.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FORMULAS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white border border-gray-200 rounded-sm p-7 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded bg-[#E20713]/10 text-[#E20713] flex items-center justify-center">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-800 rounded-xs">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="font-heading font-extrabold text-lg text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-4">
                      {item.desc}
                    </p>

                    <ul className="space-y-2 text-xs text-gray-700 pt-3 border-t border-gray-100">
                      {item.benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20des%20informations%20sur%20la%20formule%20:%20${encodeURIComponent(item.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 w-full py-3 bg-[#111827] hover:bg-[#E20713] text-white text-xs font-heading font-bold uppercase tracking-wider text-center transition-colors rounded-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Demander un Devis</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        {/* Flotte de Véhicules Disponibles */}
        <section className="py-16 px-5 sm:px-8 bg-gray-50 border-y border-gray-200">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#E20713] font-mono">
                  Parc Automobile 3M SERVICES
                </span>
                <h2 className="font-heading font-black text-2xl sm:text-4xl text-gray-900 mt-1">
                  Véhicules Phares Disponibles à la Location
                </h2>
              </div>
              <Link
                to="/location-prado-yaounde"
                className="text-[#E20713] hover:underline font-bold text-xs uppercase tracking-wider flex items-center gap-1"
              >
                <span>Découvrir l'offre spécifique Toyota Prado →</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VEHICLES.map((v) => (
                <div
                  key={v.name}
                  className="bg-white border border-gray-200 rounded-sm overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                    <img
                      src={v.image}
                      alt={v.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-[#E20713] text-white text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-xs">
                      {v.tag}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">
                        {v.category}
                      </span>
                      <h3 className="font-heading font-extrabold text-base text-gray-900 mt-1">
                        {v.name}
                      </h3>
                      <p className="text-xs text-stone-600 mt-2 font-mono">
                        {v.specs}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                        {v.useCase}
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20r%C3%A9server%20le%20v%C3%A9hicule%20suivant%20:%20${encodeURIComponent(v.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 w-full py-2.5 bg-gray-900 hover:bg-[#E20713] text-white text-xs font-heading font-bold uppercase tracking-wider text-center transition-colors rounded-xs flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Réserver ce modèle</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Spécifique Location */}
        <section className="py-16 px-5 sm:px-8 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E20713] font-mono">
              Foire Aux Questions
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-gray-900 mt-1">
              Questions Fréquentes sur la Location de Voiture à Yaoundé
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-sm p-5 shadow-xs"
              >
                <h3 className="font-heading font-bold text-base text-gray-900">
                  {faq.q}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom CTA Box */}
          <div className="mt-12 bg-stone-900 text-white rounded-sm p-6 sm:p-8 text-center shadow-xl">
            <h3 className="font-heading font-black text-xl sm:text-2xl">
              Besoin d'une voiture disponible dès aujourd'hui à Yaoundé ?
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-xl mx-auto">
              Contactez directement notre service réservation par WhatsApp. Disponibilité immédiate à l'agence d'Omnisports ou Bastos.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20louer%20une%20voiture%20imm%C3%A9diatement`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-[#E20713] text-white hover:bg-[#b3050f] font-heading font-bold text-xs uppercase tracking-wider rounded-xs transition-colors flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp : {PHONE_DISPLAY}</span>
              </a>
              <Link
                to="/boutique"
                className="px-6 py-3.5 bg-white text-gray-900 hover:bg-gray-100 font-heading font-bold text-xs uppercase tracking-wider rounded-xs transition-colors"
              >
                Consulter tous nos modèles
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
