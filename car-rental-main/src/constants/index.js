// 3M SERVICES - Application Global Constants
export const COMPANY_INFO = {
  name: "3M SERVICES",
  legalName: "3M SERVICES SARL",
  tagline: "Location de Véhicules de Prestige & Appartements Meublés VIP",
  city: "Yaoundé",
  country: "Cameroun",
  address: "Omnisports, Face Pharmacie Le Bon Berger, Yaoundé, Cameroun",
  phones: {
    primary: "+237 691 78 64 47",
    secondary: "+237 698 66 87 61",
    whatsapp: "+237 691 78 64 47",
    whatsappClean: "237691786447"
  },
  emails: {
    contact: "contact@3mservice.shop",
    support: "support@3mservice.shop",
    admin: "admin@3mservice.shop"
  },
  hours: "24h/24 & 7j/7",
  currency: "FCFA"
};

export const ROUTES = {
  HOME: "/",
  MODELS: "/models",
  APARTMENTS: "/apartments",
  ABOUT: "/about",
  CONTACT: "/contact",
  TEAM: "/team",
  TESTIMONIALS: "/testimonials",
  ADMIN: "http://127.0.0.1:5002/admin/dashboard",
  ADMIN_LOGIN: "http://127.0.0.1:5002/login"
};

export const BOOKING_STATUSES = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée"
};

export const VEHICLE_CATEGORIES = [
  "Tous",
  "4x4 & SUV VIP",
  "Berlines VIP",
  "Pick-up Urbains"
];

export const PAYMENT_METHODS = [
  "Espèces à la livraison",
  "Orange Money",
  "MTN Mobile Money",
  "Virement Bancaire (Afriland First Bank)",
  "Carte Bancaire (En Agence)"
];
