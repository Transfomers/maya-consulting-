import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { 
  FileText, CheckCircle2, FileEdit, Clock, 
  FolderTree, Image as ImageIcon, CalendarDays, 
  Download, Users, ArrowUpRight, Inbox, Handshake,
  AlertTriangle, HardDrive, CheckCircle, ArrowRight,
  ExternalLink, RefreshCw
} from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({ 
    total_articles: 0, 
    published_articles: 0, 
    draft_articles: 0, 
    scheduled_articles: 0,
    review_articles: 0,
    archived_articles: 0,
    total_categories: 0,
    total_media: 0,
    unreferenced_media: 0,
    storage_usage_bytes: 0,
    total_events: 0,
    upcoming_events: 0,
    completed_events: 0,
    total_resources: 0,
    published_resources: 0,
    draft_resources: 0,
    total_subscribers: 0,
    total_submissions: 0,
    pending_submissions: 0,
    total_partners: 0
  });

  const [overviewData, setOverviewData] = useState({
    recent_activity: [],
    awaiting_review: [],
    upcoming_events: [],
    recent_submissions: [],
    quality_audit: []
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [resStats, resOverview] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/stats/overview-data")
      ]);
      if (resStats.data) setStats(resStats.data);
      if (resOverview.data) setOverviewData(resOverview.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 Ko";
    const k = 1024;
    const sizes = ["Octets", "Ko", "Mo", "Go"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const statCards = [
    { label: "Dossiers & Submissions", value: stats.total_submissions, subtext: `${stats.pending_submissions} à traiter`, icon: Inbox, to: "/admin/submissions", color: "text-[#701EF8]" },
    { label: "Partenaires (Partners)", value: stats.total_partners, subtext: "Priorité partenariats", icon: Handshake, to: "/admin/submissions?type=partner", color: "text-[#701EF8]" },
    { label: "Articles Publiés", value: stats.published_articles, subtext: `${stats.total_articles} au total`, icon: CheckCircle2, to: "/admin/posts", color: "text-emerald-700" },
    { label: "Brouillons & Révision", value: stats.draft_articles + stats.review_articles, subtext: `${stats.review_articles} en attente de revue`, icon: FileEdit, to: "/admin/posts", color: "text-amber-700" },
    { label: "Articles Programmés", value: stats.scheduled_articles, subtext: "Publication planifiée", icon: Clock, to: "/admin/posts", color: "text-blue-700" },
    { label: "Ressources & Cours", value: stats.total_resources, subtext: `${stats.published_resources} publiés`, icon: Download, to: "/admin/resources", color: "text-forest" },
    { label: "Événements À Venir", value: stats.upcoming_events, subtext: `${stats.total_events} au catalogue`, icon: CalendarDays, to: "/admin/events", color: "text-forest" },
    { label: "Catégories Thématiques", value: stats.total_categories, subtext: "13 thématiques actives", icon: FolderTree, to: "/admin/categories", color: "text-forest" },
    { label: "Médiathèque & Stockage", value: stats.total_media, subtext: formatBytes(stats.storage_usage_bytes), icon: HardDrive, to: "/admin/media", color: "text-forest" },
    { label: "Abonnés Infolettre", value: stats.total_subscribers, subtext: "Abonnés confirmés", icon: Users, to: "/admin/newsletter", color: "text-forest" },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-forest/15 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Tableau de Bord & Opérations</h1>
            <button
              onClick={fetchData}
              disabled={refreshing}
              title="Rafraîchir les métriques"
              className="p-1.5 text-sage hover:text-forest transition-colors rounded hover:bg-forest/5"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#701EF8]" : ""}`} />
            </button>
          </div>
          <p className="text-sm text-sage mt-1">
            Supervision en temps réel des publications, dossiers entrants, événements et conformité éditoriale.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/posts/new"
            className="px-4 py-2 bg-forest text-bone text-xs font-bold uppercase tracking-wider hover:bg-forest/90 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <span>+ Nouvel Article</span>
          </Link>
          <Link
            to="/admin/resources"
            className="px-4 py-2 bg-[#701EF8] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#5f17d3] transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <span>+ Nouvelle Ressource</span>
          </Link>
        </div>
      </div>
      
      {/* 1. Statistics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.to}
              className="group bg-white border border-forest/15 p-4 hover:border-forest transition-all flex flex-col justify-between shadow-xs hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sage group-hover:text-forest transition-colors truncate">
                  {stat.label}
                </span>
                <Icon className="h-4 w-4 text-forest/40 group-hover:text-forest transition-colors shrink-0 ml-1" />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className={`font-heading text-2xl sm:text-3xl font-black ${stat.color}`}>
                    {loading ? "..." : stat.value}
                  </p>
                  <ArrowUpRight className="h-3.5 w-3.5 text-forest/30 group-hover:text-forest group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                {stat.subtext && (
                  <p className="text-[10px] text-sage font-medium mt-1 truncate">{stat.subtext}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* 2. Operational Widgets Grid (2 columns on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Submissions & Activity (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Widget A: Recent Submissions / Form Submissions */}
          <div className="bg-white border border-forest/15 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-forest/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-[#701EF8]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-forest">
                  Derniers Dossiers & Soumissions Reçues
                </h2>
              </div>
              <Link to="/admin/submissions" className="text-xs font-bold text-[#701EF8] hover:underline flex items-center gap-1">
                <span>Voir tout ({stats.total_submissions})</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {overviewData.recent_submissions.length === 0 ? (
              <p className="text-xs text-sage py-6 text-center">Aucune soumission récente.</p>
            ) : (
              <div className="divide-y divide-forest/10">
                {overviewData.recent_submissions.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                        sub.type === "partner" ? "bg-[#701EF8]/10 text-[#701EF8]" : "bg-forest/10 text-forest"
                      }`}>
                        {sub.type}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-forest">{sub.name}</span>
                        <span className="text-sage ml-2 text-[11px] font-mono">{sub.email_preview}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-sage font-medium">
                        {sub.created_at ? new Date(sub.created_at).toLocaleDateString("fr-CA") : ""}
                      </span>
                      <Link
                        to="/admin/submissions"
                        className="px-2 py-1 border border-forest/20 hover:border-forest text-forest hover:bg-forest/5 text-[10px] font-bold uppercase tracking-wider transition-colors"
                      >
                        Examiner
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget B: Recent Activity */}
          <div className="bg-white border border-forest/15 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-forest/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-forest" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-forest">
                  Activités Récentes & Mises à Jour
                </h2>
              </div>
            </div>

            {overviewData.recent_activity.length === 0 ? (
              <p className="text-xs text-sage py-6 text-center">Aucune activité enregistrée.</p>
            ) : (
              <div className="divide-y divide-forest/10">
                {overviewData.recent_activity.map((act, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-forest/5 text-forest/70 border border-forest/10">
                        {act.type}
                      </span>
                      <Link to={act.url} className="font-medium text-forest hover:text-[#701EF8] truncate transition-colors">
                        {act.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-sage">
                        {act.timestamp ? new Date(act.timestamp).toLocaleDateString("fr-CA", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Quality, Review & Events (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Widget C: Content Quality Audit */}
          <div className="bg-white border border-forest/15 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-forest/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-forest">
                  Audit Qualité Éditoriale
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                {overviewData.quality_audit.length} alertes
              </span>
            </div>

            {overviewData.quality_audit.length === 0 ? (
              <div className="py-6 text-center text-xs text-emerald-700 flex flex-col items-center gap-1">
                <CheckCircle className="h-6 w-6 text-emerald-600 mb-1" />
                <span className="font-bold">Contenu conforme !</span>
                <span className="text-sage text-[11px]">Toutes les publications disposent de visuels, résumés et balises SEO.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {overviewData.quality_audit.map((item) => (
                  <div key={item.id} className="p-3 bg-amber-50/50 border border-amber-200/60 rounded flex items-start justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-forest truncate">{item.title}</p>
                      <ul className="mt-1 space-y-0.5">
                        {item.issues.map((iss, i) => (
                          <li key={i} className="text-[10.5px] text-amber-800 flex items-center gap-1">
                            <span className="text-amber-500">•</span> {iss}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      to={item.url}
                      className="px-2 py-1 bg-white hover:bg-forest hover:text-white border border-forest/20 text-forest text-[10px] font-bold uppercase tracking-wider shrink-0 transition-colors"
                    >
                      Corriger
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget D: Content Awaiting Review */}
          <div className="bg-white border border-forest/15 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-forest/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <FileEdit className="h-4 w-4 text-forest" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-forest">
                  En Attente de Validation
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-forest/5 text-forest border border-forest/15 rounded">
                {overviewData.awaiting_review.length}
              </span>
            </div>

            {overviewData.awaiting_review.length === 0 ? (
              <p className="text-xs text-sage py-4 text-center">Aucun article en attente d'approbation.</p>
            ) : (
              <div className="divide-y divide-forest/10">
                {overviewData.awaiting_review.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-forest truncate">{item.title}</span>
                    <Link
                      to={item.url}
                      className="px-2 py-1 bg-forest text-bone text-[10px] font-bold uppercase tracking-wider hover:bg-forest/90 transition-colors"
                    >
                      Revoir
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget E: Upcoming Events Calendar */}
          <div className="bg-white border border-forest/15 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-forest/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-forest" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-forest">
                  Prochains Événements
                </h2>
              </div>
              <Link to="/admin/events" className="text-xs font-bold text-forest hover:underline flex items-center gap-1">
                <span>Gérer</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {overviewData.upcoming_events.length === 0 ? (
              <p className="text-xs text-sage py-4 text-center">Aucun événement à venir programmé.</p>
            ) : (
              <div className="space-y-2.5">
                {overviewData.upcoming_events.map((ev) => (
                  <div key={ev.id} className="p-2.5 border border-forest/10 hover:border-forest/30 transition-colors flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-forest truncate">{ev.title}</p>
                      <p className="text-[10px] text-sage">
                        {ev.start_date ? new Date(ev.start_date).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" }) : "Date à venir"} • {ev.location}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${
                      ev.status === "published" || ev.status === "registration_open"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-100 text-stone-700"
                    }`}>
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}


