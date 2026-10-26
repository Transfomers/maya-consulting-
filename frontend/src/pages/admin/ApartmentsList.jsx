import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Building2, MapPin, Edit3, Trash2, ExternalLink, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { getApartments, deleteApartment, syncApartmentsFromServer, subscribeApartments } from "@/data/apartmentStorage";

export default function AdminApartmentsList() {
  const [apartments, setApartments] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const list = getApartments();
    setApartments(list);
    setLoading(false);

    syncApartmentsFromServer().then((serverList) => {
      if (serverList) setApartments(serverList);
    });

    const unsubscribe = subscribeApartments((updated) => {
      setApartments(updated);
    });
    return unsubscribe;
  }, []);

  const locations = useMemo(() => {
    const set = new Set();
    apartments.forEach((a) => {
      if (a.location) set.add(a.location.split(",")[0].trim());
    });
    return Array.from(set);
  }, [apartments]);

  const filtered = useMemo(() => {
    return apartments.filter((apt) => {
      const matchSearch =
        search === "" ||
        (apt.title && apt.title.toLowerCase().includes(search.toLowerCase())) ||
        (apt.type && apt.type.toLowerCase().includes(search.toLowerCase())) ||
        (apt.location && apt.location.toLowerCase().includes(search.toLowerCase())) ||
        (apt.rooms && apt.rooms.toLowerCase().includes(search.toLowerCase()));

      const matchLocation =
        selectedLocation === "all" ||
        (apt.location && apt.location.toLowerCase().includes(selectedLocation.toLowerCase()));

      return matchSearch && matchLocation;
    });
  }, [apartments, search, selectedLocation]);

  const handleDelete = async (apt) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'appartement « ${apt.title} » ?`)) {
      try {
        const remaining = await deleteApartment(apt.id);
        setApartments(remaining);
        toast.success(`L'appartement a été supprimé.`);
      } catch (err) {
        toast.error("Erreur lors de la suppression.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#E20713] text-white text-[10px] font-bold uppercase tracking-widest rounded-xs">
              ADMIN 3M
            </span>
            <span className="text-xs text-gray-500 font-mono">IMMOBILIER YAOUNDÉ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-gray-900 tracking-tight mt-1">
            Gestion des Appartements Meublés
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Ajoutez, éditez et gérez les appartements de prestige disponibles à la location sur le site 3M SERVICES.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/apartments/new"
            className="px-4 py-2.5 bg-[#E20713] hover:bg-[#c00610] text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un Appartement</span>
          </Link>

          <Link
            to="/boutique?tab=appartements"
            target="_blank"
            className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 rounded-xs transition-colors"
            title="Voir sur le site public"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Aperçu Boutique</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 border border-gray-200 rounded-sm shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, quartier, type..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xs focus:outline-none focus:border-[#E20713]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-xs border border-gray-300 rounded-xs px-3 py-2 bg-white focus:outline-none focus:border-[#E20713]"
          >
            <option value="all">Tous les Quartiers ({apartments.length})</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
            {filtered.length} appartement(s)
          </span>
        </div>
      </div>

      {/* Apartments Table */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Logement</th>
                <th className="py-3 px-4">Quartier</th>
                <th className="py-3 px-4">Configuration</th>
                <th className="py-3 px-4">Tarif</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((apt) => (
                <tr key={apt.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={apt.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200"}
                        alt={apt.title}
                        className="h-12 w-16 object-cover rounded-xs border border-gray-200 flex-shrink-0"
                      />
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight">{apt.title}</p>
                        <p className="text-[11px] text-[#E20713] font-semibold mt-0.5">{apt.type}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-gray-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span>{apt.location}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-gray-600">
                    <span>{apt.rooms}</span>
                  </td>

                  <td className="py-3 px-4 font-bold text-gray-900">
                    <span>{apt.price}</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded-xs ${
                      apt.status === "Occupé"
                        ? "bg-amber-100 text-amber-800"
                        : apt.status === "En maintenance"
                        ? "bg-red-100 text-red-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {apt.status || "Disponible"}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/apartments/${apt.id}`)}
                        className="p-1.5 text-gray-600 hover:text-[#E20713] hover:bg-gray-100 rounded-xs transition-colors"
                        title="Modifier l'appartement"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(apt)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xs transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium">Aucun appartement ne correspond à votre recherche.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
