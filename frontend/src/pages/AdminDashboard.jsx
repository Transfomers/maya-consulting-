import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import {
  LogOut, LayoutDashboard, Car, Building2, FolderTree,
  Image as ImageIcon, Calendar, Settings, Inbox,
  ChevronRight, Menu, ChevronLeft, X, BookOpen, Mail, Sparkles, ExternalLink
} from "lucide-react";
import api from "@/lib/api";

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Tableau de Bord", icon: LayoutDashboard },
  { path: "/admin/posts", label: "Voitures (CMS)", icon: Car },
  { path: "/admin/apartments", label: "Appartements (CMS)", icon: Building2 },
  { path: "/admin/submissions", label: "Devis & CRM", icon: Inbox },
  { path: "/admin/settings", label: "Paramètres 3M", icon: Settings },
];

export default function AdminDashboard() {
  const [user, setUser] = useState({ name: "Administrateur 3M", email: "admin@3mservices.cm", role: "admin" });
  const [loading, setLoading] = useState(false);
  const [newSubmissionsCount, setNewSubmissionsCount] = useState(0);
  // Desktop: sidebar expanded/collapsed; Mobile: sidebar open/closed as overlay
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const load = async () => {
      const localAuth = sessionStorage.getItem("3m_admin_authenticated");
      if (localAuth === "true") {
        setUser({ name: "Administrateur 3M", email: "admin@3mservices.cm", role: "admin" });
        return;
      }
      try {
        const me = await api.get("/auth/me", { timeout: 1500 });
        if (me.data) setUser(me.data);
      } catch (err) {
        setUser({ name: "Administrateur 3M", email: "admin@3mservices.cm", role: "admin" });
      }
    };
    load();
  }, [navigate]);

  useEffect(() => {
    const fetchSubStats = async () => {
      try {
        const res = await api.get("/submissions/stats");
        if (res.data?.new_total !== undefined) {
          setNewSubmissionsCount(res.data.new_total);
        }
      } catch (_) {}
    };
    fetchSubStats();
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      navigate("/admin/login");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bone">
        <span className="font-heading text-sm font-bold uppercase tracking-[0.25em] text-sage">Loading…</span>
      </div>
    );
  }

  const pathnames = location.pathname.split("/").filter((x) => x);

  const SidebarContent = ({ compact = false }) => (
    <>
      <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
        <div className="px-4 mb-3">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
            {compact ? "Menu" : "Navigation Principale"}
          </p>
        </div>
        <ul className="space-y-1.5 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === "/admin/dashboard"
              ? location.pathname === "/admin/dashboard"
              : location.pathname.startsWith(item.path);
            const isSubmissions = item.path === "/admin/submissions";

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#E20713] text-white shadow-sm font-semibold"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  title={compact ? item.label : ""}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-500"}`} />
                    {!compact && <span className="truncate">{item.label}</span>}
                  </div>
                  {!compact && isSubmissions && newSubmissionsCount > 0 && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? "bg-white text-[#E20713]" : "bg-[#E20713] text-white"
                    }`}>
                      {newSubmissionsCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {!compact && (
          <div className="mt-8 px-4">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
              <div className="flex items-center gap-2 text-gray-900 font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Système Connecté</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug">
                Catalogue & CRM synchronisés avec 3M Service.
              </p>
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        {!compact && (
          <div className="mb-3 px-1">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name || "Administrateur"}</p>
            <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-red-50 hover:text-[#E20713] hover:border-red-200 shadow-2xs"
          title={compact ? "Déconnexion" : ""}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!compact && <span>Déconnexion</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">

      {/* ── Mobile sidebar overlay ─────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-72 bg-white border-r border-gray-200 flex flex-col
          transform transition-transform duration-300
          lg:hidden
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <img src="/Asset/logo-3m-services.png" alt="3M SERVICES" className="h-10 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-heading text-base font-black tracking-tight text-gray-900">3M SERVICES</span>
              <span className="text-[9px] font-mono font-bold text-[#E20713] uppercase tracking-widest">Administration</span>
            </div>
          </Link>
          <button onClick={() => setIsMobileOpen(false)} className="text-gray-500 hover:text-[#E20713] p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent compact={false} />
      </aside>

      {/* ── Desktop sidebar ────────────────────────────────────── */}
      <aside
        className={`
          hidden lg:flex flex-col flex-shrink-0
          ${isDesktopExpanded ? "w-72" : "w-20"}
          border-r border-gray-200 bg-white transition-all duration-300 z-20 shadow-xs
        `}
      >
        <div className={`p-4 border-b border-gray-200 flex items-center ${isDesktopExpanded ? 'justify-between' : 'justify-center'} h-20`}>
          {isDesktopExpanded ? (
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <img src="/Asset/logo-3m-services.png" alt="3M SERVICES" className="h-10 w-auto flex-shrink-0 object-contain" />
              <div className="flex flex-col min-w-0">
                <span className="font-heading text-base font-black tracking-tight text-gray-900 block truncate">3M SERVICES</span>
                <span className="text-[9px] font-mono font-bold text-[#E20713] uppercase tracking-widest">Administration</span>
              </div>
            </Link>
          ) : (
            <Link to="/" title="3M SERVICES Accueil">
              <img src="/Asset/logo-3m-services.png" alt="3M SERVICES" className="h-9 w-auto object-contain" />
            </Link>
          )}
          {isDesktopExpanded && (
            <button
              onClick={() => setIsDesktopExpanded(false)}
              className="text-gray-400 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0 ml-1"
              aria-label="Réduire le menu"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>
        <SidebarContent compact={!isDesktopExpanded} />
      </aside>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">

        {/* Top Header */}
        <header className="h-16 lg:h-20 bg-white border-b border-gray-200 px-4 lg:px-8 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden text-gray-700 hover:text-[#E20713] p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Desktop uncollapse button */}
            {!isDesktopExpanded && (
              <button
                onClick={() => setIsDesktopExpanded(true)}
                className="hidden lg:flex text-gray-500 hover:text-[#E20713] p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
                aria-label="Agrandir le menu"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Breadcrumbs */}
            <nav className="flex items-center text-xs sm:text-sm font-medium text-gray-500 overflow-x-auto scrollbar-none gap-1">
              <Link to="/admin/dashboard" className="hover:text-gray-900 transition-colors flex items-center gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5 text-[#E20713]" />
                <span className="font-semibold text-gray-800">3M Admin</span>
              </Link>
              {pathnames.filter((p) => p !== "admin").map((value, index, arr) => {
                const to = `/admin/${arr.slice(0, index + 1).join("/")}`;
                const isLast = index === arr.length - 1;
                const titleMap = {
                  dashboard: "Tableau de Bord",
                  posts: "Voitures",
                  apartments: "Appartements",
                  submissions: "Devis & CRM",
                  settings: "Paramètres",
                  new: "Nouveau",
                };
                const title = titleMap[value] || (value.charAt(0).toUpperCase() + value.slice(1));
                return (
                  <div key={to} className="flex items-center flex-shrink-0">
                    <span className="text-gray-300 mx-1">/</span>
                    {isLast ? (
                      <span className="text-gray-900 font-bold">{title}</span>
                    ) : (
                      <Link to={to} className="hover:text-gray-900 transition-colors">
                        {title}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Quick External Link */}
          <div className="flex items-center gap-2">
            <Link
              to="/boutique"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#E20713]" />
              <span className="hidden sm:inline">Boutique Publique</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
