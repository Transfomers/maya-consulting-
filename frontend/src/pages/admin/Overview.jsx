import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { 
  Car, Building2, Inbox, Plus, MessageSquare, Phone, 
  ArrowUpRight, ArrowRight, RefreshCw, CheckCircle2,
  Calendar, ShieldCheck, MapPin, Eye, ExternalLink, Sparkles, Tag, Edit3
} from "lucide-react";
import { getCars } from "@/data/catalogStorage";
import { getApartments, syncApartmentsFromServer } from "@/data/apartmentStorage";

export default function AdminOverview() {
  const [cars, setCars] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [subStats, setSubStats] = useState({ total: 0, new_total: 0, in_review_total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      // 1. Cars from local/catalog storage
      const loadedCars = getCars();
      setCars(loadedCars);

      // 2. Apartments
      const loadedApts = getApartments();
      setApartments(loadedApts);
      syncApartmentsFromServer().then((serverApts) => {
        if (serverApts && serverApts.length > 0) setApartments(serverApts);
      });

      // 3. Submissions / CRM data
      try {
        const [resSubmissions, resStats] = await Promise.all([
          api.get("/submissions?limit=8"),
          api.get("/submissions/stats")
        ]);
        if (resSubmissions.data?.submissions) {
          setSubmissions(resSubmissions.data.submissions);
        }
        if (resStats.data) {
          setSubStats(resStats.data);
        }
      } catch (crmErr) {
        console.warn("Could not fetch submissions from API", crmErr);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleCarUpdate = () => setCars(getCars());
    window.addEventListener("3m_cars_updated", handleCarUpdate);
    return () => window.removeEventListener("3m_cars_updated", handleCarUpdate);
  }, []);

  const neuvesCount = cars.filter((c) => c.condition === "Neuve" || c.mileage === "0 km").length;
  const occasionsCount = cars.filter((c) => c.condition === "Occasion" && c.mileage !== "0 km").length;

  const statCards = [
    {
      label: "Parc Automobile",
      value: cars.length,
      subtext: `${neuvesCount} Neuve(s) • ${occasionsCount} Occasion(s)`,
      icon: Car,
      to: "/admin/posts",
      badge: "CMS 2025",
      badgeColor: "bg-red-50 text-[#E20713] border-red-200"
    },
    {
      label: "Appartements Meublés",
      value: apartments.length,
      subtext: "Résidences de standing • Yaoundé",
      icon: Building2,
      to: "/admin/apartments",
      badge: "CMS Immo",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    {
      label: "Devis & CRM Clients",
      value: subStats.total || submissions.length,
      subtext: subStats.new_total > 0 ? `${subStats.new_total} nouvelle(s) demande(s)` : "Aucun devis en attente",
      icon: Inbox,
      to: "/admin/submissions",
      badge: subStats.new_total > 0 ? "Nouveau" : "À jour",
      badgeColor: subStats.new_total > 0 ? "bg-[#E20713] text-white" : "bg-gray-100 text-gray-700 border-gray-200"
    },
    {
      label: "Partenariat MUPOCAM",
      value: "Convention",
      subtext: "Mutuelle Orange Cameroun",
      icon: ShieldCheck,
      to: "/admin/submissions",
      badge: "Actif",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200"
    },
  ];

  const getClientPhone = (sub) => {
    const p = sub.payload || {};
    return p.phone || p.telephone || p.tel || p.mobile || p.whatsapp || null;
  };

  const getClientName = (sub) => {
    const p = sub.payload || {};
    return p.name || p.fullName || p.full_name || p.nom || "Client 3M";
  };

  const getSubSubject = (sub) => {
    const p = sub.payload || {};
    return p.vehicle || p.apartment || p.model || p.subject || p.message || "Demande d'information";
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-0.5 bg-[#E20713] text-white text-[11px] font-mono font-bold uppercase tracking-widest rounded-md">
              3M SERVICES YAOUNDÉ
            </span>
            <span className="text-xs text-gray-400 font-medium">PANEL GESTION & CRM</span>
            <button
              onClick={loadData}
              disabled={refreshing}
              title="Rafraîchir les métriques"
              className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-[#E20713]" : ""}`} />
            </button>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Tableau de Bord & Pilotage
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
            Supervision globale du parc automobile, gestion des appartements meublés et traitement des demandes clients en temps réel.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/admin/posts/new"
            className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 rounded-lg shadow-xs"
          >
            <Plus className="h-4 w-4 text-[#E20713]" />
            <span>Ajouter Véhicule</span>
          </Link>

          <Link
            to="/admin/apartments/new"
            className="px-4 py-2.5 bg-[#E20713] hover:bg-[#C4050F] text-white text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 rounded-lg shadow-xs"
          >
            <Plus className="h-4 w-4 text-white" />
            <span>Ajouter Appartement</span>
          </Link>

          <Link
            to="/boutique"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-500 text-gray-700 text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 rounded-lg shadow-2xs"
          >
            <ExternalLink className="h-4 w-4 text-gray-500" />
            <span>Voir Boutique</span>
          </Link>
        </div>
      </div>

      {/* ── 1. Statistics Cards Grid (4 spacious columns) ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.to}
              className="group bg-white border border-gray-200/90 hover:border-gray-400 p-5 sm:p-6 rounded-xl hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200/60 flex items-center justify-center text-gray-700 group-hover:bg-red-50 group-hover:text-[#E20713] group-hover:border-red-200 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${stat.badgeColor}`}>
                  {stat.badge}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  {stat.label}
                </p>
                <p className="font-heading text-3xl font-black text-gray-900 tracking-tight">
                  {loading ? "..." : stat.value}
                </p>
                {stat.subtext && (
                  <p className="text-xs text-gray-500 font-medium mt-1.5 flex items-center gap-1.5">
                    <span>{stat.subtext}</span>
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── 2. Main Grid: Vehicles & CRM on Left, Apartments & Info on Right ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Vehicle Inventory & CRM (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Active Vehicles Spotlight */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <Car className="h-5 w-5 text-[#E20713]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                  Véhicules en Stock ({cars.length})
                </h2>
              </div>
              <Link 
                to="/admin/posts" 
                className="text-xs font-bold text-[#E20713] hover:text-[#C4050F] flex items-center gap-1 transition-colors"
              >
                <span>Gérer le catalogue complet</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {cars.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-500">
                <Car className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-gray-700">Aucun véhicule actuellement dans le catalogue.</p>
                <Link to="/admin/posts/new" className="mt-3 inline-block px-3 py-1.5 bg-[#E20713] text-white text-xs font-bold rounded">
                  Ajouter un premier véhicule
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {cars.map((car) => {
                  const firstPhoto = car.photos?.[0] || car.image || "/Asset/image.png";
                  return (
                    <div 
                      key={car.id} 
                      className="p-3.5 bg-gray-50/80 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-between gap-4 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="h-14 w-20 bg-gray-200 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 relative">
                          <img
                            src={firstPhoto}
                            alt={car.model}
                            className="h-full w-full object-cover"
                            onError={(e) => { e.currentTarget.src = "/Asset/image.png"; }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-800 text-[10px] font-mono font-bold rounded">
                              {car.condition || "Occasion"}
                            </span>
                            <span className="text-[11px] font-mono text-gray-500">
                              {car.year || "2021"}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-900 truncate mt-0.5">
                            {car.brand ? `${car.brand} ${car.model}` : car.model}
                          </p>
                          <p className="text-xs font-heading font-black text-[#E20713]">
                            {car.price || "Sur devis"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/admin/posts/${car.id}`}
                          className="px-3 py-1.5 bg-white border border-gray-300 hover:border-gray-900 text-gray-700 hover:text-gray-900 text-xs font-bold rounded-md inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-gray-500" />
                          <span>Modifier</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CRM Leads & Inquiries */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <Inbox className="h-5 w-5 text-[#E20713]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                  Dernières Demandes & Devis Clients (CRM)
                </h2>
              </div>
              <Link to="/admin/submissions" className="text-xs font-bold text-[#E20713] hover:text-[#C4050F] flex items-center gap-1 transition-colors">
                <span>Accéder au CRM ({subStats.total || submissions.length})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-10 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                <div className="w-12 h-12 rounded-full bg-red-50 text-[#E20713] flex items-center justify-center mx-auto mb-3">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-gray-800">Aucune nouvelle demande enregistrée pour le moment.</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                  Les demandes de devis et réservations effectuées sur la boutique ou la page d'accueil s'afficheront ici en direct.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {submissions.slice(0, 5).map((sub) => {
                  const phone = getClientPhone(sub);
                  const name = getClientName(sub);
                  const subject = getSubSubject(sub);
                  const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : null;

                  return (
                    <div key={sub.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                            sub.type === "quote" || sub.type === "car_inquiry"
                              ? "bg-red-50 text-[#E20713] border border-red-200"
                              : sub.type === "apartment"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : sub.type === "custom_order"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {sub.type === "quote" ? "Devis Auto" : sub.type === "apartment" ? "Appartement" : sub.type === "custom_order" ? "Commande" : sub.type}
                          </span>
                          <span className="font-bold text-gray-900 truncate">{name}</span>
                        </div>
                        <p className="text-gray-500 text-[11px] truncate">{subject}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Bonjour ${name}, suite à votre demande sur 3M SERVICES concernant ${subject}...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors"
                            title="Répondre sur WhatsApp"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <Link
                          to="/admin/submissions"
                          className="px-3 py-1.5 border border-gray-300 hover:border-gray-900 text-gray-700 hover:text-gray-900 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors"
                        >
                          Détails
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Apartments CMS & Showroom Support (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Apartments CMS Preview */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                  Appartements Meublés ({apartments.length})
                </h3>
              </div>
              <Link to="/admin/apartments" className="text-xs font-bold text-[#E20713] hover:text-[#C4050F] flex items-center gap-1 transition-colors">
                <span>Gérer tout</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {apartments.slice(0, 3).map((apt) => (
                <div key={apt.id} className="p-3 bg-gray-50/80 hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-3.5 transition-colors">
                  <div className="h-16 w-20 bg-gray-200 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 relative">
                    <img
                      src={apt.image || apt.photos?.[0] || "/Asset/image copy 2.png"}
                      alt={apt.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-black/80 text-white text-[9px] font-mono rounded">
                      {(apt.photos?.length || 1)} 📷
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{apt.title}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                      <span className="truncate">{apt.location || "Yaoundé"}</span>
                    </p>
                    <p className="text-xs font-heading font-black text-[#E20713] mt-1">
                      {apt.price}
                    </p>
                  </div>

                  <Link
                    to={`/admin/apartments/${apt.id}`}
                    className="p-2 text-gray-500 hover:text-[#E20713] hover:bg-white rounded-md border border-transparent hover:border-gray-200 transition-colors"
                    title="Modifier cet appartement"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">Galeries multi-photos & commodités</span>
              <Link
                to="/admin/apartments/new"
                className="text-xs font-bold text-[#E20713] hover:underline flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nouvel Appartement</span>
              </Link>
            </div>
          </div>

          {/* Showroom & Contact Support Card */}
          <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 sm:p-7 rounded-xl shadow-md space-y-5 border border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E20713]/20 flex items-center justify-center text-[#E20713] border border-[#E20713]/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-white">
                  Agence Showroom 3M SERVICES
                </h3>
                <p className="text-[10px] text-gray-400 font-mono">Yaoundé - Omnisports</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Toutes les modifications apportées dans cet espace d'administration sont synchronisées en direct avec le catalogue public et la boutique des clients.
            </p>

            <div className="pt-3 border-t border-gray-800/80 space-y-2 text-xs font-mono text-gray-300">
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">Téléphone 1</span>
                <span className="font-bold text-white">+237 691 78 64 47</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">Téléphone 2</span>
                <span className="font-bold text-white">+237 653 76 17 28</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-400">WhatsApp Direct</span>
                <span className="font-bold text-emerald-400">+237 691 78 64 47</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
