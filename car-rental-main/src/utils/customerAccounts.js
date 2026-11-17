// 3M SERVICES - Customer Accounts & CRM Order Synchronization Utility
import { DEFAULT_CUSTOMERS, DEFAULT_BOOKINGS } from "../data/crmSeedData";
import { API_BASE } from "../config/api";

const CRM_STORE_KEY = "3m_crm_store_v2";
const CURRENT_CLIENT_KEY = "3m_current_client";

/**
 * Load CRM store from localStorage with fallback
 */
export const getCrmStore = () => {
  try {
    const raw = localStorage.getItem(CRM_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : DEFAULT_BOOKINGS,
        customers: Array.isArray(parsed.customers) ? parsed.customers : DEFAULT_CUSTOMERS,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        cars: Array.isArray(parsed.cars) ? parsed.cars : [],
        apartments: Array.isArray(parsed.apartments) ? parsed.apartments : [],
        ...parsed
      };
    }
  } catch (e) {
    console.warn("Could not read CRM store:", e);
  }
  return {
    bookings: DEFAULT_BOOKINGS,
    customers: DEFAULT_CUSTOMERS,
    notifications: []
  };
};

/**
 * Save CRM store to localStorage and dispatch event
 */
export const saveCrmStore = (store) => {
  try {
    localStorage.setItem(CRM_STORE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("3m-crm-updated", { detail: store }));
  } catch (e) {
    console.warn("Could not save CRM store:", e);
  }
};

/**
 * Get current logged in client from localStorage
 */
export const getCurrentClient = () => {
  try {
    const raw = localStorage.getItem(CURRENT_CLIENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not get current client:", e);
  }
  return null;
};

/**
 * Set current client in localStorage
 */
export const setCurrentClient = (client) => {
  try {
    if (client) {
      localStorage.setItem(CURRENT_CLIENT_KEY, JSON.stringify(client));
    } else {
      localStorage.removeItem(CURRENT_CLIENT_KEY);
    }
    window.dispatchEvent(new CustomEvent("3m-client-auth-changed", { detail: client }));
  } catch (e) {
    console.warn("Could not set current client:", e);
  }
};

/**
 * Login client by phone or email
 */
export const loginClient = (identifier) => {
  if (!identifier) return null;
  const store = getCrmStore();
  const cleanId = identifier.trim().toLowerCase();
  const cleanPhone = identifier.replace(/[^0-9]/g, "");

  const customer = store.customers.find((c) => {
    const cPhoneClean = (c.phone || "").replace(/[^0-9]/g, "");
    const cEmailClean = (c.email || "").trim().toLowerCase();
    return (
      (cleanPhone && cPhoneClean.includes(cleanPhone)) ||
      (cleanId && cEmailClean === cleanId) ||
      (cleanId && (c.accountNumber || "").toLowerCase() === cleanId)
    );
  });

  if (customer) {
    setCurrentClient(customer);
    return customer;
  }
  return null;
};

/**
 * Upsert or create Customer Account when an order / booking is made
 */
export const saveOrderAndCustomerAccount = ({
  clientName,
  phone,
  email = "",
  address = "",
  city = "Yaoundé",
  itemName,
  itemCategory = "Véhicule VIP",
  itemPrice = 120000,
  days = 1,
  totalPrice = 120000,
  pickTime = "",
  dropTime = "",
  pickUp = "Agence Omnisports, Yaoundé",
  dropOff = "Agence Omnisports, Yaoundé",
  notes = "",
  source = "Site Web"
}) => {
  const store = getCrmStore();
  const safeName = (clientName || "Client 3M Services").trim();
  const safePhone = (phone || "+237 691 78 64 47").trim();
  const safeEmail = (email || "").trim();
  const safePrice = Number(totalPrice) || (Number(itemPrice) * (Number(days) || 1)) || 120000;

  const phoneDigits = safePhone.replace(/[^0-9]/g, "");
  const orderRef = "3M-RES-" + Math.floor(1000 + Math.random() * 9000);

  // Check if customer already exists
  let customerIndex = store.customers.findIndex((c) => {
    const cDigits = (c.phone || "").replace(/[^0-9]/g, "");
    return (
      (phoneDigits && cDigits && (cDigits === phoneDigits || cDigits.endsWith(phoneDigits.slice(-8)))) ||
      (safeEmail && (c.email || "").toLowerCase() === safeEmail.toLowerCase())
    );
  });

  let customer;
  const now = new Date().toISOString();

  if (customerIndex >= 0) {
    // Update existing customer
    customer = { ...store.customers[customerIndex] };
    customer.name = safeName !== "Client 3M Services" ? safeName : customer.name;
    if (safeEmail && !customer.email) customer.email = safeEmail;
    if (address && !customer.address) customer.address = address;
    if (city) customer.city = city;
    customer.totalBookings = (Number(customer.totalBookings) || 0) + 1;
    customer.totalSpent = (Number(customer.totalSpent) || 0) + safePrice;
    customer.lastOrderAt = now;
    if (!customer.accountNumber) {
      customer.accountNumber = `3M-CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    // Update tier based on total spent
    if (customer.totalSpent >= 1500000) customer.tier = "Gold VIP";
    else if (customer.totalSpent >= 500000) customer.tier = "Silver VIP";
    else customer.tier = customer.tier || "Bronze VIP";

    store.customers[customerIndex] = customer;
  } else {
    // Create new customer account
    const accountNumber = `3M-CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    customer = {
      id: `CUST-${Date.now().toString().slice(-6)}`,
      accountNumber,
      name: safeName,
      phone: safePhone,
      email: safeEmail,
      city: city || "Yaoundé",
      address: address || "",
      type: "Particulier VIP",
      tier: safePrice >= 1500000 ? "Gold VIP" : safePrice >= 500000 ? "Silver VIP" : "Bronze VIP",
      totalBookings: 1,
      totalSpent: safePrice,
      status: "Actif VIP",
      createdAt: now,
      lastOrderAt: now
    };
    store.customers.unshift(customer);
  }

  // Create booking / order
  const newBooking = {
    id: orderRef,
    accountNumber: customer.accountNumber,
    customerId: customer.id,
    clientName: customer.name,
    phone: customer.phone,
    email: customer.email,
    city: customer.city,
    address: customer.address,
    carName: itemName,
    itemCategory,
    pickUp: pickUp || "Agence Omnisports, Yaoundé",
    dropOff: dropOff || "Agence Omnisports, Yaoundé",
    pickTime: pickTime || new Date().toISOString().split("T")[0],
    dropTime: dropTime || pickTime || new Date().toISOString().split("T")[0],
    days: Number(days) || 1,
    pricePerDay: Number(itemPrice) || safePrice,
    totalPrice: safePrice,
    paidAmount: 0,
    balance: safePrice,
    status: "Confirmée",
    source,
    createdAt: now,
    internalNotes: [
      {
        id: `nt-${Date.now()}`,
        text: `Commande passée via ${source}. Compte Client ${customer.accountNumber} synchronisé. Notes: ${notes || "Aucune note"}`,
        author: "Système 3M",
        createdAt: now
      }
    ]
  };

  store.bookings = [newBooking, ...(store.bookings || [])];

  // Add system notification for admin
  store.notifications = [
    {
      id: `notif-${Date.now()}`,
      type: "booking",
      title: `Nouvelle Commande : ${customer.name}`,
      desc: `${itemName} • ${safePrice.toLocaleString("fr-FR")} FCFA • Compte Client ${customer.accountNumber}`,
      time: "À l'instant",
      unread: true
    },
    ...(store.notifications || [])
  ];

  // Persist store & current client session
  saveCrmStore(store);
  setCurrentClient(customer);

  // Send to backend asynchronously if available
  fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newBooking)
  }).catch(() => {});

  return { customer, booking: newBooking };
};

/**
 * Get all orders / bookings for a given client
 */
export const getClientOrders = (client) => {
  if (!client) return [];
  const store = getCrmStore();
  const phoneDigits = (client.phone || "").replace(/[^0-9]/g, "");
  const emailClean = (client.email || "").trim().toLowerCase();
  const clientName = (client.name || "").trim().toLowerCase();
  const accountNum = (client.accountNumber || "").trim().toLowerCase();

  return (store.bookings || []).filter((b) => {
    const bDigits = (b.phone || "").replace(/[^0-9]/g, "");
    const bEmail = (b.email || "").trim().toLowerCase();
    const bName = (b.clientName || "").trim().toLowerCase();
    const bAccount = (b.accountNumber || "").trim().toLowerCase();

    return (
      (accountNum && bAccount === accountNum) ||
      (phoneDigits && bDigits && (bDigits === phoneDigits || bDigits.endsWith(phoneDigits.slice(-8)))) ||
      (emailClean && bEmail === emailClean) ||
      (clientName && bName === clientName)
    );
  });
};
