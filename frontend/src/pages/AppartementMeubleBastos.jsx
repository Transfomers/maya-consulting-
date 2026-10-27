import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Wifi,
  Tv,
  Zap,
  Droplet,
  Phone,
  MessageSquare,
  Sparkles,
  Calendar,
  Eye,
  ArrowRight
} from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function AppartementMeubleBastos() {
  const WHATSAPP_NUMBER = "237691786447";
  const PHONE_DISPLAY = "+237 691 78 64 47";

  const PHOTOS = [
    "/Asset/appartements/appartement-meuble-suite-parentale.webp",
    "/Asset/appartements/appartement-meuble-cuisine-equipee.webp",
    "/Asset/appartements/appartement-meuble-chambre-bleue.webp",
    "/Asset/appartements/appartement-meuble-salle-de-bain.webp",
    "/Asset/appartements/appartement-meuble-chambre-confort.webp",
  ];

  const AMENITIES = [
    { title: "Groupe Électrogène Automatique", desc: "Alimentation continue 24/7 en cas de coupure sur le réseau urbain.", icon: Zap },
    { title: "Réserve d'Eau & Surpresseur", desc: "Eau sous pression permanente et chauffe-eau instantané.", icon: Droplet },
    { title: "Wifi Fibre Optique Haut Débit", desc: "Connexion internet très haut débit idéale pour télétravail et streaming.", icon: Wifi },
    { title: "Sécurité & Gardiennage 24/7", desc: "Vigile permanent, vidéosurveillance périmétrique et parking clos sécurisé.", icon: ShieldCheck },
    { title: "Climatisation Intégrale", desc: "Climatiseurs silencieux nouvelle génération dans toutes les pièces.", icon: Sparkles },
    { title: "Smart TV 55\" & Canal+", desc: "Téléviseur 4K avec chaînes internationales, Netflix et YouTube.", icon: Tv },
  ];

  return (
    <>
      <Helmet>
        <title>Appartement Meublé à Tsinga (Face FECAFOOT) & Yaoundé | Bientôt Oyomabang - 3M Services</title>
        <meta
          name="description"
          content="Trouvez votre appartement meublé à Yaoundé : découvrez notre résidence de haut standing à Tsinga (Face FECAFOOT) et l'ouverture prochaine à Oyomabang (Coming Soon). Climatisation, groupe automatique 24/7, Wifi fibre. Appelez le +237 691 78 64 47."
        />
        <meta
          name="keywords"
          content="appartement meublé tsinga, appartement meuble fecafoot yaounde, appartement meuble tsinga yaounde, appartement meublé oyomabang, appartement meuble yaounde, location appartement meuble yaounde, studio meuble yaounde, reservation appartement tsinga, appartement meuble cameroun"
        />
        <link rel="canonical" href="https://www.3mservice.shop/appartement-meuble-bastos" />
      </Helmet>

      <div className="min-h-screen bg-[#FDFCFD] text-[#111827]">
        {/* Hero Section */}
        <section className="bg-[#111827] text-white pt-16 pb-20 px-5 sm:px-8 relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(#E20713_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
          <div className="max-w-[1440px] mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E20713] text-white text-[11px] font-bold uppercase tracking-widest rounded-xs mb-4">
              <MapPin className="h-3.5 w-3.5" />
              <span>Tsinga (Face FECAFOOT) • Bientôt Oyomabang • Yaoundé, Cameroun</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight max-w-4xl">
              Appartement Meublé à Tsinga (Face FECAFOOT), Yaoundé
            </h1>

            <p className="text-base sm:text-lg text-stone-300 max-w-3xl mt-4 leading-relaxed font-normal">
              Profitez d'un cadre résidentiel d'exception à <strong>Tsinga, directement en face du siège de la FECAFOOT</strong>, ainsi que de notre nouvelle résidence bientôt disponible à <strong>Oyomabang (Coming Soon)</strong>. Appartements et studios meublés tout confort avec <strong>groupe électrogène automatique</strong>, <strong>Wi-Fi fibre optique</strong>, eau courante permanente et gardiennage 24h/24. Appelez-nous sans attendre pour bloquer vos dates.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3.5 mt-8">
              <a
                href={`tel:+${WHATSAPP_NUMBER}`}
                className="px-7 py-4 bg-[#E20713] hover:bg-[#b3050f] text-white font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-xl transition-all hover:scale-[1.03]"
              >
                <Phone className="h-4 w-4" />
                <span>Appelez directement : {PHONE_DISPLAY}</span>
              </a>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20r%C3%A9server%20un%20appartement%20meubl%C3%A9%20%C3%A0%20Tsinga%20Face%20FECAFOOT`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-md transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp ({PHONE_DISPLAY})</span>
              </a>

              <Link
                to="/appartement-meuble-yaounde"
                className="px-6 py-4 bg-white text-[#111827] hover:bg-stone-100 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-all shadow-md"
              >
                <Building2 className="h-4 w-4 text-[#E20713]" />
                <span>Tsinga, Omnisports &amp; Oyomabang</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Galerie Photos Tsinga FECAFOOT */}
        <section className="py-12 px-5 sm:px-8 max-w-[1440px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PHOTOS.map((src, i) => (
              <div key={i} className="aspect-[4/3] rounded-xs overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={src}
                  alt={`Appartement meublé Tsinga FECAFOOT Yaoundé ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Fiche Descriptif & Équipements */}
        <section className="py-12 px-5 sm:px-8 max-w-[1440px] mx-auto border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E20713]">
                  Descriptif du Logement
                </span>
                <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 mt-1">
                  Grand Standing en Face de la FECAFOOT (Tsinga)
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed mt-3">
                  Situé directement en face du siège de la FECAFOOT à Tsinga (Yaoundé), notre appartement T3 dispose de 2 chambres avec literie hôtelière grand luxe, de 2 salons lumineux décorés dans un esprit contemporain et de 2 salles de bain privatives avec eau chaude. La cuisine américaine est entièrement équipée (four, micro-ondes, réfrigérateur grand volume, cafetière, vaisselle complète).
                </p>
                <div className="mt-4 p-4 bg-red-50 border-l-4 border-[#E20713] rounded-xs">
                  <p className="text-xs text-gray-800 font-bold uppercase tracking-wider text-[#E20713]">
                    ⚡ NOUVEAUTÉ : RÉSIDENCE OYOMABANG — COMING SOON
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    Notre toute nouvelle résidence grand standing à <strong>Oyomabang</strong> ouvre très prochainement. Pré-réservez dès maintenant par téléphone au <strong>{PHONE_DISPLAY}</strong> pour bénéficier des tarifs de lancement.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-heading font-bold text-lg text-gray-900 mb-4">
                  Équipements &amp; Services Inclus
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {AMENITIES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="p-4 bg-gray-50 border border-gray-200 rounded-xs flex items-start gap-3">
                        <div className="h-9 w-9 rounded bg-[#E20713]/10 text-[#E20713] flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-heading font-bold text-xs text-gray-900">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white border-2 border-[#111827] rounded-sm p-6 sm:p-7 shadow-xl h-fit">
              <span className="px-2.5 py-1 bg-[#E20713] text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs">
                Tarifs &amp; Disponibilité Tsinga
              </span>
              <div className="mt-4">
                <span className="text-3xl font-heading font-black text-gray-900">
                  65 000 FCFA
                </span>
                <span className="text-xs text-gray-500 font-mono block">
                  par nuitée (Tarif dégressif au mois)
                </span>
              </div>

              <ul className="mt-6 space-y-2.5 text-xs text-gray-700 pt-4 border-t border-gray-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Face FECAFOOT Tsinga • Sécurité 24/7</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Ménage quotidien &amp; changement de draps inclus</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Groupe électrogène automatique sans interruption</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Wi-Fi Fibre optique illimité</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Check-in / Check-out 24h/24 sur demande</span>
                </li>
              </ul>

              <div className="mt-6 space-y-2.5">
                <a
                  href={`tel:+${WHATSAPP_NUMBER}`}
                  className="w-full py-3.5 bg-[#E20713] hover:bg-[#b3050f] text-white text-xs font-heading font-black uppercase tracking-wider text-center transition-all rounded-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02]"
                >
                  <Phone className="h-4 w-4" />
                  <span>Appelez pour réserver : {PHONE_DISPLAY}</span>
                </a>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20r%C3%A9server%20l'appartement%20meubl%C3%A9%20de%20Tsinga%20Face%20FECAFOOT`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold uppercase tracking-wider text-center transition-colors rounded-xs flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Disponibilité WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
