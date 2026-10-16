import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import {
  LogOut, LayoutDashboard, FileText, FolderTree,
  Image as ImageIcon, Calendar, Settings, Inbox,
  ChevronRight, Menu, ChevronLeft, X, BookOpen, Mail
} from "lucide-react";
import api from "@/lib/api";

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/posts", label: "Articles", icon: FileText },
  { path: "/admin/newsletter", label: "Infolettre", icon: Mail },
  { path: "/admin/categories", label: "Categories", icon: FolderTree },
  { path: "/admin/resources", label: "Ressources & Cours", icon: BookOpen },
  { path: "/admin/media", label: "Media", icon: ImageIcon },
  { path: "/admin/events", label: "Events", icon: Calendar },
  { path: "/admin/submissions", label: "Submissions", icon: Inbox },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
      try {
        const me = await api.get("/auth/me");
        setUser(me.data);
      } catch (err) {
        navigate("/admin/login");
      } finally {
        setLoading(false);
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
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.path === "/admin/dashboard"
              ? location.pathname === "/admin/dashboard"
              : location.pathname.startsWith(item.path);
            const isSubmissions = item.path === "/admin/submissions";

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-forest text-bone" : "text-forest hover:bg-[#701EF8]/10 hover:text-[#701EF8]"
                  }`}
                  title={compact ? item.label : ""}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!compact && <span className="truncate">{item.label}</span>}
                  </div>
                  {!compact && isSubmissions && newSubmissionsCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#701EF8] text-white rounded-none">
                      {newSubmissionsCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-forest/15">
        {!compact && <p className="text-xs text-sage mb-3 truncate">{user?.email}</p>}
        <button
          onClick={handleLogout}
          className={`flex w-full items-center justify-center gap-2 border border-forest/25 px-2 py-2 text-xs font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-forest hover:text-bone`}
          title={compact ? "Logout" : ""}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!compact && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-bone">

      {/* ── Mobile sidebar overlay ─────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 w-72 bg-white border-r border-forest/15 flex flex-col
          transform transition-transform duration-300
          lg:hidden
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-5 border-b border-forest/15 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <img src="/assets/logo-mark.png" alt="CAP" className="h-7 w-auto" />
            <span className="font-heading text-lg font-black tracking-tight text-forest">CAP Admin</span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="text-forest hover:text-[#701EF8]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent compact={false} />
      </aside>

      {/* ── Desktop sidebar ────────────────────────────────────── */}
      <aside
        className={`
          hidden lg:flex flex-col flex-shrink-0
          ${isDesktopExpanded ? "w-64" : "w-20"}
          border-r border-forest/15 bg-white transition-all duration-300 z-20
        `}
      >
        <div className={`p-6 border-b border-forest/15 flex items-center ${isDesktopExpanded ? 'justify-between' : 'justify-center'} h-20`}>
          {isDesktopExpanded && (
            <div className="flex items-center gap-2.5 min-w-0">
              <img src="/assets/logo-mark.png" alt="CAP" className="h-8 w-auto flex-shrink-0" />
              <span className="font-heading text-lg font-black tracking-tight text-forest block truncate">CAP Admin</span>
            </div>
          )}
          <button
            onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
            className="text-forest hover:text-[#701EF8] transition-colors flex-shrink-0"
            aria-label="Toggle Sidebar"
          >
            {isDesktopExpanded ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        <SidebarContent compact={!isDesktopExpanded} />
      </aside>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative min-w-0">

        {/* Top Header */}
        <header className="h-16 lg:h-20 bg-white border-b border-forest/15 px-4 lg:px-8 flex items-center gap-4 shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden text-forest hover:text-maple flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center text-sm font-medium text-forest/70 overflow-x-auto scrollbar-none gap-0 flex-1">
            {pathnames.map((value, index) => {
              const to = `/${pathnames.slice(0, index + 1).join("/")}`;
              const isLast = index === pathnames.length - 1;
              const title = value.charAt(0).toUpperCase() + value.slice(1);
              return (
                <div key={to} className="flex items-center flex-shrink-0">
                  {index > 0 && <ChevronRight className="h-4 w-4 mx-2 opacity-50 flex-shrink-0" />}
                  {isLast ? (
                    <span className="text-forest font-bold">{title}</span>
                  ) : (
                    <Link to={to} className="hover:text-maple transition-colors">
                      {title}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
