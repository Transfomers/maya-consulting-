import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, FileText, FolderTree, Image as ImageIcon, Calendar, Settings, Inbox, ChevronRight, Menu, ChevronLeft } from "lucide-react";
import api from "@/lib/api";

const NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/posts", label: "Articles", icon: FileText },
  { path: "/admin/categories", label: "Categories", icon: FolderTree },
  { path: "/admin/media", label: "Media", icon: ImageIcon },
  { path: "/admin/events", label: "Events", icon: Calendar },
  { path: "/admin/submissions", label: "Submissions", icon: Inbox },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Breadcrumbs generation
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <div className="flex h-screen overflow-hidden bg-bone">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? "w-64" : "w-20"} flex-shrink-0 border-r border-forest/15 bg-white flex flex-col transition-all duration-300 z-20`}>
        <div className={`p-6 border-b border-forest/15 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} h-20`}>
          {isSidebarOpen && (
            <div>
              <span className="font-heading text-xl font-black tracking-tight text-forest block truncate">CAP Admin</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-forest hover:text-maple transition-colors flex-shrink-0" aria-label="Toggle Sidebar">
            {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
          <ul className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = item.path === "/admin/dashboard"
                ? location.pathname === "/admin/dashboard"
                : location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-forest text-bone" : "text-forest hover:bg-forest/5"
                    }`}
                    title={!isSidebarOpen ? item.label : ""}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-forest/15">
          {isSidebarOpen && <p className="text-xs text-sage mb-3 truncate">{user?.email}</p>}
          <button
            onClick={handleLogout}
            className={`flex w-full items-center ${isSidebarOpen ? 'justify-center' : 'justify-center'} gap-2 border border-forest/25 px-2 py-2 text-xs font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-forest hover:text-bone`}
            title={!isSidebarOpen ? "Logout" : ""}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" /> 
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header with Breadcrumbs */}
        <header className="h-20 bg-white border-b border-forest/15 px-8 flex items-center shrink-0">
          <nav className="flex items-center text-sm font-medium text-forest/70">
            {pathnames.map((value, index) => {
              const to = `/${pathnames.slice(0, index + 1).join("/")}`;
              const isLast = index === pathnames.length - 1;
              const title = value.charAt(0).toUpperCase() + value.slice(1);
              return (
                <div key={to} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 mx-2 opacity-50" />}
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
        <div className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
