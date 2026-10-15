import React, { useState, useEffect } from "react";
import {
  Mail, Users, Send, FileEdit, Settings as SettingsIcon,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Plus,
  Search, Download, Upload, Eye, Trash2, ArrowRight,
  Clock, ShieldAlert, Check, Play, Smartphone, Monitor
} from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function AdminNewsletter() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-forest/15 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B84A39]">
            COMMUNICATIONS & AUTOMATION
          </span>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-forest">
            Infolettre & Automatisation Email
          </h1>
          <p className="text-xs text-forest/60 mt-0.5">
            Expéditeur officiel : <span className="font-mono text-forest font-semibold">contact@capentrepreneurs.org</span>
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-forest/5 p-1 rounded-md">
          {[
            { id: "overview", label: "Vue d'ensemble", icon: Mail },
            { id: "subscribers", label: "Abonnés", icon: Users },
            { id: "campaigns", label: "Campagnes", icon: Send },
            { id: "templates", label: "Modèles d'email", icon: FileEdit },
            { id: "logs", label: "Journal des envois", icon: Clock },
            { id: "settings", label: "Configuration SMTP", icon: SettingsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-heading font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-forest text-bone shadow-sm"
                    : "text-forest/70 hover:text-forest hover:bg-forest/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && <NewsletterOverviewTab onNavigate={setActiveTab} />}
      {activeTab === "subscribers" && <NewsletterSubscribersTab />}
      {activeTab === "campaigns" && <NewsletterCampaignsTab />}
      {activeTab === "templates" && <NewsletterTemplatesTab />}
      {activeTab === "logs" && <NewsletterLogsTab />}
      {activeTab === "settings" && <NewsletterSettingsTab />}
    </div>
  );
}

// =========================================================================
// 1. OVERVIEW TAB
// =========================================================================
function NewsletterOverviewTab({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/newsletter/stats");
      setStats(res.data);
    } catch (err) {
      toast.error("Impossible de charger les statistiques.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#B84A39] mx-auto mb-2" />
        <p className="text-xs uppercase tracking-widest text-forest/60 font-heading">
          Chargement des indicateurs...
        </p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Abonnés", value: stats?.total_subscribers || 0, icon: Users, color: "text-forest" },
    { label: "Abonnés Actifs", value: stats?.active_subscribers || 0, icon: CheckCircle2, color: "text-emerald-700" },
    { label: "En attente (Opt-In)", value: stats?.pending_subscribers || 0, icon: Clock, color: "text-amber-700" },
    { label: "Désabonnés", value: stats?.unsubscribed_subscribers || 0, icon: XCircle, color: "text-rose-700" },
    { label: "Campagnes Livrées", value: stats?.campaigns_sent || 0, icon: Send, color: "text-blue-700" },
    { label: "Courriels Transmis", value: stats?.total_deliveries || 0, icon: Mail, color: "text-purple-700" },
  ];

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-forest/15 p-4 rounded-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-forest/40 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest/60 truncate">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className={`font-heading text-2xl md:text-3xl font-bold tracking-tight ${card.color}`}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-forest/15 p-6 rounded-sm">
          <div className="flex items-center justify-between mb-4 border-b border-forest/10 pb-3">
            <h3 className="font-heading text-base font-bold text-forest">
              Campagnes récentes & notifications
            </h3>
            <button
              onClick={() => onNavigate("campaigns")}
              className="text-xs text-[#B84A39] hover:underline font-bold flex items-center gap-1"
            >
              <span>Gérer les campagnes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!stats?.recent_campaigns || stats.recent_campaigns.length === 0 ? (
            <p className="text-xs text-forest/50 py-8 text-center">
              Aucune campagne d'infolettre n'a encore été diffusée.
            </p>
          ) : (
            <div className="divide-y divide-forest/10">
              {stats.recent_campaigns.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-forest">{c.title}</h4>
                    <p className="text-xs text-forest/60 truncate max-w-md">
                      Objet : {c.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        c.status === "sent"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.status === "processing"
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : "bg-forest/10 text-forest"
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-xs font-mono text-forest/60">
                      {c.sent_count} envoyés
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Automation Status */}
        <div className="bg-white border border-forest/15 p-6 rounded-sm space-y-4">
          <h3 className="font-heading text-base font-bold text-forest border-b border-forest/10 pb-3">
            Statut du flux automatisé
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-forest/5 rounded">
              <span className="font-semibold text-forest">Avis de publication blog</span>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                ACTIVÉ
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-forest/5 rounded">
              <span className="font-semibold text-forest">Double Opt-In</span>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                ACTIF (72H)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-forest/5 rounded">
              <span className="font-semibold text-forest">Désabonnement 1-Clic</span>
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                RFC 8058 CONFORME
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-forest/5 rounded">
              <span className="font-semibold text-forest">Passerelle SMTP</span>
              <span className="font-mono text-forest/70 text-[10px]">
                Hostinger SSL (465)
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate("settings")}
              className="w-full bg-forest text-bone hover:bg-[#B84A39] text-xs font-bold uppercase tracking-wider py-2.5 transition-colors flex items-center justify-center gap-2"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Tester la passerelle Hostinger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 2. SUBSCRIBERS TAB
// =========================================================================
function NewsletterSubscribersTab() {
  const [subscribers, setSubscribers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // New subscriber modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newStatus, setNewStatus] = useState("active");

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/newsletter/subscribers", {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined
        }
      });
      setSubscribers(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      toast.error("Erreur lors de la récupération des abonnés.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSubscribers();
  };

  const handleCreateSubscriber = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/newsletter/subscribers", {
        email: newEmail.trim().toLowerCase(),
        first_name: newFirstName.trim() || undefined,
        status: newStatus,
        source: "admin_manual",
        consent_given: true
      });
      toast.success("Abonné ajouté avec succès !");
      setShowAddModal(false);
      setNewEmail("");
      setNewFirstName("");
      fetchSubscribers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Échec de l'ajout de l'abonné.");
    }
  };

  const handleDeleteSubscriber = async (id, email) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive de ${email} ?`)) return;
    try {
      await api.delete(`/admin/newsletter/subscribers/${id}`);
      toast.success("Abonné supprimé.");
      fetchSubscribers();
    } catch (err) {
      toast.error("Impossible de supprimer cet abonné.");
    }
  };

  const handleExportCSV = () => {
    window.open(`${api.defaults.baseURL || "/api/v1"}/admin/newsletter/subscribers/export/csv`, "_blank");
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/admin/newsletter/subscribers/import/csv", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(
        `Import terminé : ${res.data.imported} ajoutés, ${res.data.duplicates} doublons ignorés.`
      );
      fetchSubscribers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'import CSV.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-forest/15 p-4 rounded-sm">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-forest/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par courriel ou prénom..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-forest/5 border border-forest/15 focus:outline-none focus:border-[#B84A39]"
            />
          </div>
          <button
            type="submit"
            className="bg-forest text-bone text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-[#B84A39] transition-colors"
          >
            Filtrer
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-xs bg-forest/5 border border-forest/15 px-3 py-2 text-forest focus:outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="pending">En attente (opt-in)</option>
            <option value="unsubscribed">Désabonné</option>
            <option value="bounced">Rebond</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-xs font-bold border border-forest/20 px-3 py-2 hover:bg-forest/5 transition-colors"
            title="Exporter en CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Exporter</span>
          </button>

          <label className="flex items-center gap-1.5 text-xs font-bold border border-forest/20 px-3 py-2 hover:bg-forest/5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Importer</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#B84A39] text-bone text-xs font-bold uppercase tracking-wider px-3.5 py-2 hover:bg-[#a03e30] transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white border border-forest/15 overflow-x-auto rounded-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-forest/5 border-b border-forest/15 font-heading text-[11px] font-bold uppercase tracking-wider text-forest/70">
              <th className="py-3 px-4">Courriel</th>
              <th className="py-3 px-4">Prénom</th>
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Date inscription</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/10">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-forest/50">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-[#B84A39]" />
                  Chargement...
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-forest/50">
                  Aucun abonné ne correspond aux critères.
                </td>
              </tr>
            ) : (
              subscribers.map((s) => (
                <tr key={s.id} className="hover:bg-forest/5 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-forest">{s.email}</td>
                  <td className="py-3 px-4 text-forest/80">{s.first_name || "—"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        s.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : s.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : s.status === "unsubscribed"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-forest/60 text-[11px] font-mono">{s.source}</td>
                  <td className="py-3 px-4 text-forest/60">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString("fr-CA") : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteSubscriber(s.id, s.email)}
                      className="p-1 hover:text-red-600 transition-colors"
                      title="Supprimer l'abonné"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="p-4 border-t border-forest/15 flex items-center justify-between text-xs text-forest/60">
          <span>Total : {total} abonnés</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border border-forest/20 disabled:opacity-30 hover:bg-forest/5"
            >
              Précédent
            </button>
            <span className="px-3 py-1 font-mono">Page {page}</span>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border border-forest/20 disabled:opacity-30 hover:bg-forest/5"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-forest/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-forest/20 max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-heading text-lg font-bold text-forest">Ajouter un abonné</h3>
            <form onSubmit={handleCreateSubscriber} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Adresse courriel *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nom@example.org"
                  className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Prénom (optionnel)</label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="Jean"
                  className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Statut initial</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none"
                >
                  <option value="active">Actif (Consentement explicite reçu)</option>
                  <option value="pending">En attente (Opt-in requis)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-forest/20 hover:bg-forest/5"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#B84A39] text-bone font-heading font-bold uppercase tracking-wider px-4 py-2 hover:bg-[#a03e30]"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 3. CAMPAIGNS TAB
// =========================================================================
function NewsletterCampaignsTab() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [testEmail, setTestEmail] = useState("");

  // Create form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [recipientSegment, setRecipientSegment] = useState("all_active");

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/newsletter/campaigns");
      setCampaigns(res.data);
    } catch (err) {
      toast.error("Impossible de charger les campagnes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/newsletter/campaigns", {
        title,
        subject,
        preview_text: previewText,
        recipient_segment: recipientSegment
      });
      toast.success("Campagne créée !");
      setShowCreateModal(false);
      setTitle("");
      setSubject("");
      setPreviewText("");
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Échec de création de la campagne.");
    }
  };

  const handleSendCampaign = async (id, title) => {
    if (!window.confirm(`Confirmez-vous le lancement de l'envoi de la campagne "${title}" à tous les abonnés actifs ?`)) return;
    try {
      await api.post(`/admin/newsletter/campaigns/${id}/send`);
      toast.success("Envoi de la campagne enclenché en arrière-plan !");
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Échec du déclenchement de l'envoi.");
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!selectedCampaign || !testEmail) return;

    try {
      await api.post(`/admin/newsletter/campaigns/${selectedCampaign.id}/test`, {
        email: testEmail.trim().toLowerCase(),
        campaign_id: selectedCampaign.id
      });
      toast.success(`Courriel de test envoyé avec succès à ${testEmail} !`);
      setShowTestModal(false);
      setTestEmail("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Échec de l'envoi du courriel de test.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white border border-forest/15 p-4 rounded-sm">
        <div>
          <h3 className="font-heading text-sm font-bold text-forest">
            Gestion des Campagnes
          </h3>
          <p className="text-xs text-forest/60">
            Créez des campagnes personnalisées ou suivez les notifications de parution automatique.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-[#B84A39] text-bone text-xs font-bold uppercase tracking-wider px-4 py-2 hover:bg-[#a03e30] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouvelle campagne</span>
        </button>
      </div>

      {/* Campaigns List */}
      <div className="bg-white border border-forest/15 rounded-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-forest/50">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B84A39]" />
            Chargement des campagnes...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center text-forest/50">
            Aucune campagne d'infolettre créée pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-forest/10">
            {campaigns.map((c) => (
              <div key={c.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-forest/5 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-heading font-bold text-base text-forest">{c.title}</h4>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        c.status === "sent"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.status === "processing"
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : "bg-forest/10 text-forest"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-forest/70">
                    <span className="font-semibold">Objet :</span> {c.subject}
                  </p>
                  <p className="text-xs text-forest/50 font-mono">
                    Segment : {c.recipient_segment} • Destinataires : {c.recipient_count} • Livrés : {c.sent_count} • Échecs : {c.failed_count}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedCampaign(c); setShowTestModal(true); }}
                    className="flex items-center gap-1.5 text-xs font-bold border border-forest/20 px-3 py-1.5 hover:bg-forest/10 text-forest"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Envoyer un test</span>
                  </button>

                  {c.status === "draft" && (
                    <button
                      onClick={() => handleSendCampaign(c.id, c.title)}
                      className="flex items-center gap-1.5 bg-forest hover:bg-[#B84A39] text-bone text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>Diffuser</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Create Campaign */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-forest/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-forest/20 max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="font-heading text-lg font-bold text-forest">Nouvelle campagne d'infolettre</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Titre interne *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex. Infolettre Mensuelle - Octobre 2026"
                  className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Objet du courriel *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="ex. Découvrez nos nouveaux programmes et initiatives"
                  className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Texte de prévisualisation</label>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Aperçu visible dans la boîte de réception..."
                  className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Segment de destinataires</label>
                <select
                  value={recipientSegment}
                  onChange={(e) => setRecipientSegment(e.target.value)}
                  className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none"
                >
                  <option value="all_active">Tous les abonnés actifs (confirmés)</option>
                  <option value="pending">Abonnés en attente de confirmation</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-forest/20 hover:bg-forest/5"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-[#B84A39] text-bone font-heading font-bold uppercase tracking-wider px-4 py-2 hover:bg-[#a03e30]"
                >
                  Créer la campagne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-forest/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-forest/20 max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-heading text-lg font-bold text-forest">Envoyer un courriel de test</h3>
            <p className="text-xs text-forest/70">
              Vérifiez la mise en page de la campagne <span className="font-semibold">"{selectedCampaign?.title}"</span> sur votre boîte personnelle avant tout envoi global.
            </p>
            <form onSubmit={handleSendTestEmail} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Adresse de réception du test *</label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="votre-adresse@domaine.com"
                  className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 border border-forest/20 hover:bg-forest/5"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-forest text-bone font-heading font-bold uppercase tracking-wider px-4 py-2 hover:bg-[#B84A39]"
                >
                  Expédier le test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 4. TEMPLATES TAB
// =========================================================================
function NewsletterTemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceMode, setDeviceMode] = useState("desktop");

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("/admin/newsletter/templates");
        setTemplates(res.data);
      } catch (err) {
        toast.error("Impossible de charger les modèles.");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white border border-forest/15 p-4 rounded-sm">
        <div>
          <h3 className="font-heading text-sm font-bold text-forest">
            Gabarits & Identité Visuelle CAP Entrepreneurs
          </h3>
          <p className="text-xs text-forest/60">
            Structure HTML compatible 100% avec les clients de messagerie (Outlook, Gmail, Apple Mail, Webmail).
          </p>
        </div>

        <div className="flex items-center gap-1 bg-forest/5 p-1 rounded">
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`p-1.5 rounded ${deviceMode === "desktop" ? "bg-forest text-bone" : "text-forest/60"}`}
            title="Aperçu Bureau"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode("mobile")}
            className={`p-1.5 rounded ${deviceMode === "mobile" ? "bg-forest text-bone" : "text-forest/60"}`}
            title="Aperçu Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Email Preview Box */}
      <div className="bg-forest/5 border border-forest/15 p-6 rounded-sm flex justify-center">
        <div
          className={`bg-white border border-forest/20 shadow-md transition-all ${
            deviceMode === "mobile" ? "w-[360px]" : "w-[600px]"
          }`}
        >
          {/* Header */}
          <div className="p-6 text-center border-b border-forest/10 bg-[#FDFCFD]">
            <img
              src="/assets/logo-mark.png"
              alt="CAP Entrepreneurs"
              className="h-10 mx-auto object-contain mb-2"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B84A39]">
              CAP ENTREPRENEURS • NOUVEL ARTICLE
            </span>
          </div>

          {/* Body */}
          <div className="p-6 md:p-8 space-y-4">
            <h2 className="font-heading text-xl md:text-2xl font-bold text-forest leading-tight">
              Bâtir des économies numériques inclusives, accessibles et durables
            </h2>
            <div className="h-44 bg-forest/10 flex items-center justify-center text-forest/40 text-xs font-mono">
              [Image à la une de l'article]
            </div>
            <p className="text-xs md:text-sm text-forest/75 italic leading-relaxed">
              « Découvrez nos dernières réflexions, outils et partenariats mis en place pour accélérer les retombées concrètes sur nos communautés. »
            </p>
            <div className="pt-2">
              <span className="inline-block bg-[#232724] text-white text-[11px] font-bold uppercase tracking-widest px-6 py-3">
                Lire l'article complet &rarr;
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-forest/10 bg-[#FDFCFD] text-center space-y-2 text-[11px] text-forest/50">
            <p>
              Vous recevez cet avis car vous êtes inscrit à l'infolettre de CAP Entrepreneurs.
            </p>
            <p>
              <a href="#" className="underline text-forest/70">Se désabonner</a> • <a href="#" className="underline text-forest/70">Politique de confidentialité</a>
            </p>
            <p className="font-mono text-[10px]">
              CAP Entrepreneurs • contact@capentrepreneurs.org
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 5. DELIVERY LOGS TAB
// =========================================================================
function NewsletterLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/newsletter/deliveries?limit=50");
      setLogs(res.data);
    } catch (err) {
      toast.error("Impossible de charger le journal des envois.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white border border-forest/15 p-4 rounded-sm">
        <div>
          <h3 className="font-heading text-sm font-bold text-forest">
            Journal d'audit des livraisons SMTP
          </h3>
          <p className="text-xs text-forest/60">
            Suivi en temps réel de chaque courriel individuel transmis par le serveur Hostinger.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-xs font-bold border border-forest/20 px-3 py-1.5 hover:bg-forest/5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Rafraîchir</span>
        </button>
      </div>

      <div className="bg-white border border-forest/15 overflow-x-auto rounded-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-forest/5 border-b border-forest/15 font-heading text-[11px] font-bold uppercase tracking-wider text-forest/70">
              <th className="py-3 px-4">Destinataire</th>
              <th className="py-3 px-4">Statut</th>
              <th className="py-3 px-4">Message / Erreur</th>
              <th className="py-3 px-4">Date de transmission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/10">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-forest/50">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-[#B84A39]" />
                  Chargement du journal...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-forest/50">
                  Aucun enregistrement d'envoi disponible pour le moment.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-forest/5 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-forest">{log.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        log.status === "sent"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-forest/70 font-mono text-[11px]">
                    {log.error_message || "Accepté par le serveur SMTP"}
                  </td>
                  <td className="py-3 px-4 text-forest/60">
                    {log.created_at ? new Date(log.created_at).toLocaleString("fr-CA") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =========================================================================
// 6. SETTINGS & SMTP CONFIGURATION TAB
// =========================================================================
function NewsletterSettingsTab() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/admin/newsletter/settings");
        setSettings(res.data);
      } catch (err) {
        toast.error("Impossible de charger les paramètres.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/admin/newsletter/settings", settings);
      toast.success("Paramètres d'infolettre sauvegardés !");
    } catch (err) {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast.error("Veuillez saisir une adresse courriel valide pour le test.");
      return;
    }
    setTesting(true);
    try {
      const res = await api.post("/admin/newsletter/settings/test-smtp", { email: testEmail });
      toast.success(res.data?.message || "Test SMTP réussi !");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Échec de connexion au serveur SMTP Hostinger.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#B84A39] mx-auto mb-2" />
        <p className="text-xs uppercase tracking-widest text-forest/60 font-heading">
          Chargement de la configuration...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <form onSubmit={handleSave} className="bg-white border border-forest/15 p-6 rounded-sm space-y-6">
        <div>
          <h3 className="font-heading text-base font-bold text-forest">
            Paramètres Généraux & Automatisation
          </h3>
          <p className="text-xs text-forest/60">
            Contrôlez l'expédition automatique dès la publication d'un article et les coordonnées de diffusion.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-forest/5 rounded">
            <div>
              <span className="font-bold text-forest block">Envoi automatique à la publication</span>
              <span className="text-forest/60 text-[11px]">
                Expédier immédiatement un courriel de notification à tous les abonnés actifs dès qu'un article passe au statut "Publié".
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings?.auto_send_on_publish ?? true}
              onChange={(e) => setSettings({ ...settings, auto_send_on_publish: e.target.checked })}
              className="h-4 w-4 rounded border-forest/30 text-[#B84A39] focus:ring-[#B84A39]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Nom d'expéditeur (From Name)</label>
              <input
                type="text"
                value={settings?.from_name || ""}
                onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Courriel d'expéditeur (From Email)</label>
              <input
                type="email"
                value={settings?.from_email || ""}
                onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Adresse de réponse (Reply-To)</label>
            <input
              type="email"
              value={settings?.reply_to || ""}
              onChange={(e) => setSettings({ ...settings, reply_to: e.target.value })}
              className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-forest/10">
          <h3 className="font-heading text-base font-bold text-forest mb-1">
            Passerelle SMTP Hostinger
          </h3>
          <p className="text-xs text-forest/60 mb-4">
            Configuration du serveur sortant pour contact@capentrepreneurs.org.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Hôte SMTP (Host)</label>
              <input
                type="text"
                value={settings?.smtp_host || ""}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                placeholder="smtp.hostinger.com"
                className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Port SMTP</label>
              <input
                type="number"
                value={settings?.smtp_port || 465}
                onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 465 })}
                placeholder="465"
                className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Identifiant SMTP (Courriel)</label>
              <input
                type="text"
                value={settings?.smtp_user || ""}
                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                placeholder="contact@capentrepreneurs.org"
                className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Mot de passe SMTP</label>
              <input
                type="password"
                value={settings?.smtp_pass || ""}
                onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                placeholder="••••••••••••"
                className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-forest focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-forest/10">
          <h3 className="font-heading text-base font-bold text-forest mb-1">
            Intégration Microsoft Teams (Optionnel)
          </h3>
          <p className="text-xs text-forest/60 mb-2">
            URL Webhook entrant pour alerter l'équipe interne lors des diffusions de contenu.
          </p>
          <input
            type="url"
            value={settings?.teams_webhook_url || ""}
            onChange={(e) => setSettings({ ...settings, teams_webhook_url: e.target.value })}
            placeholder="https://outlook.office.com/webhook/..."
            className="w-full bg-forest/5 border border-forest/20 px-3 py-2 text-xs text-forest focus:outline-none font-mono"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-forest hover:bg-[#B84A39] text-bone font-heading text-xs font-bold uppercase tracking-wider px-6 py-2.5 transition-colors"
          >
            {saving ? "Enregistrement..." : "Enregistrer la configuration"}
          </button>
        </div>
      </form>

      {/* Diagnostics Card */}
      <div className="bg-white border border-forest/15 p-6 rounded-sm space-y-4">
        <div>
          <h3 className="font-heading text-base font-bold text-forest">
            Vérification de la Connexion SMTP
          </h3>
          <p className="text-xs text-forest/60">
            Transmet un message de test sécurisé depuis <span className="font-semibold text-forest">contact@capentrepreneurs.org</span> pour valider vos identifiants Hostinger.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Entrez votre courriel pour recevoir le test..."
            className="w-full sm:flex-1 bg-forest/5 border border-forest/20 px-3 py-2.5 text-xs text-forest focus:outline-none"
          />
          <button
            type="button"
            onClick={handleTestSmtp}
            disabled={testing}
            className="w-full sm:w-auto bg-[#B84A39] hover:bg-[#a03e30] text-bone font-heading text-xs font-bold uppercase tracking-wider px-6 py-2.5 transition-colors whitespace-nowrap"
          >
            {testing ? "Test en cours..." : "Lancer le test SMTP"}
          </button>
        </div>
      </div>
    </div>
  );
}
