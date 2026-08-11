import React, { createContext, useContext, useState, useEffect } from "react";
import api from "./api";

const SettingsContext = createContext(null);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/public/settings");
        const formatted = {};
        res.data.forEach(item => {
          if (!formatted[item.category]) formatted[item.category] = {};
          formatted[item.category][item.key] = item.value;
        });
        setSettings(formatted);
      } catch (err) {
        console.error("Failed to load public settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) return null;

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
};
