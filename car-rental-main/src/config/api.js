// Configuration centralisée de l'API 3M SERVICES
// En développement local : http://localhost:5001/api
// En production (3mservice.shop) : /api (proxy Nginx vers le backend)
export const getApiBase = () => {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:5001/api";
    }
    return "/api";
  }
  return "http://localhost:5001/api";
};

export const API_BASE = getApiBase();
export default API_BASE;


// WebApp Flask (admin) pour les appels publics : REACT_APP_FLASK_URL au build, port 5002 en local.
export const FLASK_PUBLIC_URL = (() => {
  if (process.env.REACT_APP_FLASK_URL) return process.env.REACT_APP_FLASK_URL.replace(/\/$/, "");
  if (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return "http://127.0.0.1:5002";
  }
  return ""; // non configuré : les appels Flask optionnels sont ignorés
})();
