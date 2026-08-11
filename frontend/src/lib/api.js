import axios from "axios";

const backendUrl = process.env.REACT_APP_BACKEND_URL !== undefined 
  ? process.env.REACT_APP_BACKEND_URL 
  : "http://localhost:8000";

const api = axios.create({
  baseURL: `${backendUrl}/api/v1`,
  withCredentials: true,
});

export default api;
