import React from "react";
import { Link } from "react-router-dom";
import {
  Car,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  Users,
  Fuel,
  Gauge,
  Crown,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function LocationPradoYaounde() {
  const WHATSAPP_NUMBER = "237691786447";
  const PHONE_DISPLAY = "+237 691 78 64 47";

  const PRADO_VERSIONS = [
    {
      title: "Toyota Land Cruiser Prado TXL V6",
      subtitle: "Prestige, Puissance & Tout-Terrain",
      specs: [
        "Moteur V6 4.0L Essence ou Turbo-Diesel D-4D",
        "Boîte automatique séquentielle avec réducteur 4x4",
        "7 places spacieuses en cuir véritable perforé",
        "Climatisation tri-zone avant/arrière indépendante",
        "Système audio haute fidélité & écran multimédia",
        "Toit ouvrant et vitres arrière surteintées pour discrétion",
      ],
      idealFor: "Cortèges officiels, escortes de personnalités, mariages, voyages d'affaires vers Douala, Kribi, Bafoussam.",
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=compress&cs=tinysrgb&w=800",
      badge: "Modèle Vedette VIP",
    },
    {
      title: "Toyota Prado Tout-Terrain pour Missions",
      subtitle: "Spécial Chantiers, ONG & Expéditions",
      specs: [
        "Garde au sol surélevée & suspension tout-terrain renforcée",
        "Pneumatiques mixtes ville & pistes difficiles",
        "Double réservoir grande autonomie",
        "GPS et connectivité tout opérateur au Cameroun",
        "Chauffeur certifié conduite défensive et pistes",
      ],
      idealFor: "Missions de terrain d'ONG, audits miniers, visites d'infrastructures et délégations internationales.",
      image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=compress&cs=tinysrgb&w=800",
      badge: "Prêt pour les Pistes",
    },
  ];

  return (
    <>
      <Helmet>
        <title>Location Toyota Prado à Yaoundé | Location 4x4 SUV VIP - 3M Services</title>
        <meta
          name="description"
          content="Location de Toyota Land Cruiser Prado à Yaoundé : SUV 4x4 de prestige avec chauffeur VIP pour cortèges, réceptions officielles, mariages et missions au Cameroun. Réservez chez 3M Services (+237 691 78 64 47)."
        />
        <meta
          name="keywords"
          content="location Prado Yaoundé, location Toyota Prado Yaoundé, louer Prado à Yaoundé, prix location Prado Yaoundé, location 4x4 Yaoundé, location SUV Yaoundé, location voiture VIP Yaoundé, location Land Cruiser Yaoundé"
        />
        <link rel="canonical" href="https://www.3mservice.shop/location-prado-yaounde" />
      </Helmet>

      <div className="min-h-screen bg-[#FDFCFD] text-[#111827]">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-[#0D0E0D] to-[#1a1c1d] text-white pt-16 pb-20 px-5 sm:px-8 relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(#E20713_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
          <div className="max-w-[1440px] mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E20713] text-white text-[11px] font-bold uppercase tracking-widest rounded-xs mb-4">
              <Crown className="h-3.5 w-3.5 text-[#FF7900]" />
              <span>Location de Prestige VIP • Yaoundé, Cameroun</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight max-w-4xl">
              Location de Toyota Prado à Yaoundé
            </h1>

            <p className="text-base sm:text-lg text-stone-300 max-w-3xl mt-4 leading-relaxed font-normal">
              Véhicule tout-terrain d'exception, le <strong>Toyota Land Cruiser Prado</strong> est le 4x4 de référence pour vos délégations diplomatiques, visites ministérielles, cérémonies de mariage de prestige et missions professionnelles à travers le Cameroun.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3.5 mt-8">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20r%C3%A9server%20un%20Toyota%20Prado%20%C3%A0%20Yaound%C3%A9`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 bg-[#E20713] hover:bg-[#b3050f] text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-xl transition-all hover:scale-[1.02]"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Réserver un Prado sur WhatsApp ({PHONE_DISPLAY})</span>
              </a>

              <a
                href={`tel:+${WHATSAPP_NUMBER}`}
                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-all border border-white/20"
              >
                <Phone className="h-4 w-4 text-[#FF7900]" />
                <span>Contact Direct : {PHONE_DISPLAY}</span>
              </a>

              <Link
                to="/location-voiture-yaounde"
                className="px-6 py-4 bg-white text-[#111827] hover:bg-stone-100 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-all shadow-md"
              >
                <Car className="h-4 w-4 text-[#E20713]" />
                <span>Toute notre flotte de location</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Détails des Prado Disponibles */}
        <section className="py-16 px-5 sm:px-8 max-w-[1440px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E20713] font-mono">
              Flotte 4x4 de Haute Qualité
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-gray-900 mt-2">
              Pourquoi Choisir le Toyota Prado chez 3M SERVICES ?
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {PRADO_VERSIONS.map((prado) => (
              <div
                key={prado.title}
                className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-md flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
                  <img
                    src={prado.image}
                    alt={prado.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-[#E20713] text-white text-[11px] font-mono font-bold uppercase px-2.5 py-1 rounded-xs">
                    {prado.badge}
                  </span>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading font-extrabold text-xl text-gray-900">
                      {prado.title}
                    </h3>
                    <p className="text-xs font-mono text-[#FF7900] uppercase font-bold mt-1">
                      {prado.subtitle}
                    </p>

                    <p className="text-xs text-gray-600 mt-3 italic">
                      <strong>Recommandé pour :</strong> {prado.idealFor}
                    </p>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="text-[11px] font-mono uppercase font-bold text-gray-400 block mb-2">
                        Équipements &amp; Spécifications :
                      </span>
                      <ul className="space-y-1.5 text-xs text-gray-700">
                        {prado.specs.map((s, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-500">
                      Disponibilité : <strong className="text-emerald-700 font-bold">Immédiate</strong>
                    </span>
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20r%C3%A9server%20le%20${encodeURIComponent(prado.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-[#E20713] hover:bg-[#b3050f] text-white font-heading font-bold text-xs uppercase tracking-wider rounded-xs flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Réserver ce Prado</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Avantages Chauffeur VIP */}
        <section className="py-14 px-5 sm:px-8 bg-stone-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-heading font-black text-2xl sm:text-3xl">
              Chauffeur VIP Professionnel Inclus sur Demande
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-3 leading-relaxed max-w-2xl mx-auto">
              Tous nos chauffeurs de Prado sont rigoureusement sélectionnés : tenue impeccable (costume/cravate), courtoisie irréprochable, discrétion absolue et maîtrise complète de la circulation urbaine à Yaoundé et des corridors interurbains.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20un%20devis%20pour%20location%20Prado%20avec%20chauffeur`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-[#E20713] text-white hover:bg-[#b3050f] font-heading font-bold text-xs uppercase tracking-wider rounded-xs flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Devis Instantané sur WhatsApp</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
