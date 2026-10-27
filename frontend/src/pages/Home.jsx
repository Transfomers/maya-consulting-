import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Key,
  Home as HomeIcon,
  Phone,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  Fuel,
  Gauge,
  Users,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  ExternalLink,
  FileText,
  Download,
  CreditCard,
  Building2,
  ShoppingCart,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { CATALOG_INFO, CATALOG_SECTIONS } from "@/data/catalogVehicles";
import { getCars } from "@/data/catalogStorage";
import { getApartments, subscribeApartments } from "@/data/apartmentStorage";
import { useCart } from "@/context/CartContext";
import VehicleDetailModal from "@/components/VehicleDetailModal";
import CustomOrderModal from "@/components/CustomOrderModal";
import ApartmentModal from "@/components/ApartmentModal";

export default function Home() {
  const [cars, setCars] = useState([]);
  const { addToCart, isInCart } = useCart();
  const [selectedSection, setSelectedSection] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all"); // "all" | "Neuve" | "Occasion"
  const [transmissionFilter, setTransmissionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isCustomOrderOpen, setIsCustomOrderOpen] = useState(false);
  const [activeApartment, setActiveApartment] = useState(null);
  const [isApartmentModalOpen, setIsApartmentModalOpen] = useState(false);
  const [apartments, setApartments] = useState(getApartments());

  const loadCars = () => {
    setCars(getCars());
  };

  useEffect(() => {
    setApartments(getApartments());
    const unsubApts = subscribeApartments((updated) => setApartments(updated));
    return unsubApts;
  }, []);

  useEffect(() => {
    loadCars();
    const handleUpdate = () => loadCars();
    window.addEventListener("3m_cars_updated", handleUpdate);
    return () => window.removeEventListener("3m_cars_updated", handleUpdate);
  }, []);

  // Exactly 3 featured vehicles for the simplified homepage
  const featuredVehicles = useMemo(() => {
    if (!cars || cars.length === 0) return [];
    const jeep = cars.find((c) => c.id === "suv-00-jeep") || cars[0];
    const rav4 = cars.find((c) => c.id === "suv-01") || cars[1];
    const flagship = cars.find((c) => c.brand?.toLowerCase().includes("mercedes") || c.id === "suv-04-prado" || c.id === "toyota-03-hilux") || cars[2];
    const list = [jeep, rav4, flagship].filter(Boolean);
    return list.slice(0, 3);
  }, [cars]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return cars.filter((item) => {
      // Section filter
      if (selectedSection !== "all" && item.section !== selectedSection) {
        return false;
      }
      // Condition filter
      if (conditionFilter !== "all") {
        if (conditionFilter === "Neuve" && item.condition !== "Neuve" && item.mileage !== "0 km") return false;
        if (conditionFilter === "Occasion" && item.condition !== "Occasion" && item.mileage === "0 km") return false;
      }
      // Transmission filter
      if (transmissionFilter !== "all") {
        if (!item.transmission.toLowerCase().includes(transmissionFilter.toLowerCase())) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchModel = item.model.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchSection = item.sectionTitle.toLowerCase().includes(q);
        const matchEngine = item.engine.toLowerCase().includes(q);
        if (!matchModel && !matchBrand && !matchSection && !matchEngine) {
          return false;
        }
      }
      return true;
    });
  }, [cars, selectedSection, conditionFilter, transmissionFilter, searchQuery]);

  const openVehicleModal = (veh) => {
    if (veh.section === "12") {
      setIsCustomOrderOpen(true);
    } else {
      setActiveVehicle(veh);
      setIsVehicleModalOpen(true);
    }
  };

  const openApartmentModal = (apt) => {
    setActiveApartment(apt);
    setIsApartmentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-bone text-forest selection:bg-maple selection:text-white" data-testid="home-page">
      
      {/* HERO BANNER SECTION */}
      <section className="relative overflow-hidden border-b border-forest/15 bg-gradient-to-b from-[#FAF9F5] via-bone to-white pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0D0E0D_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="mx-auto max-w-[1440px] px-5 md:px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Heading & Vision */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-forest text-bone text-xs font-bold uppercase tracking-[0.2em]">
                <ShieldCheck className="h-3.5 w-3.5 text-maple-light" />
                <span>3M SERVICES • YAOUNDÉ, CAMEROUN</span>
              </div>

              <h1 className="font-heading font-black text-4xl sm:text-6xl lg:text-7xl tracking-tighter text-forest leading-[0.95]">
                CATALOGUE <br />
                <span className="text-maple italic font-serif font-normal">AUTOMOBILE</span> <br />
                2025.
              </h1>

              {/* Tagline from User */}
              <div className="border-l-4 border-maple pl-4 py-1">
                <p className="font-serif italic text-2xl sm:text-3xl text-forest/90 font-medium">
                  « Le confort de votre foyer, dans nos véhicules »
                </p>
                <p className="text-xs uppercase tracking-widest text-maple font-bold mt-1">
                  Vente de voitures • Location de véhicules et d’appartements
                </p>
              </div>

              {/* Short Description */}
              <p className="text-base sm:text-lg text-sage leading-relaxed max-w-xl">
                {CATALOG_INFO.aboutShort} Retrouvez notre sélection complète de plus de 55 véhicules rigoureusement vérifiés : SUV tout-terrain, berlines Mercedes de prestige, gamme Kia neuve 0 km, légendaires Toyota et crossovers Hyundai.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#catalogue"
                  className="px-7 py-4 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-[0.15em] transition-all flex items-center gap-3 shadow-lg"
                >
                  <span>Explorer le Catalogue</span>
                  <ChevronRight className="h-4 w-4" />
                </a>

                <a
                  href="tel:+237691786447"
                  className="px-6 py-4 bg-[#E20713] hover:bg-[#b3050f] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow"
                  title="Appel Direct 3M Services"
                >
                  <Phone className="h-4 w-4" />
                  <span>Appel : +237 691 78 64 47</span>
                </a>

                <a
                  href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20des%20renseignements%20sur%20le%20Catalogue%20Automobile%202025"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow"
                  title="WhatsApp 3M Services"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {/* Quick Stat Bar */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-forest/10 max-w-lg">
                <div>
                  <p className="font-heading font-black text-2xl sm:text-3xl text-forest">12</p>
                  <p className="text-[11px] uppercase tracking-wider text-sage font-bold">Catégories Ciblées</p>
                </div>
                <div>
                  <p className="font-heading font-black text-2xl sm:text-3xl text-forest">0 KM</p>
                  <p className="text-[11px] uppercase tracking-wider text-sage font-bold">Gamme Neuve Kia/Toyota</p>
                </div>
                <div>
                  <p className="font-heading font-black text-2xl sm:text-3xl text-forest">100%</p>
                  <p className="text-[11px] uppercase tracking-wider text-sage font-bold">Inspectés & Révisés</p>
                </div>
              </div>
            </div>

            {/* Right Column: Featured Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative border border-forest/20 bg-white p-4 sm:p-6 shadow-2xl">
                <div className="absolute -top-3 -right-3 bg-maple text-white text-[10px] font-black uppercase tracking-widest py-1 px-3">
                  ARRIVAGE 2025
                </div>

                <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-forest/10 mb-5">
                  <img
                    src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=compress&cs=tinysrgb&w=1200"
                    alt="Mercedes Maybach & SUV 3M Services"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-maple-light">
                      PRESTIGE & CONFORT
                    </span>
                    <h3 className="text-xl sm:text-2xl font-heading font-bold text-white leading-tight">
                      MERCEDES-BENZ & SUV 4x4
                    </h3>
                    <p className="text-xs text-white/80 mt-1">
                      Disponibles immédiatement à l'achat et en location à Yaoundé.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-forest/10">
                    <span className="text-sage font-medium">Fournisseur :</span>
                    <span className="font-bold text-forest">3M SERVICES</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-forest/10">
                    <span className="text-sage font-medium">Localisation :</span>
                    <span className="font-bold text-forest">Yaoundé, Région du Centre</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-forest/10">
                    <span className="text-sage font-medium">Services phares :</span>
                    <span className="font-bold text-maple">Vente • Location Véhicules & Appartements</span>
                  </div>
                </div>

                <div className="mt-5 pt-3">
                  <a
                    href="#a-propos"
                    className="w-full py-3 bg-forest hover:bg-forest/90 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Découvrir QUI SOMMES-NOUS ?</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION SERVICES PHARES & RÉFÉRENCEMENT LOCAL YAOUNDÉ
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-white border-b border-gray-200 relative">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#E20713]">
              Fournisseur Automobile &amp; Immobilier à Yaoundé
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-gray-900 mt-2">
              Nos Pôles d'Excellence à Yaoundé
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Découvrez nos services dédiés : location de véhicules avec ou sans chauffeur, 4x4 Toyota Prado VIP, appartements meublés grand standing à Tsinga (Face FECAFOOT) et bientôt Oyomabang, vente et leasing conventionné MUPOCAM.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Location de voiture Yaoundé */}
            <Link
              to="/location-voiture-yaounde"
              className="group bg-gray-50 hover:bg-white border border-gray-200 hover:border-[#E20713] p-6 rounded-sm shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-12 w-12 rounded bg-[#E20713]/10 text-[#E20713] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Car className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-gray-900 group-hover:text-[#E20713] transition-colors">
                  Location de Voiture à Yaoundé
                </h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Véhicules récents avec ou sans chauffeur professionnel. Tarifs dégressifs, formule aéroport Nsimalen 24/7 et liberté totale de déplacement.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between text-xs font-bold text-[#E20713] uppercase tracking-wider">
                <span>Découvrir la flotte</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 2: Location Toyota Prado */}
            <Link
              to="/location-prado-yaounde"
              className="group bg-gray-50 hover:bg-white border border-gray-200 hover:border-[#FF7900] p-6 rounded-sm shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-12 w-12 rounded bg-[#FF7900]/10 text-[#FF7900] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Key className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-gray-900 group-hover:text-[#FF7900] transition-colors">
                  Location Toyota Prado Yaoundé
                </h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Toyota Land Cruiser Prado TXL 4x4 tout-terrain avec chauffeur VIP. Le choix numéro 1 pour missions officielles, cortèges et mariages.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between text-xs font-bold text-[#FF7900] uppercase tracking-wider">
                <span>Offre Toyota Prado</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 3: Appartement Meublé Tsinga FECAFOOT & Oyomabang */}
            <Link
              to="/appartement-meuble-tsinga-fecafoot"
              className="group bg-gray-50 hover:bg-white border border-gray-200 hover:border-emerald-600 p-6 rounded-sm shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-12 w-12 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase rounded-xs mb-2">
                  <span>Tsinga • Bientôt Oyomabang</span>
                </div>
                <h3 className="font-heading font-extrabold text-lg text-gray-900 group-hover:text-emerald-600 transition-colors">
                  Appartements Meublés Tsinga (Face FECAFOOT)
                </h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Résidences haut standing en face du siège de la FECAFOOT et nouvelle résidence bientôt disponible à Oyomabang. Groupe électrogène permanent, Wifi fibre et gardiennage 24h/24. Appelez-nous au +237 691 78 64 47.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
                <span>Voir Tsinga &amp; Oyomabang</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 4: Appartements Meublés Yaoundé & Essos */}
            <Link
              to="/appartement-meuble-yaounde"
              className="group bg-gray-50 hover:bg-white border border-gray-200 hover:border-[#111827] p-6 rounded-sm shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-12 w-12 rounded bg-gray-200 text-gray-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <HomeIcon className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-gray-900">
                  Appartements Meublés Essos &amp; Yaoundé
                </h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Studios et logements meublés à Essos, Omnisports et Le Golfe. Idéal pour séjours d'affaires et touristiques courts et moyens séjours.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between text-xs font-bold text-gray-900 uppercase tracking-wider">
                <span>Tous les quartiers</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 5: Vente & Leasing MUPOCAM */}
            <Link
              to="/vente-voiture-leasing-cameroun"
              className="group bg-gray-50 hover:bg-white border border-gray-200 hover:border-[#E20713] p-6 rounded-sm shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-12 w-12 rounded bg-[#E20713]/10 text-[#E20713] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-gray-900 group-hover:text-[#E20713] transition-colors">
                  Vente &amp; Leasing MUPOCAM
                </h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Achat de véhicules neufs 0 km et occasions certifiées avec convention officielle de leasing et facilités de paiement échelonné.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between text-xs font-bold text-[#E20713] uppercase tracking-wider">
                <span>Programme de leasing</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Card 6: Boutique en ligne */}
            <Link
              to="/boutique"
              className="group bg-[#111827] text-white p-6 rounded-sm shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-12 w-12 rounded bg-white/10 text-[#FF7900] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-white">
                  Boutique en Ligne 3M SERVICES
                </h3>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  Consultez notre stock de voitures et appartements, ajoutez vos choix au panier et passez commande instantanément via WhatsApp.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#FF7900] uppercase tracking-wider">
                <span>Accéder à la boutique</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          SECTION PARTENARIAT MUPOCAM & VENTE EN LEASING
          ═══════════════════════════════════════════════════════════════ */}
      <section id="leasing" className="py-20 md:py-28 bg-[#0D0F0E] text-white border-b border-white/10 relative overflow-hidden">
        {/* Subtle orange accent glow in background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF7900]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#ED1C24]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-[1440px] px-5 md:px-10 relative z-10">
          
          {/* Header & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-6 pb-12 border-b border-white/10">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <div className="flex items-center gap-3 bg-black/60 px-4 py-2.5 rounded border border-white/15">
                <img
                  src="/Asset/logo-3m-services.png"
                  alt="3M SERVICES"
                  className="h-10 w-auto object-contain"
                />
                <span className="font-heading font-black text-sm text-white">3M SERVICES</span>
              </div>
              <span className="text-xl font-light text-stone-500">✕</span>
              <div className="flex items-center gap-3 bg-black/60 px-4 py-2.5 rounded border border-[#FF7900]/40 shadow-[0_0_20px_rgba(255,121,0,0.15)]">
                <img
                  src="/Asset/logo-mupocam.png"
                  alt="MUPOCAM - Mutuelle du Personnel Orange Cameroun"
                  className="h-10 w-auto object-contain"
                />
                <div>
                  <span className="font-heading font-black text-sm text-[#FF7900] block">MUPOCAM</span>
                  <span className="text-[10px] text-stone-300 block font-sans">Mutuelle Personnel Orange Cameroun</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-[#FF7900]/15 text-[#FF7900] border border-[#FF7900]/30 font-mono text-xs font-bold uppercase tracking-wider">
                Distributeur Officiel Agréé
              </span>
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 text-white/90 border border-white/15 font-mono text-xs uppercase tracking-wider hidden sm:inline-block">
                Nouvelle route - OMNISPORTS
              </span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-12 items-center">
            
            {/* Left Column: Brief, Benefits & Actions (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#FF7900] font-bold block mb-3">
                  PROGRAMME LEASING & FACILITÉS DE PAIEMENT
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  Vente de Véhicules en <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7900] to-red-500">Leasing</span> pour la Mutuelle Orange Cameroun
                </h2>
                <p className="mt-4 text-base sm:text-lg text-stone-300 leading-relaxed">
                  Dans le cadre de notre partenariat exclusif, <strong className="text-white">3M SERVICES</strong> met à disposition des mutualistes de la <strong className="text-[#FF7900]">MUPOCAM</strong> (Mutuelle du Personnel d'Orange Cameroun) et de nos clients partenaires une formule d'acquisition en <strong>paiement échelonné (leasing automobile)</strong> sur tout notre catalogue 2025.
                </p>
              </div>

              {/* 4 Feature Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-5 bg-white/5 border border-white/10 rounded-lg hover:border-[#FF7900]/50 transition-colors">
                  <div className="h-10 w-10 rounded bg-[#FF7900]/20 text-[#FF7900] flex items-center justify-center mb-3">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h4 className="font-heading font-bold text-white text-base">Paiement Échelonné Souple</h4>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Apport initial modulable et mensualités étalées sur 12, 24 ou 36 mois adaptées à vos revenus et retenues.
                  </p>
                </div>

                <div className="p-5 bg-white/5 border border-white/10 rounded-lg hover:border-[#FF7900]/50 transition-colors">
                  <div className="h-10 w-10 rounded bg-red-500/20 text-red-400 flex items-center justify-center mb-3">
                    <Car className="h-5 w-5" />
                  </div>
                  <h4 className="font-heading font-bold text-white text-base">Tout le Catalogue 2025</h4>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Éligible sur nos SUV (Toyota, Santa Fe), Berlines Mercedes, Kia neuves 0 km sous garantie, pick-ups et sur commande.
                  </p>
                </div>

                <div className="p-5 bg-white/5 border border-white/10 rounded-lg hover:border-[#FF7900]/50 transition-colors">
                  <div className="h-10 w-10 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="font-heading font-bold text-white text-base">Prise en Charge Clé en Main</h4>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Immatriculation officielle, visite technique, assurance tous risques négociée et révision certifiée avant livraison.
                  </p>
                </div>

                <div className="p-5 bg-white/5 border border-white/10 rounded-lg hover:border-[#FF7900]/50 transition-colors">
                  <div className="h-10 w-10 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h4 className="font-heading font-bold text-white text-base">Agence Dédiée Omnisports</h4>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    Accueil personnalisé à notre agence : <strong>Nouvelle route - OMNISPORTS, Yaoundé</strong> pour l'étude de votre dossier.
                  </p>
                </div>
              </div>

              {/* Action Buttons: WhatsApp & Download PDF */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES,%20je%20suis%20mutualiste%20MUPOCAM%20(Orange%20Cameroun)%20et%20je%20souhaite%20des%20informations%20sur%20l'offre%20de%20vente%20de%20véhicule%20en%20leasing%20/%20paiement%20échelonné."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-4 bg-[#FF7900] hover:bg-[#E06800] text-black font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-lg"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Demande Leasing WhatsApp</span>
                </a>

                <a
                  href="/Asset/car.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  download="Brochure-Officielle-3M-Services-MUPOCAM.pdf"
                  className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2.5"
                >
                  <Download className="h-4 w-4 text-[#FF7900]" />
                  <span>Télécharger l'Affiche Officielle (PDF)</span>
                </a>

                <a
                  href="#catalogue"
                  className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-stone-300 hover:text-white flex items-center gap-2 transition-colors underline"
                >
                  <span>Voir les véhicules éligibles</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="p-4 rounded bg-black/40 border border-white/10 text-xs text-stone-300 flex items-start gap-3">
                <Building2 className="h-5 w-5 text-[#FF7900] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-semibold">Conseil aux adhérents MUPOCAM :</strong> Munissez-vous de votre carte d'adhérent ou matricule Orange Cameroun pour bénéficier des conditions tarifaires préférentielles et du traitement prioritaire de votre dossier.
                </div>
              </div>
            </div>

            {/* Right Column: Poster Preview (5 cols) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative max-w-md w-full bg-black/80 p-3 sm:p-4 rounded-xl border border-white/15 shadow-2xl">
                <div className="absolute -top-3 -right-3 z-20 px-3 py-1 rounded bg-[#ED1C24] text-white font-mono text-[10px] font-bold uppercase tracking-widest shadow-md">
                  AFFICHE OFFICIELLE
                </div>
                
                <a
                  href="/Asset/car.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group overflow-hidden rounded-lg relative"
                  title="Cliquer pour ouvrir le document PDF officiel"
                >
                  <img
                    src="/Asset/affiche-mupocam-officielle.png"
                    alt="3M Services Distributeur Officiel MUPOCAM Mutuelle Personnel Orange Cameroun"
                    className="w-full h-auto object-contain rounded-lg group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-xs">
                    <ExternalLink className="h-4 w-4 text-[#FF7900]" />
                    <span>Ouvrir le document PDF complet</span>
                  </div>
                </a>

                <div className="pt-3 px-2 flex items-center justify-between text-xs text-stone-400">
                  <span className="font-mono text-[11px]">📍 Nouvelle route - OMNISPORTS</span>
                  <a
                    href="/Asset/car.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF7900] hover:underline font-bold text-[11px]"
                  >
                    Consulter car.pdf →
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* SECTION QUI SOMMES NOUS ? */}
      <section id="a-propos" className="py-20 md:py-28 bg-[#F7F5F0] border-b border-forest/15 relative">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual Box */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="border border-forest/20 overflow-hidden h-48 sm:h-56 bg-white shadow-sm">
                    <img
                      src="/images/cars/toyota-prado-txl-front.webp"
                      alt="Toyota Prado 4x4 3M Services Yaoundé"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4 bg-forest text-bone border border-forest">
                    <p className="font-serif italic text-lg leading-snug">
                      « Le confort de votre foyer, dans nos véhicules »
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-maple mt-2 font-mono">
                      Devise Officielle 3M SERVICES
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-6">
                  <div className="p-4 bg-white border border-forest/15 shadow-sm">
                    <Car className="h-6 w-6 text-maple mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider text-forest">Vente de voitures</p>
                    <p className="text-[11px] text-sage mt-1">Neuves 0 km & occasions certifiées prêtes à rouler.</p>
                  </div>
                  <div className="border border-forest/20 overflow-hidden h-48 sm:h-56 bg-white shadow-sm">
                    <img
                      src="/Asset/appartements/appartement-meuble-suite-parentale.webp"
                      alt="Appartement meublé Tsinga Face FECAFOOT Yaoundé 3M Services"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial Content */}
            <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
              <div className="flex items-center gap-2">
                <span className="h-px w-8 bg-maple" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-maple font-mono">
                  QUI SOMMES NOUS ?
                </span>
              </div>

              <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-forest tracking-tight leading-tight">
                3M SERVICES : L'Excellence Automobile & Immobilière à Yaoundé.
              </h2>

              <p className="font-serif text-xl sm:text-2xl italic text-forest/90 leading-snug border-l-2 border-maple pl-4">
                3M services est un fournisseur expérimenté de services automobiles basé dans la région du centre, plus précisément dans la ville de Yaoundé.
              </p>

              <p className="text-sm sm:text-base text-sage leading-relaxed">
                Forts d'une connaissance intime des exigences du réseau routier camerounais et des attentes de notre clientèle privée et institutionnelle, nous sélectionnons chaque modèle pour sa fiabilité mécanique, sa climatisation irréprochable et son confort souverain.
              </p>

              {/* 3 Pillars from Prompt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 bg-white border border-forest/15 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 bg-maple/10 text-maple flex items-center justify-center font-bold text-xs">
                      01
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-forest">
                      Location de Véhicules & d'Appartements
                    </h3>
                  </div>
                  <p className="text-xs text-sage leading-relaxed">
                    Mise à disposition de véhicules avec ou sans chauffeur pour séjours, cortèges, missions dans les 10 régions, ainsi que des appartements meublés grand standing à Yaoundé.
                  </p>
                </div>

                <div className="p-5 bg-white border border-forest/15 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 bg-forest text-bone flex items-center justify-center font-bold text-xs">
                      02
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-forest">
                      Vente de Voitures
                    </h3>
                  </div>
                  <p className="text-xs text-sage leading-relaxed">
                    Parc de véhicules neufs (0 km) sous garantie constructeur et occasions rigoureusement contrôlées : SUV, berlines, pick-up utilitaires et citadines économiques.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <a
                  href="#contact"
                  className="px-6 py-3.5 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  <span>Nous Contacter à Yaoundé</span>
                </a>
                <a
                  href="#appartements"
                  className="px-6 py-3.5 bg-white border border-forest/20 hover:border-forest text-forest text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
                >
                  <HomeIcon className="h-4 w-4 text-maple" />
                  <span>Voir les Appartements Meublés</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ── SECTION VÉHICULES EN VEDETTE (EXACTEMENT 3 VÉHICULES) ─────── */}
      <section id="catalogue" className="py-20 md:py-28 bg-[#FFFFFF] relative border-b border-gray-200">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-[#E20713] text-white text-[11px] font-bold uppercase tracking-wider rounded-xs">
                  SÉLECTION EN VEDETTE
                </span>
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                  CATALOGUE AUTOMOBILE 2025 • YAOUNDÉ
                </span>
              </div>
              <h2 className="font-heading font-black text-3xl sm:text-5xl text-gray-900 tracking-tight">
                Véhicules Phares de la Semaine
              </h2>
              <p className="font-serif italic text-lg sm:text-xl text-gray-600 mt-1">
                Une sélection exclusive disponible immédiatement pour achat au comptant ou en leasing MUPOCAM.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/boutique"
                className="px-5 py-3 bg-[#E20713] hover:bg-[#C4050F] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-xs shadow-sm hover:shadow-md"
              >
                <span>Voir toute la boutique ({cars.length}+)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* 3 Featured Vehicles in a single row on desktop */}
          <div className="pt-10 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {featuredVehicles.map((veh) => {
              const isNew = veh.condition === "Neuve" || veh.mileage === "0 km";
              const added = isInCart(veh.id);

              return (
                <div
                  key={veh.id}
                  className="group flex flex-col justify-between bg-white border border-gray-200 hover:border-[#E20713] transition-all duration-300 hover:shadow-xl rounded-sm overflow-hidden relative"
                >
                  {/* Vehicle Image */}
                  <div className="relative h-60 sm:h-64 w-full overflow-hidden bg-gray-100">
                    <img
                      src={veh.image}
                      alt={veh.model}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      <span className="px-2 py-0.5 bg-black/80 backdrop-blur-xs text-white text-[10px] font-bold font-mono uppercase tracking-wider rounded-xs">
                        {veh.brand}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wider rounded-xs text-white ${
                          isNew ? "bg-[#E20713]" : "bg-emerald-600"
                        }`}
                      >
                        {veh.condition}
                      </span>
                    </div>

                    {/* Year Tag */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2.5 py-0.5 bg-white text-gray-900 text-[10px] font-mono font-bold rounded-xs shadow-xs">
                        {veh.year ? veh.year : (veh.mileage || "Disponible")}
                      </span>
                    </div>

                    {/* Model Name & Category on Image */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-red-300">
                        {veh.sectionTitle}
                      </p>
                      <h3 className="text-xl font-heading font-black text-white leading-tight mt-0.5 drop-shadow">
                        {veh.model}
                      </h3>
                    </div>
                  </div>

                  {/* Body Specs & Pricing */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    
                    {/* Price / Leasing Box */}
                    <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded border border-gray-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                          Prix / Formule
                        </span>
                        <span className="text-sm font-extrabold text-[#E20713]">
                          {veh.price || (isNew ? "Neuve 0 km • Prix sur devis" : "Sur devis • Éligible Leasing")}
                        </span>
                      </div>
                      {veh.isMupocam !== false && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider rounded border border-orange-200">
                          MUPOCAM ✓
                        </span>
                      )}
                    </div>

                    {/* Specs Matrix */}
                    <div className="grid grid-cols-2 gap-2 text-xs border-b border-gray-100 pb-3 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Fuel className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                        <span className="truncate">{veh.engine}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                        <span className="truncate">{veh.transmission}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                        <span>{veh.seats || "5 places"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                        <span>{veh.mileage || (isNew ? "0 km" : "Certifié")}</span>
                      </div>
                    </div>

                    {/* Actions: Voir le véhicule & Ajouter au panier */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                      <button
                        onClick={() => openVehicleModal(veh)}
                        className="w-full sm:flex-1 py-2.5 px-3 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 rounded-xs"
                      >
                        <span>Voir le véhicule</span>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-500" />
                      </button>

                      {added ? (
                        <Link
                          to="/panier"
                          className="w-full sm:flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 rounded-xs shadow-xs"
                        >
                          <Check className="h-4 w-4" />
                          <span>Au Panier ✓</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => addToCart(veh)}
                          className="w-full sm:flex-1 py-2.5 px-3 bg-[#E20713] hover:bg-[#C4050F] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 rounded-xs shadow-xs"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          <span>Ajouter</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Banner: "Voir toute la boutique" Call-to-Action ─────── */}
          <div className="mt-12 p-8 sm:p-10 bg-gradient-to-r from-gray-900 via-[#111827] to-gray-900 text-white rounded-sm border border-gray-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 text-center md:text-left z-10">
              <span className="text-[11px] font-mono text-[#EF4444] font-bold uppercase tracking-widest">
                BOUTIQUE AUTOMOBILE COMPLÈTE
              </span>
              <h3 className="font-heading font-black text-2xl sm:text-3xl text-white">
                Découvrez plus de 55 véhicules en stock et sur commande
              </h3>
              <p className="text-sm text-stone-300 max-w-2xl leading-relaxed">
                Nos 12 sections complètes (Toyota Hilux, Prado, Mercedes Maybach, Kia neuves 0 km, Hyundai, etc.) sont réunies dans notre boutique dédiée avec panier et commande WhatsApp.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 z-10 w-full sm:w-auto">
              <Link
                to="/boutique"
                className="w-full sm:w-auto px-8 py-4 bg-[#E20713] hover:bg-[#C4050F] text-white font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 rounded-xs shadow-lg transition-all"
              >
                <span>Voir toute la boutique</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>


      {/* SECTION 12: COMMANDES SPÉCIALES & AUTRES MARQUES FEATURED */}
      <section className="py-20 bg-forest text-bone relative overflow-hidden border-b border-forest/30">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="mx-auto max-w-[1440px] px-5 md:px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-maple text-white text-xs font-bold font-mono uppercase tracking-widest">
                SECTION 12 • SERVICE SUR MESURE
              </div>

              <h2 className="font-heading font-black text-3xl sm:text-5xl text-white tracking-tight leading-tight">
                ET BIEN D'AUTRES MARQUES SUR COMMANDES...
              </h2>

              <p className="font-serif italic text-xl sm:text-2xl text-bone/90">
                Vous recherchez une BMW, une Audi, un Lexus, un Land Rover Defender, un Range Rover ou tout autre véhicule spécifique ?
              </p>

              <p className="text-sm sm:text-base text-bone/70 max-w-2xl leading-relaxed">
                3M SERVICES déploie son réseau de sourcing international (Europe, Émirats Arabes Unis, Amérique, Asie) pour vous livrer le véhicule exact de votre configuration avec garantie d'inspection certifiée, acheminement maritime sécurisé et formalités douanières complètes à Yaoundé.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                {[
                  { title: "Sourcing Vérifié", desc: "Inspection 150 points" },
                  { title: "Dédouanement", desc: "Clé en main Yaoundé" },
                  { title: "Toutes Marques", desc: "Luxe, 4x4, Berline" },
                  { title: "Garantie 3M", desc: "Transparence totale" }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/10">
                    <p className="text-xs font-bold uppercase tracking-wider text-maple-light">{item.title}</p>
                    <p className="text-[11px] text-bone/60 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="p-6 bg-white/10 border border-white/20 backdrop-blur-sm text-center">
                <Car className="h-8 w-8 text-[#E20713] mx-auto mb-3" />
                <h4 className="text-lg font-bold font-heading text-white">Votre Projet Automobile</h4>
                <p className="text-xs text-bone/70 mt-1 mb-5">
                  Indiquez-nous la marque, l'année et le budget souhaité. Devis gratuit sous 24h.
                </p>
                <button
                  onClick={() => setIsCustomOrderOpen(true)}
                  className="w-full py-3.5 px-6 bg-maple hover:bg-white hover:text-forest text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg"
                >
                  Remplir le Formulaire Commande
                </button>
              </div>

              <a
                href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20commander%20une%20voiture%20sur%20mesure%20(Section%2012)"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Discuter de ma commande sur WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      </section>


      {/* SECTION APPARTEMENTS MEUBLÉS À YAOUNDÉ */}
      <section id="appartements" className="py-20 md:py-28 bg-[#FAF9F5] border-b border-forest/15">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-maple font-mono">
              3M SERVICES IMMOBILIER
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-5xl text-forest tracking-tight">
              LOCATION D’APPARTEMENTS MEUBLÉS
            </h2>
            <p className="font-serif italic text-lg sm:text-xl text-sage">
              « Le confort de votre foyer » au cœur de la capitale politique du Cameroun.
            </p>
            <p className="text-xs sm:text-sm text-sage leading-relaxed">
              Pour vos séjours d'affaires, missions professionnelles ou vacances en famille à Yaoundé, profitez de résidences haut standing, sécurisées 24h/24, climatisées et entièrement équipées.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {apartments.slice(0, 4).map((apt) => (
              <div
                key={apt.id}
                className="bg-white border border-forest/20 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-forest/10">
                  <img
                    src={apt.image}
                    alt={apt.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-forest text-white text-xs font-bold uppercase tracking-wider">
                      {apt.type}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-xs text-white/80 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-maple-light" />
                      {apt.location}
                    </p>
                    <h3 className="text-xl sm:text-2xl font-heading font-bold text-white mt-0.5">
                      {apt.title}
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-maple uppercase tracking-wider mb-1">
                      {apt.rooms}
                    </p>
                    <p className="text-xs sm:text-sm text-sage leading-relaxed mb-4">
                      {apt.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-forest border-t border-forest/10 pt-3">
                      {apt.amenities.map((amenity, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-forest/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-sage uppercase tracking-wider">Tarification :</p>
                      <p className="text-xs font-bold text-forest">{apt.price}</p>
                    </div>

                    <button
                      onClick={() => openApartmentModal(apt)}
                      className="py-2.5 px-5 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Réserver / Visiter</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Link to Full Boutique Apartments */}
          <div className="text-center mt-12">
            <Link
              to="/boutique?tab=appartements"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-[#E20713] hover:bg-[#c00610] text-white font-heading font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
            >
              <Building2 className="h-4 w-4" />
              <span>Explorer Tous Nos Appartements Meublés ({apartments.length})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>


      {/* CONTACT & LOCALISATION SECTION */}
      <section id="contact" className="py-20 md:py-28 bg-white relative">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-maple font-mono">
                COORDONNÉES & ACCÈS
              </span>

              <h2 className="font-heading font-black text-3xl sm:text-4xl text-forest tracking-tight">
                CONTACTEZ 3M SERVICES À YAOUNDÉ
              </h2>

              <p className="text-sm text-sage leading-relaxed">
                Notre showroom et nos conseillers commerciaux sont à votre écoute pour toute demande d'achat de véhicule neuf ou d'occasion, devis de location automobile ou réservation d'appartement meublé.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3 p-4 bg-[#F8F7F4] border border-forest/10">
                  <MapPin className="h-5 w-5 text-maple flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-forest">Adresse Principale :</p>
                    <p className="text-xs text-sage mt-0.5">Yaoundé, Région du Centre, Cameroun</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-[#F8F7F4] border border-forest/10">
                  <Phone className="h-5 w-5 text-maple flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-forest">Lignes Téléphoniques Directes :</p>
                    <div className="mt-1 space-y-1">
                      <a href="tel:+237691786447" className="text-xs font-bold text-forest hover:text-maple block">
                        • +237 691 78 64 47
                      </a>
                      <a href="tel:+237653761728" className="text-xs font-bold text-forest hover:text-maple block">
                        • +237 653 76 17 28
                      </a>
                      <a href="tel:+237691786447" className="text-xs font-bold text-forest hover:text-maple block">
                        • +237 691 78 64 47
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200">
                  <MessageSquare className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-950">Service Client WhatsApp :</p>
                    <a
                      href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-800 hover:underline mt-0.5 block"
                    >
                      +237 691 78 64 47 (Disponible 7j/7)
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-7 bg-[#FAF9F5] border border-forest/15 p-6 sm:p-10 shadow-sm">
              <h3 className="text-xl font-heading font-bold text-forest mb-2">
                Envoyez-nous un Message Direct
              </h3>
              <p className="text-xs text-sage mb-6">
                Remplissez ce formulaire et notre équipe vous recontactera sous quelques heures.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Merci ! Votre message a bien été envoyé à l'équipe 3M SERVICES.");
                  e.target.reset();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                      Votre Nom & Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Jean Mballa"
                      className="w-full px-4 py-2.5 text-xs bg-white border border-forest/20 focus:outline-none focus:border-maple"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                      Téléphone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+237 6..."
                      className="w-full px-4 py-2.5 text-xs bg-white border border-forest/20 focus:outline-none focus:border-maple"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                      Service concerné
                    </label>
                    <select className="w-full px-4 py-2.5 text-xs bg-white border border-forest/20 focus:outline-none focus:border-maple">
                      <option>Achat Véhicule Neuf (0 km)</option>
                      <option>Achat Véhicule Occasion Certifiée</option>
                      <option>Commande Spéciale sur Mesure</option>
                      <option>Location de Véhicule</option>
                      <option>Location d'Appartement Meublé</option>
                      <option>Autre Renseignement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                      Modèle ou Localisation
                    </label>
                    <input
                      type="text"
                      placeholder="ex: RAV4, Mercedes, Tsinga FECAFOOT..."
                      className="w-full px-4 py-2.5 text-xs bg-white border border-forest/20 focus:outline-none focus:border-maple"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-forest mb-1">
                    Votre Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Précisez votre demande, budget ou dates souhaitées..."
                    className="w-full px-4 py-2.5 text-xs bg-white border border-forest/20 focus:outline-none focus:border-maple resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 shadow"
                >
                  <span>Transmettre à 3M SERVICES</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* MODALS */}
      <VehicleDetailModal
        vehicle={activeVehicle}
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
      />

      <CustomOrderModal
        isOpen={isCustomOrderOpen}
        onClose={() => setIsCustomOrderOpen(false)}
      />

      <ApartmentModal
        apartment={activeApartment}
        isOpen={isApartmentModalOpen}
        onClose={() => setIsApartmentModalOpen(false)}
      />

    </div>
  );
}
