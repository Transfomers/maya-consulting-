import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Car,
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Fuel,
  Gauge
} from "lucide-react";
import { toast } from "sonner";
import { getCars, deleteCar, resetCars, updateCar } from "@/data/catalogStorage";
import { CATALOG_SECTIONS } from "@/data/catalogVehicles";

export default function AdminPostList() {
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const navigate = useNavigate();

  const loadCars = () => {
    setCars(getCars());
  };

  useEffect(() => {
    loadCars();
    const handleUpdate = () => loadCars();
    window.addEventListener("3m_cars_updated", handleUpdate);
    return () => window.removeEventListener("3m_cars_updated", handleUpdate);
  }, []);

  // Filtered cars
  const filteredCars = cars.filter((c) => {
    if (sectionFilter !== "all" && c.section !== sectionFilter) return false;
    if (conditionFilter !== "all") {
      if (conditionFilter === "Neuve" && c.condition !== "Neuve" && c.mileage !== "0 km") return false;
      if (conditionFilter === "Occasion" && c.condition !== "Occasion" && c.mileage === "0 km") return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchModel = c.model?.toLowerCase().includes(q);
      const matchBrand = c.brand?.toLowerCase().includes(q);
      const matchEngine = c.engine?.toLowerCase().includes(q);
      const matchPrice = c.price?.toLowerCase().includes(q);
      if (!matchModel && !matchBrand && !matchEngine && !matchPrice) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredCars.length / pageSize) || 1;
  const paginatedCars = filteredCars.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = (id, model) => {
    if (window.confirm(`Confirmez-vous la suppression du véhicule « ${model} » ?`)) {
      deleteCar(id);
      loadCars();
      toast.success(`Le véhicule « ${model} » a été supprimé du catalogue.`);
    }
  };

  const handleResetCatalog = () => {
    if (window.confirm("Voulez-vous réinitialiser le catalogue avec les 65 véhicules officiels 3M SERVICES 2025 ?")) {
      resetCars();
      loadCars();
      toast.success("Catalogue réinitialisé avec succès avec les 12 sections d'origine !");
    }
  };

  const handleStatusToggle = (car) => {
    const nextStatus = car.status === "Disponible" ? "Réservé" : car.status === "Réservé" ? "Vendu" : "Disponible";
    updateCar(car.id, { status: nextStatus });
    loadCars();
    toast.success(`Statut de « ${car.model} » mis à jour : ${nextStatus}`);
  };

  const stats = {
    total: cars.length,
    neuves: cars.filter((c) => c.condition === "Neuve" || c.mileage === "0 km").length,
    occasions: cars.filter((c) => c.condition === "Occasion" && c.mileage !== "0 km").length,
    suvs: cars.filter((c) => c.section === "01").length,
  };

  return (
    <div className="p-6 md:p-10 space-y-8 bg-gray-50 min-h-screen text-gray-900 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[#E20713] text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-xs">
              ADMIN CRUD • 3M SERVICES
            </span>
            <span className="text-xs text-gray-500 font-mono">PARC AUTOMOBILE 2025</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-gray-900 tracking-tight">
            Sélection de Voitures & Gestion du Parc
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gérez en direct les 12 sections du catalogue : ajout, modification, prix, caractéristiques et statut des véhicules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetCatalog}
            className="px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-500 text-gray-700 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 rounded-xs"
            title="Restaurer les 65 véhicules du catalogue officiel 2025"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Réinitialiser (2025)</span>
          </button>

          <Link
            to="/admin/posts/new"
            className="px-5 py-2.5 bg-[#E20713] hover:bg-[#C4050F] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm rounded-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un Véhicule</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 shadow-xs rounded-sm">
          <p className="text-[11px] font-mono text-gray-500 uppercase tracking-wider font-bold">Total au Catalogue</p>
          <p className="text-3xl font-heading font-black text-gray-900 mt-1">{stats.total}</p>
          <p className="text-[10px] text-gray-400 mt-1">Véhicules répertoriés</p>
        </div>

        <div className="p-4 bg-white border border-gray-200 shadow-xs rounded-sm">
          <p className="text-[11px] font-mono text-emerald-700 uppercase tracking-wider font-bold">Gamme Neuve 0 KM</p>
          <p className="text-3xl font-heading font-black text-emerald-600 mt-1">{stats.neuves}</p>
          <p className="text-[10px] text-gray-400 mt-1">Garantie d'usine</p>
        </div>

        <div className="p-4 bg-white border border-gray-200 shadow-xs rounded-sm">
          <p className="text-[11px] font-mono text-amber-700 uppercase tracking-wider font-bold">Occasions Certifiées</p>
          <p className="text-3xl font-heading font-black text-amber-600 mt-1">{stats.occasions}</p>
          <p className="text-[10px] text-gray-400 mt-1">Révisées & inspectées</p>
        </div>

        <div className="p-4 bg-white border border-gray-200 shadow-xs rounded-sm">
          <p className="text-[11px] font-mono text-[#E20713] uppercase tracking-wider font-bold">Visibles au Public</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-heading font-black text-gray-900">{filteredCars.length}</span>
            <Link to="/boutique" target="_blank" className="text-xs text-[#E20713] hover:underline flex items-center gap-0.5">
              Voir boutique <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Synchronisation instantanée</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-gray-200 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between rounded-sm">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par modèle, marque, prix, moteur..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] rounded-xs"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">Section :</span>
            <select
              value={sectionFilter}
              onChange={(e) => { setSectionFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] font-medium rounded-xs"
            >
              <option value="all">Toutes les sections (12)</option>
              {CATALOG_SECTIONS.map((sec) => (
                <option key={sec.number} value={sec.number}>
                  {sec.number} • {sec.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">État :</span>
            <select
              value={conditionFilter}
              onChange={(e) => { setConditionFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] font-medium rounded-xs"
            >
              <option value="all">Tous états</option>
              <option value="Neuve">Neuve (0 km)</option>
              <option value="Occasion">Occasion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cars Data Table */}
      <div className="bg-white border border-gray-200 overflow-hidden shadow-xs rounded-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-900 text-white font-mono uppercase text-[11px] tracking-wider border-b border-gray-900">
                <th className="py-3.5 px-4">Véhicule & Modèle</th>
                <th className="py-3.5 px-4">Section</th>
                <th className="py-3.5 px-4">Prix / Leasing</th>
                <th className="py-3.5 px-4">Moteur</th>
                <th className="py-3.5 px-4">Transmission</th>
                <th className="py-3.5 px-4">Places</th>
                <th className="py-3.5 px-4">Compteur / État</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {paginatedCars.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-gray-400 text-sm">
                    Aucun véhicule trouvé pour ces critères de recherche.
                  </td>
                </tr>
              ) : (
                paginatedCars.map((car) => {
                  const isNew = car.condition === "Neuve" || car.mileage === "0 km";

                  return (
                    <tr key={car.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Vehicle Thumbnail & Model */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-16 bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 rounded-xs">
                            <img
                              src={car.image}
                              alt={car.model}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=compress&cs=tinysrgb&w=400";
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-heading font-black text-xs text-gray-900">
                              {car.model}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              {car.brand} • {car.year ? `Année ${car.year}` : (car.mileage || "2024")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Section */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 font-mono text-[10px] font-bold text-gray-800 rounded-xs">
                          Sec. {car.section}
                        </span>
                      </td>

                      {/* Price & MUPOCAM badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-[#E20713] text-[11px]">
                            {car.price || (isNew ? "Neuve 0 km • Prix sur devis" : "Sur devis • Éligible")}
                          </span>
                          {car.isMupocam !== false && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-orange-100 text-orange-800 font-bold uppercase rounded border border-orange-200 w-fit">
                              MUPOCAM ✓
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Engine */}
                      <td className="py-3.5 px-4 font-medium text-gray-700">
                        {car.engine}
                      </td>

                      {/* Transmission */}
                      <td className="py-3.5 px-4 text-gray-700">
                        <span className="font-medium truncate block max-w-[120px]" title={car.transmission}>
                          {car.transmission}
                        </span>
                      </td>

                      {/* Seats */}
                      <td className="py-3.5 px-4 text-gray-700">
                        {car.seats || "5 places"}
                      </td>

                      {/* Mileage & Condition */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-center w-fit rounded-xs ${
                            isNew ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {car.condition}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {car.mileage || (isNew ? "0 km" : "Certifié")}
                          </span>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleStatusToggle(car)}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors border rounded-xs ${
                            car.status === "Disponible" || !car.status
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : car.status === "Réservé"
                              ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                              : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                          }`}
                          title="Cliquer pour changer de statut"
                        >
                          {car.status || "Disponible"}
                        </button>
                      </td>

                      {/* Action Links */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/posts/${car.id}`}
                            className="p-1.5 border border-gray-300 bg-white hover:border-[#E20713] hover:text-[#E20713] text-gray-700 transition-colors rounded-xs"
                            title="Modifier ce véhicule"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDelete(car.id, car.model)}
                            className="p-1.5 border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors rounded-xs"
                            title="Supprimer du catalogue"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {page} sur {totalPages} ({filteredCars.length} véhicules)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none rounded-xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none rounded-xs"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
