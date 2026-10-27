import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import {
  Car,
  Search,
  SlidersHorizontal,
  Fuel,
  Gauge,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  ShoppingCart,
  Check,
  Building2,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Layers,
  MapPin,
  Home as HomeIcon,
  Wifi,
  Shield,
  Image as ImageIcon,
  FileText,
  Download,
  Eye,
  ExternalLink
} from "lucide-react";
import { CATALOG_INFO, CATALOG_SECTIONS } from "@/data/catalogVehicles";
import { getCars } from "@/data/catalogStorage";
import { getApartments, subscribeApartments, syncApartmentsFromServer } from "@/data/apartmentStorage";
import { useCart } from "@/context/CartContext";
import VehicleDetailModal from "@/components/VehicleDetailModal";
import CustomOrderModal from "@/components/CustomOrderModal";
import ApartmentModal from "@/components/ApartmentModal";

export default function Boutique({ defaultTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const initialTab =
    defaultTab ||
    searchParams.get("tab") ||
    (location.pathname === "/appartements" ? "appartements" : "vehicules");

  const [activeTab, setActiveTab] = useState(initialTab);

  // Vehicles state
  const [cars, setCars] = useState([]);
  const [selectedSection, setSelectedSection] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [transmissionFilter, setTransmissionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [activeVehicle, setActiveVehicle] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isCustomOrderOpen, setIsCustomOrderOpen] = useState(false);

  // Apartments state
  const [apartments, setApartments] = useState([]);
  const [aptSearch, setAptSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);

  const { addToCart, isInCart, cartCount } = useCart();

  // Sync tab with URL
  useEffect(() => {
    const urlTab = searchParams.get("tab") || (location.pathname === "/appartements" ? "appartements" : null);
    if (urlTab && (urlTab === "vehicules" || urlTab === "appartements")) {
      setActiveTab(urlTab);
    }
  }, [searchParams, location.pathname]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Load cars
  const loadCars = () => {
    setCars(getCars());
  };

  useEffect(() => {
    loadCars();
    const handleUpdate = () => loadCars();
    window.addEventListener("3m_cars_updated", handleUpdate);
    return () => window.removeEventListener("3m_cars_updated", handleUpdate);
  }, []);

  // Load apartments
  useEffect(() => {
    setApartments(getApartments());
    syncApartmentsFromServer().then((list) => {
      if (list) setApartments(list);
    });
    const unsub = subscribeApartments((updated) => {
      setApartments(updated);
    });
    return unsub;
  }, []);

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return cars.filter((item) => {
      if (item.status && (item.status.toLowerCase().includes("vendu") || item.status.toLowerCase().includes("indisponible"))) {
        return false;
      }
      if (selectedSection !== "all" && item.section !== selectedSection) {
        return false;
      }
      if (conditionFilter !== "all") {
        if (conditionFilter === "Neuve" && item.condition !== "Neuve" && item.mileage !== "0 km") return false;
        if (conditionFilter === "Occasion" && item.condition !== "Occasion" && item.mileage === "0 km") return false;
      }
      if (transmissionFilter !== "all") {
        if (!item.transmission.toLowerCase().includes(transmissionFilter.toLowerCase())) {
          return false;
        }
      }
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

  // Unique apartment locations
  const aptLocations = useMemo(() => {
    const set = new Set();
    apartments.forEach((apt) => {
      if (apt.location) {
        const loc = apt.location.split(",")[0].trim();
        set.add(loc);
      }
    });
    return Array.from(set);
  }, [apartments]);

  // Filter apartments
  const filteredApartments = useMemo(() => {
    return apartments.filter((apt) => {
      if (apt.status && apt.status.toLowerCase() === "en maintenance") {
        return false;
      }
      if (selectedLocation !== "all" && !apt.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }
      if (aptSearch.trim() !== "") {
        const q = aptSearch.toLowerCase().trim();
        const matchTitle = apt.title && apt.title.toLowerCase().includes(q);
        const matchType = apt.type && apt.type.toLowerCase().includes(q);
        const matchLoc = apt.location && apt.location.toLowerCase().includes(q);
        const matchRooms = apt.rooms && apt.rooms.toLowerCase().includes(q);
        const matchDesc = apt.description && apt.description.toLowerCase().includes(q);
        const matchAmenity = Array.isArray(apt.amenities) && apt.amenities.some((a) => a.toLowerCase().includes(q));
        if (!matchTitle && !matchType && !matchLoc && !matchRooms && !matchDesc && !matchAmenity) {
          return false;
        }
      }
      return true;
    });
  }, [apartments, selectedLocation, aptSearch]);

  const openVehicleModal = (veh) => {
    if (veh.section === "12") {
      setIsCustomOrderOpen(true);
    } else {
      setActiveVehicle(veh);
      setIsVehicleModalOpen(true);
    }
  };

  const openApartmentModal = (apt) => {
    setSelectedApartment(apt);
    setIsAptModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFD] text-[#111827]">
      {/* ── Page Header Banner ─────── */}
      <section className="bg-[#111827] text-white pt-12 pb-14 sm:pb-16 px-5 sm:px-8 relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(#E20713_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="max-w-[1440px] mx-auto relative z-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 bg-[#E20713] text-white text-[11px] font-bold uppercase tracking-widest rounded-xs">
                  BOUTIQUE 3M SERVICES
                </span>
                <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">
                  {activeTab === "vehicules"
                    ? "CATALOGUE AUTOMOBILE 2025 • YAOUNDÉ"
                    : "IMMOBILIER DE STANDING • YAOUNDÉ"}
                </span>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-none">
                {activeTab === "vehicules" ? "Notre Boutique Automobile" : "Location d'Appartements Meublés"}
              </h1>
              <p className="text-sm sm:text-base text-stone-300 max-w-2xl mt-3 font-normal leading-relaxed">
                {activeTab === "vehicules"
                  ? "Explorez notre sélection complète de véhicules neufs (0 km) et occasions certifiées. Choisissez votre véhicule, ajoutez-le à votre panier et passez commande directement via WhatsApp."
                  : "Découvrez nos résidences et appartements meublés grand standing à Yaoundé (Tsinga Face FECAFOOT, Omnisports, et bientôt Oyomabang). Climatisation, Wifi Fibre, groupe automatique, sécurité 24/7. Appelez directement au +237 691 78 64 47 ou réservez sur WhatsApp."}
              </p>
            </div>

            {/* Quick Actions Widget */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/catalogue.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3.5 bg-gradient-to-r from-[#E20713] to-[#b3050f] text-white hover:brightness-110 transition-all font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md rounded-xs group"
                title="Consulter le catalogue officiel 3M SERVICES (PDF)"
              >
                <FileText className="h-4 w-4" />
                <span>Catalogue PDF</span>
                <Eye className="h-3.5 w-3.5 opacity-80 group-hover:scale-110 transition-transform" />
              </a>

              <Link
                to="/panier"
                className="px-5 py-3.5 bg-white text-[#111827] hover:bg-[#E20713] hover:text-white transition-all font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-md rounded-xs"
              >
                <div className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-[#E20713] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span>Panier ({cartCount})</span>
              </Link>
            </div>
          </div>

          {/* Primary Boutique Category Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => switchTab("vehicules")}
              className={`px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-xs ${
                activeTab === "vehicules"
                  ? "bg-[#E20713] text-white shadow-lg shadow-[#E20713]/30 scale-[1.02]"
                  : "bg-white/10 text-stone-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              <Car className="h-4 w-4" />
              <span>Catalogue Véhicules ({cars.length})</span>
            </button>

            <button
              onClick={() => switchTab("appartements")}
              className={`px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 rounded-xs ${
                activeTab === "appartements"
                  ? "bg-[#E20713] text-white shadow-lg shadow-[#E20713]/30 scale-[1.02]"
                  : "bg-white/10 text-stone-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Appartements Meublés ({apartments.length})</span>
            </button>
          </div>

          {/* ── Official PDF Catalogue Banner ── */}
          <div className="mt-8 bg-gradient-to-br from-stone-900 via-[#18181b] to-black border border-white/15 rounded-sm p-5 sm:p-7 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#E20713]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <a
                  href="/catalogue.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group shrink-0 block"
                  title="Cliquer pour ouvrir le PDF"
                >
                  <img
                    src="/Asset/affiche-mupocam-officielle.png"
                    alt="Affiche Catalogue 3M SERVICES MUPOCAM"
                    className="h-28 sm:h-36 w-auto object-contain rounded-xs border border-white/20 shadow-xl transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute -bottom-2 -right-2 bg-[#E20713] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-xs tracking-wider shadow">
                    PDF 2025
                  </span>
                </a>
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#FF7900]/20 text-[#FF7900] border border-[#FF7900]/30 text-[10px] font-bold uppercase tracking-widest rounded-xs mb-2">
                    <FileText className="h-3 w-3" />
                    <span>Documentation Officielle MUPOCAM & 3M SERVICES</span>
                  </div>
                  <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-white tracking-tight">
                    Catalogue Officiel Disponible en PDF
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-300 max-w-xl mt-1.5 leading-relaxed">
                    Vous pouvez consulter en ligne ou télécharger notre catalogue complet : fiches techniques détaillées de nos SUV, berlines et utilitaires, ainsi que toutes les modalités de leasing conventionné MUPOCAM (Orange Cameroun).
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-[11px] text-stone-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Consultation gratuite &amp; immédiate
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Fichier PDF Haute Résolution
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col shrink-0 gap-3 w-full sm:w-auto">
                <a
                  href="/catalogue.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 bg-white text-[#111827] hover:bg-stone-100 font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md rounded-xs hover:scale-[1.02]"
                >
                  <Eye className="h-4 w-4 text-[#E20713]" />
                  <span>Consulter le PDF en ligne</span>
                  <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                </a>
                <a
                  href="/catalogue.pdf"
                  download="Catalogue-3M-SERVICES-2025.pdf"
                  className="px-6 py-3.5 bg-[#E20713] text-white hover:bg-[#b3050f] font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md rounded-xs hover:scale-[1.02]"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger le Catalogue (PDF)</span>
                </a>
              </div>
            </div>
          </div>

          {/* MUPOCAM Leasing Advantage Banner */}
          {activeTab === "vehicules" && (
            <div className="mt-4 p-3.5 sm:p-4 rounded bg-white/5 border border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <img
                  src="/Asset/logo-mupocam.png"
                  alt="MUPOCAM"
                  className="h-6 w-auto object-contain"
                />
                <span className="text-stone-300">
                  <strong className="text-white font-semibold">Adhérents MUPOCAM :</strong> Tous nos véhicules de la boutique sont éligibles au programme d'achat en leasing / paiement échelonné.
                </span>
              </div>
              <a
                href="/#leasing"
                className="text-[#FF7900] hover:underline font-bold text-xs flex items-center gap-1"
              >
                Voir conditions de leasing →
              </a>
            </div>
          )}

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: CATALOGUE VÉHICULES
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "vehicules" && (
        <>
          {/* Filters & Search Toolbar */}
          <section className="sticky top-[69px] z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 py-4 px-5 sm:px-8 shadow-xs">
            <div className="max-w-[1440px] mx-auto space-y-3.5">
              
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un modèle, marque, transmission (ex: RAV4, Maybach, Hilux, Seltos, Kona...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F9FAFB] border border-gray-300 text-xs font-medium text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#E20713] focus:bg-white transition-colors rounded-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick Filter Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mr-1 flex items-center gap-1">
                    <SlidersHorizontal className="h-3.5 w-3.5" /> État :
                  </span>
                  {[
                    { label: "Tous", val: "all" },
                    { label: "Neuves (0 km)", val: "Neuve" },
                    { label: "Occasions", val: "Occasion" }
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      onClick={() => setConditionFilter(btn.val)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-xs border ${
                        conditionFilter === btn.val
                          ? "bg-[#111827] text-white border-[#111827]"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}

                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 ml-2 mr-1">
                    Boîte :
                  </span>
                  {[
                    { label: "Toutes", val: "all" },
                    { label: "Auto", val: "auto" },
                    { label: "Manuelle", val: "manuelle" },
                    { label: "4x4", val: "4*" }
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      onClick={() => setTransmissionFilter(btn.val)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-xs border ${
                        transmissionFilter === btn.val
                          ? "bg-[#111827] text-white border-[#111827]"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sections Pills Horizontal Scroll */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-gray-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap flex items-center gap-1 mr-1">
                  <Layers className="h-3.5 w-3.5" /> Catégories :
                </span>

                <button
                  onClick={() => setSelectedSection("all")}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-xs transition-colors ${
                    selectedSection === "all"
                      ? "bg-[#E20713] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Toutes ({cars.length})
                </button>

                {CATALOG_SECTIONS.map((sec) => {
                  const count = cars.filter((v) => v.section === sec.id).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setSelectedSection(sec.id)}
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-xs transition-colors ${
                        selectedSection === sec.id
                          ? "bg-[#E20713] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {sec.id} • {sec.title} ({count})
                    </button>
                  );
                })}
              </div>

            </div>
          </section>

          {/* Vehicles Count & Results Bar */}
          <section className="py-4 px-5 sm:px-8 border-b border-gray-100 bg-[#FAF9F5]">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs text-gray-600">
              <span className="font-mono">
                Affichage de <strong className="text-gray-900">{filteredVehicles.length}</strong> véhicule(s) disponible(s)
              </span>
              {(selectedSection !== "all" || conditionFilter !== "all" || transmissionFilter !== "all" || searchQuery !== "") && (
                <button
                  onClick={() => {
                    setSelectedSection("all");
                    setConditionFilter("all");
                    setTransmissionFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-[#E20713] hover:underline font-bold text-xs uppercase tracking-wider"
                >
                  Réinitialiser tous les filtres
                </button>
              )}
            </div>
          </section>

          {/* Vehicles Grid */}
          <section className="py-10 sm:py-14 px-5 sm:px-8">
            <div className="max-w-[1440px] mx-auto">
              
              {filteredVehicles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
                  {filteredVehicles.map((car) => {
                    const inCart = isInCart(car.id);
                    const isSpecialOrder = car.section === "12";

                    return (
                      <div
                        key={car.id}
                        className="group bg-white border border-gray-200 hover:border-gray-400 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl rounded-xs"
                      >
                        {/* Card Image Container */}
                        <div
                          className="relative aspect-[16/11] bg-gray-100 overflow-hidden cursor-pointer"
                          onClick={() => openVehicleModal(car)}
                        >
                          <img
                            src={car.image}
                            alt={car.model}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />

                          {/* Section Badge */}
                          <div className="absolute top-3 left-3 bg-[#111827]/90 text-white px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs backdrop-blur-xs">
                            {car.sectionTitle || `Section ${car.section}`}
                          </div>

                          {/* Condition Badge */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            {car.isMupocam !== false && (
                              <span className="px-2 py-0.5 bg-[#FF7900] text-black text-[10px] font-black uppercase tracking-wider rounded-xs shadow-xs">
                                MUPOCAM ✓
                              </span>
                            )}
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-xs shadow-xs ${
                              car.condition === "Neuve"
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-gray-800"
                            }`}>
                              {car.condition}
                            </span>
                          </div>

                          {/* Year Badge at Bottom Left of Image */}
                          {car.year && (
                            <div className="absolute bottom-2.5 left-3 bg-black/60 text-white px-2 py-0.5 text-[10px] font-mono rounded-xs backdrop-blur-xs">
                              {car.year}
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs text-gray-500 font-mono mb-1">
                              <span className="uppercase tracking-wider font-semibold text-gray-700">{car.brand}</span>
                              {car.mileage && (
                                <span className="flex items-center gap-1">
                                  <Gauge className="h-3 w-3 text-gray-400" />
                                  {car.mileage}
                                </span>
                              )}
                            </div>

                            <h3
                              onClick={() => openVehicleModal(car)}
                              className="font-heading font-black text-base text-gray-900 group-hover:text-[#E20713] transition-colors leading-snug cursor-pointer line-clamp-1"
                              title={car.model}
                            >
                              {car.model}
                            </h3>

                            {/* Key specs row */}
                            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                              <div className="flex items-center gap-1.5 truncate">
                                <Fuel className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{car.engine}</span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <Gauge className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{car.transmission}</span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">{car.seats}</span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <Sparkles className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                                <span className="truncate text-gray-700 font-medium">{car.features?.[0] || "3M Garantie"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Pricing & Cart Action */}
                          <div className="pt-3 border-t border-gray-100 space-y-2.5">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[10px] font-mono uppercase text-gray-500 tracking-wider">
                                {isSpecialOrder ? "Tarif" : "Disponibilité"}
                              </span>
                              <span className="text-xs font-bold text-gray-900">
                                {isSpecialOrder ? "Sur devis spécial" : (car.price || "Sur demande")}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openVehicleModal(car)}
                                className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-heading font-bold uppercase tracking-wider transition-colors rounded-xs flex items-center justify-center gap-1"
                              >
                                <span>Détails</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>

                              {!isSpecialOrder && (
                                <button
                                  onClick={() => addToCart(car)}
                                  className={`p-2.5 transition-all rounded-xs flex items-center justify-center ${
                                    inCart
                                      ? "bg-emerald-600 text-white"
                                      : "bg-[#E20713] hover:bg-[#c00610] text-white"
                                  }`}
                                  title={inCart ? "Déjà dans le panier" : "Ajouter au panier"}
                                  aria-label="Ajouter au panier"
                                >
                                  {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center bg-white border border-gray-200 rounded-sm p-8 max-w-md mx-auto">
                  <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-heading font-bold text-lg text-gray-900">Aucun véhicule trouvé</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Essayez de modifier vos critères de recherche ou réinitialisez les filtres.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSection("all");
                      setConditionFilter("all");
                      setTransmissionFilter("all");
                      setSearchQuery("");
                    }}
                    className="mt-4 px-4 py-2 bg-[#E20713] text-white text-xs font-bold uppercase tracking-wider rounded-xs"
                  >
                    Voir tous les véhicules
                  </button>
                </div>
              )}

              {/* PDF Catalogue Bottom Call-to-Action Bar */}
              <div className="mt-12 bg-gradient-to-r from-stone-900 via-[#18181b] to-black border border-stone-800 text-white rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-[#E20713]/20 border border-[#E20713]/40 flex items-center justify-center shrink-0">
                    <FileText className="h-7 w-7 text-[#E20713]" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-lg sm:text-xl text-white">
                      Vous souhaitez explorer l'intégralité de notre catalogue ?
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-300 mt-1">
                      Consultez en ligne ou téléchargez le fichier PDF officiel (fiches techniques détaillées &amp; barèmes leasing MUPOCAM).
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <a
                    href="/catalogue.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-white text-[#111827] hover:bg-stone-100 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-all shadow"
                  >
                    <Eye className="h-4 w-4 text-[#E20713]" />
                    <span>Consulter le PDF</span>
                  </a>
                  <a
                    href="/catalogue.pdf"
                    download="Catalogue-3M-SERVICES-2025.pdf"
                    className="px-5 py-3 bg-[#E20713] text-white hover:bg-[#b3050f] font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs transition-all shadow"
                  >
                    <Download className="h-4 w-4" />
                    <span>Télécharger</span>
                  </a>
                </div>
              </div>

            </div>
          </section>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: CATALOGUE APPARTEMENTS MEUBLÉS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "appartements" && (
        <>
          {/* Apartments Filter Bar */}
          <section className="sticky top-[69px] z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 py-4 px-5 sm:px-8 shadow-xs">
            <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              
              {/* Search input */}
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par quartier, type, équipement (ex: Tsinga FECAFOOT, Oyomabang, Fibre...)"
                  value={aptSearch}
                  onChange={(e) => setAptSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F9FAFB] border border-gray-300 text-xs font-medium text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#E20713] focus:bg-white transition-colors rounded-xs"
                />
                {aptSearch && (
                  <button
                    onClick={() => setAptSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Location pills */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#E20713]" /> Quartiers :
                </span>

                <button
                  onClick={() => setSelectedLocation("all")}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-xs transition-colors ${
                    selectedLocation === "all"
                      ? "bg-[#E20713] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Tous ({apartments.length})
                </button>

                {aptLocations.map((loc) => {
                  const count = apartments.filter((a) => a.location && a.location.toLowerCase().includes(loc.toLowerCase())).length;
                  return (
                    <button
                      key={loc}
                      onClick={() => setSelectedLocation(loc)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap rounded-xs transition-colors ${
                        selectedLocation === loc
                          ? "bg-[#E20713] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {loc} ({count})
                    </button>
                  );
                })}
              </div>

            </div>
          </section>

          {/* Apartments Grid */}
          <section className="py-12 px-5 sm:px-8">
            <div className="max-w-[1440px] mx-auto">
              
              {/* Prominent Call to Action Banner */}
              <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-[#111827] via-[#1a2332] to-[#111827] text-white rounded-xs border-l-4 border-[#E20713] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-xl">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#E20713] text-white text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs mb-2">
                    <Phone className="h-3 w-3" />
                    <span>Ligne Directe Conciergerie 24/7</span>
                  </div>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                    Besoin d'un appartement meublé immédiatement à Yaoundé ?
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
                    Résidences de standing disponibles à <strong className="text-white">Tsinga (Face FECAFOOT)</strong> et <strong className="text-white">Oyomabang (Bientôt disponible)</strong>. Appelez dès maintenant notre équipe pour vérifier les disponibilités et bloquer vos dates sans attendre.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
                  <a
                    href="tel:+237691786447"
                    className="flex-1 md:flex-none px-6 py-3.5 bg-[#E20713] hover:bg-[#b3050f] text-white font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs shadow-lg transition-all hover:scale-105"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Appelez le +237 691 78 64 47</span>
                  </a>
                  <a
                    href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20r%C3%A9server%20un%20appartement%20meubl%C3%A9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {filteredApartments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredApartments.map((apt) => {
                    const whatsappMsg = encodeURIComponent(
                      `Bonjour 3M SERVICES,\n` +
                      `Je souhaite des informations et réserver votre appartement meublé :\n` +
                      `• Résidence : ${apt.title}\n` +
                      `• Type : ${apt.type}\n` +
                      `• Localisation : ${apt.location}\n` +
                      `• Tarif indicatif : ${apt.price}\n\n` +
                      `Pouvez-vous me confirmer les disponibilités actuelles ? Merci.`
                    );

                    const allPhotos = Array.isArray(apt.photos) && apt.photos.length > 0 
                      ? apt.photos 
                      : Array.isArray(apt.images) && apt.images.length > 0 
                      ? apt.images 
                      : apt.image ? [apt.image] : [];
                    const aptCover = apt.image || allPhotos[0] || "/Asset/image copy 2.png";

                    return (
                      <div
                        key={apt.id}
                        className="group bg-white border border-gray-200 hover:border-gray-400 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl rounded-xs"
                      >
                        {/* Image Header */}
                        <div
                          className="relative aspect-[16/10] bg-gray-100 overflow-hidden cursor-pointer"
                          onClick={() => openApartmentModal(apt)}
                        >
                          <img
                            src={aptCover}
                            alt={apt.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 bg-[#111827]/90 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs backdrop-blur-xs">
                            {apt.type}
                          </div>

                          <div className="absolute top-3 right-3">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-xs ${
                              apt.status === "Occupé"
                                ? "bg-amber-500 text-white"
                                : "bg-emerald-600 text-white"
                            }`}>
                              {apt.status || "Disponible"}
                            </span>
                          </div>

                          {/* Photo Count Badge */}
                          {allPhotos.length > 1 && (
                            <div className="absolute top-10 right-3 bg-black/70 text-white px-2 py-0.5 text-[10px] font-mono rounded-xs backdrop-blur-xs flex items-center gap-1">
                              <ImageIcon className="h-3 w-3 text-[#E20713]" />
                              <span>{allPhotos.length} photos</span>
                            </div>
                          )}

                          {/* Location overlay */}
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <p className="text-xs text-white/90 flex items-center gap-1.5 font-medium">
                              <MapPin className="h-3.5 w-3.5 text-[#E20713]" />
                              <span>{apt.location}</span>
                            </p>
                            <h3 className="text-lg sm:text-xl font-heading font-black text-white mt-0.5 leading-tight">
                              {apt.title}
                            </h3>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            {/* Rooms layout */}
                            <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xs border border-gray-100 font-medium">
                              {apt.rooms}
                            </div>

                            {/* Description preview */}
                            {apt.description && (
                              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                {apt.description}
                              </p>
                            )}

                            {/* Amenities tags */}
                            {Array.isArray(apt.amenities) && apt.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {apt.amenities.slice(0, 4).map((amenity, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-xs font-medium"
                                  >
                                    <Check className="h-2.5 w-2.5 text-[#E20713]" />
                                    <span>{amenity}</span>
                                  </span>
                                ))}
                                {apt.amenities.length > 4 && (
                                  <span className="text-[10px] px-1.5 py-0.5 text-gray-400">
                                    +{apt.amenities.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Price & Actions */}
                          <div className="pt-4 border-t border-gray-100 space-y-3">
                            <div className="flex items-baseline justify-between">
                              <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">
                                Tarif Séjour
                              </span>
                              <span className="text-sm font-black text-[#E20713]">
                                {apt.price}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <a
                                href="tel:+237691786447"
                                title="Appeler directement (+237 691 78 64 47)"
                                className="p-2.5 bg-[#E20713] hover:bg-[#b3050f] text-white rounded-xs transition-all shadow-xs flex items-center justify-center shrink-0 hover:scale-105"
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </a>

                              <a
                                href={`https://wa.me/237691786447?text=${whatsappMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-xs transition-colors shadow-xs"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>WhatsApp</span>
                              </a>

                              <button
                                onClick={() => openApartmentModal(apt)}
                                className="py-2.5 px-3 bg-gray-900 hover:bg-black text-white text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-1 rounded-xs transition-colors"
                              >
                                <span>Détails</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center bg-white border border-gray-200 rounded-sm p-8 max-w-md mx-auto">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-heading font-bold text-lg text-gray-900">Aucun appartement trouvé</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Modifiez vos critères de recherche ou réinitialisez le filtre de quartier.
                  </p>
                  <button
                    onClick={() => {
                      setAptSearch("");
                      setSelectedLocation("all");
                    }}
                    className="mt-4 px-4 py-2 bg-[#E20713] text-white text-xs font-bold uppercase tracking-wider rounded-xs"
                  >
                    Voir tous les appartements
                  </button>
                </div>
              )}

            </div>
          </section>
        </>
      )}

      {/* ── Direct Agency Contact Banner ─────── */}
      <section className="bg-gray-100 border-t border-gray-200 py-10 px-5 sm:px-8 mt-12">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-heading font-black text-xl text-gray-900">
              Besoin d'un accompagnement personnalisé ?
            </h3>
            <p className="text-sm text-gray-600 mt-1 max-w-xl">
              Notre équipe à l'agence de Yaoundé (Nouvelle route - Omnisports) vous répond en direct pour confirmer la disponibilité, fixer une visite ou réserver votre véhicule et appartement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20commander%20un%20v%C3%A9hicule%20ou%20r%C3%A9server%20un%20appartement"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-sm"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Contacter sur WhatsApp</span>
            </a>
            <a
              href="tel:+237691786447"
              className="px-5 py-3.5 bg-gray-900 hover:bg-black text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs"
            >
              <Phone className="h-4 w-4 text-[#E20713]" />
              <span>+237 691 78 64 47</span>
            </a>
            <a
              href="tel:+237653761728"
              className="px-5 py-3.5 bg-gray-900 hover:bg-black text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs"
            >
              <Phone className="h-4 w-4 text-[#E20713]" />
              <span>+237 653 76 17 28</span>
            </a>
            <a
              href="tel:+237691786447"
              className="px-5 py-3.5 bg-gray-900 hover:bg-black text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs"
            >
              <Phone className="h-4 w-4 text-[#E20713]" />
              <span>+237 691 78 64 47</span>
            </a>
          </div>
        </div>
      </section>

      {/* Vehicle Modals */}
      <VehicleDetailModal
        vehicle={activeVehicle}
        isOpen={isVehicleModalOpen}
        onClose={() => {
          setIsVehicleModalOpen(false);
          setActiveVehicle(null);
        }}
      />

      <CustomOrderModal
        isOpen={isCustomOrderOpen}
        onClose={() => setIsCustomOrderOpen(false)}
      />

      {/* Apartment Modal */}
      <ApartmentModal
        apartment={selectedApartment}
        isOpen={isAptModalOpen}
        onClose={() => {
          setIsAptModalOpen(false);
          setSelectedApartment(null);
        }}
      />
    </div>
  );
}
