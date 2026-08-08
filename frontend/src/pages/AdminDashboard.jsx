import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Inbox } from "lucide-react";
import api from "@/lib/api";

const TYPES = [
  { key: "all", label: "All" },
  { key: "application", label: "Program Applications" },
  { key: "membership", label: "Membership" },
  { key: "pledge", label: "Pledges" },
  { key: "partner", label: "Partners" },
  { key: "volunteer", label: "Volunteers" },
  { key: "contact", label: "Contact" },
];

const TYPE_BADGE = {
  application: "bg-forest text-bone",
  membership: "bg-maple text-bone",
  pledge: "bg-[#8F65DD] text-bone",
  partner: "bg-[#4CA743] text-bone",
  volunteer: "bg-[#0D0E0D] text-bone",
  contact: "bg-sage text-bone",
};

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.get("/auth/me");
        setUser(me.data);
        const res = await api.get("/admin/submissions");
        setSubmissions(res.data.submissions || []);
      } catch (err) {
        navigate("/admin/login");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const filtered = useMemo(
    () => (tab === "all" ? submissions : submissions.filter((s) => s.type === tab)),
    [tab, submissions]
  );

  const counts = useMemo(() => {
    const c = {};
    submissions.forEach((s) => {
      c[s.type] = (c[s.type] || 0) + 1;
    });
    return c;
  }, [submissions]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      navigate("/admin/login");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bone" data-testid="admin-loading">
        <span className="font-heading text-sm font-bold uppercase tracking-[0.25em] text-sage">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone" data-testid="admin-dashboard">
      <header className="border-b border-forest/15 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4 md:px-10">
          <div>
            <span className="font-heading text-xl font-black tracking-tight text-forest">CAP Entrepreneurs</span>
            <span className="ml-3 text-xs font-bold uppercase tracking-[0.2em] text-sage">Admin</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden text-sm text-sage sm:block" data-testid="admin-user-email">{user?.email}</span>
            <button
              onClick={handleLogout}
              data-testid="admin-logout-button"
              className="flex items-center gap-2 border border-forest/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-forest transition-colors hover:bg-forest hover:text-bone"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10">
        <div className="flex flex-wrap gap-2 border-b border-forest/15 pb-5" data-testid="admin-tabs">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-testid={`admin-tab-${t.key}`}
              className={`border px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                tab === t.key
                  ? "border-forest bg-forest text-bone"
                  : "border-forest/25 bg-white text-forest hover:border-forest"
              }`}
            >
              {t.label}
              <span className="ml-2 opacity-60">
                {t.key === "all" ? submissions.length : counts[t.key] || 0}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center" data-testid="admin-empty-state">
            <Inbox className="h-10 w-10 text-sage/50" strokeWidth={1.5} />
            <p className="text-sm text-sage">No submissions yet in this category.</p>
          </div>
        ) : (
          <div className="divide-y divide-forest/10 border-b border-forest/15" data-testid="admin-submissions-list">
            {filtered.map((s) => (
              <div key={s.id} className="grid gap-3 py-5 md:grid-cols-12" data-testid={`admin-submission-${s.id}`}>
                <div className="md:col-span-2">
                  <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${TYPE_BADGE[s.type] || "bg-sage text-bone"}`}>
                    {s.type}
                  </span>
                  <p className="mt-2 text-[11px] text-sage">
                    {new Date(s.created_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="md:col-span-3">
                  <p className="text-sm font-bold text-forest">{s.payload?.name}</p>
                  <p className="text-sm text-sage">{s.payload?.email}</p>
                </div>
                <div className="md:col-span-7">
                  <dl className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                    {Object.entries(s.payload || {})
                      .filter(([k]) => !["name", "email"].includes(k))
                      .map(([k, v]) => (
                        <div key={k} className="text-sm">
                          <dt className="inline text-[11px] font-bold uppercase tracking-[0.12em] text-sage">{k}: </dt>
                          <dd className="inline text-ink">{String(v) || "—"}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
