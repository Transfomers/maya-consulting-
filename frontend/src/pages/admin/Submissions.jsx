import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Search, Filter, Eye, X, CheckCircle, Clock, Archive, MessageSquare, Send, Check } from "lucide-react";

const STATUS_BADGES = {
  new: { label: "New", color: "bg-blue-100 text-blue-800 border-blue-200" },
  in_review: { label: "In Review", color: "bg-amber-100 text-amber-800 border-amber-200" },
  contacted: { label: "Contacted", color: "bg-purple-100 text-purple-800 border-purple-200" },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  archived: { label: "Archived", color: "bg-stone-100 text-stone-700 border-stone-200" },
};

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
      toast.error("Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, search]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedSubmission) return;
    setUpdatingStatus(true);
    try {
      await api.put(`/submissions/${selectedSubmission.id}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setSelectedSubmission((prev) => ({
        ...prev,
        status: newStatus,
        payload: { ...prev.payload, status: newStatus },
      }));
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedSubmission) return;
    try {
      await api.put(`/submissions/${selectedSubmission.id}`, { new_note: newNote.trim() });
      toast.success("Admin note added");
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
      toast.error("Failed to add note");
    }
  };

  const getName = (sub) => sub.payload?.name || sub.payload?.organization || "Visiteur";
  const getEmail = (sub) => sub.payload?.email || "-";
  const getSubStatus = (sub) => sub.status || sub.payload?.status || "new";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Dossiers & Formulaires</h1>
          <p className="text-xs text-sage mt-1">Gérez et traitez toutes les soumissions reçues via le site web.</p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, mot-clé..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-forest/15 bg-white text-xs focus:outline-none focus:border-forest"
          />
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-forest/15 bg-white text-xs focus:outline-none focus:border-forest cursor-pointer"
          >
            <option value="">Tous les types de formulaires</option>
            <option value="contact">Message de contact direct</option>
            <option value="application">Programme : Apprendre & Développer</option>
            <option value="volunteer">Candidature Bénévolat</option>
            <option value="partner">Partenariat (OBNL / Entreprise)</option>
            <option value="sourcing">Programme Sourcing & Acheteur</option>
            <option value="festival">Festival Global & Inscription Session</option>
            <option value="donate">Promesse de don</option>
            <option value="newsletter">Abonnement Infolettre</option>
            <option value="review">Avis & Témoignages</option>
          </select>
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-forest/15 bg-white text-xs focus:outline-none focus:border-forest cursor-pointer"
          >
            <option value="">Tous les statuts</option>
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
              <th className="px-5 py-3.5">Nom / Organisation</th>
              <th className="px-5 py-3.5">Courriel</th>
              <th className="px-5 py-3.5">Type de formulaire</th>
              <th className="px-5 py-3.5">Statut</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/10">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-sage">
                  Chargement des dossiers...
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-sage">
                  Aucune soumission trouvée.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => {
                const statusInfo = STATUS_BADGES[getSubStatus(sub)] || STATUS_BADGES.new;
                return (
                  <tr key={sub.id} className="hover:bg-bone/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-forest">{getName(sub)}</td>
                    <td className="px-5 py-3.5 text-sage">{getEmail(sub)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-forest/5 text-forest border border-forest/10">
                        {sub.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-none ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sage">{new Date(sub.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className="inline-flex items-center gap-1 text-forest hover:text-[#C89255] font-semibold transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Voir</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL WITH WORKFLOW ACTIONS */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-forest/20">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 text-sage hover:text-forest transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C89255]">
                Détail de la soumission
              </span>
              <span className="text-xs text-sage">• ID: {selectedSubmission.id.substring(0, 8)}</span>
            </div>

            <h2 className="font-heading text-2xl font-black text-forest mb-4 uppercase tracking-tight">
              {selectedSubmission.type}
            </h2>

            {/* STATUS ACTION BAR */}
            <div className="bg-[#FAF9F6] border border-[#E8E6E1] p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-forest">Statut actuel :</span>
                <span className={`px-2 py-0.5 text-xs font-bold uppercase border ${STATUS_BADGES[getSubStatus(selectedSubmission)]?.color || "bg-gray-100"}`}>
                  {STATUS_BADGES[getSubStatus(selectedSubmission)]?.label || getSubStatus(selectedSubmission)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-sage mr-1">Changer vers :</span>
                {["new", "in_review", "contacted", "approved", "archived"].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    disabled={updatingStatus}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                      getSubStatus(selectedSubmission) === st
                        ? "bg-forest text-white border-forest"
                        : "bg-white text-forest border-forest/15 hover:border-forest"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* SUBMISSION DATA FIELDS */}
            <div className="space-y-4">
              <div className="border border-forest/10 divide-y divide-forest/10">
                {Object.entries(selectedSubmission.payload || {}).map(([key, value]) => {
                  if (key === "notes" || key === "status") return null;
                  return (
                    <div key={key} className="p-3 sm:flex sm:items-start sm:gap-4 bg-white">
                      <span className="w-1/3 text-[11px] font-bold uppercase tracking-wider text-forest/70 block mb-1 sm:mb-0">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="w-2/3 text-xs sm:text-sm text-forest font-medium break-words">
                        {value === null || value === undefined
                          ? "-"
                          : typeof value === "object"
                          ? JSON.stringify(value)
                          : value.toString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* ADMIN NOTES & FOLLOW-UP */}
              <div className="mt-8 border-t border-forest/15 pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-[#C89255]" />
                  <h3 className="text-xs uppercase tracking-wider text-forest font-bold">
                    Notes internes & Suivi de contact
                  </h3>
                </div>

                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {selectedSubmission.payload?.notes?.length > 0 ? (
                    selectedSubmission.payload.notes.map((note, idx) => (
                      <div key={note.id || idx} className="bg-stone-50 border border-stone-200 p-2.5 text-xs text-forest">
                        <p>{note.text}</p>
                        <span className="text-[10px] text-sage block mt-1">
                          {new Date(note.created_at || Date.now()).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-sage italic">Aucune note enregistrée pour ce dossier.</p>
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Ajouter une note de suivi..."
                    className="flex-1 border border-forest/20 px-3 py-1.5 text-xs outline-none focus:border-forest"
                  />
                  <button
                    type="submit"
                    className="bg-forest hover:bg-[#C89255] text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
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
