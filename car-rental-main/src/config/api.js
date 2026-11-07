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
