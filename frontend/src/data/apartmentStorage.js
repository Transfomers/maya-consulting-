// 3M SERVICES - APARTMENTS STORAGE & SERVER SYNC MANAGER
import { APARTMENTS as DEFAULT_APARTMENTS } from "./catalogVehicles";

const STORAGE_KEY = "3m_apartments_catalogue_v4";

const getApiBase = () => {
  if (typeof window !== "undefined") {
    return "/api/v1/apartments";
  }
  return "http://localhost:8000/api/v1/apartments";
};

let isSyncing = false;

// Async background sync with backend server
export const syncApartmentsFromServer = async () => {
  if (isSyncing) return null;
  isSyncing = true;
  try {
    const res = await fetch(getApiBase());
    if (res.ok) {
      const serverApts = await res.json();
      if (Array.isArray(serverApts) && serverApts.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverApts));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("3m_apartments_updated", { detail: serverApts }));
        }
        return serverApts;
      }
    }
  } catch (err) {
    // Quiet fallback to local cache
  } finally {
    isSyncing = false;
  }
  return null;
};

// Immediate read from localStorage or default catalogue
export const getApartments = () => {
  try {
    // Cleanup old legacy caches
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("3m_apartments_catalogue_v1");
      localStorage.removeItem("3m_apartments_catalogue_v2");
      localStorage.removeItem("3m_apartments_catalogue_v3");
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof window !== "undefined" && !window.__3m_apartments_synced) {
          window.__3m_apartments_synced = true;
          syncApartmentsFromServer();
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to read apartments from localStorage", err);
  }

  // Initialize with defaults (3 apartments)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_APARTMENTS));
  } catch (_) {}

  if (typeof window !== "undefined" && !window.__3m_apartments_synced) {
    window.__3m_apartments_synced = true;
    syncApartmentsFromServer();
  }

  return DEFAULT_APARTMENTS;
};

// Save (create or update) single apartment
export const saveApartment = async (apartment) => {
  const current = getApartments();
  let updated;
  const aptId = apartment.id || `apt-${Date.now()}`;
  const prepared = { ...apartment, id: aptId };

  const idx = current.findIndex((a) => String(a.id) === String(aptId));
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = prepared;
  } else {
    updated = [prepared, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("3m_apartments_updated", { detail: updated }));
  } catch (err) {
    console.error("LocalStorage write error", err);
  }

  // Push to server
  try {
    await fetch(getApiBase(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prepared),
    });
  } catch (err) {
    console.warn("Server sync error (saved locally):", err);
  }

  return prepared;
};

// Delete single apartment
export const deleteApartment = async (aptId) => {
  const current = getApartments();
  const updated = current.filter((a) => String(a.id) !== String(aptId));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("3m_apartments_updated", { detail: updated }));
  } catch (err) {
    console.error("LocalStorage write error", err);
  }

  try {
    await fetch(`${getApiBase()}/${aptId}`, { method: "DELETE" });
  } catch (err) {
    console.warn("Server delete error:", err);
  }

  return updated;
};

// Subscribe to apartments change events
export const subscribeApartments = (callback) => {
  if (typeof window === "undefined") return () => {};
  const handler = (e) => {
    callback(e.detail || getApartments());
  };
  window.addEventListener("3m_apartments_updated", handler);
  return () => window.removeEventListener("3m_apartments_updated", handler);
};
