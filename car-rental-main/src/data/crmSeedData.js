// 3M SERVICES CRM & ERP INITIAL SEED DATA
// Operational data for Yaoundé VIP Fleet & Furnished Residences

export const DEFAULT_BOOKINGS = [];

export const DEFAULT_CUSTOMERS = [];

export const DEFAULT_CONTRACTS = [];

export const DEFAULT_PAYMENTS = [];

export const DEFAULT_DRIVERS = [
  {
    id: "DRV-01",
    name: "Martin Essomba",
    phone: "+237 698 11 22 33",
    licenseNumber: "PC-YDE-2015-8841",
    experienceYears: 9,
    status: "Disponible",
    specialty: "4x4 VIP & Cortèges Officiels"
  },
  {
    id: "DRV-02",
    name: "Michel Talla",
    phone: "+237 675 44 55 66",
    licenseNumber: "PC-DLA-2017-3109",
    experienceYears: 7,
    status: "En mission",
    specialty: "Berlines Exécutives & Protocole"
  },
  {
    id: "DRV-03",
    name: "Marc Ndongo",
    phone: "+237 691 00 22 44",
    licenseNumber: "PC-YDE-2019-1122",
    experienceYears: 5,
    status: "Disponible",
    specialty: "Pick-up Tout-Terrain & Longue Distance"
  },
  {
    id: "DRV-04",
    name: "Alain Nguemo",
    phone: "+237 670 99 88 77",
    licenseNumber: "PC-YDE-2018-7733",
    experienceYears: 6,
    status: "Repos",
    specialty: "Conduite Bilingue & Transferts Aéroport"
  }
];

export const DEFAULT_REVIEWS = [
  {
    id: "REV-01",
    clientName: "Patrick Nganou",
    rating: 5,
    comment: "Véhicule impeccable, Land Cruiser V8 d'une propreté remarquable. Chauffeur très ponctuel et professionnel à l'aéroport de Nsimalen.",
    date: "2026-11-11",
    status: "Publié"
  },
  {
    id: "REV-02",
    clientName: "Dr. Marie-Claire Biya",
    rating: 5,
    comment: "Excellent séjour dans la résidence meublée de Tsinga et service de conciergerie automobile irréprochable.",
    date: "2026-11-09",
    status: "Publié"
  }
];

export const DEFAULT_CONTACTS = [];

export const DEFAULT_LOCATIONS = {
  pickup: [
    { id: "loc-p1", name: "Agence Omnisports (Face Pharmacie Le Bon Berger)", city: "Yaoundé" },
    { id: "loc-p2", name: "Aéroport International de Yaoundé-Nsimalen", city: "Yaoundé" },
    { id: "loc-p3", name: "Résidences 3M Tsinga (Face FECAFOOT)", city: "Yaoundé" },
    { id: "loc-p4", name: "Bastos (Quartier Diplomatique)", city: "Yaoundé" },
    { id: "loc-p5", name: "Bonanjo Centre des Affaires", city: "Douala" }
  ],
  dropoff: [
    { id: "loc-d1", name: "Agence Omnisports (Face Pharmacie Le Bon Berger)", city: "Yaoundé" },
    { id: "loc-d2", name: "Aéroport International de Yaoundé-Nsimalen", city: "Yaoundé" },
    { id: "loc-d3", name: "Résidences 3M Tsinga (Face FECAFOOT)", city: "Yaoundé" },
    { id: "loc-d4", name: "Hôtel Hilton Yaoundé", city: "Yaoundé" }
  ]
};

export const DEFAULT_SUBSCRIBERS = [];

export const DEFAULT_EQUIPMENT_OPTIONS = [
  "Climatisation intégrale",
  "WiFi Fibre Optique illimité",
  "Smart TV 55 pouces HD (Netflix / Canal+)",
  "Cuisine américaine tout équipée",
  "Literie King Size Grand Confort",
  "Salle de bain design à l'italienne",
  "Balcon privé avec vue dégagée",
  "Forage d'eau & suppresseur automatique",
  "Machine à laver & espace buanderie",
  "Micro-ondes & réfrigérateur combiné",
  "Chauffe-eau électrique permanent"
];

export const DEFAULT_VIP_SERVICES_OPTIONS = [
  "Groupe électrogène automatique 24/7 (Zéro coupure)",
  "Gardiennage & vigiles 24/7 (Caméras de surveillance)",
  "Ménage régulier & conciergerie hôtelière 3M",
  "Parking privé sécurisé et fermé",
  "Chauffeur privé VIP dédié (sur demande)",
  "Navette accueil aéroport Nsimalen",
  "Assistance & conciergerie privée 24/7"
];

export const DEFAULT_APARTMENTS = [
  {
    id: "apt-01",
    title: "Appartement Prestige Tsinga (Face FECAFOOT)",
    type: "T3 Meublé Haut Standing",
    location: "Tsinga (Face FECAFOOT), Yaoundé",
    rooms: "2 Chambres • 2 Salons • 2 Salles de bain",
    price: "65 000 FCFA / nuitée (Dégressif au mois)",
    photosCount: 5,
    image: "/Asset/appartements/appartement-meuble-suite-parentale.webp",
    status: "Disponible",
    description: "Situé à Tsinga, directement en face du siège de la FECAFOOT à Yaoundé, cet appartement meublé grand standing vous offre une suite parentale avec literie de luxe, une cuisine équipée moderne, salle de bain design, climatisation intégrale, groupe électrogène automatique et gardiennage permanent 24/7.",
    equipments: [
      "Climatisation intégrale",
      "WiFi Fibre Optique illimité",
      "Smart TV 55 pouces HD (Netflix / Canal+)",
      "Cuisine américaine tout équipée",
      "Literie King Size Grand Confort",
      "Salle de bain design à l'italienne"
    ],
    vipServices: [
      "Groupe électrogène automatique 24/7 (Zéro coupure)",
      "Gardiennage & vigiles 24/7 (Caméras de surveillance)",
      "Ménage régulier & conciergerie hôtelière 3M",
      "Parking privé sécurisé et fermé"
    ]
  },
  {
    id: "apt-02",
    title: "Résidence Cosy Tsinga (Face FECAFOOT)",
    type: "T2 Meublé Contemporain",
    location: "Tsinga (Face FECAFOOT), Yaoundé",
    rooms: "1 Chambre • 1 Grand Salon • 1 Salle de bain",
    price: "40 000 FCFA / nuitée (Tarif spécial long séjour)",
    photosCount: 4,
    image: "/Asset/appartements/appartement-meuble-chambre-bleue.webp",
    status: "Disponible",
    description: "Élégant et chaleureux avec salon contemporain, cuisine américaine laquée, smart TV 55 pouces et connexion fibre optique haut débit.",
    equipments: [
      "Climatisation intégrale",
      "WiFi Fibre Optique illimité",
      "Smart TV 55 pouces HD (Netflix / Canal+)",
      "Cuisine américaine tout équipée"
    ],
    vipServices: [
      "Groupe électrogène automatique 24/7 (Zéro coupure)",
      "Gardiennage & vigiles 24/7 (Caméras de surveillance)",
      "Parking privé sécurisé et fermé"
    ]
  },
  {
    id: "apt-03",
    title: "Grand Standing Tsinga (Face FECAFOOT)",
    type: "T4 Prestige Exécutif",
    location: "Tsinga (Face FECAFOOT), Yaoundé",
    rooms: "3 Chambres • Double Séjour • 3 Salles de bain",
    price: "90 000 FCFA / nuitée",
    photosCount: 6,
    image: "/Asset/appartements/appartement-meuble-chambre-confort.webp",
    status: "Disponible",
    description: "Conçu pour les familles, cadres et délégations d'affaires recherchant l'espace, la confidentialité et un confort sans compromis.",
    equipments: [
      "Climatisation intégrale",
      "WiFi Fibre Optique illimité",
      "Smart TV 55 pouces HD (Netflix / Canal+)",
      "Cuisine américaine tout équipée",
      "Literie King Size Grand Confort",
      "Salle de bain design à l'italienne",
      "Balcon privé avec vue dégagée"
    ],
    vipServices: [
      "Groupe électrogène automatique 24/7 (Zéro coupure)",
      "Gardiennage & vigiles 24/7 (Caméras de surveillance)",
      "Ménage régulier & conciergerie hôtelière 3M",
      "Parking privé sécurisé et fermé",
      "Chauffeur privé VIP dédié (sur demande)"
    ]
  }
];


