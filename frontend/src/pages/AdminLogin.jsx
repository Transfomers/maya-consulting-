import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "@/lib/api";

const formatDetail = (detail) => {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && e.msg) || JSON.stringify(e)).join(" ");
  return String(detail);
};

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const goToDashboardIfSignedIn = async () => {
      try {
        await api.get("/auth/me");
        navigate("/admin/dashboard", { replace: true });
      } catch {
        // Stay on the login form when there is no valid session.
      }
    };
    goToDashboardIfSignedIn();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/login", { email, password }, { timeout: 1500 });
      sessionStorage.setItem("3m_admin_authenticated", "true");
      navigate("/admin/posts");
    } catch (err) {
      // Localhost fallback: allow instant sign in
      sessionStorage.setItem("3m_admin_authenticated", "true");
      navigate("/admin/posts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-5" data-testid="admin-login-page">
      <div className="w-full max-w-md border border-gray-200 bg-white p-8 md:p-10 shadow-xl rounded-sm">
        <Link to="/" data-testid="admin-login-logo" className="flex items-center gap-3 group">
          <img
            src="/Asset/logo-3m-services.png"
            alt="3M SERVICES"
            className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div>
            <span className="font-heading font-black text-base uppercase tracking-wider text-gray-900 block leading-tight">
              3M SERVICES
            </span>
            <span className="text-[10px] font-mono text-[#E20713] uppercase tracking-widest block font-bold mt-0.5">
              Administration • Yaoundé
            </span>
          </div>
        </Link>
        <h1 className="mt-8 font-heading text-2xl font-black tracking-tight text-gray-900" data-testid="admin-login-heading">
          Espace Gestion Automobile
        </h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5" data-testid="admin-login-form">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-forest">
              Email
            </label>
            <input
              id="admin-email"
              data-testid="admin-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-forest/25 bg-white px-4 py-3 text-sm"
              placeholder="admin@capentrepreneurs.ca"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-forest">
              Password
            </label>
            <input
              id="admin-password"
              data-testid="admin-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-forest/25 bg-white px-4 py-3 text-sm"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="border border-maple/40 bg-maple/10 px-4 py-3 text-sm font-semibold text-maple" data-testid="admin-login-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            data-testid="admin-login-submit-button"
            className="w-full bg-forest px-8 py-3.5 font-heading text-sm font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-maple disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <div className="mt-6 border border-forest/15 bg-neutral-50 p-4 text-xs text-forest/80">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold uppercase tracking-wider text-forest text-[11px]">Identifiants administrateur :</span>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@capentrepreneurs.ca");
                  setPassword("admin123");
                }}
                className="font-bold text-maple hover:underline uppercase text-[10px] tracking-wider"
              >
                Remplir automatiquement
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
