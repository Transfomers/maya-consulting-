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
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=compress&cs=tinysrgb&w=1200",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=compress&cs=tinysrgb&w=1200",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=compress&cs=tinysrgb&w=1200",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=compress&cs=tinysrgb&w=1200",
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
        <title>Appartement Meublé à Bastos, Yaoundé | Résidence Haut Standing 3M Services</title>
        <meta
          name="description"
          content="Trouvez votre appartement meublé à Bastos, Yaoundé, avec 3M Services. Découvrez les logements disponibles, les équipements haut standing (groupe électrogène, fibre optique, gardiennage 24/7), les tarifs et réservez sur WhatsApp (+237 691 78 64 47)."
        />
        <meta
          name="keywords"
          content="appartement meublé Bastos, location appartement meublé Bastos, studio meublé Bastos Yaoundé, appartement à louer Bastos, appartement meublé Bastos prix, location appartement courte durée Bastos, appartement meublé par jour Bastos, appartement meublé par mois Bastos, logement meublé Bastos Yaoundé, appartement meublé haut standing Bastos, studio meublé à louer Bastos, réservation appartement meublé Bastos"
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
              <span>Quartier Diplomatique de Bastos • Yaoundé, Cameroun</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight max-w-4xl">
              Appartement Meublé à Bastos, Yaoundé
            </h1>

            <p className="text-base sm:text-lg text-stone-300 max-w-3xl mt-4 leading-relaxed font-normal">
              Profitez d'un cadre résidentiel d'exception au cœur de <strong>Bastos</strong>. Appartements et studios meublés tout confort avec <strong>groupe électrogène automatique</strong>, <strong>Wi-Fi fibre optique</strong>, eau courante permanente et gardiennage 24h/24. Idéal pour diplomates, cadres expatriés et séjours d'affaires.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3.5 mt-8">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20r%C3%A9server%20un%20appartement%20meubl%C3%A9%20%C3%A0%20Bastos`}
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
                <span>Appel : {PHONE_DISPLAY}</span>
              </a>

              <Link
                to="/appartement-meuble-yaounde"
                className="px-6 py-4 bg-white text-[#111827] hover:bg-stone-100 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-all shadow-md"
              >
                <Building2 className="h-4 w-4 text-[#E20713]" />
                <span>Tous nos appartements à Yaoundé</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Galerie Photos Bastos */}
        <section className="py-12 px-5 sm:px-8 max-w-[1440px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PHOTOS.map((src, i) => (
              <div key={i} className="aspect-[4/3] rounded-xs overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={src}
                  alt={`Appartement meublé Bastos Yaoundé ${i + 1}`}
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
                  Grand Standing au Calme à Bastos
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed mt-3">
                  Situé dans une rue calme et sécurisée du quartier diplomatique de Bastos, notre appartement T3 dispose de 2 chambres avec literie haut de gamme, de 2 salons lumineux décorés dans un esprit contemporain et de 2 salles de bain privatives avec eau chaude. La cuisine américaine est entièrement équipée (four, micro-ondes, réfrigérateur grand volume, cafetière, vaisselle complète).
                </p>
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
                Tarifs &amp; Disponibilité Bastos
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
                  <span>Ménage quotidien &amp; changement de draps inclus</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Electricité &amp; groupe électrogène inclus sans supplément</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Wi-Fi Fibre illimité</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Check-in / Check-out 24h/24 sur demande</span>
                </li>
              </ul>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20r%C3%A9server%20l'appartement%20meubl%C3%A9%20de%20Bastos`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full py-3.5 bg-[#E20713] hover:bg-[#b3050f] text-white text-xs font-heading font-bold uppercase tracking-wider text-center transition-colors rounded-xs flex items-center justify-center gap-2 shadow"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Réserver sur WhatsApp</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
