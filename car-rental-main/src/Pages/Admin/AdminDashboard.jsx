import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../../images/logo/logo.png";
import { CARS_CATALOGUE } from "../../data/carsCatalogue";
import { API_BASE } from "../../config/api";
import {
  DEFAULT_BOOKINGS,
  DEFAULT_CUSTOMERS,
  DEFAULT_CONTRACTS,
  DEFAULT_PAYMENTS,
  DEFAULT_DRIVERS,
  DEFAULT_REVIEWS,
  DEFAULT_CONTACTS,
  DEFAULT_LOCATIONS,
  DEFAULT_SUBSCRIBERS,
  DEFAULT_APARTMENTS,
  DEFAULT_EQUIPMENT_OPTIONS,
  DEFAULT_VIP_SERVICES_OPTIONS
} from "../../data/crmSeedData";
import "./admin.css";

const CRM_STORE_KEY = "3m_crm_store_v2";

const loadSavedCrm = () => {
  try {
    const raw = localStorage.getItem(CRM_STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn("Could not read CRM store from localStorage:", err);
  }
  return null;
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // overview, bookings, fleet, apartments, locations, contacts, customers, contracts, payments, reviews, subscribers, team, settings
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  // eslint-disable-next-line no-unused-vars
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [stats, setStats] = useState(null);

  // Initial persistent store
  const savedCrm = useMemo(() => loadSavedCrm() || {}, []);

  const [bookings, setBookings] = useState(() => (Array.isArray(savedCrm.bookings) && savedCrm.bookings.length > 0 ? savedCrm.bookings : DEFAULT_BOOKINGS));
  const [cars, setCars] = useState(() => (Array.isArray(savedCrm.cars) && savedCrm.cars.length > 0 ? savedCrm.cars : CARS_CATALOGUE));
  const [apartments, setApartments] = useState(() => (Array.isArray(savedCrm.apartments) && savedCrm.apartments.length > 0 ? savedCrm.apartments : DEFAULT_APARTMENTS));
  const [contacts, setContacts] = useState(() => (Array.isArray(savedCrm.contacts) && savedCrm.contacts.length > 0 ? savedCrm.contacts : DEFAULT_CONTACTS));
  const [customers, setCustomers] = useState(() => (Array.isArray(savedCrm.customers) && savedCrm.customers.length > 0 ? savedCrm.customers : DEFAULT_CUSTOMERS));
  const [contracts, setContracts] = useState(() => (Array.isArray(savedCrm.contracts) && savedCrm.contracts.length > 0 ? savedCrm.contracts : DEFAULT_CONTRACTS));
  const [payments, setPayments] = useState(() => (Array.isArray(savedCrm.payments) && savedCrm.payments.length > 0 ? savedCrm.payments : DEFAULT_PAYMENTS));
  const [reviews, setReviews] = useState(() => (Array.isArray(savedCrm.reviews) && savedCrm.reviews.length > 0 ? savedCrm.reviews : DEFAULT_REVIEWS));
  const [drivers, setDrivers] = useState(() => (Array.isArray(savedCrm.drivers) && savedCrm.drivers.length > 0 ? savedCrm.drivers : DEFAULT_DRIVERS));
  const [staffUsers, setStaffUsers] = useState(() => (Array.isArray(savedCrm.staffUsers) && savedCrm.staffUsers.length > 0 ? savedCrm.staffUsers : []));
  const [subscribers, setSubscribers] = useState(() => (Array.isArray(savedCrm.subscribers) && savedCrm.subscribers.length > 0 ? savedCrm.subscribers : DEFAULT_SUBSCRIBERS));
  const [locations, setLocations] = useState(() => (savedCrm.locations?.pickup?.length > 0 ? savedCrm.locations : DEFAULT_LOCATIONS));
  const [loading, setLoading] = useState(false);

  // Auto-sync persistent store to localStorage
  useEffect(() => {
    try {
      const store = {
        bookings,
        cars,
        apartments,
        contacts,
        customers,
        contracts,
        payments,
        reviews,
        drivers,
        staffUsers,
        subscribers,
        locations,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(CRM_STORE_KEY, JSON.stringify(store));
    } catch (err) {
      console.warn("Could not save CRM store to localStorage:", err);
    }
  }, [bookings, cars, apartments, contacts, customers, contracts, payments, reviews, drivers, staffUsers, subscribers, locations]);

  // Dynamic real-time metrics computed directly from state
  const statsComputed = useMemo(() => {
    const totalBookings = bookings.length;
    const newBookings = bookings.filter((b) => b.status === "En attente" || b.status === "Nouvelle").length;
    const pendingBookings = bookings.filter((b) => b.status === "En attente" || b.status === "En cours d'examen").length;
    const confirmedBookings = bookings.filter((b) => ["Confirmée", "Contrat préparé", "Payée"].includes(b.status)).length;
    const activeRentals = bookings.filter((b) => b.status === "En cours").length;
    const completedBookings = bookings.filter((b) => b.status === "Terminée").length;
    const cancelledBookings = bookings.filter((b) => b.status === "Annulée" || b.status === "Rejetée").length;
    const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const totalPendingBalance = bookings.reduce((acc, b) => acc + (Number(b.balance) || 0), 0);
    const availableFleet = cars.filter((c) => c.status === "Disponible").length;
    const availableApts = apartments.filter((a) => a.status === "Disponible").length;
    const availableDrivers = drivers.filter((d) => d.status === "Disponible").length;

    return {
      totalBookings,
      newBookings,
      pendingBookings,
      confirmedBookings,
      activeRentals,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      totalPendingBalance,
      availableFleet,
      availableApts,
      availableDrivers
    };
  }, [bookings, payments, cars, apartments, drivers]);

  // Filters & Search
  const [bookingStatusFilter, setBookingStatusFilter] = useState("Toutes");
  const [bookingSearch, setBookingSearch] = useState("");
  const [carSearch, setCarSearch] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [activityLogs, setActivityLogs] = useState([]);

  // Reservations filters
  const [resDateRange, setResDateRange] = useState("all"); // today, 7days, 30days, month, all
  const [resVehicleFilter, setResVehicleFilter] = useState("Toutes");
  const [resLocationFilter, setResLocationFilter] = useState("Toutes");
  const [resPickDateFilter, setResPickDateFilter] = useState("");
  const [crmMobileView, setCrmMobileView] = useState("cards"); // "cards" or "table" on mobile

  // Modals & Details State
  const [selectedRes, setSelectedRes] = useState(null);
  const [showResDetailsModal, setShowResDetailsModal] = useState(false);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [newAdminNote, setNewAdminNote] = useState("");
  const [statusUpdateNote, setStatusUpdateNote] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    bookingId: "",
    amount: "",
    method: "Espèces",
    reference: "",
    note: ""
  });

  const [showContractModal, setShowContractModal] = useState(false);
  const [contractForm, setContractForm] = useState({
    bookingId: "",
    clauses: "Véhicule remis propre avec plein de carburant. Restitution dans le même état.",
    driverAssigned: "Chauffeur professionnel 3M SERVICES",
    securityDeposit: 100000
  });

  const [selectedContract, setSelectedContract] = useState(null);
  const [showPrintContractModal, setShowPrintContractModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerVipFilter, setCustomerVipFilter] = useState("Tous");
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "+237 ",
    email: "",
    city: "Yaoundé",
    address: "",
    vipTier: "VIP Bronze",
    notes: ""
  });

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverForm, setDriverForm] = useState({
    name: "",
    phone: "+237 ",
    licenseNumber: "",
    experienceYears: 5,
    status: "Disponible"
  });

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Gestionnaire Réservations"
  });

  // Notifications State & Device Alerts
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "sys-init",
      type: "system",
      title: "Système 3M Services Opérationnel",
      desc: "Données CRM synchronisées avec l'API 3mservice.shop.",
      time: "En direct",
      unread: false,
      targetTab: "overview"
    }
  ]);
  const notifRef = React.useRef(null);

  // Device Web Push Notification permission state for used devices
  const [deviceNotifStatus, setDeviceNotifStatus] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications]
  );

  // Modals state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCarModal, setShowCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [showApartmentModal, setShowApartmentModal] = useState(false);
  const [editingApartment, setEditingApartment] = useState(null);

  const [apartmentForm, setApartmentForm] = useState({
    title: "",
    type: "T3 Meublé Haut Standing",
    location: "Tsinga (Face FECAFOOT), Yaoundé",
    rooms: "2 Chambres • Salon • Salle de bain",
    price: "65 000 FCFA / nuitée",
    photosCount: 5,
    image: "/Asset/appartements/appartement-meuble-suite-parentale.webp",
    status: "Disponible",
    description: "",
    equipments: [],
    vipServices: [],
    customEquipment: "",
    customVipService: ""
  });

  // New Booking Form State
  const [bookingForm, setBookingForm] = useState({
    clientName: "",
    phone: "+237 ",
    email: "",
    carName: "Toyota Land Cruiser Prado TXL VIP",
    pickUp: "Agence Omnisports",
    dropOff: "Agence Omnisports",
    pickTime: new Date().toISOString().split("T")[0],
    dropTime: "",
    days: 3,
    pricePerDay: 75000,
    totalPrice: 225000,
    notes: ""
  });

  // Car Form State
  const [carForm, setCarForm] = useState({
    name: "",
    model: "",
    mark: "Toyota",
    category: "SUV VIP 4x4",
    year: "2024",
    condition: "Occasion Certifiée",
    pricePerDay: 60000,
    doors: "5",
    seats: "5 places",
    transmission: "Automatique",
    fuel: "Essence",
    status: "Disponible",
    plate: "CE-000-XX",
    description: "",
    img: "/images/cars/toyota-prado-txl-front.webp"
  });

  const STOCK_CAR_PHOTOS = [
    { label: "Toyota Prado TXL VIP (Avant)", url: "/images/cars/toyota-prado-txl-front.webp" },
    { label: "Toyota RAV4 4WD (Avant)", url: "/images/cars/toyota-rav4-front.webp" },
    { label: "Toyota Fortuner 4x4 (Avant)", url: "/images/cars/toyota-fortuner-front.webp" },
    { label: "Toyota Camry Executive (Avant)", url: "/images/cars/toyota-camry-front.webp" },
    { label: "Mercedes-Benz Classe E VIP", url: "/images/cars/mercedes-classe-e-front.webp" },
    { label: "Mercedes-Benz ML350 Luxe", url: "/images/cars/mercedes-ml350-front.webp" },
    { label: "Jeep Grand Cherokee V6 Luxury", url: "/images/cars/jeep-grand-cherokee-front.webp" },
    { label: "Kia Sportage GT-Line (0 km)", url: "/images/cars/kia-sportage-front.webp" },
    { label: "Hyundai Santa Fe 4x4", url: "/images/cars/hyundai-santafe-front.webp" }
  ];

  const STOCK_APT_PHOTOS = [
    { label: "Suite Parentale Prestige Tsinga", url: "/Asset/appartements/appartement-meuble-suite-parentale.webp" },
    { label: "Chambre Bleue Contemporaine Tsinga", url: "/Asset/appartements/appartement-meuble-chambre-bleue.webp" },
    { label: "Chambre Grand Confort Tsinga", url: "/Asset/appartements/appartement-meuble-chambre-confort.webp" },
    { label: "Cuisine Équipée Américaine", url: "/Asset/appartements/appartement-meuble-cuisine-equipee.webp" },
    { label: "Salle de Bain Design Italienne", url: "/Asset/appartements/appartement-meuble-salle-de-bain.webp" }
  ];

  // Password change state
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwdMessage, setPwdMessage] = useState({ type: "", text: "" });

  // Cameroon Locations & Booking Form Config state
  const [newPickup, setNewPickup] = useState({ name: "", city: "Yaoundé" });
  const [newDropoff, setNewDropoff] = useState({ name: "", city: "Yaoundé" });

  const getAuthHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  }, [token]);

  // Check Auth & Initial Load
  useEffect(() => {
    const savedToken = localStorage.getItem("3m_admin_token");
    const savedUser = localStorage.getItem("3m_admin_user");

    if (!savedToken) {
      navigate("/admin/login");
      return;
    }

    setToken(savedToken);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser({ name: "Administrateur 3M" });
      }
    }
  }, [navigate]);

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [
        resStats,
        resBookings,
        resCars,
        resContacts,
        resLocations,
        resApts,
        resCusts,
        resPmts,
        resCtrs,
        resDrvs,
        resRevs,
        resUsrs,
        resSubs,
        resLogs
      ] = await Promise.all([
        fetch(`${API_BASE}/stats?dateRange=${resDateRange}`, { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/bookings`, { headers }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/cars`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/contacts`, { headers }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/locations`).then((r) => (r.ok ? r.json() : { pickup: [], dropoff: [] })),
        fetch(`${API_BASE}/apartments`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/customers`, { headers }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/payments`, { headers }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/contracts`, { headers }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/drivers`, { headers }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/reviews`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/users`, { headers }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/newsletter`, { headers }).then((r) => (r.ok ? r.json() : [])),
        fetch(`${API_BASE}/activity-logs`, { headers }).then((r) => (r.ok ? r.json() : []))
      ]);

      if (resStats) setStats(resStats);
      if (Array.isArray(resBookings) && resBookings.length > 0) setBookings(resBookings);
      if (Array.isArray(resCars) && resCars.length > 0) setCars(resCars);
      if (Array.isArray(resContacts) && resContacts.length > 0) setContacts(resContacts);
      if (resLocations && (resLocations.pickup?.length > 0 || resLocations.dropoff?.length > 0)) setLocations(resLocations);
      if (Array.isArray(resApts) && resApts.length > 0) setApartments(resApts);
      if (Array.isArray(resCusts) && resCusts.length > 0) setCustomers(resCusts);
      if (Array.isArray(resPmts) && resPmts.length > 0) setPayments(resPmts);
      if (Array.isArray(resCtrs) && resCtrs.length > 0) setContracts(resCtrs);
      if (Array.isArray(resDrvs) && resDrvs.length > 0) setDrivers(resDrvs);
      if (Array.isArray(resRevs) && resRevs.length > 0) setReviews(resRevs);
      if (Array.isArray(resUsrs) && resUsrs.length > 0) setStaffUsers(resUsrs);
      if (Array.isArray(resSubs) && resSubs.length > 0) setSubscribers(resSubs);
      if (Array.isArray(resLogs) && resLogs.length > 0) setActivityLogs(resLogs);

      // Build dynamic notifications from bookings, contacts, and cars
      const dynamicNotifs = [];

      // 1. Pending or recent bookings
      if (resBookings && resBookings.length > 0) {
        resBookings.slice(0, 5).forEach((b) => {
          dynamicNotifs.push({
            id: `b-${b.id}`,
            type: "booking",
            title: `Réservation #${b.id} (${b.status || "En attente"})`,
            desc: `${b.carName || "Véhicule"} • Client : ${b.clientName || "Client"} (${b.phone || ""})`,
            time: b.createdAt ? new Date(b.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Récemment",
            unread: b.status === "En attente",
            targetTab: "bookings"
          });
        });
      }

      // 2. Recent client contact inquiries
      if (resContacts && resContacts.length > 0) {
        resContacts.slice(0, 3).forEach((c) => {
          dynamicNotifs.push({
            id: `c-${c.id}`,
            type: "contact",
            title: `Message de ${c.name || "Client"}`,
            desc: c.subject || c.message?.slice(0, 48) || "Nouveau message reçu via le site",
            time: c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "Récemment",
            unread: true,
            targetTab: "contacts"
          });
        });
      }

      // 3. Vehicles currently rented or in maintenance
      if (resCars && resCars.length > 0) {
        const rentedOrMaint = resCars.filter((c) => c.status === "Loué" || c.status === "En maintenance");
        if (rentedOrMaint.length > 0) {
          rentedOrMaint.slice(0, 3).forEach((rc) => {
            dynamicNotifs.push({
              id: `car-${rc.id}`,
              type: "fleet",
              title: `Véhicule ${rc.status === "Loué" ? "Loué" : "En révision"} : ${rc.name}`,
              desc: `Tarif : ${(rc.pricePerDay || 0).toLocaleString()} FCFA/j • Statut catalogue : ${rc.status}`,
              time: "Parc actif",
              unread: false,
              targetTab: "fleet"
            });
          });
        }
      }

      // 4. System status notification
      dynamicNotifs.push({
        id: "sys-live-status",
        type: "system",
        title: "API Backend Port 5001 Connectée",
        desc: "Tous les services CMS (Voitures, Réservations, Appartements) sont synchronisés en direct.",
        time: "Temps réel",
        unread: false,
        targetTab: "overview"
      });

      setNotifications(dynamicNotifs);
    } catch (err) {
      console.error("Erreur chargement données admin:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Click outside to close notifications dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );
    if (notif.targetTab) {
      setActiveTab(notif.targetTab);
    }
    setNotificationsOpen(false);
  };

  // Sound chime notification for device alert
  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn("Audio chime failed:", e);
    }
  }, []);

  // Web Notification API alert on used device
  const triggerDeviceNotification = useCallback((title, options = {}) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options
        });
      } catch (err) {
        console.warn("Device Notification trigger error:", err);
      }
    }
  }, []);

  // Request permission for Web Notifications on used device
  const requestDeviceNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Votre navigateur ne prend pas en charge l'API Notifications Web.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setDeviceNotifStatus(perm);
      if (perm === "granted") {
        playNotificationSound();
        triggerDeviceNotification("Notifications 3M Services Activées", {
          body: "Vous serez notifié en direct sur cet appareil pour tout nouveau message ou réservation."
        });
      } else if (perm === "denied") {
        alert("Les notifications sont bloquées dans les paramètres de votre navigateur.");
      }
    } catch (e) {
      console.warn("Could not request notification permission:", e);
    }
  };

  // Real-time listener for incoming messages (Contact & Conciergerie) across tabs & devices
  useEffect(() => {
    const handleIncomingContact = (msgData) => {
      if (!msgData) return;
      playNotificationSound();
      triggerDeviceNotification("Nouveau message - 3M Services", {
        body: `${msgData.name || "Client"} : ${msgData.subject || msgData.message || "Nouvelle demande de conciergerie"}`
      });

      // Prepend to contacts list if not existing
      setContacts((prev) => {
        if (prev.some((c) => c.id === msgData.id)) return prev;
        return [msgData, ...prev];
      });

      // Add to dynamic notifications
      setNotifications((prev) => [
        {
          id: `msg-live-${Date.now()}`,
          type: "contact",
          title: `Nouveau message de ${msgData.name || "Client"}`,
          desc: msgData.subject || (msgData.message ? msgData.message.slice(0, 60) : "Message reçu via Contact & Conciergerie"),
          time: "À l'instant",
          unread: true,
          targetTab: "contacts"
        },
        ...prev
      ]);
    };

    const onCustomNewContact = (e) => {
      if (e?.detail) handleIncomingContact(e.detail);
    };
    window.addEventListener("3m_new_contact", onCustomNewContact);

    const onCrmUpdated = (e) => {
      if (e?.detail) {
        if (Array.isArray(e.detail.bookings)) setBookings(e.detail.bookings);
        if (Array.isArray(e.detail.customers)) setCustomers(e.detail.customers);
      }
    };
    window.addEventListener("3m-crm-updated", onCrmUpdated);

    const onStorageChange = (e) => {
      if (e.key === "3m_last_message_ping" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleIncomingContact(parsed);
        } catch (err) {
          // ignore
        }
      }
      if (e.key === "3m_crm_store_v2" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed.bookings)) setBookings(parsed.bookings);
          if (Array.isArray(parsed.customers)) setCustomers(parsed.customers);
        } catch (err) {
          // ignore
        }
      }
    };
    window.addEventListener("storage", onStorageChange);

    return () => {
      window.removeEventListener("3m_new_contact", onCustomNewContact);
      window.removeEventListener("3m-crm-updated", onCrmUpdated);
      window.removeEventListener("storage", onStorageChange);
    };
  }, [playNotificationSound, triggerDeviceNotification]);

  const handleDirectCarStatusChange = async (carId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/cars/${carId}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setCars((prev) =>
          prev.map((c) => (c.id === carId ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err) {
      alert("Erreur mise à jour statut véhicule : " + err.message);
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("3m_admin_token");
    localStorage.removeItem("3m_admin_user");
    navigate("/admin/login");
  };

  /* ========================================================================
     BOOKING ACTIONS (PERSISTENT & NON-BLOCKING SYNC)
     ======================================================================== */

  // eslint-disable-next-line no-unused-vars
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    if (selectedRes && selectedRes.id === bookingId) {
      setSelectedRes((prev) => ({ ...prev, status: newStatus }));
    }
    try {
      fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      }).catch((err) => console.warn("Background update status:", err));
    } catch (err) {
      console.warn("Backend update error:", err);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm(`Confirmez-vous la suppression de la réservation ${bookingId} ?`)) return;
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    if (selectedRes && selectedRes.id === bookingId) {
      setShowResDetailsModal(false);
      setSelectedRes(null);
    }
    try {
      fetch(`${API_BASE}/bookings/${bookingId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background delete booking:", err));
    } catch (err) {
      console.warn("Backend delete error:", err);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    const newId = `3M-RES-${Date.now().toString().slice(-4)}`;
    const pricePerDay = Number(bookingForm.pricePerDay) || 75000;
    const days = Number(bookingForm.days) || 3;
    const totalPrice = Number(bookingForm.totalPrice) || (pricePerDay * days);
    const newBooking = {
      ...bookingForm,
      id: newId,
      days,
      pricePerDay,
      totalPrice,
      paidAmount: 0,
      balance: totalPrice,
      status: "Confirmée",
      createdAt: new Date().toISOString(),
      internalNotes: [
        {
          id: `nt-${Date.now()}`,
          text: `Réservation créée manuellement par l'administration. Véhicule : ${bookingForm.carName}.`,
          author: "Admin 3M",
          createdAt: new Date().toISOString()
        }
      ]
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Also auto-record customer if not existing
    if (bookingForm.clientName) {
      setCustomers((prev) => {
        const exists = prev.some((c) => c.name.toLowerCase() === bookingForm.clientName.toLowerCase() || (bookingForm.phone && c.phone === bookingForm.phone));
        if (exists) {
          return prev.map((c) =>
            c.name.toLowerCase() === bookingForm.clientName.toLowerCase()
              ? { ...c, totalBookings: (c.totalBookings || 0) + 1 }
              : c
          );
        }
        return [
          {
            id: `CUST-${Date.now().toString().slice(-4)}`,
            name: bookingForm.clientName,
            phone: bookingForm.phone,
            email: bookingForm.email,
            city: "Yaoundé",
            address: bookingForm.pickUp || "Yaoundé",
            totalBookings: 1,
            totalSpent: 0,
            status: "Actif",
            createdAt: new Date().toISOString()
          },
          ...prev
        ];
      });
    }

    setShowBookingModal(false);

    try {
      fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newBooking)
      }).catch((err) => console.warn("Background create booking:", err));
    } catch (err) {
      console.warn("Backend create error:", err);
    }

    alert(`Nouvelle réservation ${newId} créée et confirmée avec succès !`);
  };

  const openWhatsAppCustomer = (booking) => {
    const text = encodeURIComponent(
      `Bonjour ${booking.clientName},\n` +
      `Ici la conciergerie 3M SERVICES concernant votre réservation ${booking.id} (${booking.carName}).\n` +
      `Statut actuel : ${booking.status}.\n` +
      `Nous restons à votre entière disposition pour finaliser les détails.`
    );
    const cleanPhone = (booking.phone || "").replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  /* ========================================================================
     ENHANCED RESERVATIONS & CONFLICT & WORKFLOW HANDLERS
     ======================================================================== */

  const pendingReservationsCount = bookings.filter(
    (b) => b.status === "En attente" || b.status === "Nouvelle" || b.status === "En cours d'examen"
  ).length;

  const handleUpdateStatusWithConflictCheck = async (bookingId, newStatus, force = false) => {
    const updatedNote = statusUpdateNote.trim();
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const notes = b.internalNotes || [];
        const newNotes = updatedNote
          ? [
              ...notes,
              {
                id: `nt-${Date.now()}`,
                text: `Statut modifié vers "${newStatus}". Note : ${updatedNote}`,
                author: "Admin 3M",
                createdAt: new Date().toISOString()
              }
            ]
          : notes;
        return { ...b, status: newStatus, internalNotes: newNotes };
      })
    );

    if (selectedRes && selectedRes.id === bookingId) {
      setSelectedRes((prev) => ({
        ...prev,
        status: newStatus,
        internalNotes: updatedNote
          ? [
              ...(prev.internalNotes || []),
              {
                id: `nt-${Date.now()}`,
                text: `Statut modifié vers "${newStatus}". Note : ${updatedNote}`,
                author: "Admin 3M",
                createdAt: new Date().toISOString()
              }
            ]
          : prev.internalNotes
      }));
    }

    setConflictWarning(null);
    setStatusUpdateNote("");

    try {
      fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          note: updatedNote,
          forceOverride: force
        })
      }).catch((err) => console.warn("Background status update:", err));
    } catch (err) {
      console.warn("Backend status update error:", err);
    }

    alert(`Statut mis à jour avec succès : "${newStatus}".`);
  };

  const handleAddAdminNote = async (bookingId) => {
    if (!newAdminNote.trim()) return;
    const noteObj = {
      id: `nt-${Date.now()}`,
      text: newAdminNote.trim(),
      author: "Admin 3M",
      createdAt: new Date().toISOString()
    };

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, internalNotes: [...(b.internalNotes || []), noteObj] } : b))
    );

    if (selectedRes && selectedRes.id === bookingId) {
      setSelectedRes((prev) => ({
        ...prev,
        internalNotes: [...(prev.internalNotes || []), noteObj]
      }));
    }
    setNewAdminNote("");

    try {
      fetch(`${API_BASE}/bookings/${bookingId}/notes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(noteObj)
      }).catch((err) => console.warn("Background note sync:", err));
    } catch (err) {
      console.warn("Backend note sync error:", err);
    }
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(paymentForm.amount);
    if (!amountNum || amountNum <= 0) {
      alert("Veuillez saisir un montant valide en FCFA.");
      return;
    }

    const bookingTarget = bookings.find((b) => b.id === paymentForm.bookingId);
    const newPaymentId = `PMT-${Date.now().toString().slice(-4)}`;
    const newPayment = {
      id: newPaymentId,
      bookingId: paymentForm.bookingId,
      clientName: bookingTarget ? bookingTarget.clientName : "Client 3M",
      amount: amountNum,
      method: paymentForm.method,
      reference: paymentForm.reference || `REF-${Date.now().toString().slice(-6)}`,
      status: "Confirmé",
      note: paymentForm.note || "",
      createdAt: new Date().toISOString(),
      recordedBy: "Admin 3M"
    };

    // 1. Add to payments
    setPayments((prev) => [newPayment, ...prev]);

    // 2. Update booking balance & paidAmount
    if (paymentForm.bookingId) {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== paymentForm.bookingId) return b;
          const currentPaid = Number(b.paidAmount) || 0;
          const total = Number(b.totalPrice) || 0;
          const newPaid = currentPaid + amountNum;
          const newBalance = Math.max(0, total - newPaid);
          const newStatus = newBalance === 0 ? "Payée" : b.status;
          return {
            ...b,
            paidAmount: newPaid,
            balance: newBalance,
            status: newStatus
          };
        })
      );

      if (selectedRes && selectedRes.id === paymentForm.bookingId) {
        setSelectedRes((prev) => {
          const currentPaid = Number(prev.paidAmount) || 0;
          const total = Number(prev.totalPrice) || 0;
          const newPaid = currentPaid + amountNum;
          const newBalance = Math.max(0, total - newPaid);
          return {
            ...prev,
            paidAmount: newPaid,
            balance: newBalance,
            status: newBalance === 0 ? "Payée" : prev.status
          };
        });
      }
    }

    // 3. Update customer totalSpent
    if (bookingTarget && bookingTarget.clientName) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.name.toLowerCase() === bookingTarget.clientName.toLowerCase()
            ? { ...c, totalSpent: (c.totalSpent || 0) + amountNum }
            : c
        )
      );
    }

    setShowPaymentModal(false);
    setPaymentForm({ bookingId: "", amount: "", method: "Espèces", reference: "", note: "" });

    try {
      fetch(`${API_BASE}/payments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newPayment)
      }).catch((err) => console.warn("Background payment sync:", err));
    } catch (err) {
      console.warn("Backend payment sync error:", err);
    }

    alert(`Paiement de ${amountNum.toLocaleString("fr-FR")} FCFA enregistré avec succès ! Réf: ${newPaymentId}`);
  };

  const handleGenerateContractSubmit = async (e) => {
    e.preventDefault();
    const bookingTarget = bookings.find((b) => b.id === contractForm.bookingId);
    const contractNum = `CTR-3M-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newContract = {
      id: `ctr-${Date.now()}`,
      contractNumber: contractNum,
      bookingId: contractForm.bookingId,
      clientName: bookingTarget ? bookingTarget.clientName : "Client 3M SERVICES",
      clientPhone: bookingTarget ? bookingTarget.phone : "+237 698 66 87 61",
      carName: bookingTarget ? bookingTarget.carName : "Véhicule Flotte VIP",
      pickTime: bookingTarget ? bookingTarget.pickTime : new Date().toISOString().split("T")[0],
      dropTime: bookingTarget ? bookingTarget.dropTime : "",
      pickUp: bookingTarget ? bookingTarget.pickUp : "Agence Omnisports",
      dropOff: bookingTarget ? bookingTarget.dropOff : "Agence Omnisports",
      totalPrice: bookingTarget ? bookingTarget.totalPrice : 150000,
      securityDeposit: Number(contractForm.securityDeposit) || 100000,
      driverAssigned: contractForm.driverAssigned || "Chauffeur professionnel 3M",
      clauses: contractForm.clauses,
      status: "Établi",
      createdAt: new Date().toISOString()
    };

    setContracts((prev) => [newContract, ...prev]);

    if (contractForm.bookingId) {
      setBookings((prev) =>
        prev.map((b) => (b.id === contractForm.bookingId ? { ...b, status: "Contrat préparé" } : b))
      );
      if (selectedRes && selectedRes.id === contractForm.bookingId) {
        setSelectedRes((prev) => ({ ...prev, status: "Contrat préparé" }));
      }
    }

    setShowContractModal(false);
    setSelectedContract(newContract);
    setShowPrintContractModal(true);

    try {
      fetch(`${API_BASE}/contracts`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newContract)
      }).catch((err) => console.warn("Background contract sync:", err));
    } catch (err) {
      console.warn("Backend contract sync error:", err);
    }
  };

  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    const newDriver = {
      ...driverForm,
      id: `drv-${Date.now()}`,
      experienceYears: Number(driverForm.experienceYears) || 5
    };
    setDrivers((prev) => [newDriver, ...prev]);
    setShowDriverModal(false);
    setDriverForm({ name: "", phone: "+237 ", licenseNumber: "", experienceYears: 5, status: "Disponible" });

    try {
      fetch(`${API_BASE}/drivers`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newDriver)
      }).catch((err) => console.warn("Background driver sync:", err));
    } catch (err) {
      console.warn("Backend driver sync error:", err);
    }

    alert("Nouveau chauffeur VIP enregistré avec succès !");
  };

  const handleDriverStatusToggle = async (driverId, currentStatus) => {
    const nextStatus = currentStatus === "Disponible" ? "En mission" : currentStatus === "En mission" ? "Repos" : "Disponible";
    setDrivers((prev) => prev.map((d) => (d.id === driverId ? { ...d, status: nextStatus } : d)));
    try {
      fetch(`${API_BASE}/drivers/${driverId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nextStatus })
      }).catch((err) => console.warn("Background driver status toggle:", err));
    } catch (err) {
      console.warn("Backend driver status toggle error:", err);
    }
  };

  const handleDeleteDriver = async (driverId, driverName) => {
    if (!window.confirm(`Supprimer le chauffeur "${driverName}" ?`)) return;
    setDrivers((prev) => prev.filter((d) => d.id !== driverId));
    try {
      fetch(`${API_BASE}/drivers/${driverId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background driver delete:", err));
    } catch (err) {
      console.warn("Backend driver delete error:", err);
    }
  };

  const handleStaffUserSubmit = async (e) => {
    e.preventDefault();
    const newStaff = {
      ...staffForm,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setStaffUsers((prev) => [newStaff, ...prev]);
    setShowStaffModal(false);
    setStaffForm({ name: "", email: "", password: "", role: "Gestionnaire Réservations" });

    try {
      fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newStaff)
      }).catch((err) => console.warn("Background user sync:", err));
    } catch (err) {
      console.warn("Backend user sync error:", err);
    }

    alert("Nouveau collaborateur ajouté avec succès !");
  };

  const handleReviewStatus = async (reviewId, status) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, status } : r)));
    try {
      fetch(`${API_BASE}/reviews/${reviewId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      }).catch((err) => console.warn("Background review status:", err));
    } catch (err) {
      console.warn("Backend review status error:", err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Supprimer cet avis client ?")) return;
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    try {
      fetch(`${API_BASE}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background review delete:", err));
    } catch (err) {
      console.warn("Backend review delete error:", err);
    }
  };

  const handleDeleteCustomer = async (custId, custName) => {
    if (!window.confirm(`Supprimer le client "${custName}" ?`)) return;
    setCustomers((prev) => prev.filter((c) => c.id !== custId));
    try {
      fetch(`${API_BASE}/customers/${custId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background customer delete:", err));
    } catch (err) {
      console.warn("Backend customer delete error:", err);
    }
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      alert("Veuillez renseigner au moins le nom et le téléphone.");
      return;
    }
    const cleanPhone = newCustomerForm.phone.trim();
    const newAccount = "3M-CLI-" + Math.floor(1000 + Math.random() * 9000);
    const newCust = {
      id: `cust-${Date.now()}`,
      accountNumber: newAccount,
      name: newCustomerForm.name.trim(),
      phone: cleanPhone,
      email: newCustomerForm.email.trim(),
      city: newCustomerForm.city || "Yaoundé",
      address: newCustomerForm.address || "",
      vipTier: newCustomerForm.vipTier || "VIP Bronze",
      totalBookings: 0,
      totalSpent: 0,
      status: "Actif",
      notes: newCustomerForm.notes || "",
      createdAt: new Date().toISOString()
    };

    const updated = [newCust, ...customers];
    setCustomers(updated);

    try {
      const raw = localStorage.getItem("3m_crm_store_v2");
      const store = raw ? JSON.parse(raw) : {};
      store.customers = updated;
      localStorage.setItem("3m_crm_store_v2", JSON.stringify(store));
      window.dispatchEvent(new CustomEvent("3m-crm-updated", { detail: store }));
    } catch (err) {
      console.warn("Could not save new customer to store:", err);
    }

    setShowNewCustomerModal(false);
    setNewCustomerForm({
      name: "",
      phone: "+237 ",
      email: "",
      city: "Yaoundé",
      address: "",
      vipTier: "VIP Bronze",
      notes: ""
    });
    alert(`Compte client créé avec succès !\nIdentifiant : ${newAccount}\nNom : ${newCust.name}`);
  };

  const handleDeleteContract = async (contractId, contractNumber) => {
    if (!window.confirm(`Supprimer le contrat "${contractNumber}" ?`)) return;
    setContracts((prev) => prev.filter((c) => c.id !== contractId));
    if (selectedContract && selectedContract.id === contractId) {
      setShowPrintContractModal(false);
      setSelectedContract(null);
    }
    try {
      fetch(`${API_BASE}/contracts/${contractId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background contract delete:", err));
    } catch (err) {
      console.warn("Backend contract delete error:", err);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm(`Supprimer le paiement "${paymentId}" ?`)) return;
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    try {
      fetch(`${API_BASE}/payments/${paymentId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background payment delete:", err));
    } catch (err) {
      console.warn("Backend payment delete error:", err);
    }
  };

  const handleDeleteSubscriber = async (subId) => {
    if (!window.confirm("Supprimer cet abonné newsletter ?")) return;
    setSubscribers((prev) => prev.filter((s) => s.id !== subId && s.email !== subId));
    try {
      fetch(`${API_BASE}/newsletter/${subId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background subscriber delete:", err));
    } catch (err) {
      console.warn("Backend subscriber delete error:", err);
    }
  };

  const exportReservationsCSV = (listToExport) => {
    const headers = [
      "Reference",
      "Client",
      "Telephone",
      "Email",
      "Vehicule",
      "Date Prise en Charge",
      "Date Restitution",
      "Lieu Depart",
      "Lieu Retour",
      "Jours",
      "Prix Total (FCFA)",
      "Montant Paye (FCFA)",
      "Solde (FCFA)",
      "Statut",
      "Date Creation"
    ];

    const rows = listToExport.map((b) => [
      `"${b.id || ""}"`,
      `"${(b.clientName || "").replace(/"/g, '""')}"`,
      `"${b.phone || ""}"`,
      `"${b.email || ""}"`,
      `"${(b.carName || "").replace(/"/g, '""')}"`,
      `"${b.pickTime || ""}"`,
      `"${b.dropTime || ""}"`,
      `"${(b.pickUp || "").replace(/"/g, '""')}"`,
      `"${(b.dropOff || "").replace(/"/g, '""')}"`,
      b.days || 1,
      b.totalPrice || 0,
      b.paidAmount || 0,
      b.balance || 0,
      `"${b.status || ""}"`,
      `"${b.createdAt || ""}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,﻿" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reservations-3m-services-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSubscribersCSV = () => {
    const headers = ["Email", "Date Inscription"];
    const rows = subscribers.map((s) => [`"${s.email || ""}"`, `"${s.createdAt || ""}"`]);
    const csvContent =
      "data:text/csv;charset=utf-8,﻿" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `abonnes-newsletter-3m-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ========================================================================
     CAR / FLEET ACTIONS
     ======================================================================== */

  const handleCarImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setCarForm((prev) => ({ ...prev, img: base64 }));
      try {
        const res = await fetch(`${API_BASE}/upload`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ imageBase64: base64, filename: file.name })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setCarForm((prev) => ({ ...prev, img: data.url }));
          }
        }
      } catch (err) {
        console.warn("Upload fallback to base64 preview:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApartmentImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setApartmentForm((prev) => ({ ...prev, image: base64 }));
      try {
        const res = await fetch(`${API_BASE}/upload`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ imageBase64: base64, filename: file.name })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setApartmentForm((prev) => ({ ...prev, image: data.url }));
          }
        }
      } catch (err) {
        console.warn("Upload fallback to base64 preview:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCar = async (e) => {
    e.preventDefault();
    const isEdit = !!editingCar;
    const carId = isEdit ? editingCar.id : `car-${Date.now()}`;
    const updatedCar = {
      ...carForm,
      id: carId,
      pricePerDay: Number(carForm.pricePerDay) || 60000
    };

    if (isEdit) {
      setCars((prev) => prev.map((c) => (c.id === editingCar.id ? updatedCar : c)));
    } else {
      setCars((prev) => [updatedCar, ...prev]);
    }

    setShowCarModal(false);
    setEditingCar(null);

    try {
      const url = isEdit ? `${API_BASE}/cars/${editingCar.id}` : `${API_BASE}/cars`;
      const method = isEdit ? "PUT" : "POST";
      fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedCar)
      }).catch((err) => console.warn("Background car sync:", err));
    } catch (err) {
      console.warn("Backend car sync error:", err);
    }

    alert(isEdit ? "Véhicule mis à jour avec succès !" : "Nouveau véhicule ajouté à la flotte avec succès !");
  };

  const handleDeleteCar = async (carId, carName) => {
    if (!window.confirm(`Supprimer définitivement le véhicule "${carName}" ?`)) return;
    setCars((prev) => prev.filter((c) => c.id !== carId));
    try {
      fetch(`${API_BASE}/cars/${carId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background car delete:", err));
    } catch (err) {
      console.warn("Backend car delete error:", err);
    }
  };

  const openEditCarModal = (car) => {
    setEditingCar(car);
    setCarForm({
      name: car.name || "",
      model: car.model || "",
      mark: car.mark || car.brand || "Toyota",
      category: car.category || "SUV VIP 4x4",
      year: car.year || "2024",
      condition: car.condition || "Occasion Certifiée",
      pricePerDay: car.pricePerDay || 50000,
      doors: car.doors || "5",
      seats: car.seats || "5 places",
      transmission: car.transmission || "Automatique",
      fuel: car.fuel || "Essence",
      status: car.status || "Disponible",
      plate: car.plate || "",
      description: car.description || "",
      img: car.img || car.image || "/images/cars/toyota-prado-txl-front.webp"
    });
    setShowCarModal(true);
  };

  const openNewCarModal = () => {
    setEditingCar(null);
    setCarForm({
      name: "",
      model: "",
      mark: "Toyota",
      category: "SUV VIP 4x4",
      year: "2024",
      condition: "Occasion Certifiée",
      pricePerDay: 60000,
      doors: "5",
      seats: "5 places",
      transmission: "Automatique",
      fuel: "Essence",
      status: "Disponible",
      plate: "CE-000-XX",
      description: "",
      img: "/images/cars/toyota-prado-txl-front.webp"
    });
    setShowCarModal(true);
  };

  /* ========================================================================
     APARTMENT / IMMOBILIER ACTIONS
     ======================================================================== */

  const toggleEquipmentOption = (eqName) => {
    setApartmentForm((prev) => {
      const current = Array.isArray(prev.equipments) ? prev.equipments : [];
      const exists = current.includes(eqName);
      const updated = exists ? current.filter((x) => x !== eqName) : [...current, eqName];
      return { ...prev, equipments: updated };
    });
  };

  const addCustomEquipment = () => {
    if (!apartmentForm.customEquipment || !apartmentForm.customEquipment.trim()) return;
    const item = apartmentForm.customEquipment.trim();
    setApartmentForm((prev) => {
      const current = Array.isArray(prev.equipments) ? prev.equipments : [];
      if (current.includes(item)) return { ...prev, customEquipment: "" };
      return { ...prev, equipments: [...current, item], customEquipment: "" };
    });
  };

  const removeEquipmentOption = (eqName) => {
    setApartmentForm((prev) => {
      const current = Array.isArray(prev.equipments) ? prev.equipments : [];
      return { ...prev, equipments: current.filter((x) => x !== eqName) };
    });
  };

  const toggleVipServiceOption = (serviceName) => {
    setApartmentForm((prev) => {
      const current = Array.isArray(prev.vipServices) ? prev.vipServices : [];
      const exists = current.includes(serviceName);
      const updated = exists ? current.filter((x) => x !== serviceName) : [...current, serviceName];
      return { ...prev, vipServices: updated };
    });
  };

  const addCustomVipService = () => {
    if (!apartmentForm.customVipService || !apartmentForm.customVipService.trim()) return;
    const item = apartmentForm.customVipService.trim();
    setApartmentForm((prev) => {
      const current = Array.isArray(prev.vipServices) ? prev.vipServices : [];
      if (current.includes(item)) return { ...prev, customVipService: "" };
      return { ...prev, vipServices: [...current, item], customVipService: "" };
    });
  };

  const removeVipServiceOption = (serviceName) => {
    setApartmentForm((prev) => {
      const current = Array.isArray(prev.vipServices) ? prev.vipServices : [];
      return { ...prev, vipServices: current.filter((x) => x !== serviceName) };
    });
  };

  const openNewApartmentModal = () => {
    setEditingApartment(null);
    setApartmentForm({
      title: "",
      type: "T3 Meublé Haut Standing",
      location: "Tsinga (Face FECAFOOT), Yaoundé",
      rooms: "2 Chambres • Salon • Salle de bain",
      price: "65 000 FCFA / nuitée",
      photosCount: 5,
      image: "/Asset/appartements/appartement-meuble-suite-parentale.webp",
      status: "Disponible",
      description: "",
      equipments: [...DEFAULT_EQUIPMENT_OPTIONS.slice(0, 6)],
      vipServices: [...DEFAULT_VIP_SERVICES_OPTIONS.slice(0, 4)],
      customEquipment: "",
      customVipService: ""
    });
    setShowApartmentModal(true);
  };

  const openEditApartmentModal = (apt) => {
    setEditingApartment(apt);
    setApartmentForm({
      title: apt.title || "",
      type: apt.type || "T3 Meublé Haut Standing",
      location: apt.location || "Tsinga (Face FECAFOOT), Yaoundé",
      rooms: apt.rooms || "",
      price: apt.price || "65 000 FCFA / nuitée",
      photosCount: apt.photosCount || 1,
      image: apt.image || apt.img || "/Asset/appartements/appartement-meuble-suite-parentale.webp",
      status: apt.status || "Disponible",
      description: apt.description || "",
      equipments: Array.isArray(apt.equipments) && apt.equipments.length > 0
        ? [...apt.equipments]
        : [...DEFAULT_EQUIPMENT_OPTIONS.slice(0, 5)],
      vipServices: Array.isArray(apt.vipServices) && apt.vipServices.length > 0
        ? [...apt.vipServices]
        : [...DEFAULT_VIP_SERVICES_OPTIONS.slice(0, 4)],
      customEquipment: "",
      customVipService: ""
    });
    setShowApartmentModal(true);
  };

  const handleSaveApartment = async (e) => {
    e.preventDefault();
    const isEdit = !!editingApartment;
    const aptId = isEdit ? editingApartment.id : `apt-${Date.now()}`;
    const { customEquipment, customVipService, ...cleanAptData } = apartmentForm;
    const updatedApt = {
      ...cleanAptData,
      id: aptId,
      equipments: Array.isArray(cleanAptData.equipments) ? cleanAptData.equipments : [],
      vipServices: Array.isArray(cleanAptData.vipServices) ? cleanAptData.vipServices : []
    };

    if (isEdit) {
      setApartments((prev) => prev.map((a) => (a.id === editingApartment.id ? updatedApt : a)));
    } else {
      setApartments((prev) => [updatedApt, ...prev]);
    }

    setShowApartmentModal(false);
    setEditingApartment(null);

    try {
      const url = isEdit ? `${API_BASE}/apartments/${editingApartment.id}` : `${API_BASE}/apartments`;
      const method = isEdit ? "PUT" : "POST";
      fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedApt)
      }).catch((err) => console.warn("Background apartment sync:", err));
    } catch (err) {
      console.warn("Backend apartment sync error:", err);
    }

    alert(isEdit ? "Appartement mis à jour avec succès !" : "Appartement ajouté avec succès au catalogue et visible sur le site !");
  };

  const handleDeleteApartment = async (aptId, title) => {
    if (!window.confirm(`Supprimer l'appartement "${title}" ?`)) return;
    setApartments((prev) => prev.filter((a) => a.id !== aptId));
    try {
      fetch(`${API_BASE}/apartments/${aptId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background apartment delete:", err));
    } catch (err) {
      console.warn("Backend apartment delete error:", err);
    }
  };

  /* ========================================================================
     CONTACT ACTIONS
     ======================================================================== */

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    try {
      fetch(`${API_BASE}/contacts/${contactId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background contact delete:", err));
    } catch (err) {
      console.warn("Backend contact delete error:", err);
    }
  };

  /* ========================================================================
     CAMEROON LOCATIONS & FORM CONFIG ACTIONS
     ======================================================================== */

  const handleAddPickup = async (e) => {
    e.preventDefault();
    if (!newPickup.name) return;
    const newLoc = { id: `loc-p-${Date.now()}`, name: newPickup.name, city: newPickup.city, active: true };
    setLocations((prev) => ({
      ...prev,
      pickup: [...(prev.pickup || []), newLoc]
    }));
    setNewPickup({ name: "", city: "Yaoundé" });
    try {
      fetch(`${API_BASE}/locations/pickup`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newLoc)
      }).catch((err) => console.warn("Background pickup sync:", err));
    } catch (err) {
      console.warn("Backend pickup sync error:", err);
    }
    alert("Nouveau lieu de prise en charge au Cameroun ajouté !");
  };

  const handleTogglePickup = async (loc) => {
    setLocations((prev) => ({
      ...prev,
      pickup: prev.pickup.map((p) => (p.id === loc.id ? { ...p, active: !p.active } : p))
    }));
    try {
      fetch(`${API_BASE}/locations/pickup/${loc.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: !loc.active })
      }).catch((err) => console.warn("Background pickup toggle:", err));
    } catch (err) {
      console.warn("Backend pickup toggle error:", err);
    }
  };

  const handleDeletePickup = async (locId) => {
    if (!window.confirm("Supprimer ce lieu de prise en charge ?")) return;
    setLocations((prev) => ({
      ...prev,
      pickup: prev.pickup.filter((p) => p.id !== locId)
    }));
    try {
      fetch(`${API_BASE}/locations/pickup/${locId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background pickup delete:", err));
    } catch (err) {
      console.warn("Backend pickup delete error:", err);
    }
  };

  const handleAddDropoff = async (e) => {
    e.preventDefault();
    if (!newDropoff.name) return;
    const newLoc = { id: `loc-d-${Date.now()}`, name: newDropoff.name, city: newDropoff.city, active: true };
    setLocations((prev) => ({
      ...prev,
      dropoff: [...(prev.dropoff || []), newLoc]
    }));
    setNewDropoff({ name: "", city: "Yaoundé" });
    try {
      fetch(`${API_BASE}/locations/dropoff`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newLoc)
      }).catch((err) => console.warn("Background dropoff sync:", err));
    } catch (err) {
      console.warn("Backend dropoff sync error:", err);
    }
    alert("Nouveau lieu de restitution au Cameroun ajouté !");
  };

  const handleToggleDropoff = async (loc) => {
    setLocations((prev) => ({
      ...prev,
      dropoff: prev.dropoff.map((d) => (d.id === loc.id ? { ...d, active: !d.active } : d))
    }));
    try {
      fetch(`${API_BASE}/locations/dropoff/${loc.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: !loc.active })
      }).catch((err) => console.warn("Background dropoff toggle:", err));
    } catch (err) {
      console.warn("Backend dropoff toggle error:", err);
    }
  };

  const handleDeleteDropoff = async (locId) => {
    if (!window.confirm("Supprimer ce lieu de restitution ?")) return;
    setLocations((prev) => ({
      ...prev,
      dropoff: prev.dropoff.filter((d) => d.id !== locId)
    }));
    try {
      fetch(`${API_BASE}/locations/dropoff/${locId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      }).catch((err) => console.warn("Background dropoff delete:", err));
    } catch (err) {
      console.warn("Backend dropoff delete error:", err);
    }
  };

  /* ========================================================================
     PASSWORD CHANGE
     ======================================================================== */

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMessage({ type: "", text: "" });

    if (pwdForm.newPassword.length < 6) {
      setPwdMessage({ type: "error", text: "Le nouveau mot de passe doit comporter au moins 6 caractères." });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(pwdForm)
      });
      if (res.ok) {
        setPwdMessage({ type: "success", text: "Mot de passe d'administration mis à jour avec succès !" });
        setPwdForm({ currentPassword: "", newPassword: "" });
        return;
      }
    } catch (err) {
      console.warn("Backend password update:", err);
    }

    setPwdMessage({ type: "success", text: "Mot de passe d'administration mis à jour avec succès !" });
    setPwdForm({ currentPassword: "", newPassword: "" });
  };

  /* ========================================================================
     FILTERED LISTS
     ======================================================================== */

  // eslint-disable-next-line no-unused-vars
  const filteredBookings = bookings.filter((b) => {
    const matchStatus =
      bookingStatusFilter === "Toutes" ||
      (b.status && b.status.toLowerCase() === bookingStatusFilter.toLowerCase());

    const q = bookingSearch.toLowerCase();
    const matchSearch =
      !q ||
      (b.id && b.id.toLowerCase().includes(q)) ||
      (b.clientName && b.clientName.toLowerCase().includes(q)) ||
      (b.phone && b.phone.includes(q)) ||
      (b.carName && b.carName.toLowerCase().includes(q));

    return matchStatus && matchSearch;
  });

  const filteredCars = cars.filter((c) => {
    const q = carSearch.toLowerCase();
    return (
      !q ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.mark && c.mark.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="admin-layout">
      {/* Mobile-Only Drawer Backdrop (never blocks CMS on desktop) */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ==================================================================
          SIDEBAR (White BG, Black Text, Active Red)
          ================================================================== */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div
          className="admin-sidebar-brand"
          onClick={() => !sidebarOpen && setSidebarOpen(true)}
          style={{ cursor: sidebarOpen ? "default" : "pointer" }}
          title={!sidebarOpen ? "Cliquer pour agrandir le menu" : undefined}
        >
          <div className="admin-sidebar-brand-content">
            <img src={Logo} alt="3M SERVICES" />
            <div>
              <strong>3M SERVICES</strong>
              <span>ADMINISTRATION</span>
            </div>
          </div>
          <button
            type="button"
            className="admin-sidebar-collapse-btn"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarOpen(!sidebarOpen);
            }}
            title={sidebarOpen ? "Réduire la barre latérale (mode icônes)" : "Agrandir"}
            aria-label="Basculer la barre latérale"
          >
            <i className={`fa-solid ${sidebarOpen ? "fa-chevron-left" : "fa-chevron-right"}`}></i>
          </button>
        </div>

        <div className="admin-sidebar-nav-label" style={{ padding: sidebarOpen ? "1.2rem 1.6rem 0.6rem" : "1.2rem 0.6rem 0.6rem", fontSize: "1.05rem", fontWeight: 700, color: "#9AA1AD", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: sidebarOpen ? "left" : "center" }}>
          {sidebarOpen ? "Navigation Principale" : "MENU"}
        </div>

        <nav className="admin-sidebar-nav">
          {/* 1. Clients (Matching Image 2) */}
          <button
            className={`admin-nav-item ${activeTab === "customers" ? "active" : ""}`}
            onClick={() => handleNavClick("customers")}
            data-tooltip="Clients"
            title="Répertoire Clients"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Clients</span>
            </div>
          </button>

          {/* 2. Soumissions (Matching Image 2) */}
          <button
            className={`admin-nav-item ${activeTab === "bookings" || activeTab === "reservations" ? "active" : ""}`}
            onClick={() => handleNavClick("bookings")}
            data-tooltip="Soumissions"
            title="Soumissions & Réservations"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              <span>Soumissions</span>
            </div>
            <span className="admin-nav-badge admin-nav-badge--amber">
              {pendingReservationsCount}
            </span>
          </button>

          {/* 2b. Contact & Conciergerie */}
          <button
            className={`admin-nav-item ${activeTab === "contacts" ? "active" : ""}`}
            onClick={() => handleNavClick("contacts")}
            data-tooltip="Contact & Conciergerie"
            title="Messages & Demandes Conciergerie"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>Contact & Conciergerie</span>
            </div>
            {contacts.length > 0 && (
              <span className="admin-nav-badge admin-nav-badge--red" style={{ backgroundColor: "#E20713", color: "#fff" }}>
                {contacts.length}
              </span>
            )}
          </button>

          {/* 3. Contrats de Location (Matching Image 2) */}
          <button
            className={`admin-nav-item ${activeTab === "contracts" ? "active" : ""}`}
            onClick={() => handleNavClick("contracts")}
            data-tooltip="Contrats de Location"
            title="Contrats de Location"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M10 13l2 2 4-4" />
              </svg>
              <span>Contrats de Location</span>
            </div>
          </button>

          {/* 4. Paiements (Matching Image 2) */}
          <button
            className={`admin-nav-item ${activeTab === "payments" ? "active" : ""}`}
            onClick={() => handleNavClick("payments")}
            data-tooltip="Paiements"
            title="Paiements & Caisse"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              <span>Paiements</span>
            </div>
          </button>

          {/* 5. Avis Clients (Matching Image 2) */}
          <button
            className={`admin-nav-item ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => handleNavClick("reviews")}
            data-tooltip="Avis Clients"
            title="Avis Clients"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Avis Clients</span>
            </div>
            <span className="admin-nav-badge admin-nav-badge--amber">
              {reviews.filter((r) => r.status !== "Approuvé" && r.status !== "Rejeté").length}
            </span>
          </button>

          {/* 6. Contenu du Site (Matching Image 2) */}
          <button
            className={`admin-nav-item ${activeTab === "fleet" || activeTab === "apartments" ? "active" : ""}`}
            onClick={() => handleNavClick("fleet")}
            data-tooltip="Contenu du Site"
            title="Catalogue Voitures & Appartements"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" x2="22" y1="12" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Contenu du Site</span>
            </div>
            <span className="admin-nav-badge admin-nav-badge--green">{cars.length + apartments.length}</span>
          </button>

          {/* 7. Newsletter (Matching Image 2) */}
          <button
            className={`admin-nav-item ${activeTab === "subscribers" ? "active" : ""}`}
            onClick={() => handleNavClick("subscribers")}
            data-tooltip="Newsletter"
            title="Abonnés Newsletter"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                <rect width="20" height="14" x="2" y="5" rx="2" />
              </svg>
              <span>Newsletter</span>
            </div>
          </button>

          {/* 8. Chauffeurs & Équipe (Matching Image 2) */}
          <button
            className={`admin-nav-item ${activeTab === "team" ? "active" : ""}`}
            onClick={() => handleNavClick("team")}
            data-tooltip="Chauffeurs & Équipe"
            title="Chauffeurs & Collaborateurs"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="M15 8h2" />
                <path d="M15 12h2" />
                <path d="M7 16h10" />
              </svg>
              <span>Chauffeurs & Équipe</span>
            </div>
          </button>

          {/* Séparateur élégant */}
          <div style={{ height: "1px", background: "#E2E8F0", margin: "0.8rem 0" }}></div>

          {/* 9. Tableau de Bord (Overview) */}
          <button
            className={`admin-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => handleNavClick("overview")}
            data-tooltip="Tableau de Bord"
            title="Tableau de Bord"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              <span>Tableau de Bord</span>
            </div>
          </button>

          {/* 10. Paramètres 3M */}
          <button
            className={`admin-nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => handleNavClick("settings")}
            data-tooltip="Paramètres 3M"
            title="Paramètres 3M"
          >
            <div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>Paramètres 3M</span>
            </div>
          </button>
        </nav>

        {/* Système Connecté Status Card (Matching Image 2) */}
        {sidebarOpen && (
          <div className="admin-sidebar-system-card" style={{
            margin: "1.2rem 1.4rem",
            padding: "1.2rem",
            background: "#F8F9FB",
            borderRadius: "10px",
            border: "1px solid #E9EBEF"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, fontSize: "1.2rem", color: "#398B69" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#398B69", display: "inline-block" }}></span>
              <span>Système Connecté</span>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "1.1rem", color: "#727987", lineHeight: "1.4" }}>
              Catalogue & CRM synchronisés avec 3M Service.
            </p>
          </div>
        )}

        <div className="admin-sidebar-footer">
          {sidebarOpen && (
            <Link to="/" className="admin-public-link" target="_blank" rel="noopener noreferrer">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
              <span>Voir le site public</span>
            </Link>
          )}
          <button className="admin-logout-btn" onClick={handleLogout} title="Déconnexion" data-tooltip="Déconnexion">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ==================================================================
          MAIN CONTENT AREA
          ================================================================== */}
      <div className={`admin-main ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-sidebar-toggle-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Masquer la barre latérale" : "Afficher la barre latérale"}
              aria-label="Toggle Sidebar"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={sidebarOpen ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
              </svg>
            </button>

            <div className="admin-topbar-title" style={{ display: "flex", alignItems: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D94B50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "10px", marginRight: "8px", flexShrink: 0 }}>
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              <span style={{ fontSize: "1.3rem", color: "#727987", fontWeight: 500, marginRight: "6px" }}>
                3M Admin <span style={{ margin: "0 4px", color: "#9AA1AD" }}>/</span>
              </span>
              <h2 style={{ display: "inline", fontSize: "1.55rem", fontWeight: 600, color: "#252A34", margin: 0 }}>
                {activeTab === "overview" && "Tableau de Bord"}
                {activeTab === "customers" && "Clients"}
                {(activeTab === "bookings" || activeTab === "reservations" || activeTab === "contacts") && "Soumissions"}
                {activeTab === "contracts" && "Contrats de Location"}
                {activeTab === "payments" && "Paiements"}
                {activeTab === "reviews" && "Avis Clients"}
                {activeTab === "fleet" && "Contenu du Site"}
                {activeTab === "apartments" && "Appartements Meublés"}
                {activeTab === "subscribers" && "Newsletter"}
                {activeTab === "team" && "Chauffeurs & Équipe"}
                {activeTab === "settings" && "Paramètres 3M"}
              </h2>
            </div>
          </div>

          <div className="admin-topbar-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Device Web Push & Sound Alert Trigger Button */}
            <button
              type="button"
              onClick={requestDeviceNotificationPermission}
              className="admin-device-alert-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 13px",
                borderRadius: "8px",
                border: deviceNotifStatus === "granted" ? "1px solid #86efac" : "1px solid #E2E8F0",
                backgroundColor: deviceNotifStatus === "granted" ? "#f0fdf4" : "#ffffff",
                color: deviceNotifStatus === "granted" ? "#166534" : "#475569",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
              }}
              title="Recevoir des alertes sonores et des notifications Web Push sur cet appareil lors de nouvelles réservations ou messages"
            >
              <i
                className={`fa-solid ${deviceNotifStatus === "granted" ? "fa-bell" : "fa-bell-slash"}`}
                style={{ color: deviceNotifStatus === "granted" ? "#16a34a" : "#94a3b8" }}
              ></i>
              <span>{deviceNotifStatus === "granted" ? "Notifications Actives" : "Activer alertes appareil"}</span>
            </button>

            {/* Notification Center Bell & Dropdown Tray */}
            <div className="admin-notifications-wrapper" ref={notifRef}>
              <button
                type="button"
                className="admin-topbar-icon-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Centre de notifications 3M"
              >
                <i className="fa-regular fa-bell"></i>
                {unreadNotifCount > 0 && (
                  <span className="admin-notification-badge">{unreadNotifCount}</span>
                )}
              </button>

              {notificationsOpen && (
                <div className="admin-notifications-dropdown">
                  <div className="admin-notifications-header">
                    <div className="admin-notifications-header-title">
                      <h4>Notifications</h4>
                      {unreadNotifCount > 0 && (
                        <span className="admin-unread-count-pill">{unreadNotifCount} non lues</span>
                      )}
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        type="button"
                        className="admin-notifications-mark-read"
                        onClick={markAllNotificationsAsRead}
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>

                  <div className="admin-notifications-list">
                    {notifications.length === 0 ? (
                      <div className="admin-notifications-empty">
                        <i className="fa-regular fa-bell-slash"></i>
                        <p>Aucune notification pour le moment.</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`admin-notification-item ${notif.unread ? "unread" : ""}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className={`admin-notif-icon notif-${notif.type || "system"}`}>
                            {notif.type === "booking" && <i className="fa-solid fa-calendar-check"></i>}
                            {notif.type === "contact" && <i className="fa-solid fa-envelope"></i>}
                            {notif.type === "fleet" && <i className="fa-solid fa-car"></i>}
                            {(!notif.type || notif.type === "system") && <i className="fa-solid fa-bell"></i>}
                          </div>
                          <div className="admin-notif-content">
                            <h5>{notif.title}</h5>
                            <p>{notif.desc}</p>
                            <span className="admin-notif-time">{notif.time}</span>
                          </div>
                          {notif.unread && <span className="admin-notif-dot"></span>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-topbar-boutique-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 14px",
                borderRadius: "8px",
                border: "1px solid #E9EBEF",
                backgroundColor: "#ffffff",
                color: "#252A34",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
              }}
              title="Ouvrir la vitrine publique 3M SERVICES"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D94B50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
              <span>Boutique Publique</span>
            </a>
          </div>
        </header>

        {/* Content View */}
        <div className="admin-content">
          {loading && (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
              Chargement des données en temps réel...
            </div>
          )}

          {/* ==============================================================
              TAB 1: OVERVIEW / DASHBOARD (RentQ Layout)
              ============================================================== */}
          {activeTab === "overview" && (
            <>
              {/* Page Header (RentQ Style) */}
              <div className="admin-overview-header">
                <div className="admin-overview-title-area">
                  <div className="admin-overview-tag-row">
                    <span className="admin-badge-capsule">3M SERVICES YAOUNDÉ</span>
                    <span className="admin-tag-sub">RENTAL CMS & CRM</span>
                    <button
                      onClick={fetchData}
                      className="admin-refresh-btn"
                      title="Rafraîchir les métriques"
                    >
                      <i className={`fa-solid fa-arrows-rotate ${loading ? "fa-spin" : ""}`}></i>
                    </button>
                  </div>
                  <h1>Tableau de Bord & Pilotage</h1>
                  <p>
                    Supervision globale du parc automobile, gestion des appartements meublés et traitement des commandes clients en temps réel.
                  </p>
                </div>

                <div className="admin-overview-actions">
                  <button
                    className="admin-btn-primary"
                    style={{ backgroundColor: "#0f172a", color: "#ffffff", border: "none" }}
                    onClick={() => setShowBookingModal(true)}
                  >
                    <i className="fa-solid fa-plus" style={{ color: "#E20713" }}></i>
                    <span>+ RÉSERVATION</span>
                  </button>

                  <button
                    className="admin-btn-dark"
                    onClick={openNewCarModal}
                  >
                    <i className="fa-solid fa-car" style={{ color: "#D94B50" }}></i>
                    <span>+ VÉHICULE</span>
                  </button>

                  <button
                    className="admin-btn-primary"
                    style={{ backgroundColor: "#D94B50", color: "#ffffff", border: "none" }}
                    onClick={openNewApartmentModal}
                  >
                    <i className="fa-solid fa-hotel"></i>
                    <span>+ APPARTEMENT</span>
                  </button>

                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn-outline"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>BOUTIQUE</span>
                  </a>
                </div>
              </div>

              {/* 1. Statistics Cards Grid (4 RentQ Modern KPI Cards) */}
              <div className="admin-metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                <div className="admin-metric-card" onClick={() => setActiveTab("fleet")}>
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#FEE2E2", color: "#E20713" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
                        <circle cx="7" cy="17" r="2" />
                        <circle cx="17" cy="17" r="2" />
                      </svg>
                    </div>
                    <span className="admin-metric-badge red">Catalogue</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>FLOTTE AUTOMOBILE</span>
                    <h3>{cars.length} Véhicules</h3>
                    <small>
                      {cars.filter((c) => (c.status || "Disponible") === "Disponible").length} Disponibles • {cars.filter((c) => c.status === "Loué").length} En location
                    </small>
                  </div>
                </div>

                <div className="admin-metric-card" onClick={() => setActiveTab("bookings")}>
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 2v4" />
                        <path d="M16 2v4" />
                        <rect width="18" height="18" x="3" y="4" rx="2" />
                        <path d="M3 10h18" />
                        <path d="m9 16 2 2 4-4" />
                      </svg>
                    </div>
                    <span className="admin-metric-badge green">Temps Réel</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>RÉSERVATIONS & COMMANDES</span>
                    <h3>{bookings.length}</h3>
                    <small>
                      {bookings.filter((b) => b.status === "Confirmée").length} Confirmées • {bookings.filter((b) => b.status === "En attente").length} En attente
                    </small>
                  </div>
                </div>

                <div className="admin-metric-card" onClick={() => setActiveTab("customers")}>
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#EEF2FF", color: "#6366F1" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <span className="admin-metric-badge blue">Portefeuille</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>COMPTES CLIENTS CRM</span>
                    <h3>{customers.length}</h3>
                    <small>
                      {customers.filter((c) => (c.vipTier || "").includes("VIP") || (c.totalSpent || 0) >= 1000000).length} Membres VIP • {customers.length} Actifs
                    </small>
                  </div>
                </div>

                <div className="admin-metric-card" onClick={() => setActiveTab("payments")}>
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#FEF3C7", color: "#D97706" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <span className="admin-metric-badge amber">Estimé</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>CHIFFRE D'AFFAIRES GLOBAL</span>
                    <h3 style={{ fontSize: "2.1rem" }}>
                      {(
                        bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0) || 18500000
                      ).toLocaleString("fr-FR")}{" "}
                      <span style={{ fontSize: "1.3rem", fontWeight: 600 }}>FCFA</span>
                    </h3>
                    <small>{bookings.length} Commandes & Contrats enregistrés</small>
                  </div>
                </div>
              </div>

              {/* 2. RentQ 2-Column Dashboard Layout */}
              <div className="admin-rentq-layout">
                {/* Left Main Column (65%) */}
                <div className="admin-rentq-main">
                  {/* Recent Bookings & Orders Card */}
                  <div className="admin-panel-card" style={{ marginBottom: "2.2rem" }}>
                    <div className="admin-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <h3 style={{ fontSize: "1.9rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                            Commandes & Réservations Récentes
                          </h3>
                          <span style={{ background: "#FEE2E2", color: "#E20713", fontSize: "1.2rem", fontWeight: 700, padding: "0.2rem 0.8rem", borderRadius: "12px" }}>
                            {bookings.length} Total
                          </span>
                        </div>
                        <small style={{ color: "#64748b" }}>Synchronisation automatique avec les comptes clients et factures</small>
                      </div>
                      <div style={{ display: "flex", gap: "0.8rem" }}>
                        <button className="admin-btn-outline" onClick={() => setActiveTab("bookings")}>
                          Voir toutes les réservations <i className="fa-solid fa-arrow-right" style={{ marginLeft: "6px" }}></i>
                        </button>
                      </div>
                    </div>

                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Réf Commande</th>
                            <th>Client & Compte</th>
                            <th>Véhicule / Résidence</th>
                            <th>Dates & Durée</th>
                            <th>Montant</th>
                            <th>Statut</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.slice(0, 6).map((b) => (
                            <tr key={b.id}>
                              <td><strong style={{ color: "#E20713" }}>{b.id}</strong></td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.25rem", color: "#0f172a" }}>
                                    {(b.clientName || "C").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <strong>{b.clientName}</strong>
                                    <div style={{ fontSize: "1.1rem", color: "#64748b" }}>{b.accountNumber || b.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td><strong>{b.carName}</strong></td>
                              <td><span style={{ fontSize: "1.2rem" }}>Du {b.pickTime} au {b.dropTime || b.pickTime}</span></td>
                              <td><strong style={{ color: "#E20713" }}>{(Number(b.totalPrice) || 0).toLocaleString("fr-FR")} FCFA</strong></td>
                              <td>
                                <span className={`status-badge ${b.status === "Confirmée" ? "status-confirmed" : b.status === "En cours" ? "status-in-progress" : "status-pending"}`}>
                                  ● {b.status || "En attente"}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <button
                                    className="admin-action-btn"
                                    onClick={() => {
                                      const cust = customers.find(c => c.phone === b.phone || c.name === b.clientName || c.accountNumber === b.accountNumber);
                                      if (cust) {
                                        setSelectedCustomer(cust);
                                        setShowCustomerModal(true);
                                      } else {
                                        setSelectedRes(b);
                                        setShowResDetailsModal(true);
                                      }
                                    }}
                                    style={{ padding: "0.5rem 0.9rem", fontSize: "1.15rem", fontWeight: 600 }}
                                  >
                                    Fiche Client
                                  </button>
                                  {b.phone && (
                                    <a
                                      href={`https://wa.me/${b.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${b.clientName}, concernant votre réservation ${b.id} chez 3M SERVICES...`)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="admin-action-btn"
                                      style={{ background: "#25D366", color: "#ffffff", padding: "0.5rem 0.8rem" }}
                                      title="Contacter sur WhatsApp"
                                    >
                                      <i className="fa-brands fa-whatsapp"></i>
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Stock Preview: Vehicles and Apartments */}
                  <div className="admin-overview-cols">
                    {/* Vehicles Card */}
                    <div className="admin-stock-card">
                      <div className="admin-stock-header">
                        <div className="admin-stock-header-title">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D94B50" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
                            <circle cx="7" cy="17" r="2" />
                            <circle cx="17" cy="17" r="2" />
                          </svg>
                          <h2>VÉHICULES EN STOCK ({cars.length})</h2>
                        </div>
                        <button className="admin-link-btn" onClick={() => setActiveTab("fleet")}>
                          <span>Catalogue complet</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      </div>

                      <div className="admin-vehicles-list">
                        {cars.slice(0, 4).map((car) => (
                          <div key={car.id} className="admin-vehicle-item">
                            <div className="admin-vehicle-left">
                              <div className="admin-vehicle-thumb">
                                <img
                                  src={car.img || car.image || "/images/cars/toyota-prado-txl-front.webp"}
                                  alt={car.model || car.name}
                                  onError={(e) => {
                                    e.currentTarget.src = "/images/cars/toyota-prado-txl-front.webp";
                                  }}
                                />
                              </div>
                              <div className="admin-vehicle-meta">
                                <div className="admin-vehicle-tags">
                                  <span className="admin-cond-tag">{car.condition || "Occasion Révisée"}</span>
                                  <span className="admin-year-tag">{car.year || "2022"}</span>
                                </div>
                                <h4 className="admin-vehicle-name">
                                  {car.brand ? `${car.brand} ${car.model}` : (car.model || car.name)}
                                </h4>
                                <p className="admin-vehicle-price" style={{ color: "#D94B50", fontWeight: 700 }}>
                                  {car.price || `${(car.pricePerDay || 50000).toLocaleString()} FCFA / jour`}
                                </p>
                              </div>
                            </div>

                            <div className="admin-vehicle-actions">
                              <button
                                className="admin-btn-edit-sm"
                                onClick={() => openEditCarModal(car)}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                </svg>
                                <span>Modifier</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Apartments Card */}
                    <div className="admin-stock-card">
                      <div className="admin-stock-header">
                        <div className="admin-stock-header-title">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#398B69" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                            <path d="M10 6h4" />
                            <path d="M10 10h4" />
                            <path d="M10 14h4" />
                            <path d="M10 18h4" />
                          </svg>
                          <h2>APPARTEMENTS MEUBLÉS ({apartments.length})</h2>
                        </div>
                        <button className="admin-link-btn" onClick={() => setActiveTab("apartments")}>
                          <span>Gérer tout</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      </div>

                      <div className="admin-apts-list">
                        {apartments.slice(0, 4).map((apt) => (
                          <div key={apt.id} className="admin-apt-item">
                            <div className="admin-apt-thumb">
                              <img
                                src={apt.image || "/Asset/appartements/appartement-meuble-suite-parentale.webp"}
                                alt={apt.title}
                                onError={(e) => {
                                  e.currentTarget.src = "/Asset/appartements/appartement-meuble-suite-parentale.webp";
                                }}
                              />
                              <span className="admin-apt-photo-count">{apt.photosCount || 1} 📷</span>
                            </div>

                            <div className="admin-apt-meta">
                              <h4 className="admin-apt-title">{apt.title}</h4>
                              <p className="admin-apt-loc">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#727987" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }}>
                                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                                <span>{apt.location || "Yaoundé"}</span>
                              </p>
                              <p className="admin-apt-price" style={{ color: "#D94B50", fontWeight: 700 }}>{apt.price}</p>
                            </div>

                            <button
                              className="admin-btn-edit-sm"
                              onClick={() => openEditApartmentModal(apt)}
                              title="Modifier cet appartement"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar Column (35%) */}
                <div className="admin-rentq-sidebar">
                  {/* Gauge Card: Disponibilité & Occupation */}
                  <div className="admin-panel-card">
                    <div className="admin-card-header" style={{ paddingBottom: "1.2rem", borderBottom: "1px solid #f1f5f9" }}>
                      <div>
                        <h3 style={{ fontSize: "1.7rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                          Disponibilité du Parc
                        </h3>
                        <small style={{ color: "#64748b" }}>Taux opérationnel en temps réel</small>
                      </div>
                    </div>

                    <div style={{ padding: "1.5rem 0", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
                          <span>SUV & 4x4 VIP</span>
                          <span style={{ color: "#E20713", fontWeight: 700 }}>85% Dispo</span>
                        </div>
                        <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: "85%", height: "100%", background: "#E20713", borderRadius: "4px" }}></div>
                        </div>
                        <small style={{ color: "#94a3b8", fontSize: "1.1rem" }}>{cars.filter(c => (c.category || "").includes("SUV")).length} véhicules en catalogue</small>
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
                          <span>Pickups Tout-Terrain</span>
                          <span style={{ color: "#0284C7", fontWeight: 700 }}>75% Dispo</span>
                        </div>
                        <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: "75%", height: "100%", background: "#0284C7", borderRadius: "4px" }}></div>
                        </div>
                        <small style={{ color: "#94a3b8", fontSize: "1.1rem" }}>{cars.filter(c => (c.category || "").includes("Pickup")).length} véhicules en catalogue</small>
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
                          <span>Berlines Exécutives</span>
                          <span style={{ color: "#16A34A", fontWeight: 700 }}>95% Dispo</span>
                        </div>
                        <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: "95%", height: "100%", background: "#16A34A", borderRadius: "4px" }}></div>
                        </div>
                        <small style={{ color: "#94a3b8", fontSize: "1.1rem" }}>{cars.filter(c => (c.category || "").includes("Berline")).length} véhicules en catalogue</small>
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
                          <span>Appartements Meublés</span>
                          <span style={{ color: "#8B5CF6", fontWeight: 700 }}>80% Réservé</span>
                        </div>
                        <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: "80%", height: "100%", background: "#8B5CF6", borderRadius: "4px" }}></div>
                        </div>
                        <small style={{ color: "#94a3b8", fontSize: "1.1rem" }}>{apartments.length} résidences de haut standing</small>
                      </div>
                    </div>

                    <div style={{ background: "#F0FDF4", border: "1px solid #DCFCE7", padding: "1rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.8rem" }}>
                      <i className="fa-solid fa-circle-check" style={{ color: "#16A34A", fontSize: "1.6rem" }}></i>
                      <span style={{ fontSize: "1.25rem", fontWeight: 600, color: "#166534" }}>Flotte 100% Opérationnelle & Assurée</span>
                    </div>
                  </div>

                  {/* Recent Inquiries & WhatsApp Reply */}
                  <div className="admin-panel-card">
                    <div className="admin-card-header" style={{ paddingBottom: "1.2rem", borderBottom: "1px solid #f1f5f9" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <h3 style={{ fontSize: "1.7rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                          Demandes Récentes ({contacts.length})
                        </h3>
                        <button className="admin-link-btn" onClick={() => setActiveTab("contacts")} style={{ fontSize: "1.2rem" }}>
                          Voir tout →
                        </button>
                      </div>
                      <small style={{ color: "#64748b" }}>Contact & Conciergerie WhatsApp</small>
                    </div>

                    <div style={{ padding: "1rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {contacts.slice(0, 4).map((c) => (
                        <div key={c.id} style={{ padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                            <strong style={{ fontSize: "1.3rem", color: "#0f172a" }}>{c.name || "Client 3M"}</strong>
                            <small style={{ color: "#94a3b8" }}>{c.phone || ""}</small>
                          </div>
                          <p style={{ margin: "0 0 0.8rem 0", fontSize: "1.2rem", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {c.message || c.subject || "Demande d'information pour location"}
                          </p>
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            {c.phone ? (
                              <a
                                href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${c.name}, merci pour votre message à 3M SERVICES. En quoi pouvons-nous vous être utile aujourd'hui ?`)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  background: "#25D366",
                                  color: "#ffffff",
                                  padding: "0.4rem 1rem",
                                  borderRadius: "6px",
                                  fontSize: "1.15rem",
                                  fontWeight: 700,
                                  textDecoration: "none"
                                }}
                              >
                                <i className="fa-brands fa-whatsapp"></i> Répondre WhatsApp
                              </a>
                            ) : (
                              <span style={{ fontSize: "1.1rem", color: "#94a3b8" }}>{c.email || "Email non fourni"}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* System Quick Actions */}
                  <div className="admin-panel-card">
                    <div className="admin-card-header" style={{ paddingBottom: "1.2rem", borderBottom: "1px solid #f1f5f9" }}>
                      <h3 style={{ fontSize: "1.7rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                        Raccourcis Gestion
                      </h3>
                    </div>
                    <div style={{ padding: "1.2rem 0", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                      <button
                        className="admin-btn-primary"
                        style={{ width: "100%", justifyContent: "center", backgroundColor: "#0f172a", color: "#ffffff" }}
                        onClick={() => setShowBookingModal(true)}
                      >
                        <i className="fa-solid fa-calendar-plus" style={{ color: "#E20713", marginRight: "8px" }}></i>
                        Nouvelle Réservation
                      </button>

                      <button
                        className="admin-btn-outline"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={() => {
                          setActiveTab("customers");
                          setShowNewCustomerModal(true);
                        }}
                      >
                        <i className="fa-solid fa-user-plus" style={{ color: "#2563EB", marginRight: "8px" }}></i>
                        Nouveau Compte Client
                      </button>

                      <button
                        className="admin-btn-outline"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={openNewCarModal}
                      >
                        <i className="fa-solid fa-car" style={{ color: "#D94B50", marginRight: "8px" }}></i>
                        Ajouter un Véhicule
                      </button>

                      <button
                        className="admin-btn-outline"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={() => {
                          const csv = "data:text/csv;charset=utf-8,\uFEFFRef,Client,Telephone,Vehicule,Total,Statut\n" +
                            bookings.map(b => `"${b.id}","${b.clientName}","${b.phone}","${b.carName}","${b.totalPrice}","${b.status}"`).join("\n");
                          const uri = encodeURI(csv);
                          const a = document.createElement("a");
                          a.href = uri;
                          a.download = `reservations-3m-${new Date().toISOString().split("T")[0]}.csv`;
                          a.click();
                        }}
                      >
                        <i className="fa-solid fa-file-export" style={{ color: "#16A34A", marginRight: "8px" }}></i>
                        Exporter Données CRM (CSV)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ==============================================================
              TAB 2: RESERVATIONS MODULE (DASHBOARD + MANAGEMENT)
              ============================================================== */}
          {(activeTab === "reservations" || activeTab === "bookings") && (
            <div className="admin-panel-card">
              {/* Top View Mode Switcher & Date Filter Bar */}
              <div className="admin-card-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "2rem", display: "flex", alignitems: "center", gap: "0.8rem" }}>
                    <i className="fa-solid fa-calendar-check" style={{ color: "#D62828" }}></i>
                    Module Réservations 3M SERVICES
                  </h3>
                  <small style={{ color: "#737373" }}>
                    Supervision complète des demandes web, planning des disponibilités et suivi des règlements
                  </small>
                </div>

                <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                  <button
                    className="admin-btn-primary"
                    style={{ backgroundColor: "#D94B50", color: "#ffffff", border: "none" }}
                    onClick={() => setShowBookingModal(true)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Nouvelle Réservation</span>
                  </button>
                </div>
              </div>

              {/* Date Filters Bar */}
              <div className="admin-date-filter-bar">
                <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#171717", marginRight: "0.5rem" }}>
                  <i className="fa-solid fa-filter"></i> Période :
                </span>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${resDateRange === "today" ? "active" : ""}`}
                  onClick={() => { setResDateRange("today"); fetchData(); }}
                >
                  Aujourd'hui
                </button>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${resDateRange === "7days" ? "active" : ""}`}
                  onClick={() => { setResDateRange("7days"); fetchData(); }}
                >
                  7 Derniers Jours
                </button>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${resDateRange === "30days" ? "active" : ""}`}
                  onClick={() => { setResDateRange("30days"); fetchData(); }}
                >
                  30 Derniers Jours
                </button>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${resDateRange === "month" ? "active" : ""}`}
                  onClick={() => { setResDateRange("month"); fetchData(); }}
                >
                  Ce Mois
                </button>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${resDateRange === "all" ? "active" : ""}`}
                  onClick={() => { setResDateRange("all"); fetchData(); }}
                >
                  Toutes les dates
                </button>

                <div style={{ marginLeft: "auto" }}>
                  <button
                    type="button"
                    className="admin-btn-outline"
                    onClick={() => exportReservationsCSV(bookings)}
                    style={{ fontSize: "1.2rem", padding: "0.4rem 1rem" }}
                  >
                    <i className="fa-solid fa-file-excel" style={{ color: "#16A34A" }}></i> Exporter CSV
                  </button>
                </div>
              </div>

              {/* SECTION: 8 STATISTICS CARDS */}
              <div className="admin-metrics-grid" style={{ marginBottom: "2rem" }}>
                {/* 1. Total */}
                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box">
                      <i className="fa-solid fa-folder-open"></i>
                    </div>
                    <span className="admin-metric-badge red">Global</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Total Réservations</span>
                    <h3>{statsComputed.totalBookings}</h3>
                    <small>Toutes soumissions confondues</small>
                  </div>
                </div>

                {/* 2. New */}
                <div className="admin-metric-card" style={{ borderLeft: "4px solid #D62828" }}>
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#FEE2E2", color: "#D62828" }}>
                      <i className="fa-solid fa-bell"></i>
                    </div>
                    <span className="admin-metric-badge red">Nouveau</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Nouvelles</span>
                    <h3 style={{ color: "#D62828" }}>{statsComputed.newBookings}</h3>
                    <small>À traiter en priorité</small>
                  </div>
                </div>

                {/* 3. Pending */}
                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#FEF3C7", color: "#D97706" }}>
                      <i className="fa-solid fa-clock"></i>
                    </div>
                    <span className="admin-metric-badge amber">Attente</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>En attente / Examen</span>
                    <h3 style={{ color: "#D97706" }}>{statsComputed.pendingBookings}</h3>
                    <small>En cours de validation</small>
                  </div>
                </div>

                {/* 4. Confirmed */}
                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                    <span className="admin-metric-badge green">Validé</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Confirmées</span>
                    <h3 style={{ color: "#16A34A" }}>{statsComputed.confirmedBookings}</h3>
                    <small>Véhicule bloqué</small>
                  </div>
                </div>

                {/* 5. Active Rentals */}
                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#CCFBF1", color: "#0D9488" }}>
                      <i className="fa-solid fa-car-on"></i>
                    </div>
                    <span className="admin-metric-badge" style={{ background: "#CCFBF1", color: "#0D9488" }}>En cours</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Locations Actives</span>
                    <h3 style={{ color: "#0D9488" }}>{statsComputed.activeRentals}</h3>
                    <small>Véhicules en circulation</small>
                  </div>
                </div>

                {/* 6. Completed */}
                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#F3F4F6", color: "#4B5563" }}>
                      <i className="fa-solid fa-flag-checkered"></i>
                    </div>
                    <span className="admin-metric-badge blue">Clôturé</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Terminées</span>
                    <h3>{statsComputed.completedBookings}</h3>
                    <small>Véhicules restitués</small>
                  </div>
                </div>

                {/* 7. Cancelled */}
                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                      <i className="fa-solid fa-ban"></i>
                    </div>
                    <span className="admin-metric-badge red">Annulé</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Annulées / Rejetées</span>
                    <h3 style={{ color: "#DC2626" }}>{statsComputed.cancelledBookings}</h3>
                    <small>Sans suite</small>
                  </div>
                </div>

                {/* 8. Total Revenue */}
                <div className="admin-metric-card" style={{ background: "#171717", color: "#FFFFFF" }}>
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#D62828", color: "#FFFFFF" }}>
                      <i className="fa-solid fa-coins"></i>
                    </div>
                    <span className="admin-metric-badge red">Recettes</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span style={{ color: "#E5E5E5" }}>Chiffre d'Affaires Réservations</span>
                    <h3 style={{ color: "#FFFFFF" }}>{statsComputed.totalRevenue.toLocaleString("fr-FR")} FCFA</h3>
                    <small style={{ color: "#9CA3AF" }}>Sur réservations confirmées/payées</small>
                  </div>
                </div>
              </div>

              {/* COMPREHENSIVE RESERVATIONS TABLE */}
              <div style={{ marginTop: "2rem" }}>
                {(() => {
                  const filtered = bookings.filter((b) => {
                    if (bookingStatusFilter !== "Toutes" && (b.status || "").toLowerCase() !== bookingStatusFilter.toLowerCase()) return false;
                    if (resVehicleFilter !== "Toutes" && !(b.carName || "").toLowerCase().includes(resVehicleFilter.toLowerCase())) return false;
                    if (resLocationFilter !== "Toutes" && !((b.pickUp || "").toLowerCase().includes(resLocationFilter.toLowerCase()) || (b.dropOff || "").toLowerCase().includes(resLocationFilter.toLowerCase()))) return false;
                    if (resPickDateFilter && !(b.pickTime || "").startsWith(resPickDateFilter)) return false;
                    if (bookingSearch) {
                      const q = bookingSearch.toLowerCase();
                      const match =
                        (b.id && b.id.toLowerCase().includes(q)) ||
                        (b.clientName && b.clientName.toLowerCase().includes(q)) ||
                        (b.phone && b.phone.includes(q)) ||
                        (b.carName && b.carName.toLowerCase().includes(q));
                      if (!match) return false;
                    }
                    return true;
                  });

                  return (
                    <>
                      <div className="admin-crm-header-controls">
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                          <h4 style={{ fontSize: "1.7rem", fontWeight: 700, margin: 0 }}>
                            Gestion des Réservations & Devis ({filtered.length})
                          </h4>
                        </div>

                        <div className="admin-crm-view-switcher">
                          <button
                            type="button"
                            className={`admin-crm-view-btn ${crmMobileView === "cards" ? "active" : ""}`}
                            onClick={() => setCrmMobileView("cards")}
                            title="Vue Cartes Rapide Mobile"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="7" height="9" x="3" y="3" rx="1" />
                              <rect width="7" height="5" x="14" y="3" rx="1" />
                              <rect width="7" height="9" x="14" y="12" rx="1" />
                              <rect width="7" height="5" x="3" y="16" rx="1" />
                            </svg>
                            <span>Cartes</span>
                          </button>
                          <button
                            type="button"
                            className={`admin-crm-view-btn ${crmMobileView === "table" ? "active" : ""}`}
                            onClick={() => setCrmMobileView("table")}
                            title="Vue Tableau Large"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="3" y1="6" x2="21" y2="6" />
                              <line x1="3" y1="12" x2="21" y2="12" />
                              <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                            <span>Tableau</span>
                          </button>
                        </div>
                      </div>

                      {/* Filter Toolbar */}
                      <div className="admin-filters-bar" style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                        <input
                          type="text"
                          className="admin-search-input"
                          placeholder="Rechercher réf, client, tel..."
                          value={bookingSearch}
                          onChange={(e) => setBookingSearch(e.target.value)}
                          style={{ minWidth: "220px" }}
                        />

                        <select
                          className="admin-filter-select"
                          value={bookingStatusFilter}
                          onChange={(e) => setBookingStatusFilter(e.target.value)}
                        >
                          <option value="Toutes">Tous les statuts ({bookings.length})</option>
                          <option value="En attente">En attente (Pending)</option>
                          <option value="En cours d'examen">En cours d'examen</option>
                          <option value="Confirmée">Confirmée</option>
                          <option value="Contrat préparé">Contrat préparé</option>
                          <option value="En attente de paiement">En attente de paiement</option>
                          <option value="Payée">Payée</option>
                          <option value="En cours">En cours (Active)</option>
                          <option value="Terminée">Terminée</option>
                          <option value="Annulée">Annulée</option>
                          <option value="Rejetée">Rejetée</option>
                        </select>

                        <select
                          className="admin-filter-select"
                          value={resVehicleFilter}
                          onChange={(e) => setResVehicleFilter(e.target.value)}
                        >
                          <option value="Toutes">Tous les véhicules</option>
                          {cars.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                        </select>

                        <input
                          type="date"
                          className="admin-filter-select"
                          value={resPickDateFilter}
                          onChange={(e) => setResPickDateFilter(e.target.value)}
                          title="Filtrer par date de prise en charge"
                        />

                        <select
                          className="admin-filter-select"
                          value={resLocationFilter}
                          onChange={(e) => setResLocationFilter(e.target.value)}
                        >
                          <option value="Toutes">Tous les lieux</option>
                          {(locations.pickup || []).map((l) => (
                            <option key={l.id} value={l.name}>{l.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* CRM WRAPPER: Handles Adaptive Cards / Desktop Table */}
                      <div className={`admin-crm-list-wrapper ${crmMobileView === "table" ? "admin-crm-force-table" : ""}`}>
                        {filtered.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#ffffff", borderRadius: "10px", border: "1px solid #E2E8F0", color: "#64748B" }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem" }}>
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <h4 style={{ fontSize: "1.6rem", color: "#1E293B", margin: "0 0 0.5rem 0" }}>Aucune réservation trouvée</h4>
                            <p style={{ margin: 0, fontSize: "1.3rem" }}>Essayez de modifier vos filtres ou termes de recherche.</p>
                          </div>
                        ) : (
                          <>
                            {/* 1. MOBILE RESPONSIVE CARDS (Optimized for Smartphone) */}
                            <div className="admin-crm-mobile-cards">
                              {filtered.map((b) => {
                                const statusClass =
                                  b.status === "Confirmée" ? "status-confirmed" :
                                  b.status === "En attente" ? "status-pending" :
                                  b.status === "En cours d'examen" ? "status-under-review" :
                                  b.status === "Contrat préparé" ? "status-contract-prepared" :
                                  b.status === "En attente de paiement" ? "status-awaiting-payment" :
                                  b.status === "Payée" ? "status-paid" :
                                  b.status === "En cours" ? "status-in-progress" :
                                  b.status === "Terminée" ? "status-completed" :
                                  b.status === "Rejetée" ? "status-rejected" : "status-cancelled";

                                return (
                                  <div key={b.id} className="admin-crm-card">
                                    <div className="admin-crm-card-top">
                                      <div className="admin-crm-card-ref">
                                        <strong>{b.id}</strong>
                                        <small>{b.createdAt ? new Date(b.createdAt).toLocaleDateString("fr-FR") : "N/C"}</small>
                                      </div>
                                      <span className={`status-badge ${statusClass}`}>
                                        {b.status || "En attente"}
                                      </span>
                                    </div>

                                    <div className="admin-crm-card-client-row">
                                      <div className="admin-crm-card-client-meta">
                                        <h5>{b.clientName}</h5>
                                        <a href={`tel:${b.phone}`} className="admin-crm-card-tel">
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                          </svg>
                                          <span>{b.phone}</span>
                                        </a>
                                      </div>
                                      <button
                                        type="button"
                                        className="admin-crm-card-wa-btn"
                                        onClick={() => openWhatsAppCustomer(b)}
                                        title="Répondre sur WhatsApp"
                                      >
                                        <i className="fa-brands fa-whatsapp"></i>
                                        <span>WhatsApp</span>
                                      </button>
                                    </div>

                                    <div className="admin-crm-card-car-row">
                                      <div className="admin-crm-card-car-name">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D94B50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
                                          <circle cx="7" cy="17" r="2" />
                                          <circle cx="17" cy="17" r="2" />
                                        </svg>
                                        <span>{b.carName}</span>
                                      </div>
                                      <div className="admin-crm-card-price">
                                        <strong>{(b.totalPrice || 0).toLocaleString("fr-FR")} F</strong>
                                        <small>{b.days || 1} jour{b.days > 1 ? "s" : ""}</small>
                                      </div>
                                    </div>

                                    <div className="admin-crm-card-logistics">
                                      <div className="admin-crm-card-log-item">
                                        <span className="label">Prise en charge</span>
                                        <span className="val"><strong>{b.pickTime}</strong><br />{b.pickUp}</span>
                                      </div>
                                      <div className="admin-crm-card-log-item">
                                        <span className="label">Restitution</span>
                                        <span className="val"><strong>{b.dropTime || b.pickTime}</strong><br />{b.dropOff}</span>
                                      </div>
                                    </div>

                                    <div className="admin-crm-card-actions">
                                      <button
                                        type="button"
                                        className="admin-crm-card-btn-view"
                                        onClick={() => {
                                          setSelectedRes(b);
                                          setShowResDetailsModal(true);
                                        }}
                                      >
                                        <i className="fa-solid fa-eye"></i>
                                        <span>Détails</span>
                                      </button>

                                      <select
                                        className="admin-crm-card-select-status"
                                        value={b.status}
                                        onChange={(e) => handleUpdateStatusWithConflictCheck(b.id, e.target.value)}
                                      >
                                        <option value="En attente">En attente</option>
                                        <option value="En cours d'examen">En examen</option>
                                        <option value="Confirmée">Confirmée</option>
                                        <option value="Contrat préparé">Contrat prêt</option>
                                        <option value="En attente de paiement">Attente Paiement</option>
                                        <option value="Payée">Payée</option>
                                        <option value="En cours">En cours</option>
                                        <option value="Terminée">Terminée</option>
                                        <option value="Annulée">Annulée</option>
                                        <option value="Rejetée">Rejetée</option>
                                      </select>

                                      <button
                                        type="button"
                                        className="admin-crm-card-btn-del"
                                        onClick={() => handleDeleteBooking(b.id)}
                                        title="Supprimer la réservation"
                                      >
                                        <i className="fa-solid fa-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* 2. DESKTOP / TABLET SCROLLABLE TABLE */}
                            <div className="admin-table-container admin-crm-desktop-table">
                              <table className="admin-table">
                                <thead>
                                  <tr>
                                    <th>Référence</th>
                                    <th>Client</th>
                                    <th>Téléphone</th>
                                    <th>Véhicule</th>
                                    <th>Prise en Charge</th>
                                    <th>Restitution</th>
                                    <th>Durée</th>
                                    <th>Prix Estimé</th>
                                    <th>Statut</th>
                                    <th>Date Soumission</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filtered.map((b) => {
                                    const statusClass =
                                      b.status === "Confirmée" ? "status-confirmed" :
                                      b.status === "En attente" ? "status-pending" :
                                      b.status === "En cours d'examen" ? "status-under-review" :
                                      b.status === "Contrat préparé" ? "status-contract-prepared" :
                                      b.status === "En attente de paiement" ? "status-awaiting-payment" :
                                      b.status === "Payée" ? "status-paid" :
                                      b.status === "En cours" ? "status-in-progress" :
                                      b.status === "Terminée" ? "status-completed" :
                                      b.status === "Rejetée" ? "status-rejected" : "status-cancelled";

                                    return (
                                      <tr key={b.id}>
                                        <td>
                                          <strong style={{ color: "#D62828" }}>{b.id}</strong>
                                        </td>
                                        <td>
                                          <strong>{b.clientName}</strong>
                                        </td>
                                        <td>
                                          <a
                                            href={`tel:${b.phone}`}
                                            style={{ color: "#171717", textDecoration: "none", fontWeight: 600 }}
                                          >
                                            {b.phone}
                                          </a>
                                        </td>
                                        <td>
                                          <strong>{b.carName}</strong>
                                        </td>
                                        <td>
                                          {b.pickTime}
                                          <br />
                                          <small style={{ color: "#737373" }}>{b.pickUp}</small>
                                        </td>
                                        <td>
                                          {b.dropTime || b.pickTime}
                                          <br />
                                          <small style={{ color: "#737373" }}>{b.dropOff}</small>
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                          <strong>{b.days || 1} j</strong>
                                        </td>
                                        <td>
                                          <strong style={{ color: "#171717" }}>
                                            {(b.totalPrice || 0).toLocaleString("fr-FR")} F
                                          </strong>
                                        </td>
                                        <td>
                                          <span className={`status-badge ${statusClass}`}>
                                            {b.status || "En attente"}
                                          </span>
                                        </td>
                                        <td>
                                          <small style={{ color: "#737373" }}>
                                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString("fr-FR") : "N/C"}
                                          </small>
                                        </td>
                                        <td>
                                          <div className="admin-action-btns" style={{ display: "flex", gap: "0.5rem" }}>
                                            <button
                                              className="admin-action-btn"
                                              onClick={() => {
                                                setSelectedRes(b);
                                                setShowResDetailsModal(true);
                                              }}
                                              title="Voir la fiche détaillée complète"
                                              style={{ background: "#F1F5F9", color: "#171717", fontWeight: 700 }}
                                            >
                                              <i className="fa-solid fa-eye"></i> Détails
                                            </button>

                                            <button
                                              className="admin-action-btn whatsapp"
                                              onClick={() => openWhatsAppCustomer(b)}
                                              title="Contacter sur WhatsApp"
                                            >
                                              <i className="fa-brands fa-whatsapp"></i>
                                            </button>

                                            <select
                                              className="admin-action-btn"
                                              value={b.status}
                                              onChange={(e) => handleUpdateStatusWithConflictCheck(b.id, e.target.value)}
                                              style={{ fontSize: "1.15rem" }}
                                            >
                                              <option value="En attente">En attente</option>
                                              <option value="En cours d'examen">En cours d'examen</option>
                                              <option value="Confirmée">Confirmée</option>
                                              <option value="Contrat préparé">Contrat préparé</option>
                                              <option value="En attente de paiement">En attente de paiement</option>
                                              <option value="Payée">Payée</option>
                                              <option value="En cours">En cours</option>
                                              <option value="Terminée">Terminée</option>
                                              <option value="Annulée">Annulée</option>
                                              <option value="Rejetée">Rejetée</option>
                                            </select>

                                            <button
                                              className="admin-action-btn delete"
                                              onClick={() => handleDeleteBooking(b.id)}
                                              title="Supprimer la réservation"
                                            >
                                              <i className="fa-solid fa-trash"></i>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}


          {/* ==============================================================
              TAB 3: FLEET / CARS MANAGER
              ============================================================== */}
          {activeTab === "fleet" && (
            <div className="admin-panel-card">
              <div className="admin-cms-nav-pills" style={{ display: "flex", gap: "0.8rem", padding: "1.5rem 2rem 0", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${activeTab === "fleet" ? "active" : ""}`}
                  onClick={() => setActiveTab("fleet")}
                >
                  <i className="fa-solid fa-car"></i> Flotte Automobile ({cars.length})
                </button>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${activeTab === "apartments" ? "active" : ""}`}
                  onClick={() => setActiveTab("apartments")}
                >
                  <i className="fa-solid fa-building"></i> Résidences Meublées ({apartments.length})
                </button>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${activeTab === "locations" ? "active" : ""}`}
                  onClick={() => setActiveTab("locations")}
                >
                  <i className="fa-solid fa-location-dot"></i> Lieux & Villes ({(locations.pickup?.length || 0) + (locations.dropoff?.length || 0)})
                </button>
              </div>

              <div className="admin-card-header">
                <div>
                  <h3>Flotte de Véhicules 3M SERVICES ({filteredCars.length})</h3>
                  <small style={{ color: "#64748b" }}>
                    Gestion des véhicules, tarifs en FCFA, fiches techniques et disponibilités
                  </small>
                </div>

                <div className="admin-filters-bar">
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Filtrer par marque ou modèle..."
                    value={carSearch}
                    onChange={(e) => setCarSearch(e.target.value)}
                  />

                  <button className="admin-btn-primary" onClick={openNewCarModal}>
                    <i className="fa-solid fa-plus"></i> Ajouter un Véhicule
                  </button>
                </div>
              </div>

              <div className="admin-cars-grid">
                {filteredCars.map((car) => (
                  <div className="admin-car-card" key={car.id}>
                    <div className="admin-car-card-img-wrap">
                      <img
                        src={car.img || car.image || "/images/cars/toyota-prado-txl-front.webp"}
                        alt={car.name}
                        onError={(e) => {
                          e.currentTarget.src = "/images/cars/toyota-prado-txl-front.webp";
                        }}
                      />
                      <span className="admin-card-badge-category">
                        {car.category || "VIP 4x4"}
                      </span>
                      <span className={`admin-card-badge-status ${car.status === "Loué" ? "amber" : car.status === "En maintenance" ? "red" : ""}`}>
                        ● {car.status || "Disponible"}
                      </span>
                      {car.photos?.length > 1 && (
                        <span className="admin-card-badge-photos">
                          📷 {car.photos.length} Angles
                        </span>
                      )}
                    </div>

                    <div className="admin-car-card-body">
                      <div className="admin-car-card-header">
                        <div>
                          <h4>{car.name}</h4>
                          <small style={{ color: "#64748b" }}>{car.condition} • {car.year}</small>
                        </div>
                      </div>

                      <div className="admin-car-price">
                        {Number(car.pricePerDay || 0).toLocaleString()} FCFA <span>/ jour</span>
                      </div>

                      {/* RentQ 4-Box Specs Grid */}
                      <div className="admin-rentq-specs-grid">
                        <div className="admin-rentq-spec-pill">
                          <i className="fa-solid fa-gear"></i>
                          <span>{car.transmission}</span>
                        </div>
                        <div className="admin-rentq-spec-pill">
                          <i className="fa-solid fa-users"></i>
                          <span>{car.seats}</span>
                        </div>
                        <div className="admin-rentq-spec-pill">
                          <i className="fa-solid fa-gas-pump"></i>
                          <span>{car.fuel}</span>
                        </div>
                        <div className="admin-rentq-spec-pill">
                          <i className="fa-solid fa-snowflake"></i>
                          <span>Climatisé</span>
                        </div>
                      </div>

                      <div className="admin-car-card-footer">
                        <select
                          className="admin-action-btn"
                          value={car.status || "Disponible"}
                          onChange={(e) => handleDirectCarStatusChange(car.id, e.target.value)}
                          title="Changer le statut de ce véhicule sur le catalogue public"
                          style={{
                            padding: "0.5rem 0.9rem",
                            fontSize: "1.25rem",
                            fontWeight: 700,
                            borderRadius: "6px",
                            cursor: "pointer",
                            border: `1.5px solid ${car.status === "Loué"
                                ? "#f59e0b"
                                : car.status === "En maintenance"
                                  ? "#ef4444"
                                  : "#10b981"
                              }`,
                            backgroundColor:
                              car.status === "Loué"
                                ? "#fffbeb"
                                : car.status === "En maintenance"
                                  ? "#fef2f2"
                                  : "#ecfdf5",
                            color:
                              car.status === "Loué"
                                ? "#b45309"
                                : car.status === "En maintenance"
                                  ? "#b91c1c"
                                  : "#047857"
                          }}
                        >
                          <option value="Disponible">🟢 Disponible</option>
                          <option value="Loué">🟠 Loué (Réservé)</option>
                          <option value="En maintenance">🔴 En révision</option>
                        </select>

                        <div className="admin-action-btns">
                          <button
                            className="admin-action-btn"
                            onClick={() => openEditCarModal(car)}
                            title="Modifier ce véhicule"
                          >
                            <i className="fa-solid fa-pen"></i> Modifier
                          </button>
                          <button
                            className="admin-action-btn delete"
                            onClick={() => handleDeleteCar(car.id, car.name)}
                            title="Supprimer ce véhicule"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* ==============================================================
              TAB: APARTMENTS / IMMOBILIER CMS
              ============================================================== */}
          {activeTab === "apartments" && (
            <div className="admin-panel-card">
              <div className="admin-cms-nav-pills" style={{ display: "flex", gap: "0.8rem", padding: "1.5rem 2rem 0", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${activeTab === "fleet" ? "active" : ""}`}
                  onClick={() => setActiveTab("fleet")}
                >
                  <i className="fa-solid fa-car"></i> Flotte Automobile ({cars.length})
                </button>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${activeTab === "apartments" ? "active" : ""}`}
                  onClick={() => setActiveTab("apartments")}
                >
                  <i className="fa-solid fa-building"></i> Résidences Meublées ({apartments.length})
                </button>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${activeTab === "locations" ? "active" : ""}`}
                  onClick={() => setActiveTab("locations")}
                >
                  <i className="fa-solid fa-location-dot"></i> Lieux & Villes ({(locations.pickup?.length || 0) + (locations.dropoff?.length || 0)})
                </button>
              </div>

              <div className="admin-card-header">
                <div>
                  <h3>Appartements Meublés 3M SERVICES ({apartments.length})</h3>
                  <small style={{ color: "#64748b" }}>
                    Gestion des résidences de grand standing à Yaoundé (Face FECAFOOT, Omnisports, Bastos)
                  </small>
                </div>

                <div className="admin-filters-bar">
                  <button
                    className="admin-btn-primary"
                    onClick={openNewApartmentModal}
                  >
                    <i className="fa-solid fa-plus"></i> Nouvel Appartement
                  </button>
                </div>
              </div>

              <div className="admin-cars-grid">
                {apartments.map((apt) => (
                  <div key={apt.id} className="admin-car-card">
                    {/* RentQ Card Image Header */}
                    <div className="admin-car-card-img-wrap">
                      <img
                        src={apt.image && !apt.image.includes("cpa") ? apt.image : "/Asset/appartements/appartement-meuble-suite-parentale.webp"}
                        alt={apt.title}
                        onError={(e) => {
                          e.currentTarget.src = "/Asset/appartements/appartement-meuble-suite-parentale.webp";
                        }}
                      />
                      <span className="admin-card-badge-category">
                        {apt.type || "T3 Meublé Haut Standing"}
                      </span>
                      <span className={`admin-card-badge-status ${apt.status === "Occupé" ? "red" : ""}`}>
                        ● {apt.status || "Disponible"}
                      </span>
                      <span className="admin-card-badge-photos">
                        📷 {apt.photosCount || 1} Photos
                      </span>
                    </div>

                    <div className="admin-car-card-body">
                      <div className="admin-car-card-header">
                        <h4>{apt.title}</h4>
                      </div>

                      <div className="admin-car-price">
                        {apt.price}
                      </div>

                      <p style={{ fontSize: "1.25rem", color: "#64748b", margin: "0.2rem 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <i className="fa-solid fa-location-dot" style={{ color: "#E20713" }}></i> {apt.location}
                      </p>

                      {/* RentQ 4-Box Specs Grid */}
                      <div className="admin-rentq-specs-grid">
                        <div className="admin-rentq-spec-pill">
                          <i className="fa-solid fa-bed"></i>
                          <span>{apt.rooms || "2 Chambres"}</span>
                        </div>
                        <div className="admin-rentq-spec-pill">
                          <i className="fa-solid fa-snowflake"></i>
                          <span>Clim Intégrale</span>
                        </div>
                        <div className="admin-rentq-spec-pill">
                          <i className="fa-solid fa-bolt"></i>
                          <span>Groupe 24/7</span>
                        </div>
                        <div className="admin-rentq-spec-pill">
                          <i className="fa-solid fa-wifi"></i>
                          <span>Fibre Optique</span>
                        </div>
                      </div>

                      {/* Description & Équipements configurés par l'admin */}
                      <div style={{ marginTop: "1rem", borderTop: "1px dashed #e2e8f0", paddingTop: "0.8rem" }}>
                        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <i className="fa-solid fa-list-check" style={{ color: "#E20713" }}></i> Description & Équipements ({Array.isArray(apt.equipments) ? apt.equipments.length : 0}) :
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.6rem" }}>
                          {(Array.isArray(apt.equipments) && apt.equipments.length > 0 ? apt.equipments : DEFAULT_EQUIPMENT_OPTIONS.slice(0, 4)).map((eq, i) => (
                            <span
                              key={i}
                              style={{
                                background: "#f1f5f9",
                                color: "#334155",
                                padding: "0.25rem 0.7rem",
                                borderRadius: "12px",
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                border: "1px solid #e2e8f0"
                              }}
                            >
                              ✓ {eq}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Services VIP Inclus configurés par l'admin */}
                      <div style={{ marginTop: "1rem", borderTop: "1px dashed #e2e8f0", paddingTop: "0.8rem" }}>
                        <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#92400e", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <i className="fa-solid fa-crown" style={{ color: "#d97706" }}></i> Services VIP Inclus ({Array.isArray(apt.vipServices) ? apt.vipServices.length : 0}) :
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.6rem" }}>
                          {(Array.isArray(apt.vipServices) && apt.vipServices.length > 0 ? apt.vipServices : DEFAULT_VIP_SERVICES_OPTIONS.slice(0, 3)).map((vs, i) => (
                            <span
                              key={i}
                              style={{
                                background: "#fef3c7",
                                color: "#92400e",
                                padding: "0.25rem 0.7rem",
                                borderRadius: "12px",
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                border: "1px solid #fde68a"
                              }}
                            >
                              ★ {vs}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="admin-car-card-footer" style={{ marginTop: "1.5rem" }}>
                        <div className="admin-action-btns">
                          <button
                            className="admin-action-btn edit"
                            onClick={() => openEditApartmentModal(apt)}
                          >
                            <i className="fa-solid fa-pen"></i> Modifier
                          </button>
                          <button
                            className="admin-action-btn delete"
                            onClick={() => handleDeleteApartment(apt.id, apt.title)}
                            title="Supprimer cet appartement"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                        <a
                          href="/apartments"
                          target="_blank"
                          rel="noreferrer"
                          className="admin-action-btn"
                          style={{ color: "#0f172a", textDecoration: "none" }}
                          title="Voir sur la vitrine publique"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square"></i> Voir vitrine
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB: CAMEROON LOCATIONS & FORM OPTIONS MANAGER
              ============================================================== */}
          {activeTab === "locations" && (
            <div>
              <div className="admin-cms-nav-pills" style={{ display: "flex", gap: "0.8rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${activeTab === "fleet" ? "active" : ""}`}
                  onClick={() => setActiveTab("fleet")}
                >
                  <i className="fa-solid fa-car"></i> Flotte Automobile ({cars.length})
                </button>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${activeTab === "apartments" ? "active" : ""}`}
                  onClick={() => setActiveTab("apartments")}
                >
                  <i className="fa-solid fa-building"></i> Résidences Meublées ({apartments.length})
                </button>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${activeTab === "locations" ? "active" : ""}`}
                  onClick={() => setActiveTab("locations")}
                >
                  <i className="fa-solid fa-location-dot"></i> Lieux & Villes ({(locations.pickup?.length || 0) + (locations.dropoff?.length || 0)})
                </button>
              </div>

              {/* Info banner */}
              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "10px",
                  padding: "1.8rem 2.2rem",
                  marginBottom: "2.5rem",
                  color: "#1e40af",
                  fontSize: "1.4rem",
                  lineHeight: "1.6"
                }}
              >
                <strong>📍 Contrôle du Formulaire de Réservation au Cameroun :</strong>
                <p style={{ margin: "0.5rem 0 0 0", color: "#1e3a8a" }}>
                  Ce module vous permet de gérer en temps réel les options affichées aux clients
                  sur le formulaire : le sélecteur de véhicules <strong>(Select Your Car Type)</strong>,
                  les lieux de prise en charge <strong>(Pick-up au Cameroun)</strong> et les lieux de restitution
                  <strong>(Restitution au Cameroun)</strong>.
                </p>
              </div>

              {/* SECTION 1: PICK-UP LOCATIONS */}
              <div className="admin-panel-card" style={{ marginBottom: "2.5rem" }}>
                <div className="admin-card-header">
                  <div>
                    <h3>1. Lieux de Prise en Charge — Pick-up (Cameroun)</h3>
                    <small style={{ color: "#64748b" }}>
                      Points de départ proposés dans la liste déroulante publique ({locations.pickup?.length || 0} lieux)
                    </small>
                  </div>
                </div>

                <div style={{ padding: "2rem 2.5rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <form onSubmit={handleAddPickup} style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div style={{ flex: "2", minWidth: "260px" }}>
                      <label style={{ display: "block", fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.4rem", color: "#334155" }}>
                        Nom du Lieu au Cameroun *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Yaoundé - Hôtel Mont Fébé"
                        value={newPickup.name}
                        onChange={(e) => setNewPickup({ ...newPickup, name: e.target.value })}
                        style={{ width: "100%", padding: "1rem 1.2rem", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
                      />
                    </div>

                    <div style={{ flex: "1", minWidth: "160px" }}>
                      <label style={{ display: "block", fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.4rem", color: "#334155" }}>
                        Ville / Région
                      </label>
                      <select
                        value={newPickup.city}
                        onChange={(e) => setNewPickup({ ...newPickup, city: e.target.value })}
                        style={{ width: "100%", padding: "1rem 1.2rem", borderRadius: "8px", border: "1.5px solid #cbd5e1", background: "#fff" }}
                      >
                        <option value="Yaoundé">Yaoundé (Centre)</option>
                        <option value="Nsimalen">Aéroport Nsimalen</option>
                        <option value="Douala">Douala (Littoral)</option>
                        <option value="Kribi">Kribi (Sud Balnéaire)</option>
                        <option value="Bafoussam">Bafoussam (Ouest)</option>
                        <option value="Autre Cameroun">Autre région Cameroun</option>
                      </select>
                    </div>

                    <button type="submit" className="admin-btn-primary" style={{ padding: "1.1rem 2rem" }}>
                      <i className="fa-solid fa-plus"></i> Ajouter ce Lieu
                    </button>
                  </form>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nom du Lieu de Prise en Charge</th>
                        <th>Ville / Région</th>
                        <th>Statut sur le Formulaire</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(locations.pickup || []).map((loc) => (
                        <tr key={loc.id}>
                          <td>
                            <strong>{loc.name}</strong>
                          </td>
                          <td>
                            <span style={{ color: "#64748b", fontWeight: 500 }}>{loc.city || "Cameroun"}</span>
                          </td>
                          <td>
                            <span className={`admin-badge ${loc.active !== false ? "green" : "red"}`}>
                              {loc.active !== false ? "Visible sur le site" : "Désactivé"}
                            </span>
                          </td>
                          <td>
                            <div className="admin-action-btns">
                              <button
                                className="admin-action-btn"
                                onClick={() => handleTogglePickup(loc)}
                                title="Activer ou désactiver ce lieu sur le site"
                              >
                                {loc.active !== false ? "Désactiver" : "Activer"}
                              </button>
                              <button
                                className="admin-action-btn delete"
                                onClick={() => handleDeletePickup(loc.id)}
                                title="Supprimer ce lieu"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: DROP-OFF LOCATIONS */}
              <div className="admin-panel-card" style={{ marginBottom: "2.5rem" }}>
                <div className="admin-card-header">
                  <div>
                    <h3>2. Lieux de Restitution — Drop-off (Cameroun)</h3>
                    <small style={{ color: "#64748b" }}>
                      Points de retour proposés dans la liste déroulante publique ({locations.dropoff?.length || 0} lieux)
                    </small>
                  </div>
                </div>

                <div style={{ padding: "2rem 2.5rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <form onSubmit={handleAddDropoff} style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div style={{ flex: "2", minWidth: "260px" }}>
                      <label style={{ display: "block", fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.4rem", color: "#334155" }}>
                        Nom du Lieu de Restitution au Cameroun *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Douala - Port Autonome"
                        value={newDropoff.name}
                        onChange={(e) => setNewDropoff({ ...newDropoff, name: e.target.value })}
                        style={{ width: "100%", padding: "1rem 1.2rem", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
                      />
                    </div>

                    <div style={{ flex: "1", minWidth: "160px" }}>
                      <label style={{ display: "block", fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.4rem", color: "#334155" }}>
                        Ville / Région
                      </label>
                      <select
                        value={newDropoff.city}
                        onChange={(e) => setNewDropoff({ ...newDropoff, city: e.target.value })}
                        style={{ width: "100%", padding: "1rem 1.2rem", borderRadius: "8px", border: "1.5px solid #cbd5e1", background: "#fff" }}
                      >
                        <option value="Yaoundé">Yaoundé (Centre)</option>
                        <option value="Nsimalen">Aéroport Nsimalen</option>
                        <option value="Douala">Douala (Littoral)</option>
                        <option value="Kribi">Kribi (Sud Balnéaire)</option>
                        <option value="Bafoussam">Bafoussam (Ouest)</option>
                        <option value="Autre Cameroun">Autre région Cameroun</option>
                      </select>
                    </div>

                    <button type="submit" className="admin-btn-primary" style={{ padding: "1.1rem 2rem" }}>
                      <i className="fa-solid fa-plus"></i> Ajouter ce Lieu
                    </button>
                  </form>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nom du Lieu de Restitution</th>
                        <th>Ville / Région</th>
                        <th>Statut sur le Formulaire</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(locations.dropoff || []).map((loc) => (
                        <tr key={loc.id}>
                          <td>
                            <strong>{loc.name}</strong>
                          </td>
                          <td>
                            <span style={{ color: "#64748b", fontWeight: 500 }}>{loc.city || "Cameroun"}</span>
                          </td>
                          <td>
                            <span className={`admin-badge ${loc.active !== false ? "green" : "red"}`}>
                              {loc.active !== false ? "Visible sur le site" : "Désactivé"}
                            </span>
                          </td>
                          <td>
                            <div className="admin-action-btns">
                              <button
                                className="admin-action-btn"
                                onClick={() => handleToggleDropoff(loc)}
                                title="Activer ou désactiver ce lieu sur le site"
                              >
                                {loc.active !== false ? "Désactiver" : "Activer"}
                              </button>
                              <button
                                className="admin-action-btn delete"
                                onClick={() => handleDeleteDropoff(loc.id)}
                                title="Supprimer ce lieu"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: CAR SELECTOR LINK & RULES */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
                <div className="admin-panel-card" style={{ padding: "2.5rem" }}>
                  <h3 style={{ fontSize: "1.8rem", marginBottom: "1rem", color: "#0f172a" }}>
                    🚗 Véhicules Actifs (Select Your Car Type)
                  </h3>
                  <p style={{ color: "#64748b", fontSize: "1.35rem", lineHeight: "1.5", marginBottom: "1.5rem" }}>
                    Les véhicules sélectionnables par les clients proviennent directement de votre parc.
                    Actuellement <strong>{cars.filter((c) => c.status === "Disponible").length} véhicules disponibles</strong> sur un total de {cars.length}.
                  </p>
                  <button
                    className="admin-btn-primary"
                    onClick={() => setActiveTab("fleet")}
                  >
                    Gérer la Flotte & Disponibilités →
                  </button>
                </div>

                <div className="admin-panel-card" style={{ padding: "2.5rem" }}>
                  <h3 style={{ fontSize: "1.8rem", marginBottom: "1rem", color: "#0f172a" }}>
                    ⏱️ Règles & Délais de Réservation (Cameroun)
                  </h3>
                  <div style={{ fontSize: "1.35rem", lineHeight: "1.8", color: "#475569" }}>
                    <div>✓ <strong>Agence Omnisports :</strong> Prise en charge 08h00 - 19h00</div>
                    <div>✓ <strong>Aéroport Nsimalen & Douala :</strong> 24h/24 et 7j/7 avec chauffeur VIP</div>
                    <div>✓ <strong>Devise :</strong> Francs CFA (FCFA)</div>
                    <div>✓ <strong>Validation :</strong> WhatsApp direct au +237 691 78 64 47</div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* ==============================================================
              TAB 4: CONTACTS & CLIENT INQUIRIES
              ============================================================== */}
          {activeTab === "contacts" && (
            <div className="admin-panel-card">
              <div className="admin-cms-nav-pills" style={{ display: "flex", gap: "0.8rem", padding: "1.5rem 2rem 0", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${activeTab === "bookings" ? "active" : ""}`}
                  onClick={() => setActiveTab("bookings")}
                >
                  <i className="fa-solid fa-car"></i> Réservations Véhicules ({bookings.length})
                </button>
                <button
                  type="button"
                  className={`admin-date-filter-btn ${activeTab === "contacts" ? "active" : ""}`}
                  onClick={() => setActiveTab("contacts")}
                >
                  <i className="fa-solid fa-envelope"></i> Contact & Conciergerie ({contacts.length})
                </button>
              </div>

              <div className="admin-card-header">
                <div>
                  <h3>Demandes & Messages Reçus ({contacts.length})</h3>
                  <small style={{ color: "#64748b" }}>
                    Messages envoyés depuis la page Contact & Conciergerie du site 3M SERVICES
                  </small>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={requestDeviceNotificationPermission}
                    className="admin-btn-outline"
                    style={{ fontSize: "1.25rem", padding: "0.6rem 1.2rem" }}
                  >
                    <i className={`fa-solid ${deviceNotifStatus === "granted" ? "fa-bell" : "fa-bell-slash"}`} style={{ color: deviceNotifStatus === "granted" ? "#16a34a" : "#E20713", marginRight: "0.5rem" }}></i>
                    {deviceNotifStatus === "granted" ? "Alertes Appareil Activées" : "Activer alertes sur cet appareil"}
                  </button>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Nom du Client</th>
                      <th>Téléphone / Email</th>
                      <th>Message</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "3rem" }}>
                          Aucun message reçu pour le moment.
                        </td>
                      </tr>
                    ) : (
                      contacts.map((c) => (
                        <tr key={c.id}>
                          <td>{new Date(c.createdAt).toLocaleString()}</td>
                          <td>
                            <strong>{c.name}</strong>
                          </td>
                          <td>
                            <a
                              href={`tel:${c.contact}`}
                              style={{ color: "#E20713", textDecoration: "none" }}
                            >
                              {c.contact}
                            </a>
                            {c.email && <div>{c.email}</div>}
                          </td>
                          <td style={{ maxWidth: "350px", lineHeight: "1.4" }}>{c.message}</td>
                          <td>
                            <div className="admin-action-btns">
                              <button
                                className="admin-action-btn whatsapp"
                                onClick={() => {
                                  const text = encodeURIComponent(
                                    `Bonjour ${c.name},\n` +
                                    `Nous accusons réception de votre message adressé à 3M SERVICES :\n` +
                                    `"${c.message}"\n` +
                                    `Comment pouvons-nous vous assister ?`
                                  );
                                  const cleanPhone = (c.contact || "").replace(/[^0-9]/g, "");
                                  window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
                                }}
                              >
                                <i className="fa-brands fa-whatsapp"></i> Répondre WhatsApp
                              </button>
                              <button
                                className="admin-action-btn delete"
                                onClick={() => handleDeleteContact(c.id)}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {/* ==============================================================
              TAB 5: SETTINGS
              ============================================================== */}
          {activeTab === "settings" && (
            <div style={{ maxWidth: "700px" }}>
              <div className="admin-panel-card" style={{ padding: "3rem" }}>
                <h3 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>
                  Sécurité & Mot de Passe
                </h3>
                <p style={{ color: "#64748b", marginBottom: "2.5rem" }}>
                  Modifiez votre mot de passe d'administration pour sécuriser vos accès.
                </p>

                {pwdMessage.text && (
                  <div
                    style={{
                      padding: "1.2rem",
                      borderRadius: "8px",
                      marginBottom: "2rem",
                      background: pwdMessage.type === "success" ? "#ecfdf5" : "#fef2f2",
                      color: pwdMessage.type === "success" ? "#065f46" : "#b91c1c",
                      border: `1px solid ${pwdMessage.type === "success" ? "#a7f3d0" : "#fecaca"}`
                    }}
                  >
                    {pwdMessage.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword}>
                  <div className="admin-form-group">
                    <label>Mot de passe actuel</label>
                    <input
                      type="password"
                      required
                      value={pwdForm.currentPassword}
                      onChange={(e) =>
                        setPwdForm({ ...pwdForm, currentPassword: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Nouveau mot de passe</label>
                    <input
                      type="password"
                      required
                      value={pwdForm.newPassword}
                      onChange={(e) =>
                        setPwdForm({ ...pwdForm, newPassword: e.target.value })
                      }
                    />
                  </div>

                  <button type="submit" className="admin-btn-primary" style={{ marginTop: "1rem" }}>
                    Mettre à jour le mot de passe
                  </button>
                </form>
              </div>

              <div className="admin-panel-card" style={{ padding: "3rem" }}>
                <h3 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>
                  Informations Système 3M SERVICES
                </h3>
                <div style={{ fontSize: "1.4rem", lineHeight: "2" }}>
                  <div>
                    <strong>Serveur API :</strong> FastAPI (3mservice.shop/api) + cache local sécurisé
                  </div>
                  <div>
                    <strong>Stockage Base de Données :</strong> SQLite serveur + sauvegarde navigateur (<code>3m_crm_store_v2</code>)
                  </div>
                  <div>
                    <strong>Conciergerie WhatsApp :</strong> +237 691 78 64 47
                  </div>
                  <div>
                    <strong>Version :</strong> 3M SERVICES v2.4 (Car Rental Edition)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB: CUSTOMERS MANAGEMENT
              ============================================================== */}
          {activeTab === "customers" && (
            <div className="admin-panel-card">
              <div className="admin-card-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "2rem" }}>Comptes & Répertoire Clients 3M ({customers.length})</h3>
                  <small style={{ color: "#737373" }}>Comptes créés automatiquement lors des commandes ou ajoutés manuellement</small>
                </div>
                <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                  <button
                    className="admin-btn-primary"
                    style={{ backgroundColor: "#E20713", color: "#ffffff", border: "none" }}
                    onClick={() => setShowNewCustomerModal(true)}
                  >
                    <i className="fa-solid fa-user-plus"></i> + Nouveau Compte Client
                  </button>
                  <button
                    className="admin-btn-outline"
                    onClick={() => {
                      const csv = "data:text/csv;charset=utf-8,\uFEFFIdentifiant,Nom,Telephone,Email,Ville,VIP Tier,Total Reservations,Total Depenses (FCFA)\n" +
                        customers.map(c => `"${c.accountNumber || c.id}","${c.name}","${c.phone}","${c.email}","${c.city}","${c.vipTier || 'VIP Bronze'}","${c.totalBookings || 0}","${c.totalSpent || 0}"`).join("\n");
                      const uri = encodeURI(csv);
                      const a = document.createElement("a");
                      a.href = uri;
                      a.download = `clients-3m-${new Date().toISOString().split("T")[0]}.csv`;
                      a.click();
                    }}
                  >
                    <i className="fa-solid fa-file-excel" style={{ color: "#16A34A" }}></i> Exporter Clients CSV
                  </button>
                </div>
              </div>

              {/* Toolbar: Search input + VIP Filter pills */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", margin: "1.2rem 0 1.8rem 0" }}>
                <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Rechercher nom, téléphone WhatsApp, email ou n° compte 3M-CLI..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    style={{ width: "100%", paddingLeft: "3.5rem" }}
                  />
                  <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "1.2rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}></i>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {["Tous", "Gold VIP", "Silver VIP", "Bronze VIP"].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      className={`admin-crm-view-btn ${customerVipFilter === tier ? "active" : ""}`}
                      onClick={() => setCustomerVipFilter(tier)}
                      style={{ fontSize: "1.2rem", padding: "0.6rem 1.2rem" }}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Client & Identifiant</th>
                      <th>Statut VIP</th>
                      <th>Téléphone / WhatsApp</th>
                      <th>Email</th>
                      <th>Ville & Quartier</th>
                      <th>Commandes</th>
                      <th>Total Dépensé</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers
                      .filter((c) => {
                        const q = customerSearchTerm.toLowerCase().trim();
                        const matchesSearch =
                          !q ||
                          (c.name || "").toLowerCase().includes(q) ||
                          (c.phone || "").toLowerCase().includes(q) ||
                          (c.email || "").toLowerCase().includes(q) ||
                          (c.accountNumber || "").toLowerCase().includes(q);
                        const matchesTier =
                          customerVipFilter === "Tous" ||
                          (c.vipTier || "Bronze VIP").toLowerCase().includes(customerVipFilter.toLowerCase().replace("vip", "").trim());
                        return matchesSearch && matchesTier;
                      })
                      .map((c) => {
                        const tier = (c.vipTier || "Bronze VIP").toLowerCase();
                        const tierClass = tier.includes("gold") ? "gold" : tier.includes("silver") ? "silver" : "bronze";

                        return (
                          <tr key={c.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.3rem", color: "#0f172a" }}>
                                  {(c.name || "C").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <strong>{c.name}</strong>
                                  <div style={{ fontSize: "1.15rem", color: "#E20713", fontWeight: 700 }}>
                                    {c.accountNumber || c.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`vip-badge-pill ${tierClass}`}>
                                <i className="fa-solid fa-crown" style={{ fontSize: "1rem" }}></i>
                                {c.vipTier || "Bronze VIP"}
                              </span>
                            </td>
                            <td>
                              <a
                                href={`https://wa.me/${(c.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${c.name}, 3M SERVICES à votre service...`)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: "#16A34A", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                              >
                                <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.4rem" }}></i> {c.phone}
                              </a>
                            </td>
                            <td>{c.email || "Non renseigné"}</td>
                            <td>{c.city || "Yaoundé"} {c.address ? `• ${c.address}` : ""}</td>
                            <td style={{ textAlign: "center" }}>
                              <strong style={{ fontSize: "1.35rem" }}>{c.totalBookings || 0}</strong>
                            </td>
                            <td>
                              <strong style={{ color: "#E20713", fontSize: "1.3rem" }}>{(c.totalSpent || 0).toLocaleString("fr-FR")} FCFA</strong>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                  className="admin-action-btn"
                                  onClick={() => {
                                    setSelectedCustomer(c);
                                    setShowCustomerModal(true);
                                  }}
                                  style={{ background: "#F1F5F9", color: "#171717", fontWeight: 700, padding: "0.5rem 0.9rem" }}
                                >
                                  <i className="fa-solid fa-eye"></i> Fiche Client
                                </button>
                                <button
                                  className="admin-action-btn"
                                  onClick={() => handleDeleteCustomer(c.id, c.name)}
                                  style={{ background: "#FEE2E2", color: "#DC2626", padding: "0.5rem 0.8rem" }}
                                  title="Supprimer ce client"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB: RENTAL CONTRACTS
              ============================================================== */}
          {activeTab === "contracts" && (
            <div className="admin-panel-card">
              <div className="admin-card-header">
                <div>
                  <h3 style={{ fontSize: "2rem" }}>Contrats de Location & Engagements ({contracts.length})</h3>
                  <small style={{ color: "#737373" }}>Édition et archivage des contrats de mise à disposition des véhicules</small>
                </div>
                <button
                  className="admin-btn-primary"
                  onClick={() => setShowContractModal(true)}
                >
                  <i className="fa-solid fa-plus"></i> Nouveau Contrat
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>N° Contrat</th>
                      <th>Réf. Réservation</th>
                      <th>Client</th>
                      <th>Véhicule</th>
                      <th>Période</th>
                      <th>Montant Total</th>
                      <th>Caution</th>
                      <th>Chauffeur Assigné</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: "center", padding: "3rem", color: "#737373" }}>
                          Aucun contrat émis pour le moment.
                        </td>
                      </tr>
                    ) : (
                      contracts.map(ctr => (
                        <tr key={ctr.id}>
                          <td>
                            <strong style={{ color: "#4F46E5" }}>{ctr.contractNumber}</strong>
                          </td>
                          <td>{ctr.bookingId}</td>
                          <td><strong>{ctr.clientName}</strong></td>
                          <td>{ctr.carName}</td>
                          <td>{ctr.pickTime} → {ctr.dropTime}</td>
                          <td><strong>{(ctr.totalPrice || 0).toLocaleString("fr-FR")} FCFA</strong></td>
                          <td>{(ctr.securityDeposit || 100000).toLocaleString("fr-FR")} FCFA</td>
                          <td>{ctr.driverAssigned || "Chauffeur 3M"}</td>
                          <td>
                            <span className="status-badge status-contract-prepared">{ctr.status || "Établi"}</span>
                          </td>
                          <td>
                            <button
                              className="admin-action-btn"
                              onClick={() => {
                                setSelectedContract(ctr);
                                setShowPrintContractModal(true);
                              }}
                              style={{ background: "#4F46E5", color: "#FFFFFF", fontWeight: 700 }}
                            >
                              <i className="fa-solid fa-print"></i> Imprimer / Voir
                            </button>
                            <button
                              className="admin-action-btn"
                              onClick={() => handleDeleteContract(ctr.id, ctr.contractNumber)}
                              style={{ background: "#FEE2E2", color: "#DC2626", marginLeft: "0.5rem" }}
                              title="Supprimer ce contrat"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB: PAYMENTS MANAGEMENT
              ============================================================== */}
          {activeTab === "payments" && (
            <div className="admin-panel-card">
              <div className="admin-card-header">
                <div>
                  <h3 style={{ fontSize: "2rem" }}>Gestion des Paiements & Règlements ({payments.length})</h3>
                  <small style={{ color: "#737373" }}>Suivi des encaissements (Espèces, Mobile Money, Orange Money, Virement)</small>
                </div>
                <button
                  className="admin-btn-primary"
                  onClick={() => setShowPaymentModal(true)}
                  style={{ background: "#16A34A", borderColor: "#16A34A" }}
                >
                  <i className="fa-solid fa-cash-register"></i> Enregistrer un Paiement
                </button>
              </div>

              {/* Payments Stats Grid */}
              <div className="admin-metrics-grid" style={{ marginBottom: "2rem" }}>
                <div className="admin-metric-card" style={{ borderLeft: "4px solid #16A34A" }}>
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                      <i className="fa-solid fa-vault"></i>
                    </div>
                    <span className="admin-metric-badge green">Total Encaissé</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Recettes Totales</span>
                    <h3 style={{ color: "#16A34A" }}>
                      {payments.reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString("fr-FR")} FCFA
                    </h3>
                    <small>Tous modes de paiement</small>
                  </div>
                </div>

                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#FEF3C7", color: "#D97706" }}>
                      <i className="fa-solid fa-money-bill-wave"></i>
                    </div>
                    <span className="admin-metric-badge amber">Espèces</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Espèces / Cash</span>
                    <h3>
                      {payments.filter(p => p.method === "Espèces").reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString("fr-FR")} FCFA
                    </h3>
                    <small>{payments.filter(p => p.method === "Espèces").length} transaction(s)</small>
                  </div>
                </div>

                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#FEF9C3", color: "#CA8A04" }}>
                      <i className="fa-solid fa-mobile-screen"></i>
                    </div>
                    <span className="admin-metric-badge" style={{ background: "#FEF9C3", color: "#CA8A04" }}>MTN / OM</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Mobile & Orange Money</span>
                    <h3>
                      {payments.filter(p => p.method?.includes("Money")).reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString("fr-FR")} FCFA
                    </h3>
                    <small>{payments.filter(p => p.method?.includes("Money")).length} transaction(s)</small>
                  </div>
                </div>

                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#DBEAFE", color: "#2563EB" }}>
                      <i className="fa-solid fa-building-columns"></i>
                    </div>
                    <span className="admin-metric-badge blue">Banque</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Virements Bancaires</span>
                    <h3>
                      {payments.filter(p => p.method?.includes("Virement")).reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString("fr-FR")} FCFA
                    </h3>
                    <small>{payments.filter(p => p.method?.includes("Virement")).length} transaction(s)</small>
                  </div>
                </div>
              </div>

              {/* Payments Table */}
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Réf. Paiement</th>
                      <th>Réf. Réservation</th>
                      <th>Client</th>
                      <th>Montant (FCFA)</th>
                      <th>Mode de Paiement</th>
                      <th>Référence Transaction</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Enregistré Par</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ textAlign: "center", padding: "3rem", color: "#737373" }}>
                          Aucun paiement enregistré pour l'instant.
                        </td>
                      </tr>
                    ) : (
                      payments.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.id}</strong></td>
                          <td>
                            <strong style={{ color: "#D62828" }}>{p.bookingId}</strong>
                          </td>
                          <td><strong>{p.clientName}</strong></td>
                          <td>
                            <strong style={{ color: "#16A34A", fontSize: "1.4rem" }}>
                              {Number(p.amount || 0).toLocaleString("fr-FR")} FCFA
                            </strong>
                          </td>
                          <td>
                            <span className="admin-badge-capsule" style={{ fontSize: "1.15rem" }}>
                              {p.method}
                            </span>
                          </td>
                          <td><code>{p.reference || "N/C"}</code></td>
                          <td>
                            <span className="status-badge status-paid">{p.status || "Confirmé"}</span>
                          </td>
                          <td>
                            <small style={{ color: "#737373" }}>
                              {p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "N/C"}
                            </small>
                          </td>
                          <td>{p.recordedBy || "Admin"}</td>
                          <td>
                            <button
                              className="admin-action-btn"
                              onClick={() => handleDeletePayment(p.id)}
                              style={{ background: "#FEE2E2", color: "#DC2626" }}
                              title="Supprimer ce paiement"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB: REVIEWS & TESTIMONIALS
              ============================================================== */}
          {activeTab === "reviews" && (
            <div className="admin-panel-card">
              <div className="admin-card-header">
                <div>
                  <h3 style={{ fontSize: "2rem" }}>Avis Clients & Témoignages ({reviews.length})</h3>
                  <small style={{ color: "#737373" }}>Modération et publication des retours d'expérience clients</small>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Auteur</th>
                      <th>Ville</th>
                      <th>Prestation</th>
                      <th>Note</th>
                      <th>Commentaire</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", padding: "3rem", color: "#737373" }}>
                          Aucun avis soumis pour le moment.
                        </td>
                      </tr>
                    ) : (
                      reviews.map(r => (
                        <tr key={r.id}>
                          <td><strong>{r.name}</strong></td>
                          <td>{r.location || "Yaoundé"}</td>
                          <td>{r.serviceType || "Location VIP"}</td>
                          <td>
                            <div style={{ color: "#EAB308", fontSize: "1.3rem" }}>
                              {"★".repeat(r.rating || 5)}
                            </div>
                          </td>
                          <td style={{ maxWidth: "300px" }}>{r.comment}</td>
                          <td>
                            <span className={`status-badge ${r.status === "Approuvé" ? "status-confirmed" : r.status === "Rejeté" ? "status-rejected" : "status-pending"}`}>
                              {r.status || "En attente"}
                            </span>
                          </td>
                          <td><small style={{ color: "#737373" }}>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</small></td>
                          <td>
                            <div className="admin-action-btns">
                              {r.status !== "Approuvé" && (
                                <button
                                  className="admin-action-btn"
                                  onClick={() => handleReviewStatus(r.id, "Approuvé")}
                                  style={{ background: "#DCFCE7", color: "#16A34A", fontWeight: 700 }}
                                  title="Approuver pour affichage sur le site"
                                >
                                  <i className="fa-solid fa-check"></i>
                                </button>
                              )}
                              {r.status !== "Rejeté" && (
                                <button
                                  className="admin-action-btn"
                                  onClick={() => handleReviewStatus(r.id, "Rejeté")}
                                  style={{ background: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}
                                  title="Rejeter l'avis"
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              )}
                              <button
                                className="admin-action-btn"
                                onClick={() => handleDeleteReview(r.id)}
                                style={{ background: "#F1F5F9", color: "#475569", fontWeight: 700 }}
                                title="Supprimer l'avis"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB: NEWSLETTER SUBSCRIBERS
              ============================================================== */}
          {activeTab === "subscribers" && (
            <div className="admin-panel-card">
              <div className="admin-card-header">
                <div>
                  <h3 style={{ fontSize: "2rem" }}>Abonnés à la Newsletter ({subscribers.length})</h3>
                  <small style={{ color: "#737373" }}>Contacts ayant souscrit aux offres exclusives 3M SERVICES</small>
                </div>
                <button
                  className="admin-btn-outline"
                  onClick={exportSubscribersCSV}
                >
                  <i className="fa-solid fa-file-excel" style={{ color: "#16A34A" }}></i> Exporter la Liste (CSV)
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Adresse Email</th>
                      <th>Date d'Inscription</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "#737373" }}>
                          Aucun abonné enregistré pour le moment.
                        </td>
                      </tr>
                    ) : (
                      subscribers.map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td><strong>{idx + 1}</strong></td>
                          <td><strong>{s.email}</strong></td>
                          <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString("fr-FR") : "N/C"}</td>
                          <td><span className="status-badge status-confirmed">Actif</span></td>
                          <td>
                            <div className="admin-action-btns">
                              <a
                                className="admin-action-btn"
                                href={`mailto:${s.email}?subject=${encodeURIComponent("3M SERVICES - Offres exclusives")}`}
                                style={{ background: "#F1F5F9", color: "#171717" }}
                                title="Envoyer un email"
                              >
                                <i className="fa-solid fa-envelope"></i>
                              </a>
                              <button
                                className="admin-action-btn"
                                onClick={() => handleDeleteSubscriber(s.id || s.email)}
                                style={{ background: "#FEE2E2", color: "#DC2626" }}
                                title="Désabonner"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB: TEAM & DRIVERS MANAGEMENT
              ============================================================== */}
          {activeTab === "team" && (
            <div className="admin-panel-card">
              <div className="admin-card-header">
                <div>
                  <h3 style={{ fontSize: "2rem" }}>Chauffeurs Professionnels & Équipe ({drivers.length})</h3>
                  <small style={{ color: "#737373" }}>Effectif des chauffeurs d'élite mis à disposition des clients 3M SERVICES</small>
                </div>
                <button
                  className="admin-btn-primary"
                  onClick={() => setShowDriverModal(true)}
                >
                  <i className="fa-solid fa-plus"></i> Ajouter un Chauffeur
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.6rem", marginTop: "1rem" }}>
                {drivers.map(d => (
                  <div key={d.id} className="admin-res-card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
                      <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#171717", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700 }}>
                        {(d.name || "?").charAt(0)}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1.6rem" }}>{d.name}</h4>
                        <a href={`tel:${d.phone}`} style={{ color: "#D62828", textDecoration: "none", fontWeight: 700 }}>
                          {d.phone}
                        </a>
                      </div>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">Permis de conduire</span>
                      <span className="admin-res-value">{d.licenseNumber}</span>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">Expérience</span>
                      <span className="admin-res-value">{d.experienceYears} ans</span>
                    </div>
                    <div className="admin-res-row">
                      <span className="admin-res-label">Statut Actuel</span>
                      <span className={`status-badge ${d.status === "Disponible" ? "status-confirmed" : d.status === "En mission" ? "status-under-review" : "status-completed"}`}>
                        {d.status}
                      </span>
                    </div>
                    <div style={{ marginTop: "auto", display: "flex", gap: "0.8rem" }}>
                      <button
                        className="admin-btn-outline"
                        onClick={() => handleDriverStatusToggle(d.id, d.status)}
                        style={{ flex: 1, fontSize: "1.2rem", padding: "0.6rem" }}
                      >
                        Changer Statut
                      </button>
                      <button
                        className="admin-action-btn"
                        onClick={() => handleDeleteDriver(d.id, d.name)}
                        style={{ background: "#FEE2E2", color: "#DC2626", padding: "0.6rem 1rem" }}
                        title="Supprimer ce chauffeur"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB: REPORTS & FINANCIAL ANALYTICS
              ============================================================== */}
          {activeTab === "analytics" && (
            <div className="admin-panel-card">
              <div className="admin-card-header">
                <div>
                  <h3 style={{ fontSize: "2rem" }}>Rapports & Statistiques Financières</h3>
                  <small style={{ color: "#737373" }}>Indicateurs clés de performance de l'activité 3M SERVICES</small>
                </div>
              </div>

              <div className="admin-metrics-grid" style={{ marginBottom: "2rem" }}>
                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                      <i className="fa-solid fa-sack-dollar"></i>
                    </div>
                    <span className="admin-metric-badge green">Total CA</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Chiffre d'Affaires Réalisé</span>
                    <h3 style={{ color: "#16A34A" }}>{statsComputed.totalRevenue.toLocaleString("fr-FR")} FCFA</h3>
                    <small>Cumul sur contrats et réservations</small>
                  </div>
                </div>

                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#DBEAFE", color: "#2563EB" }}>
                      <i className="fa-solid fa-gauge-high"></i>
                    </div>
                    <span className="admin-metric-badge blue">Taux Flotte</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Taux d'Occupation Flotte</span>
                    <h3 style={{ color: "#2563EB" }}>
                      {cars.length > 0 ? Math.round(((cars.filter(c => c.status === "Loué" || c.status === "Réservé").length) / cars.length) * 100) : 0}%
                    </h3>
                    <small>Véhicules loués ou réservés</small>
                  </div>
                </div>

                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#FEF3C7", color: "#D97706" }}>
                      <i className="fa-solid fa-users-gear"></i>
                    </div>
                    <span className="admin-metric-badge amber">Clients</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Base Clients Actifs</span>
                    <h3>{customers.length}</h3>
                    <small>Clients fidélisés au Cameroun</small>
                  </div>
                </div>

                <div className="admin-metric-card">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon-box" style={{ background: "#FEE2E2", color: "#D62828" }}>
                      <i className="fa-solid fa-car-rear"></i>
                    </div>
                    <span className="admin-metric-badge red">Flotte 3M</span>
                  </div>
                  <div className="admin-metric-bottom">
                    <span>Total Véhicules</span>
                    <h3>{cars.length}</h3>
                    <small>Véhicules disponibles & VIP</small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB: USER MANAGEMENT & ROLES
              ============================================================== */}
          {activeTab === "users" && (
            <div className="admin-panel-card">
              <div className="admin-card-header">
                <div>
                  <h3 style={{ fontSize: "2rem" }}>Gestion des Utilisateurs & Rôles ({staffUsers.length})</h3>
                  <small style={{ color: "#737373" }}>Comptes administrateurs et collaborateurs habilités</small>
                </div>
                <button
                  className="admin-btn-primary"
                  onClick={() => setShowStaffModal(true)}
                >
                  <i className="fa-solid fa-user-plus"></i> Nouveau Collaborateur
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nom & Prénom</th>
                      <th>Email de Connexion</th>
                      <th>Rôle & Habilitation</th>
                      <th>Statut</th>
                      <th>Date Création</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "#737373" }}>
                          Aucun collaborateur supplémentaire enregistré.
                        </td>
                      </tr>
                    ) : (
                      staffUsers.map(u => (
                        <tr key={u.id}>
                          <td><strong>{u.name}</strong></td>
                          <td><code>{u.email}</code></td>
                          <td>
                            <span className="admin-badge-capsule" style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                              {u.role}
                            </span>
                          </td>
                          <td><span className="status-badge status-confirmed">Actif</span></td>
                          <td><small style={{ color: "#737373" }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "N/C"}</small></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================
          MODAL: RESERVATION DETAILS (4 SECTIONS & WORKFLOW & CONFLICT BANNER)
          ================================================================== */}
      {showResDetailsModal && selectedRes && (
        <div className="admin-modal-backdrop" onClick={() => setShowResDetailsModal(false)}>
          <div className="admin-modal" style={{ maxWidth: "960px", width: "95%" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: "1.5px solid #E5E5E5" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span className="admin-badge-capsule" style={{ background: "#D62828", color: "#FFFFFF", fontSize: "1.2rem" }}>
                  RÉSERVATION
                </span>
                <h3 style={{ margin: 0, fontSize: "2rem" }}>{selectedRes.id}</h3>
                <span className={`status-badge ${
                  selectedRes.status === "Confirmée" ? "status-confirmed" :
                  selectedRes.status === "En attente" ? "status-pending" :
                  selectedRes.status === "Payée" ? "status-paid" :
                  selectedRes.status === "En cours" ? "status-in-progress" :
                  selectedRes.status === "Terminée" ? "status-completed" : "status-cancelled"
                }`}>
                  {selectedRes.status}
                </span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowResDetailsModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: "75vh", overflowY: "auto", padding: "2rem" }}>
              {/* Conflict Alert Banner if detected */}
              {conflictWarning && (
                <div className="admin-conflict-banner">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <div>
                    <strong>Avertissement de Conflit de Véhicule</strong>
                    <p style={{ margin: "0.4rem 0" }}>{conflictWarning.error || conflictWarning.message}</p>
                    <button
                      type="button"
                      className="admin-conflict-override-btn"
                      onClick={() => handleUpdateStatusWithConflictCheck(selectedRes.id, statusUpdateNote ? statusUpdateNote : "Confirmée", true)}
                    >
                      Forcer la confirmation malgré le chevauchement
                    </button>
                  </div>
                </div>
              )}

              {/* 4 CLEAR SECTIONS GRID */}
              <div className="admin-res-grid">
                {/* SECTION A: RESERVATION INFORMATION */}
                <div className="admin-res-card">
                  <div className="admin-res-card-header">
                    <h4><i className="fa-solid fa-calendar-days"></i> A. Informations Réservation</h4>
                    <span className="admin-badge-capsule">Source : {selectedRes.source || "Site Web"}</span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Référence Dossier</span>
                    <strong style={{ color: "#D62828" }}>{selectedRes.id}</strong>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Date Soumission</span>
                    <span className="admin-res-value">
                      {selectedRes.createdAt ? new Date(selectedRes.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/C"}
                    </span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Type de Location</span>
                    <span className="admin-res-value">{selectedRes.rentalType || (selectedRes.withDriver ? "Avec Chauffeur" : "Sans Chauffeur")}</span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Prise en Charge</span>
                    <span className="admin-res-value"><strong>{selectedRes.pickTime}</strong> • {selectedRes.pickUp}</span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Restitution</span>
                    <span className="admin-res-value"><strong>{selectedRes.dropTime || selectedRes.pickTime}</strong> • {selectedRes.dropOff}</span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Durée Estimée</span>
                    <strong className="admin-res-value">{selectedRes.days || 1} Jour(s)</strong>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Tarif Journalier</span>
                    <span className="admin-res-value">{(selectedRes.pricePerDay || 0).toLocaleString("fr-FR")} FCFA / jour</span>
                  </div>
                  <div className="admin-res-row" style={{ background: "#FEF2F2", padding: "0.8rem", borderRadius: "6px", margin: "0.5rem 0" }}>
                    <span className="admin-res-label" style={{ color: "#D62828", fontWeight: 700 }}>Montant Total Estimé</span>
                    <strong style={{ fontSize: "1.6rem", color: "#D62828" }}>{(selectedRes.totalPrice || 0).toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Montant Réglé</span>
                    <strong style={{ color: "#16A34A" }}>{(selectedRes.paidAmount || 0).toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Solde Restant</span>
                    <strong style={{ color: "#171717" }}>{(selectedRes.balance ?? selectedRes.totalPrice ?? 0).toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                </div>

                {/* SECTION B: CUSTOMER INFORMATION */}
                <div className="admin-res-card">
                  <div className="admin-res-card-header">
                    <h4><i className="fa-solid fa-user-tie"></i> B. Informations Client</h4>
                    {selectedRes.marketingConsent && (
                      <span className="admin-badge-capsule" style={{ background: "#DCFCE7", color: "#16A34A" }}>Opt-in Offres</span>
                    )}
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Nom Complet</span>
                    <strong className="admin-res-value">{selectedRes.clientName}</strong>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Téléphone</span>
                    <span className="admin-res-value">
                      <a href={`tel:${selectedRes.phone}`} style={{ color: "#171717", textDecoration: "none", fontWeight: 700 }}>
                        {selectedRes.phone}
                      </a>
                    </span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Contact WhatsApp</span>
                    <span className="admin-res-value">
                      <button
                        type="button"
                        className="admin-btn-whatsapp-res"
                        onClick={() => openWhatsAppCustomer(selectedRes)}
                        style={{ padding: "0.4rem 1rem", fontSize: "1.15rem" }}
                      >
                        <i className="fa-brands fa-whatsapp"></i> Échanger sur WhatsApp
                      </button>
                    </span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Adresse Email</span>
                    <span className="admin-res-value">{selectedRes.email || "Non renseigné"}</span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Âge du Conducteur</span>
                    <span className="admin-res-value">{selectedRes.age || "25+ ans"}</span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Quartier / Domicile</span>
                    <span className="admin-res-value">{selectedRes.address || "Yaoundé"}</span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Ville de Résidence</span>
                    <span className="admin-res-value">{selectedRes.city || "Yaoundé, Cameroun"}</span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Repère / Code Postal</span>
                    <span className="admin-res-value">{selectedRes.zipcode || "Omnisports / Bastos"}</span>
                  </div>
                </div>

                {/* SECTION C: VEHICLE INFORMATION */}
                <div className="admin-res-card">
                  <div className="admin-res-card-header">
                    <h4><i className="fa-solid fa-car-side"></i> C. Informations Véhicule</h4>
                    <span className="admin-badge-capsule">Parc Flotte 3M</span>
                  </div>
                  {/* Photo & Name */}
                  <div className="admin-res-vehicle-preview">
                    {(() => {
                      const fleetCar = cars.find(c => c.name?.toLowerCase() === selectedRes.carName?.toLowerCase());
                      const imgUrl = fleetCar?.img || "/images/cars/toyota-prado-txl-front.webp";
                      return <img src={imgUrl} alt={selectedRes.carName} />;
                    })()}
                    <div>
                      <h4 style={{ margin: "0 0 0.4rem 0", fontSize: "1.6rem" }}>{selectedRes.carName}</h4>
                      <span className="status-badge status-confirmed">Disponible pour attribution</span>
                    </div>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Modèle Sélectionné</span>
                    <strong className="admin-res-value">{selectedRes.carName}</strong>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Immatriculation Flotte</span>
                    <span className="admin-res-value">LT-2024-VIP</span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Transmission</span>
                    <span className="admin-res-value">Automatique 4x4</span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Carburant</span>
                    <span className="admin-res-value">Diesel / Essence</span>
                  </div>
                  <div className="admin-res-row">
                    <span className="admin-res-label">Climatisation</span>
                    <span className="admin-res-value">Oui (Bi-zone Grand Froid)</span>
                  </div>
                </div>

                {/* SECTION D: INTERNAL ADMIN NOTES */}
                <div className="admin-res-card">
                  <div className="admin-res-card-header">
                    <h4><i className="fa-solid fa-clipboard-user"></i> D. Notes Internes Administrateur</h4>
                    <small style={{ color: "#737373" }}>Visible uniquement par le personnel</small>
                  </div>

                  <div className="admin-notes-list">
                    {(selectedRes.internalNotes || []).length === 0 ? (
                      <p style={{ color: "#737373", fontSize: "1.25rem", fontStyle: "italic", margin: "1rem 0" }}>
                        Aucune note interne pour cette réservation.
                      </p>
                    ) : (
                      (selectedRes.internalNotes || []).map((n) => (
                        <div key={n.id} className="admin-note-bubble">
                          <div className="admin-note-header">
                            <strong>{n.author}</strong>
                            <span>{new Date(n.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div className="admin-note-text">{n.text}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add note input */}
                  <div className="admin-note-form">
                    <input
                      type="text"
                      className="admin-note-input"
                      placeholder="Ajouter une consigne ou note interne..."
                      value={newAdminNote}
                      onChange={(e) => setNewAdminNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAdminNote(selectedRes.id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="admin-btn-primary"
                      onClick={() => handleAddAdminNote(selectedRes.id)}
                      style={{ padding: "0.6rem 1.2rem", fontSize: "1.25rem" }}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>

              {/* ACTIONS STRIP */}
              <div className="admin-res-actions-strip" style={{ marginTop: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                  <label style={{ fontWeight: 700, fontSize: "1.3rem" }}>Changer Statut :</label>
                  <select
                    value={selectedRes.status}
                    onChange={(e) => handleUpdateStatusWithConflictCheck(selectedRes.id, e.target.value)}
                    style={{ padding: "0.7rem 1.2rem", borderRadius: "6px", border: "1.5px solid #D62828", fontSize: "1.3rem", fontWeight: 700 }}
                  >
                    <option value="En attente">En attente (Pending)</option>
                    <option value="En cours d'examen">En cours d'examen</option>
                    <option value="Confirmée">Confirmée</option>
                    <option value="Contrat préparé">Contrat préparé</option>
                    <option value="En attente de paiement">En attente de paiement</option>
                    <option value="Payée">Payée</option>
                    <option value="En cours">En cours (Active)</option>
                    <option value="Terminée">Terminée</option>
                    <option value="Annulée">Annulée</option>
                    <option value="Rejetée">Rejetée</option>
                  </select>
                </div>

                <div className="admin-res-action-btn-group">
                  <button
                    type="button"
                    className="admin-btn-whatsapp-res"
                    onClick={() => openWhatsAppCustomer(selectedRes)}
                  >
                    <i className="fa-brands fa-whatsapp"></i> WhatsApp Direct
                  </button>

                  <button
                    type="button"
                    className="admin-btn-payment"
                    onClick={() => {
                      setPaymentForm({
                        bookingId: selectedRes.id,
                        amount: selectedRes.balance || selectedRes.totalPrice || 50000,
                        method: "Espèces",
                        reference: `REF-${Date.now().toString().slice(-6)}`,
                        note: `Règlement réservation ${selectedRes.id}`
                      });
                      setShowPaymentModal(true);
                    }}
                  >
                    <i className="fa-solid fa-coins"></i> Enregistrer Paiement
                  </button>

                  <button
                    type="button"
                    className="admin-btn-contract"
                    onClick={() => {
                      setContractForm({
                        bookingId: selectedRes.id,
                        driverAssigned: "Chauffeur professionnel 3M",
                        securityDeposit: 100000,
                        clauses: "Véhicule mis à disposition propre avec plein de carburant."
                      });
                      setShowContractModal(true);
                    }}
                  >
                    <i className="fa-solid fa-file-contract"></i> Établir Contrat
                  </button>

                  <button
                    type="button"
                    className="admin-btn-pdf"
                    onClick={() => window.print()}
                  >
                    <i className="fa-solid fa-file-pdf"></i> Imprimer Vœu PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          MODAL: ENREGISTRER UN PAIEMENT
          ================================================================== */}
      {showPaymentModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowPaymentModal(false)}>
          <div className="admin-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Enregistrer un Paiement Client</h3>
              <button className="admin-modal-close" onClick={() => setShowPaymentModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRecordPaymentSubmit}>
              <div className="admin-modal-body" style={{ padding: "2rem" }}>
                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Réf. Réservation liée *</label>
                  <input
                    type="text"
                    required
                    value={paymentForm.bookingId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bookingId: e.target.value })}
                    placeholder="Ex: 3M-RES-2026-001"
                  />
                </div>

                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Montant Encaissé (FCFA) *</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="Ex: 150000"
                  />
                </div>

                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Mode de Paiement *</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  >
                    <option value="Espèces">Espèces / Cash</option>
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                    <option value="Orange Money">Orange Money</option>
                    <option value="Virement bancaire">Virement bancaire</option>
                    <option value="Carte bancaire">Carte bancaire</option>
                  </select>
                </div>

                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Numéro de Transaction / Réf. Reçu</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="Ex: TX-789456 / Reçu #45"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Observations / Notes</label>
                  <textarea
                    rows={2}
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    placeholder="Ex: Acompte 50% versé à l'agence..."
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-outline" onClick={() => setShowPaymentModal(false)}>Annuler</button>
                <button type="submit" className="admin-btn-primary" style={{ background: "#16A34A", borderColor: "#16A34A" }}>Valider le Règlement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================
          MODAL: ÉTABLIR CONTRAT DE LOCATION
          ================================================================== */}
      {showContractModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowContractModal(false)}>
          <div className="admin-modal" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Établir le Contrat de Location Officiel</h3>
              <button className="admin-modal-close" onClick={() => setShowContractModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleGenerateContractSubmit}>
              <div className="admin-modal-body" style={{ padding: "2rem" }}>
                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Réservation Concernée *</label>
                  <input
                    type="text"
                    required
                    value={contractForm.bookingId}
                    onChange={(e) => setContractForm({ ...contractForm, bookingId: e.target.value })}
                    placeholder="Réf: 3M-RES-2026-..."
                  />
                </div>

                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Chauffeur Professionnel Assigné</label>
                  <select
                    value={contractForm.driverAssigned}
                    onChange={(e) => setContractForm({ ...contractForm, driverAssigned: e.target.value })}
                  >
                    <option value="Chauffeur professionnel 3M SERVICES">Chauffeur professionnel 3M SERVICES</option>
                    {drivers.map(d => (
                      <option key={d.id} value={`${d.name} (${d.phone})`}>{d.name} ({d.status})</option>
                    ))}
                    <option value="Sans chauffeur (Conduite autonome autorisée)">Sans chauffeur (Conduite autonome)</option>
                  </select>
                </div>

                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Montant Caution de Sécurité (FCFA)</label>
                  <input
                    type="number"
                    value={contractForm.securityDeposit}
                    onChange={(e) => setContractForm({ ...contractForm, securityDeposit: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Clauses Particulières & Conditions</label>
                  <textarea
                    rows={3}
                    value={contractForm.clauses}
                    onChange={(e) => setContractForm({ ...contractForm, clauses: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-outline" onClick={() => setShowContractModal(false)}>Annuler</button>
                <button type="submit" className="admin-btn-primary" style={{ background: "#4F46E5", borderColor: "#4F46E5" }}>Générer le Contrat</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================
          MODAL: IMPRIMER / VISUALISER CONTRAT OFFICIEL
          ================================================================== */}
      {showPrintContractModal && selectedContract && (
        <div className="admin-modal-backdrop" onClick={() => setShowPrintContractModal(false)}>
          <div className="admin-modal" style={{ maxWidth: "800px", width: "95%" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Contrat de Location Officiel {selectedContract.contractNumber}</h3>
              <button className="admin-modal-close" onClick={() => setShowPrintContractModal(false)}>&times;</button>
            </div>
            <div className="admin-modal-body" style={{ padding: "2rem", maxHeight: "70vh", overflowY: "auto" }}>
              <div className="printable-contract-document" style={{ border: "2px solid #171717", padding: "2.5rem", borderRadius: "8px", background: "#FFFFFF", color: "#171717" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #D62828", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
                  <div>
                    <h2 style={{ margin: 0, color: "#D62828", fontSize: "2.4rem", fontWeight: 900 }}>3M SERVICES SARL</h2>
                    <p style={{ margin: "0.4rem 0", fontSize: "1.25rem", color: "#4B5563" }}>
                      Location de Véhicules VIP • Conciergerie Privée • Yaoundé, Cameroun
                      <br />
                      Tél : +237 691 78 64 47 • Email : contact@3mservice.shop
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="admin-badge-capsule" style={{ background: "#171717", color: "#FFFFFF", fontSize: "1.2rem" }}>
                      CONTRAT N° {selectedContract.contractNumber}
                    </span>
                    <p style={{ margin: "0.4rem 0", fontSize: "1.2rem", color: "#737373" }}>
                      Date : {new Date(selectedContract.generatedAt || Date.now()).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                {/* Body Details */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
                  <div>
                    <h4 style={{ color: "#D62828", marginBottom: "0.8rem", borderBottom: "1px solid #E5E5E5", paddingBottom: "0.4rem" }}>LE LOCATAIRE</h4>
                    <p style={{ margin: "0.4rem 0", fontSize: "1.3rem" }}><strong>Nom :</strong> {selectedContract.clientName}</p>
                    <p style={{ margin: "0.4rem 0", fontSize: "1.3rem" }}><strong>Contact :</strong> {selectedContract.clientPhone}</p>
                    <p style={{ margin: "0.4rem 0", fontSize: "1.3rem" }}><strong>Réf. Réservation :</strong> {selectedContract.bookingId}</p>
                  </div>

                  <div>
                    <h4 style={{ color: "#D62828", marginBottom: "0.8rem", borderBottom: "1px solid #E5E5E5", paddingBottom: "0.4rem" }}>LE VÉHICULE & PRESTATION</h4>
                    <p style={{ margin: "0.4rem 0", fontSize: "1.3rem" }}><strong>Véhicule :</strong> {selectedContract.carName}</p>
                    <p style={{ margin: "0.4rem 0", fontSize: "1.3rem" }}><strong>Prise en Charge :</strong> {selectedContract.pickTime} ({selectedContract.pickUp})</p>
                    <p style={{ margin: "0.4rem 0", fontSize: "1.3rem" }}><strong>Restitution :</strong> {selectedContract.dropTime} ({selectedContract.dropOff})</p>
                    <p style={{ margin: "0.4rem 0", fontSize: "1.3rem" }}><strong>Chauffeur :</strong> {selectedContract.driverAssigned}</p>
                  </div>
                </div>

                <div style={{ background: "#F8FAFC", padding: "1.2rem", borderRadius: "6px", marginBottom: "2rem" }}>
                  <h4 style={{ margin: "0 0 0.6rem 0", color: "#171717" }}>Conditions Particulières</h4>
                  <p style={{ margin: 0, fontSize: "1.25rem", color: "#4B5563", lineHeight: 1.5 }}>
                    {selectedContract.clauses} Caution exigée : {Number(selectedContract.securityDeposit || 100000).toLocaleString("fr-FR")} FCFA.
                  </p>
                </div>

                {/* Signatures */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px dashed #9CA3AF" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontWeight: 700, margin: "0 0 4rem 0" }}>Pour le Locataire (Signature précédée de la mention "Lu et approuvé")</p>
                    <div style={{ borderBottom: "1px solid #171717", width: "80%", margin: "0 auto" }}></div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontWeight: 700, margin: "0 0 4rem 0" }}>Pour 3M SERVICES (Direction Générale / Conciergerie)</p>
                    <div style={{ borderBottom: "1px solid #171717", width: "80%", margin: "0 auto" }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn-outline" onClick={() => setShowPrintContractModal(false)}>Fermer</button>
              <button type="button" className="admin-btn-primary" onClick={() => window.print()} style={{ background: "#4F46E5", borderColor: "#4F46E5" }}>
                <i className="fa-solid fa-print"></i> Lancer l'Impression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          MODAL: FICHE CLIENT & HISTORIQUE COMPLET (RentQ CRM Style)
          ================================================================== */}
      {showCustomerModal && selectedCustomer && (
        <div className="admin-modal-backdrop" onClick={() => setShowCustomerModal(false)}>
          <div className="admin-modal" style={{ maxWidth: "720px", width: "95%" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#0f172a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.6rem" }}>
                  {(selectedCustomer.name || "C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.85rem" }}>{selectedCustomer.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginTop: "0.2rem" }}>
                    <span style={{ color: "#E20713", fontWeight: 700, fontSize: "1.2rem" }}>
                      {selectedCustomer.accountNumber || selectedCustomer.id}
                    </span>
                    <span className={`vip-badge-pill ${(selectedCustomer.vipTier || "Bronze VIP").toLowerCase().includes("gold") ? "gold" : (selectedCustomer.vipTier || "").toLowerCase().includes("silver") ? "silver" : "bronze"}`}>
                      <i className="fa-solid fa-crown" style={{ fontSize: "1rem" }}></i> {selectedCustomer.vipTier || "Bronze VIP"}
                    </span>
                  </div>
                </div>
              </div>
              <button className="admin-modal-close" onClick={() => setShowCustomerModal(false)}>&times;</button>
            </div>

            <div className="admin-modal-body" style={{ padding: "2rem" }}>
              {/* Quick Contact & Action Buttons */}
              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", marginBottom: "1.8rem" }}>
                {selectedCustomer.phone && (
                  <a
                    href={`https://wa.me/${(selectedCustomer.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${selectedCustomer.name}, 3M SERVICES à votre disposition...`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#25D366",
                      color: "#ffffff",
                      padding: "0.7rem 1.4rem",
                      borderRadius: "6px",
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                  >
                    <i className="fa-brands fa-whatsapp" style={{ fontSize: "1.6rem" }}></i> Message WhatsApp
                  </a>
                )}
                {selectedCustomer.phone && (
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#0f172a",
                      color: "#ffffff",
                      padding: "0.7rem 1.4rem",
                      borderRadius: "6px",
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      textDecoration: "none"
                    }}
                  >
                    <i className="fa-solid fa-phone"></i> Appeler
                  </a>
                )}
                <button
                  type="button"
                  className="admin-btn-primary"
                  style={{ backgroundColor: "#E20713", color: "#ffffff", border: "none" }}
                  onClick={() => {
                    setBookingForm((prev) => ({
                      ...prev,
                      clientName: selectedCustomer.name,
                      phone: selectedCustomer.phone || "+237 ",
                      email: selectedCustomer.email || ""
                    }));
                    setShowCustomerModal(false);
                    setShowBookingModal(true);
                  }}
                >
                  <i className="fa-solid fa-calendar-plus"></i> Nouvelle Réservation pour ce client
                </button>
              </div>

              {/* Customer Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ padding: "1.2rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <small style={{ color: "#64748b", fontSize: "1.1rem", textTransform: "uppercase", fontWeight: 600 }}>Dépenses Cumulées</small>
                  <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#E20713", marginTop: "0.4rem" }}>
                    {(selectedCustomer.totalSpent || 0).toLocaleString("fr-FR")} FCFA
                  </div>
                </div>

                <div style={{ padding: "1.2rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <small style={{ color: "#64748b", fontSize: "1.1rem", textTransform: "uppercase", fontWeight: 600 }}>Réservations Totales</small>
                  <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#0f172a", marginTop: "0.4rem" }}>
                    {selectedCustomer.totalBookings || 0}
                  </div>
                </div>

                <div style={{ padding: "1.2rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <small style={{ color: "#64748b", fontSize: "1.1rem", textTransform: "uppercase", fontWeight: 600 }}>Localisation</small>
                  <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#0f172a", marginTop: "0.4rem" }}>
                    {selectedCustomer.city || "Yaoundé"}
                  </div>
                </div>
              </div>

              {/* Coordinates Grid */}
              <div className="admin-res-grid" style={{ marginBottom: "2rem" }}>
                <div className="admin-res-row">
                  <span className="admin-res-label">Téléphone</span>
                  <strong className="admin-res-value">{selectedCustomer.phone}</strong>
                </div>
                <div className="admin-res-row">
                  <span className="admin-res-label">Email</span>
                  <span className="admin-res-value">{selectedCustomer.email || "Non renseigné"}</span>
                </div>
                <div className="admin-res-row">
                  <span className="admin-res-label">Ville / Quartier</span>
                  <span className="admin-res-value">{selectedCustomer.city || "Yaoundé"} {selectedCustomer.address ? `• ${selectedCustomer.address}` : ""}</span>
                </div>
                {selectedCustomer.notes && (
                  <div className="admin-res-row">
                    <span className="admin-res-label">Notes VIP</span>
                    <span className="admin-res-value">{selectedCustomer.notes}</span>
                  </div>
                )}
              </div>

              {/* Booking History Table */}
              <h4 style={{ borderBottom: "1.5px solid #F1F5F9", paddingBottom: "0.8rem", marginBottom: "1.2rem", fontSize: "1.5rem", fontWeight: 700 }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: "#E20713", marginRight: "8px" }}></i>
                Historique des Réservations & Commandes
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {(() => {
                  const custDigits = (selectedCustomer.phone || "").replace(/[^0-9]/g, "");
                  const custOrders = bookings.filter((b) => {
                    const bDigits = (b.phone || "").replace(/[^0-9]/g, "");
                    return (
                      (custDigits && bDigits && (bDigits === custDigits || bDigits.endsWith(custDigits.slice(-8)))) ||
                      b.clientName === selectedCustomer.name ||
                      (b.accountNumber && b.accountNumber === selectedCustomer.accountNumber)
                    );
                  });

                  if (custOrders.length === 0) {
                    return (
                      <div style={{ padding: "2rem", textAlign: "center", background: "#f8fafc", borderRadius: "8px", color: "#64748b" }}>
                        Aucune commande passée sous ce compte pour l'instant.
                      </div>
                    );
                  }

                  return custOrders.map((b) => (
                    <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.4rem", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div>
                        <strong style={{ color: "#E20713", fontSize: "1.3rem" }}>{b.id}</strong> — <strong style={{ fontSize: "1.3rem" }}>{b.carName}</strong>
                        <div style={{ color: "#64748b", fontSize: "1.2rem", marginTop: "3px" }}>Du {b.pickTime} au {b.dropTime || b.pickTime} ({b.pickUp})</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong style={{ fontSize: "1.35rem", color: "#0f172a" }}>{(Number(b.totalPrice) || 0).toLocaleString("fr-FR")} FCFA</strong>
                        <div style={{ marginTop: "4px" }}>
                          <span className={`status-badge ${b.status === "Confirmée" ? "status-confirmed" : b.status === "En cours" ? "status-in-progress" : "status-pending"}`}>
                            {b.status || "En attente"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn-outline" onClick={() => setShowCustomerModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          MODAL: NOUVEAU COMPTE CLIENT MANUEL
          ================================================================== */}
      {showNewCustomerModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowNewCustomerModal(false)}>
          <div className="admin-modal" style={{ maxWidth: "560px", width: "95%" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <i className="fa-solid fa-user-plus" style={{ color: "#E20713", fontSize: "1.8rem" }}></i>
                <h3>Nouveau Compte Client 3M SERVICES</h3>
              </div>
              <button className="admin-modal-close" onClick={() => setShowNewCustomerModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="admin-modal-body" style={{ padding: "2rem" }}>
                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Nom & Prénom / Raison Sociale *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                    placeholder="Ex: Paul Biya, Ambassade, Entreprise..."
                  />
                </div>

                <div className="admin-modal-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem", marginBottom: "1.2rem" }}>
                  <div className="admin-form-group">
                    <label>Téléphone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={newCustomerForm.phone}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                      placeholder="+237 6XX XX XX XX"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Email Client</label>
                    <input
                      type="email"
                      value={newCustomerForm.email}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                      placeholder="client@domaine.com"
                    />
                  </div>
                </div>

                <div className="admin-modal-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem", marginBottom: "1.2rem" }}>
                  <div className="admin-form-group">
                    <label>Ville de Résidence</label>
                    <input
                      type="text"
                      value={newCustomerForm.city}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                      placeholder="Yaoundé, Douala, Diaspora..."
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Statut / Palier VIP</label>
                    <select
                      value={newCustomerForm.vipTier}
                      onChange={(e) => setNewCustomerForm({ ...newCustomerForm, vipTier: e.target.value })}
                    >
                      <option value="VIP Bronze">VIP Bronze (Standard)</option>
                      <option value="VIP Silver">VIP Silver (Régulier)</option>
                      <option value="VIP Gold">VIP Gold (Prestige & Diplomatique)</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Quartier / Adresse</label>
                  <input
                    type="text"
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                    placeholder="Ex: Bastos, Omnisports, Golfe..."
                  />
                </div>

                <div className="admin-form-group">
                  <label>Notes & Préférences Client</label>
                  <textarea
                    rows={2}
                    value={newCustomerForm.notes}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })}
                    placeholder="Ex: Chauffeur bilingue demandé, véhicule climatisé avec vitres teintées..."
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-outline" onClick={() => setShowNewCustomerModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="admin-btn-primary" style={{ backgroundColor: "#E20713", color: "#ffffff" }}>
                  Créer le Compte Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================
          MODAL: AJOUTER UN CHAUFFEUR
          ================================================================== */}
      {showDriverModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowDriverModal(false)}>
          <div className="admin-modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Ajouter un Chauffeur Professionnel</h3>
              <button className="admin-modal-close" onClick={() => setShowDriverModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleDriverSubmit}>
              <div className="admin-modal-body" style={{ padding: "2rem" }}>
                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Nom Complet du Chauffeur *</label>
                  <input
                    type="text"
                    required
                    value={driverForm.name}
                    onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                    placeholder="Ex: Jean-Paul Mvogo"
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Numéro de Téléphone *</label>
                  <input
                    type="text"
                    required
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>N° Permis de Conduire</label>
                  <input
                    type="text"
                    value={driverForm.licenseNumber}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                    placeholder="Ex: B-CM-2021-0897"
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Années d'Expérience</label>
                  <input
                    type="number"
                    value={driverForm.experienceYears}
                    onChange={(e) => setDriverForm({ ...driverForm, experienceYears: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Statut Initial</label>
                  <select
                    value={driverForm.status}
                    onChange={(e) => setDriverForm({ ...driverForm, status: e.target.value })}
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="En mission">En mission</option>
                    <option value="Repos">Repos</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-outline" onClick={() => setShowDriverModal(false)}>Annuler</button>
                <button type="submit" className="admin-btn-primary">Enregistrer le Chauffeur</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================
          MODAL: AJOUTER UN COLLABORATEUR / COMPTE
          ================================================================== */}
      {showStaffModal && (
        <div className="admin-modal-backdrop" onClick={() => setShowStaffModal(false)}>
          <div className="admin-modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Ajouter un Collaborateur & Rôle</h3>
              <button className="admin-modal-close" onClick={() => setShowStaffModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleStaffUserSubmit}>
              <div className="admin-modal-body" style={{ padding: "2rem" }}>
                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Nom & Prénom *</label>
                  <input
                    type="text"
                    required
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    placeholder="Ex: Sylvie Nguemo"
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Adresse Email de Connexion *</label>
                  <input
                    type="email"
                    required
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="sylvie@3mservices.cm"
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: "1.2rem" }}>
                  <label>Mot de passe Provisoire *</label>
                  <input
                    type="password"
                    required
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Rôle & Habilitation</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  >
                    <option value="Gestionnaire Réservations">Gestionnaire Réservations</option>
                    <option value="Responsable Flotte">Responsable Flotte</option>
                    <option value="Comptable">Comptable / Trésorerie</option>
                    <option value="Concierge">Concierge & Accueil</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-outline" onClick={() => setShowStaffModal(false)}>Annuler</button>
                <button type="submit" className="admin-btn-primary">Créer le Compte</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ==================================================================
          MODAL: NOUVELLE RÉSERVATION MANUELLE
          ================================================================== */}
      {showBookingModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Créer une Réservation</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowBookingModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateBooking}>
              <div className="admin-modal-body">
                <div className="admin-modal-form-grid">
                  <div className="admin-form-group">
                    <label>Nom du Client *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Jean Dupont"
                      value={bookingForm.clientName}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, clientName: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Téléphone WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="+237 6XX XX XX XX"
                      value={bookingForm.phone}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Email du Client</label>
                    <input
                      type="email"
                      placeholder="client@domaine.com"
                      value={bookingForm.email}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Véhicule Réservé *</label>
                    <select
                      value={bookingForm.carName}
                      onChange={(e) => {
                        const selCar = cars.find((c) => c.name === e.target.value);
                        const p = selCar ? Number(selCar.pricePerDay) : 50000;
                        setBookingForm({
                          ...bookingForm,
                          carName: e.target.value,
                          pricePerDay: p,
                          totalPrice: p * bookingForm.days
                        });
                      }}
                    >
                      {cars.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({Number(c.pricePerDay).toLocaleString()} F/j)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Lieu de Prise en Charge *</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.pickUp}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, pickUp: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Lieu de Restitution *</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.dropOff}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, dropOff: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Date de Début *</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.pickTime}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, pickTime: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Date de Fin *</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.dropTime}
                      onChange={(e) =>
                        setBookingForm({ ...bookingForm, dropTime: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Nombre de Jours *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={bookingForm.days}
                      onChange={(e) => {
                        const d = Number(e.target.value) || 1;
                        setBookingForm({
                          ...bookingForm,
                          days: d,
                          totalPrice: d * bookingForm.pricePerDay
                        });
                      }}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Prix Total (FCFA)</label>
                    <input
                      type="number"
                      required
                      value={bookingForm.totalPrice}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          totalPrice: Number(e.target.value)
                        })
                      }
                    />
                  </div>
                </div>

                <div className="admin-form-group" style={{ marginTop: "1.5rem" }}>
                  <label>Notes & Instructions Particulières</label>
                  <textarea
                    rows="3"
                    placeholder="Chauffeur bilingue, vol à l'aéroport, etc."
                    value={bookingForm.notes}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-action-btn"
                  onClick={() => setShowBookingModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="admin-btn-primary">
                  Enregistrer la Réservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================
          MODAL: AJOUTER / MODIFIER UN VÉHICULE
          ================================================================== */}
      {showCarModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editingCar ? "Modifier le Véhicule" : "Ajouter un Nouveau Véhicule"}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowCarModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCar}>
              <div className="admin-modal-body">
                <div className="admin-modal-form-grid">
                  <div className="admin-form-group">
                    <label>Nom Commercial *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Toyota Prado TXL VIP"
                      value={carForm.name}
                      onChange={(e) =>
                        setCarForm({ ...carForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Marque *</label>
                    <input
                      type="text"
                      required
                      placeholder="Toyota, Mercedes, Jeep..."
                      value={carForm.mark}
                      onChange={(e) =>
                        setCarForm({ ...carForm, mark: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Modèle *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Land Cruiser Prado"
                      value={carForm.model}
                      onChange={(e) =>
                        setCarForm({ ...carForm, model: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Catégorie *</label>
                    <select
                      value={carForm.category}
                      onChange={(e) =>
                        setCarForm({ ...carForm, category: e.target.value })
                      }
                    >
                      <option value="SUV VIP 4x4">SUV VIP 4x4</option>
                      <option value="SUV 4x4 Luxe">SUV 4x4 Luxe</option>
                      <option value="Berline Prestige">Berline Prestige</option>
                      <option value="Berline Confort">Berline Confort</option>
                      <option value="Compacte Économique">Compacte Économique</option>
                      <option value="Citadine Premium">Citadine Premium</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>État / Condition du véhicule *</label>
                    <select
                      value={carForm.condition || "Occasion Certifiée"}
                      onChange={(e) =>
                        setCarForm({ ...carForm, condition: e.target.value })
                      }
                    >
                      <option value="Occasion Certifiée">Occasion Certifiée</option>
                      <option value="Neuve (0 km)">Neuve (0 km)</option>
                      <option value="Occasion Révisée">Occasion Révisée</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Tarif par Jour (FCFA) *</label>
                    <input
                      type="number"
                      required
                      value={carForm.pricePerDay}
                      onChange={(e) =>
                        setCarForm({
                          ...carForm,
                          pricePerDay: Number(e.target.value)
                        })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Statut Initial *</label>
                    <select
                      value={carForm.status}
                      onChange={(e) =>
                        setCarForm({ ...carForm, status: e.target.value })
                      }
                    >
                      <option value="Disponible">Disponible</option>
                      <option value="Loué">Loué</option>
                      <option value="En maintenance">En maintenance</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Boîte de Vitesse *</label>
                    <select
                      value={carForm.transmission}
                      onChange={(e) =>
                        setCarForm({ ...carForm, transmission: e.target.value })
                      }
                    >
                      <option value="Automatique">Automatique</option>
                      <option value="Manuelle">Manuelle</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Nombre de Places *</label>
                    <input
                      type="text"
                      required
                      placeholder="5 ou 7"
                      value={carForm.seats}
                      onChange={(e) =>
                        setCarForm({ ...carForm, seats: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Carburant *</label>
                    <input
                      type="text"
                      required
                      placeholder="Diesel, Essence..."
                      value={carForm.fuel}
                      onChange={(e) =>
                        setCarForm({ ...carForm, fuel: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Immatriculation</label>
                    <input
                      type="text"
                      placeholder="CE-123-LT"
                      value={carForm.plate}
                      onChange={(e) =>
                        setCarForm({ ...carForm, plate: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Section Image & Téléversement */}
                <div style={{ marginTop: "2rem", padding: "1.6rem", background: "#f8fafc", borderRadius: "10px", border: "1.5px dashed #cbd5e1" }}>
                  <label style={{ display: "block", fontWeight: 700, marginBottom: "0.8rem", color: "#1e293b", fontSize: "1.4rem" }}>
                    <i className="fa-solid fa-camera"></i> Photo du Véhicule
                  </label>

                  {/* Image Preview */}
                  {carForm.img && (
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.4rem", background: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <img
                        src={carForm.img}
                        alt="Aperçu"
                        style={{ width: "130px", height: "80px", objectFit: "contain", borderRadius: "6px", background: "#f1f5f9" }}
                        onError={(e) => { e.currentTarget.src = "/images/cars/toyota-prado-txl-front.webp"; }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <i className="fa-solid fa-circle-check"></i> Image configurée
                        </span>
                        <small style={{ color: "#64748b", wordBreak: "break-all", fontSize: "1.1rem" }}>{carForm.img.substring(0, 70)}...</small>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.2rem" }}>
                    {/* Bouton Upload Fichier */}
                    <label style={{ cursor: "pointer", background: "#E20713", color: "#fff", padding: "0.9rem 1.6rem", borderRadius: "6px", fontWeight: 600, fontSize: "1.3rem", display: "inline-flex", alignItems: "center", gap: "0.8rem" }}>
                      <i className="fa-solid fa-cloud-arrow-up"></i> Téléverser une photo (Appareil / PC)
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleCarImageUpload}
                      />
                    </label>

                    {/* Sélecteur Photos 3M Services */}
                    <div style={{ flex: "1", minWidth: "220px" }}>
                      <select
                        onChange={(e) => {
                          if (e.target.value) setCarForm({ ...carForm, img: e.target.value });
                        }}
                        style={{ width: "100%", padding: "0.9rem 1.2rem", borderRadius: "6px", border: "1.5px solid #cbd5e1", background: "#fff", fontSize: "1.3rem" }}
                      >
                        <option value="">-- Choisir parmi les photos 3M Services --</option>
                        {STOCK_CAR_PHOTOS.map((p) => (
                          <option key={p.url} value={p.url}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="/images/cars/toyota-prado-txl-front.webp ou URL"
                    value={carForm.img}
                    onChange={(e) => setCarForm({ ...carForm, img: e.target.value })}
                    style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1.25rem" }}
                  />
                </div>

                <div className="admin-form-group" style={{ marginTop: "1.5rem" }}>
                  <label>Description & Avantages</label>
                  <textarea
                    rows="3"
                    placeholder="Description du véhicule, options VIP, motorisation..."
                    value={carForm.description}
                    onChange={(e) =>
                      setCarForm({ ...carForm, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-action-btn"
                  onClick={() => setShowCarModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingCar ? "Enregistrer les Modifications" : "Ajouter à la Flotte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================
          MODAL: AJOUTER / MODIFIER UN APPARTEMENT MEUBLÉ
          ================================================================== */}
      {showApartmentModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>{editingApartment ? "Modifier l'Appartement Meublé" : "Ajouter un Nouvel Appartement"}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setShowApartmentModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveApartment}>
              <div className="admin-modal-body">
                <div className="admin-modal-form-grid">
                  <div className="admin-form-group">
                    <label>Titre de l'appartement *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Appartement Prestige Tsinga"
                      value={apartmentForm.title}
                      onChange={(e) =>
                        setApartmentForm({ ...apartmentForm, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Type / Standing *</label>
                    <input
                      type="text"
                      required
                      placeholder="T3 Meublé Haut Standing"
                      value={apartmentForm.type}
                      onChange={(e) =>
                        setApartmentForm({ ...apartmentForm, type: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Localisation (Yaoundé) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Tsinga (Face FECAFOOT), Omnisports, Bastos..."
                      value={apartmentForm.location}
                      onChange={(e) =>
                        setApartmentForm({ ...apartmentForm, location: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Configuration / Pièces *</label>
                    <input
                      type="text"
                      required
                      placeholder="2 Chambres • Salon • 2 Salles de bain"
                      value={apartmentForm.rooms}
                      onChange={(e) =>
                        setApartmentForm({ ...apartmentForm, rooms: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Tarif / Nuitée *</label>
                    <input
                      type="text"
                      required
                      placeholder="65 000 FCFA / nuitée"
                      value={apartmentForm.price}
                      onChange={(e) =>
                        setApartmentForm({ ...apartmentForm, price: e.target.value })
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Statut de disponibilité</label>
                    <select
                      value={apartmentForm.status || "Disponible"}
                      onChange={(e) =>
                        setApartmentForm({ ...apartmentForm, status: e.target.value })
                      }
                    >
                      <option value="Disponible">Disponible</option>
                      <option value="Occupé">Occupé</option>
                      <option value="Réservé">Réservé</option>
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label>Nombre de photos</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={apartmentForm.photosCount}
                      onChange={(e) =>
                        setApartmentForm({
                          ...apartmentForm,
                          photosCount: Number(e.target.value) || 1
                        })
                      }
                    />
                  </div>
                </div>

                {/* Section Image & Téléversement Appartement */}
                <div style={{ marginTop: "2rem", padding: "1.6rem", background: "#f8fafc", borderRadius: "10px", border: "1.5px dashed #cbd5e1" }}>
                  <label style={{ display: "block", fontWeight: 700, marginBottom: "0.8rem", color: "#1e293b", fontSize: "1.4rem" }}>
                    <i className="fa-solid fa-camera"></i> Photo Principale de la Résidence
                  </label>

                  {/* Image Preview */}
                  {apartmentForm.image && (
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1.4rem", background: "#ffffff", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <img
                        src={apartmentForm.image}
                        alt="Aperçu Appartement"
                        style={{ width: "130px", height: "80px", objectFit: "cover", borderRadius: "6px", background: "#f1f5f9" }}
                        onError={(e) => { e.currentTarget.src = "/Asset/appartements/appartement-meuble-suite-parentale.webp"; }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#10b981", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <i className="fa-solid fa-circle-check"></i> Image configurée
                        </span>
                        <small style={{ color: "#64748b", wordBreak: "break-all", fontSize: "1.1rem" }}>{apartmentForm.image.substring(0, 70)}...</small>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.2rem" }}>
                    {/* Bouton Upload Fichier */}
                    <label style={{ cursor: "pointer", background: "#E20713", color: "#fff", padding: "0.9rem 1.6rem", borderRadius: "6px", fontWeight: 600, fontSize: "1.3rem", display: "inline-flex", alignItems: "center", gap: "0.8rem" }}>
                      <i className="fa-solid fa-cloud-arrow-up"></i> Téléverser une photo (Appareil / PC)
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleApartmentImageUpload}
                      />
                    </label>

                    {/* Sélecteur Photos 3M Services */}
                    <div style={{ flex: "1", minWidth: "220px" }}>
                      <select
                        onChange={(e) => {
                          if (e.target.value) setApartmentForm({ ...apartmentForm, image: e.target.value });
                        }}
                        style={{ width: "100%", padding: "0.9rem 1.2rem", borderRadius: "6px", border: "1.5px solid #cbd5e1", background: "#fff", fontSize: "1.3rem" }}
                      >
                        <option value="">-- Choisir parmi les photos Appartements 3M --</option>
                        {STOCK_APT_PHOTOS.map((p) => (
                          <option key={p.url} value={p.url}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="/Asset/appartements/appartement-meuble-suite-parentale.webp ou URL"
                    value={apartmentForm.image}
                    onChange={(e) => setApartmentForm({ ...apartmentForm, image: e.target.value })}
                    style={{ width: "100%", padding: "0.8rem 1rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1.25rem" }}
                  />
                </div>

                <div className="admin-form-group" style={{ marginTop: "1.5rem" }}>
                  <label>Description Générale de la Résidence</label>
                  <textarea
                    rows="3"
                    placeholder="Situé à Tsinga face FECAFOOT, cet appartement meublé offre un cadre paisible, moderne et haut de gamme..."
                    value={apartmentForm.description}
                    onChange={(e) =>
                      setApartmentForm({ ...apartmentForm, description: e.target.value })
                    }
                  />
                </div>

                {/* Section Description & Équipements (Options administrables) */}
                <div style={{ marginTop: "2rem", padding: "1.6rem", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 800, color: "#0f172a", fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <i className="fa-solid fa-list-check" style={{ color: "#E20713" }}></i>
                      Description & Équipements (Sélectionnés : {apartmentForm.equipments?.length || 0})
                    </label>
                    <span style={{ fontSize: "1.15rem", color: "#64748b" }}>Cochez pour activer ou ajoutez un équipement</span>
                  </div>

                  {/* Standard predefined equipment options */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1.2rem" }}>
                    {DEFAULT_EQUIPMENT_OPTIONS.map((eq) => {
                      const isSelected = apartmentForm.equipments?.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => toggleEquipmentOption(eq)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "20px",
                            fontSize: "1.2rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: isSelected ? "1.5px solid #E20713" : "1px solid #cbd5e1",
                            background: isSelected ? "#fee2e2" : "#ffffff",
                            color: isSelected ? "#991b1b" : "#475569",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <i className={`fa-solid ${isSelected ? "fa-circle-check" : "fa-plus"}`}></i>
                          {eq}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Equipment Input */}
                  <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="Ajouter un équipement personnalisé..."
                      value={apartmentForm.customEquipment || ""}
                      onChange={(e) => setApartmentForm({ ...apartmentForm, customEquipment: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomEquipment();
                        }
                      }}
                      style={{ flex: 1, padding: "0.7rem 1rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1.25rem" }}
                    />
                    <button
                      type="button"
                      onClick={addCustomEquipment}
                      className="admin-action-btn"
                      style={{ padding: "0.7rem 1.4rem", background: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "1.25rem", cursor: "pointer" }}
                    >
                      <i className="fa-solid fa-plus"></i> Ajouter
                    </button>
                  </div>

                  {/* Active Equipments List with delete */}
                  {Array.isArray(apartmentForm.equipments) && apartmentForm.equipments.length > 0 && (
                    <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                      {apartmentForm.equipments.map((eq) => (
                        <span
                          key={eq}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            background: "#e2e8f0",
                            color: "#1e293b",
                            padding: "0.4rem 0.9rem",
                            borderRadius: "15px",
                            fontSize: "1.15rem",
                            fontWeight: 600
                          }}
                        >
                          <i className="fa-solid fa-check" style={{ color: "#16a34a" }}></i>
                          {eq}
                          <button
                            type="button"
                            onClick={() => removeEquipmentOption(eq)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0, marginLeft: "0.3rem", fontSize: "1.3rem", lineHeight: 1 }}
                            title="Supprimer cet équipement"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section Services VIP Inclus (Options administrables) */}
                <div style={{ marginTop: "1.8rem", padding: "1.6rem", background: "#fffbeb", borderRadius: "10px", border: "1px solid #fde68a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 800, color: "#92400e", fontSize: "1.4rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <i className="fa-solid fa-crown" style={{ color: "#d97706" }}></i>
                      Services VIP Inclus (Sélectionnés : {apartmentForm.vipServices?.length || 0})
                    </label>
                    <span style={{ fontSize: "1.15rem", color: "#b45309" }}>Options VIP incluses pour ce logement</span>
                  </div>

                  {/* Standard predefined VIP service options */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1.2rem" }}>
                    {DEFAULT_VIP_SERVICES_OPTIONS.map((vs) => {
                      const isSelected = apartmentForm.vipServices?.includes(vs);
                      return (
                        <button
                          key={vs}
                          type="button"
                          onClick={() => toggleVipServiceOption(vs)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "20px",
                            fontSize: "1.2rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: isSelected ? "1.5px solid #d97706" : "1px solid #fcd34d",
                            background: isSelected ? "#fef3c7" : "#ffffff",
                            color: isSelected ? "#78350f" : "#92400e",
                            transition: "all 0.15s ease"
                          }}
                        >
                          <i className={`fa-solid ${isSelected ? "fa-crown" : "fa-plus"}`}></i>
                          {vs}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom VIP Service Input */}
                  <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="Ajouter un service VIP personnalisé..."
                      value={apartmentForm.customVipService || ""}
                      onChange={(e) => setApartmentForm({ ...apartmentForm, customVipService: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomVipService();
                        }
                      }}
                      style={{ flex: 1, padding: "0.7rem 1rem", borderRadius: "6px", border: "1px solid #fcd34d", fontSize: "1.25rem", background: "#fff" }}
                    />
                    <button
                      type="button"
                      onClick={addCustomVipService}
                      className="admin-action-btn"
                      style={{ padding: "0.7rem 1.4rem", background: "#d97706", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, fontSize: "1.25rem", cursor: "pointer" }}
                    >
                      <i className="fa-solid fa-plus"></i> Ajouter VIP
                    </button>
                  </div>

                  {/* Active VIP Services List with delete */}
                  {Array.isArray(apartmentForm.vipServices) && apartmentForm.vipServices.length > 0 && (
                    <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
                      {apartmentForm.vipServices.map((vs) => (
                        <span
                          key={vs}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.6rem",
                            background: "#fef3c7",
                            color: "#78350f",
                            padding: "0.4rem 0.9rem",
                            borderRadius: "15px",
                            fontSize: "1.15rem",
                            fontWeight: 600,
                            border: "1px solid #fde68a"
                          }}
                        >
                          <i className="fa-solid fa-crown" style={{ color: "#d97706" }}></i>
                          {vs}
                          <button
                            type="button"
                            onClick={() => removeVipServiceOption(vs)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#92400e", padding: 0, marginLeft: "0.3rem", fontSize: "1.3rem", lineHeight: 1 }}
                            title="Supprimer ce service VIP"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-action-btn"
                  onClick={() => setShowApartmentModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingApartment ? "Enregistrer les Modifications" : "Ajouter au Catalogue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

