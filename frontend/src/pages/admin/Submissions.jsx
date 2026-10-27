import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { 
  Search, Eye, X, MessageSquare, Download, Trash2, 
  Handshake, Mail, Inbox, CheckCircle2, Clock, 
  RefreshCw, Building2, User, ExternalLink, Calendar,
  Check
} from "lucide-react";

const STATUS_BADGES = {
  new: { label: "Nouveau", color: "bg-blue-50 text-blue-800 border-blue-200" },
  in_review: { label: "En cours d'examen", color: "bg-amber-50 text-amber-800 border-amber-200" },
  contacted: { label: "Contacté", color: "bg-purple-50 text-purple-800 border-purple-200" },
  approved: { label: "Accepté / Validé", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  archived: { label: "Archivé", color: "bg-stone-100 text-stone-600 border-stone-200" },
};

const TYPE_CONFIG = {
  quote: { label: "Devis Véhicule", color: "bg-[#E20713]/10 text-[#E20713] border-[#E20713]/30" },
  car_inquiry: { label: "Demande Véhicule", color: "bg-[#E20713]/10 text-[#E20713] border-[#E20713]/30" },
  custom_order: { label: "Commande Spéciale", color: "bg-amber-50 text-amber-800 border-amber-200" },
  apartment: { label: "Réservation Appartement", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  mupocam: { label: "Leasing MUPOCAM", color: "bg-orange-50 text-orange-800 border-orange-200" },
  contact: { label: "Contact Général", color: "bg-blue-50 text-blue-700 border-blue-200" },
  partner: { label: "Partenaire / Entreprise", color: "bg-purple-50 text-purple-700 border-purple-200" },
  application: { label: "Dossier Client", color: "bg-teal-50 text-teal-800 border-teal-200" },
};

const TABS = [
  { id: "", label: "Toutes les demandes", countKey: "all" },
  { id: "quote", label: "Devis Véhicules", countKey: "quote" },
  { id: "apartment", label: "Réservations Appartements", countKey: "apartment" },
  { id: "custom_order", label: "Commandes Spéciales", countKey: "custom_order" },
  { id: "mupocam", label: "Leasing MUPOCAM", countKey: "mupocam" },
  { id: "contact", label: "Messages & Contacts", countKey: "contact" },
  { id: "partner", label: "Partenariats", countKey: "partner" },
];

export default function AdminSubmissions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get("type") || "";

  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, partners_total: 0, new_total: 0, in_review_total: 0, by_type: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Sync typeFilter with URL search param
  useEffect(() => {
    const urlType = searchParams.get("type");
    if (urlType !== null && urlType !== typeFilter) {
      setTypeFilter(urlType);
    }
  }, [searchParams, typeFilter]);

  const handleSelectTab = (tabId) => {
    setTypeFilter(tabId);
    if (tabId) {
      setSearchParams({ type: tabId });
    } else {
      setSearchParams({});
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/submissions/stats");
      if (res.data) setStats(res.data);
    } catch (err) {
      console.warn("Could not load submission stats", err);
    }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append("type", typeFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await api.get(`/submissions?${params.toString()}`);
      setSubmissions(res.data?.submissions || []);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de charger les soumissions");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, search]);

  useEffect(() => {
    fetchSubmissions();
    fetchStats();
  }, [fetchSubmissions, fetchStats]);

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedSubmission) return;
    setUpdatingStatus(true);
    try {
      await api.put(`/submissions/${selectedSubmission.id}`, { status: newStatus });
      toast.success(`Statut mis à jour : ${STATUS_BADGES[newStatus]?.label || newStatus}`);
      setSelectedSubmission((prev) => ({
        ...prev,
        status: newStatus,
        payload: { ...prev.payload, status: newStatus },
      }));
      fetchSubmissions();
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Échec de la mise à jour du statut");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedSubmission) return;
    try {
      await api.put(`/submissions/${selectedSubmission.id}`, { new_note: newNote.trim() });
      toast.success("Note enregistrée avec succès");
      const updatedNotes = [
        ...(selectedSubmission.payload?.notes || []),
        { id: Date.now().toString(), text: newNote.trim(), created_at: new Date().toISOString() },
      ];
      setSelectedSubmission((prev) => ({
        ...prev,
        payload: { ...prev.payload, notes: updatedNotes },
      }));
      setNewNote("");
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'enregistrement de la note");
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.")) {
      return;
    }
    setDeletingId(id);
    try {
      await api.delete(`/submissions/${id}`);
      toast.success("Dossier supprimé");
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null);
      }
      fetchSubmissions();
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer le dossier");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }
    const headers = ["ID", "Type", "Nom", "Courriel", "Organisation", "Statut", "Date", "Détails"];
    const rows = submissions.map((sub) => {
      const p = sub.payload || {};
      const name = p.name || p.fullName || p.full_name || "-";
      const email = p.email || p.courriel || "-";
      const org = p.organization || p.company || "-";
      const status = sub.status || p.status || "new";
      const date = new Date(sub.created_at).toISOString().split("T")[0];
      const details = (p.message || p.partnerType || p.program || p.aim || "").replace(/"/g, '""');
      return `"${sub.id}","${sub.type}","${name}","${email}","${org}","${status}","${date}","${details}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `crm_3m_services_${typeFilter || "tous"}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exportation CSV téléchargée avec succès");
  };

  const getName = (sub) => {
    const p = sub.payload || {};
    return p.name || p.fullName || p.full_name || p.nom || p.organization || "Client 3M";
  };

  const getPhone = (sub) => {
    const p = sub.payload || {};
    return p.phone || p.telephone || p.tel || p.mobile || p.whatsapp || null;
  };

  const getOrg = (sub) => {
    const p = sub.payload || {};
    return p.organization || p.company || p.org || null;
  };

  const getEmail = (sub) => {
    const p = sub.payload || {};
    return p.email || p.courriel || "-";
  };

  const getSubStatus = (sub) => sub.status || sub.payload?.status || "new";

  const getPreviewSnippet = (sub) => {
    const p = sub.payload || {};
    if (sub.type === "partner") {
      const typeStr = p.partnerType ? `[${p.partnerType}] ` : "";
      return typeStr + (p.message || p.idea || "Demande de partenariat");
    }
    return p.message || p.notes || p.vehicle || p.apartment || p.model || p.subject || "-";
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl font-black tracking-tight text-forest">
              CRM 3M SERVICES • Devis & Réservations
            </h1>
          </div>
          <p className="text-xs text-sage mt-1">
            Gestion centralisée des demandes de devis véhicules, réservations d'appartements et contacts clients 3M SERVICES.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-forest/20 bg-white text-forest hover:border-[#E20713] hover:text-[#E20713] text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            title="Exporter les données actuelles au format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={() => { fetchSubmissions(); fetchStats(); }}
            className="p-2 border border-forest/20 bg-white text-forest hover:text-[#E20713] hover:border-[#E20713] transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#E20713]" : ""}`} />
          </button>
        </div>
      </div>

      {/* TOP KPI STATS SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div 
          onClick={() => handleSelectTab("")}
          className={`p-4 bg-white border cursor-pointer transition-all ${typeFilter === "" ? "border-forest shadow-sm" : "border-forest/15 hover:border-forest/40"}`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sage mb-2">
            <span>Total Dossiers</span>
            
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-black text-forest">
            {stats.total || 0}
          </p>
        </div>

        {/* HIGHLIGHTED PARTNERS CARD */}
        <div 
          onClick={() => handleSelectTab("partner")}
          className={`p-4 bg-white border cursor-pointer transition-all relative overflow-hidden ${typeFilter === "partner" ? "border-[#E20713] ring-2 ring-[#E20713]/20 shadow-md" : "border-[#E20713]/30 hover:border-[#E20713]"}`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#E20713] mb-2">
            <span className="flex items-center gap-1.5 font-bold">
              
              Partenaires (Partners)
            </span>
            <span className="h-2 w-2 rounded-full bg-[#E20713] animate-pulse" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="font-heading text-2xl sm:text-3xl font-black text-[#E20713]">
              {stats.partners_total || stats.by_type?.partner || 0}
            </p>
            <span className="text-[10px] font-bold text-[#E20713] uppercase tracking-wider bg-[#E20713]/10 px-2 py-0.5">
              Prioritaire
            </span>
          </div>
        </div>

        <div className="p-4 bg-white border border-forest/15">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sage mb-2">
            <span>Nouveaux Dossiers</span>
            
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-black text-blue-700">
            {stats.new_total || stats.by_status?.new || 0}
          </p>
        </div>

        <div className="p-4 bg-white border border-forest/15">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-sage mb-2">
            <span>En Traitement / Contactés</span>
            
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-black text-emerald-700">
            {(stats.in_review_total || 0) + (stats.by_status?.contacted || 0) + (stats.by_status?.approved || 0)}
          </p>
        </div>
      </div>

      {/* HORIZONTAL CATEGORY TABS WITH PARTNERS HIGHLIGHT */}
      <div className="border-b border-forest/15 overflow-x-auto scrollbar-none flex gap-1 pt-1">
        {TABS.map((tab) => {
          const isActive = typeFilter === tab.id;
          const count = tab.id === "" ? stats.total : (stats.by_type?.[tab.id] || 0);
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                isActive
                  ? tab.highlight 
                    ? "border-[#E20713] text-[#E20713] bg-[#E20713]/5"
                    : "border-forest text-forest bg-forest/5"
                  : tab.highlight
                    ? "border-transparent text-[#E20713] hover:bg-[#E20713]/5"
                    : "border-transparent text-sage hover:text-forest hover:bg-forest/5"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-none ${
                isActive 
                  ? tab.highlight ? "bg-[#E20713] text-white" : "bg-forest text-bone"
                  : "bg-forest/10 text-forest"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage" />
          <input
            type="text"
            placeholder="Rechercher par nom, organisation, courriel, mot-clé dans les messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-forest/15 bg-white text-xs focus:outline-none focus:border-[#E20713] shadow-sm"
          />
        </div>

        <div className="sm:col-span-4 relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-forest/15 bg-white text-xs focus:outline-none focus:border-[#E20713] cursor-pointer shadow-sm"
          >
            <option value="">Tous les statuts de suivi</option>
            <option value="new">Nouveau (New)</option>
            <option value="in_review">En cours d'examen (In Review)</option>
            <option value="contacted">Contacté (Contacted)</option>
            <option value="approved">Validé / Accepté (Approved)</option>
            <option value="archived">Archivé (Archived)</option>
          </select>
        </div>
      </div>

      {/* SUBMISSIONS TABLE */}
      <div className="bg-white border border-forest/15 overflow-x-auto shadow-sm">
        <table className="w-full text-left text-xs text-forest">
          <thead className="border-b border-forest/15 bg-bone/70 uppercase tracking-wider text-sage font-bold">
            <tr>
              <th className="px-5 py-3.5">Contact & Organisation</th>
              <th className="px-5 py-3.5">Courriel</th>
              <th className="px-5 py-3.5">Type & Profil</th>
              <th className="px-5 py-3.5">Aperçu / Sujet</th>
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/10">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-sage">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#E20713]" />
                    <span>Chargement des dossiers en cours...</span>
                  </div>
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-14 text-center text-sage">
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="font-heading text-base font-bold text-forest">Aucune soumission trouvée</p>
                    <p className="text-xs">
                      {typeFilter === "partner" 
                        ? "Aucune demande de partenariat pour le moment. Dès qu'un visiteur soumet le formulaire Partenaires, il s'affichera immédiatement ici."
                        : "Aucune soumission ne correspond aux filtres sélectionnés."}
                    </p>
                    {typeFilter && (
                      <button 
                        onClick={() => handleSelectTab("")} 
                        className="text-xs text-[#E20713] font-bold underline pt-1 inline-block"
                      >
                        Afficher tous les dossiers
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              submissions.map((sub) => {
                const statusInfo = STATUS_BADGES[getSubStatus(sub)] || STATUS_BADGES.new;
                const typeInfo = TYPE_CONFIG[sub.type] || { label: sub.type, color: "bg-gray-100 text-gray-800 border-gray-200" };
                const isPartner = sub.type === "partner";
                const org = getOrg(sub);
                const name = getName(sub);

                return (
                  <tr 
                    key={sub.id} 
                    onClick={() => setSelectedSubmission(sub)}
                    className="hover:bg-bone/40 transition-colors cursor-pointer group"
                  >
                    {/* NOM & ORGANISATION */}
                    <td className="px-5 py-3.5">
                      {isPartner && org ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-forest text-sm">
                            
                            <span>{org}</span>
                          </div>
                          <div className="text-[11px] text-sage flex items-center gap-1 mt-0.5">
                            
                            <span>{name}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-forest text-sm">{name}</p>
                          {org && <p className="text-[11px] text-sage">{org}</p>}
                        </div>
                      )}
                    </td>

                    {/* COURRIEL */}
                    <td className="px-5 py-3.5 text-sage">
                      <a 
                        href={`mailto:${getEmail(sub)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-[#E20713] hover:underline"
                      >
                        {getEmail(sub)}
                      </a>
                    </td>

                    {/* TYPE DE FORMULAIRE */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${typeInfo.color}`}>
                          
                          <span>{typeInfo.label}</span>
                        </span>
                        {isPartner && sub.payload?.partnerType && (
                          <span className="text-[9.5px] font-semibold text-sage uppercase tracking-wider bg-forest/5 px-1.5 py-0.2">
                            {sub.payload.partnerType}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* APERÇU / SUJET */}
                    <td className="px-5 py-3.5 text-sage max-w-xs truncate">
                      {getPreviewSnippet(sub)}
                    </td>

                    {/* STATUT */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>

                    {/* DATE */}
                    <td className="px-5 py-3.5 text-sage whitespace-nowrap">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="inline-flex items-center gap-1 text-forest hover:text-[#E20713] font-bold transition-colors p-1"
                          title="Voir le dossier"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Voir</span>
                        </button>
                        <button
                          onClick={(e) => handleDelete(sub.id, e)}
                          disabled={deletingId === sub.id}
                          className="text-sage/60 hover:text-red-600 transition-colors p-1"
                          title="Supprimer"
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

      {/* DETAIL MODAL WITH EDITORIAL LAYOUT & WORKFLOW ACTIONS */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-forest/20">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 text-sage hover:text-forest transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>

            {/* MODAL HEADER */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E20713]">
                Dossier de soumission
              </span>
              <span className="text-xs text-sage">• ID: {selectedSubmission.id.substring(0, 8)}</span>
              <span className="text-xs text-sage">• Date: {new Date(selectedSubmission.created_at).toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="font-heading text-2xl font-black text-forest uppercase tracking-tight flex items-center gap-2">
                <span>{TYPE_CONFIG[selectedSubmission.type]?.icon || "📄"}</span>
                <span>{TYPE_CONFIG[selectedSubmission.type]?.label || selectedSubmission.type}</span>
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                {getPhone(selectedSubmission) && (
                  <a
                    href={`https://wa.me/${getPhone(selectedSubmission).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${getName(selectedSubmission)}, nous vous contactons depuis 3M SERVICES concernant votre demande.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp ({getPhone(selectedSubmission)})</span>
                  </a>
                )}
                {selectedSubmission.payload?.email && (
                  <a
                    href={`mailto:${selectedSubmission.payload.email}?subject=3M%20SERVICES%20-%20Votre%20demande%20${selectedSubmission.type}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E20713] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#E20713]/90 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contacter par courriel</span>
                  </a>
                )}
              </div>
            </div>

            {/* STATUS & ASSIGNMENT ACTION BAR */}
            <div className="bg-[#FAF9F6] border border-[#E8E6E1] p-4 mb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest">Statut actuel :</span>
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase border ${STATUS_BADGES[getSubStatus(selectedSubmission)]?.color || "bg-gray-100"}`}>
                    {STATUS_BADGES[getSubStatus(selectedSubmission)]?.label || getSubStatus(selectedSubmission)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-sage mr-1">Changer statut :</span>
                  {["new", "in_review", "contacted", "approved", "archived"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      disabled={updatingStatus}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                        getSubStatus(selectedSubmission) === st
                          ? "bg-[#E20713] text-white border-[#E20713]"
                          : "bg-white text-forest border-forest/15 hover:border-[#E20713]"
                      }`}
                    >
                      {STATUS_BADGES[st]?.label || st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reviewer Assignment Row */}
              <div className="pt-2 border-t border-forest/10 flex items-center justify-between gap-3 flex-wrap text-xs">
                <span className="font-bold uppercase tracking-wider text-forest/70">Assigner à un réviseur :</span>
                <select
                  value={selectedSubmission.payload?.assigned_to || ""}
                  onChange={async (e) => {
                    const val = e.target.value;
                    try {
                      await api.put(`/submissions/${selectedSubmission.id}`, { assigned_to: val });
                      toast.success(`Dossier assigné à ${val || "Personne"}`);
                      setSelectedSubmission((prev) => ({
                        ...prev,
                        payload: { ...prev.payload, assigned_to: val }
                      }));
                      fetchSubmissions();
                    } catch (err) {
                      toast.error("Échec de l'assignation");
                    }
                  }}
                  className="px-3 py-1.5 border border-forest/20 bg-white text-forest text-xs font-medium outline-none focus:border-[#E20713]"
                >
                  <option value="">Non assigné</option>
                  <option value="Équipe 3M SERVICES">Équipe 3M SERVICES</option>
                  <option value="Murielle">Murielle</option>
                  <option value="Comité Partenariats">Comité Partenariats</option>
                  <option value="Coordination Programmes">Coordination Programmes</option>
                </select>
              </div>
            </div>

            {/* SUBMISSION DATA FIELDS */}
            <div className="space-y-4">
              <div className="border border-forest/10 divide-y divide-forest/10">
                {Object.entries(selectedSubmission.payload || {}).map(([key, value]) => {
                  if (key === "notes" || key === "status") return null;
                  return (
                    <div key={key} className="p-3.5 sm:flex sm:items-start sm:gap-4 bg-white">
                      <span className="w-1/3 text-[11px] font-bold uppercase tracking-wider text-forest/70 block mb-1 sm:mb-0">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="w-2/3 text-xs sm:text-sm text-forest font-medium break-words">
                        {value === null || value === undefined
                          ? "-"
                          : typeof value === "boolean"
                          ? (value ? "Oui" : "Non")
                          : typeof value === "object"
                          ? JSON.stringify(value)
                          : value.toString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ADMIN NOTES & FOLLOW-UP TIMELINE */}
              <div className="mt-8 border-t border-forest/15 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-[#E20713]" />
                  <h3 className="text-xs uppercase tracking-wider text-forest font-bold">
                    Notes internes & Historique de suivi
                  </h3>
                </div>

                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {selectedSubmission.payload?.notes?.length > 0 ? (
                    selectedSubmission.payload.notes.map((note, idx) => (
                      <div key={note.id || idx} className="bg-stone-50 border border-stone-200 p-3 text-xs text-forest">
                        <p className="leading-relaxed">{note.text}</p>
                        <div className="flex items-center justify-between text-[10px] text-sage mt-1.5 border-t border-stone-200/60 pt-1">
                          <span>Auteur : {note.author || "Admin"}</span>
                          <span>{new Date(note.created_at || Date.now()).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-sage italic">Aucune note de suivi enregistrée pour ce dossier.</p>
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Ajouter une note de suivi interne..."
                    className="flex-1 border border-forest/20 px-3 py-2 text-xs outline-none focus:border-[#E20713]"
                  />
                  <button
                    type="submit"
                    className="bg-[#E20713] hover:bg-[#E20713]/90 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Ajouter
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

