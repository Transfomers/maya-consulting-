import React, { useState, useMemo } from "react";
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
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { CATALOG_INFO, CATALOG_SECTIONS, VEHICLES, APARTMENTS } from "@/data/catalogVehicles";
import VehicleDetailModal from "@/components/VehicleDetailModal";
import CustomOrderModal from "@/components/CustomOrderModal";
import ApartmentModal from "@/components/ApartmentModal";

export default function Home() {
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

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return VEHICLES.filter((item) => {
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
  }, [selectedSection, conditionFilter, transmissionFilter, searchQuery]);

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

                <button
                  onClick={() => setIsCustomOrderOpen(true)}
                  className="px-7 py-4 bg-white border border-forest/30 hover:border-maple hover:text-maple text-forest text-xs font-bold uppercase tracking-[0.15em] transition-all flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-maple" />
                  <span>Commander sur Mesure</span>
                </button>

                <a
                  href="https://wa.me/237677000000?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20des%20renseignements%20sur%20le%20Catalogue%20Automobile%202025"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow"
                  title="WhatsApp 3M Services"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp Direct</span>
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
                    <span className="font-bold text-forest">3M SERVICES SARL</span>
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
                      src="https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=compress&cs=tinysrgb&w=600"
                      alt="SUV 3M Services"
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
                      src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=compress&cs=tinysrgb&w=600"
                      alt="Appartement meublé Yaoundé"
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


      {/* MAIN CATALOGUE SECTION */}
      <section id="catalogue" className="py-20 md:py-28 bg-bone relative border-b border-forest/15">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          
          {/* Section Title */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-forest/15">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-maple text-white text-[11px] font-bold uppercase tracking-wider">
                  ÉDITION 2025
                </span>
                <span className="text-xs font-mono text-sage uppercase tracking-widest">
                  TOUTES MARQUES & MODÈLES
                </span>
              </div>
              <h2 className="font-heading font-black text-3xl sm:text-5xl text-forest tracking-tight">
                LE CATALOGUE AUTOMOBILE
              </h2>
              <p className="font-serif italic text-lg sm:text-xl text-sage mt-1">
                Explorez nos 12 sections : SUV, Mercedes, Kia, Toyota, Hyundai et commandes spéciales.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-forest font-mono">
                {filteredVehicles.length} Véhicules trouvés
              </span>
              <button
                onClick={() => setIsCustomOrderOpen(true)}
                className="px-4 py-2 bg-maple text-white text-xs font-bold uppercase tracking-wider hover:bg-forest transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Section 12 : Sur Commande</span>
              </button>
            </div>
          </div>

          {/* FILTER TOOLBAR */}
          <div className="py-6 space-y-4">
            
            {/* Search Input & Condition Pills */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-forest/40" />
                <input
                  type="text"
                  placeholder="Rechercher par modèle (ex: RAV4, Maybach, Hilux, Seltos, Prado, Kona...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-forest/20 text-xs font-medium text-forest placeholder:text-sage/60 focus:outline-none focus:border-maple"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sage hover:text-forest"
                  >
                    Effacer
                  </button>
                )}
              </div>

              {/* Quick Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-forest mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> État :
                </span>
                {[
                  { label: "Tous", val: "all" },
                  { label: "Neuves (0 km)", val: "Neuve" },
                  { label: "Occasions Certifiées", val: "Occasion" }
                ].map((btn) => (
                  <button
                    key={btn.val}
                    onClick={() => setConditionFilter(btn.val)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border ${
                      conditionFilter === btn.val
                        ? "bg-forest text-white border-forest"
                        : "bg-white text-forest border-forest/20 hover:border-forest"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}

                <span className="text-xs font-bold uppercase tracking-wider text-forest ml-2 mr-1">
                  Boîte :
                </span>
                {[
                  { label: "Toutes", val: "all" },
                  { label: "Auto", val: "auto" },
                  { label: "Manuelle", val: "manuelle" },
                  { label: "4*4", val: "4*" }
                ].map((btn) => (
                  <button
                    key={btn.val}
                    onClick={() => setTransmissionFilter(btn.val)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors border ${
                      transmissionFilter === btn.val
                        ? "bg-maple text-white border-maple"
                        : "bg-white text-forest border-forest/20 hover:border-maple"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTIONS TABS (01 to 12) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 scrollbar-none">
              <button
                onClick={() => setSelectedSection("all")}
                className={`px-4 py-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider transition-colors border ${
                  selectedSection === "all"
                    ? "bg-forest text-white border-forest shadow-sm"
                    : "bg-white text-forest border-forest/20 hover:border-forest hover:bg-forest/5"
                }`}
              >
                Toutes les Catégories ({VEHICLES.length})
              </button>

              {CATALOG_SECTIONS.map((sec) => (
                <button
                  key={sec.number}
                  onClick={() => setSelectedSection(sec.number)}
                  className={`px-4 py-2 whitespace-nowrap text-xs font-bold uppercase tracking-wider transition-colors border ${
                    selectedSection === sec.number
                      ? "bg-maple text-white border-maple shadow-sm"
                      : "bg-white text-forest border-forest/20 hover:border-maple hover:bg-maple/5"
                  }`}
                >
                  <span className="opacity-70 font-mono mr-1.5">{sec.number}</span>
                  {sec.title}
                </button>
              ))}
            </div>

          </div>

          {/* ACTIVE SECTION BANNER IF SPECIFIC SECTION SELECTED */}
          {selectedSection !== "all" && (
            <div className="my-6 p-4 sm:p-6 bg-forest text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-forest">
              <div>
                <span className="text-xs font-mono font-bold text-maple uppercase tracking-widest">
                  SECTION {selectedSection}
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-white mt-0.5">
                  {CATALOG_SECTIONS.find((s) => s.number === selectedSection)?.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-1">
                  {CATALOG_SECTIONS.find((s) => s.number === selectedSection)?.subtitle}
                </p>
              </div>

              <button
                onClick={() => setSelectedSection("all")}
                className="text-xs underline text-maple-light hover:text-white"
              >
                Afficher tout le catalogue (Toutes sections)
              </button>
            </div>
          )}

          {/* VEHICLES GRID */}
          {filteredVehicles.length === 0 ? (
            <div className="py-20 text-center bg-white border border-forest/15 p-8">
              <Car className="h-12 w-12 text-forest/30 mx-auto mb-4" />
              <h4 className="text-xl font-bold font-heading text-forest">Aucun véhicule ne correspond aux filtres</h4>
              <p className="text-sm text-sage max-w-md mx-auto mt-2">
                Essayez d'ajuster votre recherche ou utilisez notre service de commande sur mesure pour trouver exactement le véhicule de vos rêves.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setSelectedSection("all");
                    setConditionFilter("all");
                    setTransmissionFilter("all");
                    setSearchQuery("");
                  }}
                  className="px-5 py-2.5 bg-forest text-white text-xs font-bold uppercase tracking-wider"
                >
                  Réinitialiser les filtres
                </button>
                <button
                  onClick={() => setIsCustomOrderOpen(true)}
                  className="px-5 py-2.5 bg-maple text-white text-xs font-bold uppercase tracking-wider"
                >
                  Passer une commande sur mesure
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredVehicles.map((veh) => {
                const isNew = veh.condition === "Neuve" || veh.mileage === "0 km";

                return (
                  <div
                    key={veh.id}
                    className="group flex flex-col justify-between bg-white border border-forest/20 hover:border-maple transition-all duration-300 hover:shadow-xl relative overflow-hidden"
                  >
                    {/* Top Image Container */}
                    <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-forest/10">
                      <img
                        src={veh.image}
                        alt={veh.model}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                        <span className="px-2 py-0.5 bg-forest/90 text-white text-[10px] font-bold font-mono uppercase tracking-wider">
                          {veh.section} • {veh.brand}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            isNew ? "bg-emerald-500 text-white" : "bg-amber-400 text-black"
                          }`}
                        >
                          {veh.condition}
                        </span>
                      </div>

                      {/* Mileage / Year Tag */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2 py-0.5 bg-black/70 text-white text-[10px] font-mono font-bold">
                          {veh.mileage || (isNew ? "0 km" : "Occasion")}
                        </span>
                      </div>

                      {/* Bottom Title on Image */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-maple-light">
                          {veh.sectionTitle}
                        </p>
                        <h4 className="text-lg sm:text-xl font-heading font-black text-white leading-tight mt-0.5 drop-shadow">
                          {veh.model}
                        </h4>
                      </div>
                    </div>

                    {/* Specifications Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      
                      {/* Specs Matrix */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs border-b border-forest/10 pb-4">
                        <div className="flex items-center gap-2">
                          <Fuel className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                          <span className="text-sage">Moteur :</span>
                          <span className="font-bold text-forest">{veh.engine}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Gauge className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                          <span className="text-sage">Boîte :</span>
                          <span className="font-bold text-forest truncate" title={veh.transmission}>
                            {veh.transmission}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                          <span className="text-sage">Places :</span>
                          <span className="font-bold text-forest">{veh.seats || "5 places"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                          <span className="text-sage">Compteur :</span>
                          <span className="font-bold text-forest">{veh.mileage || (isNew ? "0 km" : "Certifié")}</span>
                        </div>
                      </div>

                      {/* Short Description */}
                      <p className="text-xs text-sage line-clamp-2 leading-relaxed">
                        {veh.description}
                      </p>

                      {/* Action CTA Buttons */}
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => openVehicleModal(veh)}
                          className="flex-1 py-2.5 px-3 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>Fiche & Devis</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>

                        <a
                          href={`https://wa.me/237677000000?text=${encodeURIComponent(
                            `Bonjour 3M SERVICES, je souhaite réserver ou commander : ${veh.model} (Moteur: ${veh.engine}, Boite: ${veh.transmission}, Section: ${veh.section})`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                          title="Commander sur WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                      </div>
                    </div>

                    {/* Footer strip */}
                    <div className="px-5 py-2 bg-[#F9F8F6] border-t border-forest/10 flex items-center justify-between text-[10px] text-sage font-mono">
                      <span>RÉF : {veh.id.toUpperCase()}</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Yaoundé Disponible
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

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
                <Sparkles className="h-8 w-8 text-maple-light mx-auto mb-3" />
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
                href="https://wa.me/237677000000?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20commander%20une%20voiture%20sur%20mesure%20(Section%2012)"
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
            {APARTMENTS.map((apt) => (
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
                    <p className="text-xs font-bold uppercase tracking-wider text-forest">Ligne Téléphonique Directe :</p>
                    <a href="tel:+237677000000" className="text-xs font-bold text-forest hover:text-maple mt-0.5 block">
                      +237 6 77 00 00 00
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200">
                  <MessageSquare className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-950">Service Client WhatsApp :</p>
                    <a
                      href="https://wa.me/237677000000?text=Bonjour%203M%20SERVICES"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-800 hover:underline mt-0.5 block"
                    >
                      +237 6 77 00 00 00 (Disponible 7j/7)
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
                      placeholder="ex: RAV4, Mercedes, Bastos..."
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
