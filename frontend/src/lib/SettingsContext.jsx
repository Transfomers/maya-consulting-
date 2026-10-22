import React, { createContext, useContext, useState, useEffect } from "react";
import api from "./api";

const defaultSettings = {
  general: {
    site_name: "3M SERVICES",
    site_tagline: "Le confort de votre foyer, dans nos véhicules",
    site_description: "Catalogue Automobile 2025 - Fournisseur expérimenté de services automobiles, vente & location de véhicules et d'appartements à Yaoundé, Cameroun.",
    contact_email: "contact@3mservices.cm",
    contact_phone: "+237 6 77 00 00 00",
    address: "Yaoundé, Région du Centre, Cameroun",
  },
  branding: {
    logo_main: "/assets/logo-mark.png",
    logo_light: "/assets/logo-mark-light.png",
  }
};

const SettingsContext = createContext(defaultSettings);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await api.get("/public/settings", { timeout: 2000 });
        if (res.data && Array.isArray(res.data)) {
          const formatted = { ...defaultSettings };
          res.data.forEach(item => {
            if (!formatted[item.category]) formatted[item.category] = {};
            formatted[item.category][item.key] = item.value;
          });
          if (isMounted) setSettings(formatted);
        }
      } catch (err) {
        // Silently use default 3M Services settings
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};
