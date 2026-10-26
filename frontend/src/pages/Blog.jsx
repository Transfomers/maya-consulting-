import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Search,
  Filter,
  Sparkles,
  Phone,
  MessageSquare,
  Fuel,
  Gauge,
  Users,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Lock,
  Download,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Check
} from "lucide-react";
import { getCars } from "@/data/catalogStorage";
import { CATALOG_SECTIONS } from "@/data/catalogVehicles";
import VehicleDetailModal from "@/components/VehicleDetailModal";
import CustomOrderModal from "@/components/CustomOrderModal";

export default function Blog() {
  const [cars, setCars] = useState([]);
  const [selectedSection, setSelectedSection] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all"); // "all" | "Neuve" | "Occasion"
  const [transmissionFilter, setTransmissionFilter] = useState("all"); // "all" | "auto" | "manuelle" | "4*4"
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Modals
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomOrderOpen, setIsCustomOrderOpen] = useState(false);

  const loadCars = () => {
    setCars(getCars());
  };

  useEffect(() => {
    loadCars();
    const handleUpdate = () => loadCars();
    window.addEventListener("3m_cars_updated", handleUpdate);
    return () => window.removeEventListener("3m_cars_updated", handleUpdate);
  }, []);

  // Filtered cars computation
  const filteredCars = useMemo(() => {
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
        const trans = (item.transmission || "").toLowerCase();
        if (transmissionFilter === "auto" && !trans.includes("auto")) return false;
        if (transmissionFilter === "manuelle" && !trans.includes("manuelle")) return false;
        if (transmissionFilter === "4*4" && !trans.includes("4*4") && !trans.includes("4x4")) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchModel = item.model?.toLowerCase().includes(q);
        const matchBrand = item.brand?.toLowerCase().includes(q);
        const matchSection = item.sectionTitle?.toLowerCase().includes(q);
        const matchEngine = item.engine?.toLowerCase().includes(q);
        if (!matchModel && !matchBrand && !matchSection && !matchEngine) return false;
      }
      return true;
    });
  }, [cars, selectedSection, conditionFilter, transmissionFilter, searchQuery]);

  const handleOpenDetail = (car) => {
    if (car.section === "12") {
      setIsCustomOrderOpen(true);
    } else {
      setActiveVehicle(car);
      setIsModalOpen(true);
    }
  };

  const resetFilters = () => {
    setSelectedSection("all");
    setConditionFilter("all");
    setTransmissionFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedSection !== "all" ||
    conditionFilter !== "all" ||
    transmissionFilter !== "all" ||
    searchQuery.trim() !== "";

  // Count by condition
  const neuveCount = useMemo(() => cars.filter(c => c.condition === "Neuve" || c.mileage === "0 km").length, [cars]);
  const occasionCount = useMemo(() => cars.filter(c => c.condition !== "Neuve" && c.mileage !== "0 km").length, [cars]);

  // Count by section
  const sectionCounts = useMemo(() => {
    const counts = {};
    cars.forEach(c => {
      counts[c.section] = (counts[c.section] || 0) + 1;
    });
    return counts;
  }, [cars]);

  return (
    <div className="min-h-screen bg-bone text-forest pt-12 pb-24 selection:bg-maple selection:text-white" data-testid="cars-selection-page">
      
      {/* ── Editorial Header ────────────────────────────────────────── */}
      <section className="py-12 md:py-20 border-b border-forest/15 bg-gradient-to-b from-[#FAF9F5] to-bone">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest text-bone text-xs font-mono font-bold uppercase tracking-widest">
                <Car className="h-3.5 w-3.5 text-maple-light" />
                <span>3M SERVICES • PARC AUTOMOBILE 2025</span>
              </div>
              
              <h1 className="font-heading font-black text-4xl sm:text-6xl text-forest tracking-tight">
                SÉLECTION DE VOITURES
              </h1>
              
              <p className="font-serif italic text-2xl sm:text-3xl text-forest/90">
                « Le confort de votre foyer, dans nos véhicules »
              </p>
              
              <p className="text-sm sm:text-base text-sage leading-relaxed pt-1">
                Explorez notre sélection active de véhicules disponibles immédiatement à la vente au comptant et en leasing / paiement échelonné à Yaoundé.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Official Catalog Download Button */}
              <a
                href="/Asset/catalogue-automobile-2025.pdf"
                download="Catalogue-Automobile-2025-3M-Services.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3.5 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-md"
                title="Télécharger le Catalogue Officiel 2025 (15 pages PDF)"
              >
                <Download className="h-4 w-4 text-maple-light" />
                <span>Télécharger le Catalogue (PDF)</span>
              </a>

              <Link
                to="/admin/posts"
                className="px-4 py-3.5 bg-white border border-forest/20 hover:border-maple hover:text-maple text-forest text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-xs"
                title="Panneau d'administration CRUD"
              >
                <Lock className="h-3.5 w-3.5 text-maple" />
                <span>Gestion Admin CRUD</span>
              </Link>

              <button
                onClick={() => setIsCustomOrderOpen(true)}
                className="px-4 py-3.5 bg-maple hover:bg-forest text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Commande Spéciale</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── Main Layout: Sidebar Filters + Products Grid ──────────── */}
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-10">
        
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6 flex items-center justify-between bg-white border border-forest/20 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-maple" />
            <span className="font-heading font-bold text-sm text-forest uppercase">
              Filtres du Catalogue ({filteredCars.length})
            </span>
          </div>
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="px-3.5 py-1.5 bg-forest text-white text-xs font-bold uppercase tracking-wider rounded"
          >
            {mobileFilterOpen ? "Fermer" : "Filtrer"}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* ══════════════════════════════════════════════════════════
              FILTER SIDEBAR (Sticky on Desktop)
              ══════════════════════════════════════════════════════════ */}
          <aside
            className={`w-full lg:w-80 flex-shrink-0 space-y-6 ${
              mobileFilterOpen ? "block" : "hidden lg:block"
            }`}
          >
            <div className="bg-white border border-forest/20 p-5 shadow-sm space-y-6 sticky top-28">
              
              {/* Sidebar Title & Reset */}
              <div className="flex items-center justify-between border-b border-forest/10 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-maple" />
                  <span className="font-heading font-black text-sm uppercase tracking-wider text-forest">
                    Filtres de Recherche
                  </span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-[11px] font-mono text-maple hover:text-forest flex items-center gap-1 font-bold transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Réinitialiser</span>
                  </button>
                )}
              </div>

              {/* 1. Recherche par Modèle */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-forest block font-mono">
                  Rechercher par modèle
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-forest/40" />
                  <input
                    type="text"
                    placeholder="ex: RAV4, Maybach, Hilux, Seltos, Prado, Kona..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-7 py-2.5 text-xs bg-[#FAF9F5] border border-forest/20 text-forest placeholder:text-sage/60 focus:outline-none focus:border-maple font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-sage hover:text-forest font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 2. État du Véhicule */}
              <div className="space-y-2 border-t border-forest/10 pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-forest block font-mono">
                  État :
                </label>
                <div className="space-y-1.5">
                  {[
                    { label: "Tous", val: "all", count: cars.length },
                    { label: "Neuves (0 km)", val: "Neuve", count: neuveCount },
                    { label: "Occasions Certifiées", val: "Occasion", count: occasionCount },
                  ].map((item) => {
                    const active = conditionFilter === item.val;
                    return (
                      <button
                        key={item.val}
                        onClick={() => setConditionFilter(item.val)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors border text-left ${
                          active
                            ? "bg-forest text-white border-forest font-bold"
                            : "bg-[#FAF9F5] text-forest/90 border-transparent hover:border-forest/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            active ? "bg-maple-light" : "bg-forest/20"
                          }`} />
                          <span>{item.label}</span>
                        </div>
                        <span className={`font-mono text-[11px] ${
                          active ? "text-white/80" : "text-sage"
                        }`}>
                          ({item.count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Boîte de Vitesse / Transmission */}
              <div className="space-y-2 border-t border-forest/10 pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-forest block font-mono">
                  Boîte :
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Toutes", val: "all" },
                    { label: "Auto", val: "auto" },
                    { label: "Manuelle", val: "manuelle" },
                    { label: "4*4", val: "4*4" },
                  ].map((item) => {
                    const active = transmissionFilter === item.val;
                    return (
                      <button
                        key={item.val}
                        onClick={() => setTransmissionFilter(item.val)}
                        className={`px-3 py-2 text-xs font-bold uppercase tracking-wider text-center transition-colors border ${
                          active
                            ? "bg-maple text-white border-maple"
                            : "bg-[#FAF9F5] text-forest border-forest/15 hover:border-forest/40"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Toutes les Catégories (01-12) */}
              <div className="space-y-2 border-t border-forest/10 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-forest block font-mono">
                    Toutes les Catégories ({cars.length})
                  </label>
                  {selectedSection !== "all" && (
                    <button
                      onClick={() => setSelectedSection("all")}
                      className="text-[10px] text-maple underline font-mono font-bold"
                    >
                      Toutes
                    </button>
                  )}
                </div>
                
                <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                  <button
                    onClick={() => setSelectedSection("all")}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors border text-left ${
                      selectedSection === "all"
                        ? "bg-forest text-white border-forest font-bold"
                        : "bg-[#FAF9F5] text-forest border-transparent hover:border-forest/20"
                    }`}
                  >
                    <span>Tous les Véhicules</span>
                    <span className="font-mono text-[11px] opacity-70">({cars.length})</span>
                  </button>

                  {CATALOG_SECTIONS.map((sec) => {
                    const count = sectionCounts[sec.number] || 0;
                    const active = selectedSection === sec.number;

                    return (
                      <button
                        key={sec.number}
                        onClick={() => setSelectedSection(sec.number)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors border text-left ${
                          active
                            ? "bg-forest text-white border-forest font-bold shadow-xs"
                            : "bg-[#FAF9F5] text-forest/90 border-transparent hover:border-forest/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className={`font-mono text-[10px] px-1 py-0.5 rounded ${
                            active ? "bg-maple text-white font-bold" : "bg-forest/10 text-forest font-semibold"
                          }`}>
                            {sec.number}
                          </span>
                          <span className="truncate">{sec.title}</span>
                        </div>
                        <span className={`font-mono text-[11px] flex-shrink-0 ${
                          active ? "text-white" : "text-sage"
                        }`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. MUPOCAM Leasing Box in Sidebar */}
              <div className="p-3.5 bg-[#0D0F0E] text-white rounded border border-[#FF7900]/40 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/Asset/logo-mupocam.png"
                    alt="MUPOCAM"
                    className="h-7 w-auto object-contain flex-shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-mono text-[#FF7900] uppercase font-bold tracking-wider block">
                      Partenaire Officiel
                    </span>
                    <span className="text-xs font-bold text-white block">
                      MUPOCAM Orange Cameroun
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-300 leading-tight">
                  Vente de véhicules en leasing et mensualités étalées. Agence : <strong>Nouvelle route - OMNISPORTS</strong>.
                </p>
                <div className="flex gap-2 pt-1">
                  <a
                    href="/Asset/car.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider rounded border border-white/20 transition-colors"
                  >
                    Affiche PDF
                  </a>
                  <a
                    href="https://wa.me/237691786447?text=Bonjour%203M%20SERVICES,%20je%20souhaite%20des%20informations%20sur%20l'offre%20de%20leasing%20automobile%20MUPOCAM."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-1.5 px-2 bg-[#FF7900] hover:bg-[#E06800] text-black text-[10px] font-bold uppercase tracking-wider rounded transition-colors"
                  >
                    Leasing WhatsApp
                  </a>
                </div>
              </div>

              {/* 6. Catalogue Download Card in Sidebar */}
              <a
                href="/Asset/catalogue-automobile-2025.pdf"
                download="Catalogue-Automobile-2025-3M-Services.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-3.5 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow"
              >
                <Download className="h-4 w-4 text-maple-light" />
                <span>Télécharger Catalogue PDF</span>
              </a>

            </div>
          </aside>

          {/* ══════════════════════════════════════════════════════════
              RIGHT COLUMN: ACTIVE CHIPS + VEHICLES GRID
              ══════════════════════════════════════════════════════════ */}
          <main className="flex-1 min-w-0 space-y-6 w-full">
            
            {/* Top Toolbar: Active Chips & Result Counter */}
            <div className="bg-white border border-forest/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono uppercase tracking-wider text-sage font-bold">
                  Résultats :
                </span>
                <span className="font-heading font-black text-forest text-base">
                  {filteredCars.length} véhicule(s)
                </span>
                
                {/* Active Filter Chips */}
                {selectedSection !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-forest text-white text-xs font-mono">
                    <span>Sec. {selectedSection}</span>
                    <button onClick={() => setSelectedSection("all")} className="hover:text-maple font-bold">✕</button>
                  </span>
                )}
                {conditionFilter !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-maple text-white text-xs font-mono">
                    <span>{conditionFilter}</span>
                    <button onClick={() => setConditionFilter("all")} className="hover:text-forest font-bold">✕</button>
                  </span>
                )}
                {transmissionFilter !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-700 text-white text-xs font-mono">
                    <span>Boîte: {transmissionFilter}</span>
                    <button onClick={() => setTransmissionFilter("all")} className="hover:text-maple font-bold">✕</button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-200 text-forest text-xs font-mono">
                    <span>"{searchQuery}"</span>
                    <button onClick={() => setSearchQuery("")} className="hover:text-maple font-bold">✕</button>
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-mono text-maple hover:underline font-bold flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Effacer tous les filtres
                </button>
              )}
            </div>

            {/* Vehicles Grid */}
            {filteredCars.length === 0 ? (
              <div className="py-24 text-center bg-white border border-forest/15 p-8 shadow-xs">
                <Car className="h-14 w-14 text-forest/20 mx-auto mb-3" />
                <h3 className="text-2xl font-black font-heading text-forest">Aucun véhicule trouvé</h3>
                <p className="text-sm text-sage mt-2 max-w-md mx-auto leading-relaxed">
                  Aucun résultat ne correspond à votre sélection actuelle. Modifiez vos filtres dans la barre latérale ou contactez notre équipe pour une commande spéciale.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={resetFilters}
                    className="px-6 py-2.5 bg-forest text-white text-xs font-bold uppercase tracking-wider hover:bg-maple transition-colors"
                  >
                    Voir tous les véhicules
                  </button>
                  <button
                    onClick={() => setIsCustomOrderOpen(true)}
                    className="px-6 py-2.5 bg-maple text-white text-xs font-bold uppercase tracking-wider hover:bg-forest transition-colors"
                  >
                    Commander sur mesure
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCars.map((veh) => {
                  const isNew = veh.condition === "Neuve" || veh.mileage === "0 km";

                  return (
                    <div
                      key={veh.id}
                      className="group flex flex-col justify-between bg-white border border-forest/20 hover:border-maple transition-all duration-300 hover:shadow-xl overflow-hidden"
                    >
                      {/* Photo Container */}
                      <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-forest/10">
                        <img
                          src={veh.image}
                          alt={veh.model}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                          <span className="px-2 py-0.5 bg-forest text-white text-[10px] font-mono font-bold uppercase">
                            {veh.section} • {veh.brand}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase ${
                            isNew ? "bg-emerald-500 text-white" : "bg-amber-400 text-black"
                          }`}>
                            {veh.condition}
                          </span>
                        </div>

                        <div className="absolute top-3 right-3 z-10">
                          <span className="px-2 py-0.5 bg-black/75 text-white text-[10px] font-mono">
                            {veh.mileage || (isNew ? "0 km" : "Occasion")}
                          </span>
                        </div>

                        {/* Title & Section on Image */}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-maple-light truncate">
                            {veh.sectionTitle}
                          </p>
                          <h4 className="text-lg font-heading font-black text-white leading-tight mt-0.5 drop-shadow line-clamp-1">
                            {veh.model}
                          </h4>
                        </div>
                      </div>

                      {/* Body Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                        <div className="grid grid-cols-2 gap-2 text-xs border-b border-forest/10 pb-3">
                          <div className="flex items-center gap-1.5 text-sage">
                            <Fuel className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                            <span className="font-bold text-forest truncate">{veh.engine}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sage">
                            <Gauge className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                            <span className="font-bold text-forest truncate" title={veh.transmission}>
                              {veh.transmission}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sage">
                            <Users className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                            <span className="font-bold text-forest">{veh.seats || "5 places"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sage">
                            <Calendar className="h-3.5 w-3.5 text-maple flex-shrink-0" />
                            <span className="font-bold text-forest">{veh.year || "2024"}</span>
                          </div>
                        </div>

                        <p className="text-xs text-sage line-clamp-2 leading-relaxed">
                          {veh.description}
                        </p>

                        {/* MUPOCAM Leasing Tag */}
                        <div className="py-1 px-2.5 rounded bg-orange-50 border border-orange-200/80 flex items-center justify-between text-[10.5px]">
                          <span className="font-bold text-[#D35400] flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF7900] animate-pulse" />
                            Éligible Leasing MUPOCAM
                          </span>
                          <span className="text-stone-500 font-mono text-[9.5px]">Paiement échelonné</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            onClick={() => handleOpenDetail(veh)}
                            className="flex-1 py-2.5 px-3 bg-forest hover:bg-maple text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>Détails & Devis</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>

                          <a
                            href={`https://wa.me/237691786447?text=${encodeURIComponent(
                              `Bonjour 3M SERVICES, je souhaite commander ou avoir des détails sur : ${veh.model} (${veh.engine}, ${veh.transmission})`
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
                    </div>
                  );
                })}
              </div>
            )}

          </main>

        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <VehicleDetailModal
        vehicle={activeVehicle}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setActiveVehicle(null);
        }}
      />

      <CustomOrderModal
        isOpen={isCustomOrderOpen}
        onClose={() => setIsCustomOrderOpen(false)}
      />

    </div>
  );
}
