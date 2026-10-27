import React, { createContext, useContext, useState, useEffect } from "react";
import api from "./api";

const defaultSettings = {
  general: {
    site_name: "3M SERVICES",
    site_tagline: "Le confort de votre foyer, dans nos véhicules",
    site_description: "Catalogue Automobile 2025 - Fournisseur expérimenté de services automobiles, vente & location de véhicules et d'appartements à Yaoundé, Cameroun.",
    contact_email: "contact@3mservice.shop",
    contact_phone: "+237 691 78 64 47",
    contact_whatsapp: "237691786447",
    address: "Nouvelle route - OMNISPORTS, Yaoundé, Cameroun",
  },
  branding: {
    logo_main: "/Asset/logo-3m-services.png",
    logo_light: "/Asset/logo-3m-services.png",
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
            let val = item.value;
            if (typeof val === "string" && val.toLowerCase().includes("capentrepreneurs")) {
              val = val.replace(/capentrepreneurs\.org/gi, "3mservice.shop");
            }
            if (typeof val === "string" && val.toLowerCase().includes("cap")) {
              val = "3M SERVICES";
            }
            formatted[item.category][item.key] = val;
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
