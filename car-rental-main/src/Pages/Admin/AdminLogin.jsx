import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../../images/logo/logo.png";
import "./admin.css";

const API_BASE = "http://localhost:5001/api";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect directly to /admin
    const token = localStorage.getItem("3m_admin_token");
    if (token) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Identifiants invalides");
      }

      // Save token and user info
      localStorage.setItem("3m_admin_token", data.token);
      localStorage.setItem("3m_admin_user", JSON.stringify(data.user));

      navigate("/admin");
    } catch (err) {
      setError(err.message || "Impossible de contacter le serveur d'administration.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("admin@3mservices.cm");
    setPassword("admin3m2026");
    setError("");
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <img src={Logo} alt="3M SERVICES Logo" className="admin-login-logo" />

        <div className="admin-login-header">
          <h1>Espace Administrateur</h1>
          <p>Gestion de la flotte & des réservations 3M SERVICES</p>
        </div>

        {error && <div className="admin-login-error">⚠️ {error}</div>}

        <form onSubmit={handleLogin}>
          <div className="admin-form-group">
            <label htmlFor="admin-email">Adresse Email</label>
            <input
              id="admin-email"
              type="email"
              required
              placeholder="admin@3mservices.cm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="admin-password">Mot de passe</label>
            <input
              id="admin-password"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter à la console"}
          </button>
        </form>

        <div className="admin-demo-hint">
          <strong>💡 Identifiants d'accès 3M SERVICES :</strong>
          <div>Email : <code>admin@3mservices.cm</code></div>
          <div>Mot de passe : <code>admin3m2026</code></div>
          <button
            type="button"
            className="admin-demo-fill-btn"
            onClick={fillDemoCredentials}
          >
            ⚡ Remplir automatiquement
          </button>
        </div>

        <div>
          <Link to="/" className="admin-back-to-site">
            ← Retour au site public 3M SERVICES
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

