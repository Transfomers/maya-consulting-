// 3M SERVICES - CAR SELECTION STORAGE & SERVER SYNC MANAGER
import { VEHICLES as DEFAULT_VEHICLES, CATALOG_SECTIONS } from "./catalogVehicles";

const STORAGE_KEY = "3m_cars_catalogue_v4";

const getApiBase = () => {
  if (typeof window !== "undefined") {
    // When running in browser, proxy through current host /api
    return "/api/v1/vehicles";
  }
  return "http://localhost:8000/api/v1/vehicles";
};

let isSyncing = false;

// Async background sync with backend server
export const syncCarsFromServer = async () => {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const res = await fetch(getApiBase());
    if (res.ok) {
      const serverCars = await res.json();
      if (Array.isArray(serverCars) && serverCars.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverCars));
        window.dispatchEvent(new CustomEvent("3m_cars_updated", { detail: serverCars }));
        return serverCars;
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
export const getCars = () => {
  try {
    // Cleanup old legacy caches
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("3m_cars_catalogue_v1");
      localStorage.removeItem("3m_cars_catalogue_v2");
      localStorage.removeItem("3m_cars_catalogue_v3");
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Trigger non-blocking server fetch
        if (typeof window !== "undefined" && !window.__3m_server_synced) {
          window.__3m_server_synced = true;
          syncCarsFromServer();
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to read cars from localStorage, using defaults", err);
  }

  // Initialize with default 3 showcase catalog vehicles
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_VEHICLES));
  } catch (_) {}

  if (typeof window !== "undefined" && !window.__3m_server_synced) {
    window.__3m_server_synced = true;
    syncCarsFromServer();
  }

  return DEFAULT_VEHICLES;
};

export const saveCars = (cars) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
    window.dispatchEvent(new CustomEvent("3m_cars_updated", { detail: cars }));
  } catch (err) {
    console.error("Failed to save cars to localStorage", err);
  }
};

export const getCarById = (id) => {
  const cars = getCars();
  return cars.find((c) => String(c.id) === String(id) || c.slug === id);
};

export const createCar = (newCarData) => {
  const cars = getCars();
  const sectionObj = CATALOG_SECTIONS.find((s) => s.number === newCarData.section);
  const sectionTitle = sectionObj ? sectionObj.title : `SECTION ${newCarData.section || "01"}`;
  
  const id = `veh-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const slug = (newCarData.model || "vehicule")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") + `-${id.slice(-4)}`;

  const car = {
    id,
    slug,
    section: newCarData.section || "01",
    sectionTitle: newCarData.sectionTitle || sectionTitle,
    model: newCarData.model || "Nouveau Véhicule",
    brand: newCarData.brand || "Marque",
    year: parseInt(newCarData.year, 10) || new Date().getFullYear(),
    engine: newCarData.engine || "Essence",
    transmission: newCarData.transmission || "Automatique",
    seats: newCarData.seats || "5 places",
    condition: newCarData.condition || "Occasion",
    mileage: newCarData.mileage || (newCarData.condition === "Neuve" ? "0 km" : "Certifié"),
    interior: newCarData.interior || "Cuir / Tissu",
    price: newCarData.price || "Sur devis • Éligible Leasing",
    isMupocam: newCarData.isMupocam !== undefined ? Boolean(newCarData.isMupocam) : true,
    status: newCarData.status || "Disponible",
    image: newCarData.image || (newCarData.photos && newCarData.photos[0]) || "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=compress&cs=tinysrgb&w=800",
    photos: Array.isArray(newCarData.photos) && newCarData.photos.length > 0
      ? newCarData.photos
      : [newCarData.image || "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=compress&cs=tinysrgb&w=800"],
    description: newCarData.description || "Véhicule sélectionné par 3M SERVICES à Yaoundé.",
    features: Array.isArray(newCarData.features)
      ? newCarData.features
      : (newCarData.features || "").split("\n").map(f => f.trim()).filter(Boolean),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [car, ...cars];
  saveCars(updated);

  // Sync to server in production/local
  fetch(getApiBase(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(car),
  }).catch((err) => console.warn("Server vehicle save error", err));

  return car;
};

export const updateCar = (id, updatedFields) => {
  const cars = getCars();
  const index = cars.findIndex((c) => String(c.id) === String(id));
  if (index === -1) return null;

  const sectionObj = CATALOG_SECTIONS.find((s) => s.number === updatedFields.section);
  const sectionTitle = sectionObj ? sectionObj.title : cars[index].sectionTitle;

  const features = Array.isArray(updatedFields.features)
    ? updatedFields.features
    : typeof updatedFields.features === "string"
    ? updatedFields.features.split("\n").map(f => f.trim()).filter(Boolean)
    : cars[index].features;

  const primaryImage = updatedFields.image || (updatedFields.photos && updatedFields.photos[0]) || cars[index].image;
  const photos = Array.isArray(updatedFields.photos) && updatedFields.photos.length > 0
    ? updatedFields.photos
    : cars[index].photos || (primaryImage ? [primaryImage] : []);

  const updatedCar = {
    ...cars[index],
    ...updatedFields,
    image: primaryImage,
    photos,
    sectionTitle,
    features,
    updatedAt: new Date().toISOString(),
  };

  cars[index] = updatedCar;
  saveCars(cars);

  // Sync to server
  fetch(`${getApiBase()}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedCar),
  }).catch((err) => console.warn("Server vehicle update error", err));

  return updatedCar;
};

export const deleteCar = (id) => {
  const cars = getCars();
  const filtered = cars.filter((c) => String(c.id) !== String(id));
  saveCars(filtered);

  // Sync delete to server
  fetch(`${getApiBase()}/${id}`, {
    method: "DELETE",
  }).catch((err) => console.warn("Server vehicle delete error", err));

  return filtered;
};

export const resetCars = () => {
  saveCars(DEFAULT_VEHICLES);

  // Sync bulk save to server
  fetch(`${getApiBase()}/bulk-save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(DEFAULT_VEHICLES),
  }).catch((err) => console.warn("Server vehicle reset error", err));

  return DEFAULT_VEHICLES;
};
