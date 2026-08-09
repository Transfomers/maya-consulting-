import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, FileText, FolderTree, Image as ImageIcon, Calendar, Settings } from "lucide-react";
import api from "@/lib/api";

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/posts", label: "Articles", icon: FileText },
  { path: "/admin/categories", label: "Categories", icon: FolderTree },
  { path: "/admin/media", label: "Media", icon: ImageIcon },
  { path: "/admin/events", label: "Events", icon: Calendar },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="flex min-h-screen bg-bone">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-forest/15 bg-white flex flex-col">
        <div className="p-6 border-b border-forest/15">
          <span className="font-heading text-xl font-black tracking-tight text-forest block">CAP Entrepreneurs</span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Admin</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = item.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "bg-forest text-bone" : "text-forest hover:bg-forest/5"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-forest/15">
          <p className="text-xs text-sage mb-3 truncate">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 border border-forest/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-forest hover:text-bone"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
