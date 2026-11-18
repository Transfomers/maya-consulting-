// 3M SERVICES - Centralized API Service Layer
import { API_BASE } from "../config/api";

/**
 * Common headers with optional admin token injection
 */
const getHeaders = (customHeaders = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...customHeaders
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("3m_admin_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

/**
 * Handle fetch response safely
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // Non-json error
    }
    const err = new Error(errorMessage);
    err.status = response.status;
    throw err;
  }

  try {
    return await response.json();
  } catch {
    return { success: true };
  }
};

export const apiService = {
  async get(endpoint) {
    const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  async post(endpoint, data = {}) {
    const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async put(endpoint, data = {}) {
    const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async patch(endpoint, data = {}) {
    const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async delete(endpoint) {
    const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

export default apiService;
