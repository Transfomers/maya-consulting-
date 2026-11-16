// 3M SERVICES CRM & ERP INITIAL SEED DATA
// Operational data for Yaoundé VIP Fleet & Furnished Residences

export const DEFAULT_BOOKINGS = [
  {
    id: "3M-RES-1082",
    clientName: "Arnaud Mbarga",
    phone: "+237 698 66 87 61",
    email: "arnaud.mbarga@gmail.com",
    carName: "Toyota Land Cruiser Prado TXL VIP (Gris Anthracite)",
    pickUp: "Agence Omnisports (Face Pharmacie Le Bon Berger)",
    dropOff: "Agence Omnisports (Face Pharmacie Le Bon Berger)",
    pickTime: "2026-11-15",
    dropTime: "2026-11-19",
    days: 4,
    pricePerDay: 120000,
    totalPrice: 480000,
    paidAmount: 240000,
    balance: 240000,
    status: "Confirmée",
    driverAssigned: "Martin Essomba (Chauffeur VIP 4x4)",
    createdAt: "2026-11-12T10:30:00Z",
    internalNotes: [
      {
        id: "nt-1",
        text: "Acompte de 50% reçu par Orange Money. Véhicule préparé, lustré et vérifié.",
        author: "Direction 3M",
        createdAt: "2026-11-12T11:00:00Z"
      }
    ]
  },
  {
    id: "3M-RES-1081",
    clientName: "Délégation MINREX",
    phone: "+237 673 84 18 21",
    email: "protocole@diplomatie.cm",
    carName: "Toyota Land Cruiser V8 (LC200 Prestige)",
    pickUp: "Aéroport International de Yaoundé-Nsimalen",
    dropOff: "Hôtel Hilton Yaoundé",
    pickTime: "2026-11-14",
    dropTime: "2026-11-17",
    days: 3,
    pricePerDay: 130000,
    totalPrice: 390000,
    paidAmount: 390000,
    balance: 0,
    status: "En cours",
    driverAssigned: "Martin Essomba (Chauffeur VIP 4x4)",
    createdAt: "2026-11-10T14:15:00Z",
    internalNotes: [
      {
        id: "nt-2",
        text: "Mission diplomatique officielle. Chauffeur bilingue en tenue d'apparat exigé.",
        author: "Protocole 3M",
        createdAt: "2026-11-10T14:30:00Z"
      }
    ]
  },
  {
    id: "3M-RES-1080",
    clientName: "Société Générale Cameroun",
    phone: "+237 691 78 64 47",
    email: "direction.logistique@sgc.cm",
    carName: "Pickup Toyota Hilux",
    pickUp: "Agence Omnisports (Face Pharmacie Le Bon Berger)",
    dropOff: "Agence Omnisports (Face Pharmacie Le Bon Berger)",
    pickTime: "2026-11-18",
    dropTime: "2026-11-23",
    days: 5,
    pricePerDay: 70000,
    totalPrice: 350000,
    paidAmount: 100000,
    balance: 250000,
    status: "En attente",
    driverAssigned: "Alain Nguemo (Chauffeur Polyvalent)",
    createdAt: "2026-11-13T09:00:00Z",
    internalNotes: [
      {
        id: "nt-3",
        text: "Tournée des agences régionales. En attente de validation du bon de commande.",
        author: "Direction 3M",
        createdAt: "2026-11-13T09:15:00Z"
      }
    ]
  },
  {
    id: "3M-RES-1079",
    clientName: "Chantal Etoa",
    phone: "+237 699 12 34 56",
    email: "etoa.chantal@yahoo.fr",
    carName: "Toyota Camry Berline Prestige",
    pickUp: "Résidences 3M Tsinga (Face FECAFOOT)",
    dropOff: "Aéroport International de Yaoundé-Nsimalen",
    pickTime: "2026-11-10",
    dropTime: "2026-11-12",
    days: 2,
    pricePerDay: 60000,
    totalPrice: 120000,
    paidAmount: 120000,
    balance: 0,
    status: "Terminée",
    driverAssigned: "Michel Talla (Chauffeur Berline)",
    createdAt: "2026-11-08T08:00:00Z",
    internalNotes: [
      {
        id: "nt-4",
        text: "Transfert aéroport et déplacements d'affaires. Prestation terminée avec succès.",
        author: "Conciergerie",
        createdAt: "2026-11-12T18:00:00Z"
      }
    ]
  }
];

export const DEFAULT_CUSTOMERS = [
  {
    id: "CUST-001",
    name: "Arnaud Mbarga",
    phone: "+237 698 66 87 61",
    email: "arnaud.mbarga@gmail.com",
    city: "Yaoundé",
    type: "Particulier VIP",
    totalBookings: 3,
    totalSpent: 1120000,
    status: "Actif"
  },
  {
    id: "CUST-002",
    name: "Délégation MINREX",
    phone: "+237 673 84 18 21",
    email: "protocole@diplomatie.cm",
    city: "Yaoundé",
    type: "Institutionnel",
    totalBookings: 7,
    totalSpent: 3850000,
    status: "Grand Compte"
  },
  {
    id: "CUST-003",
    name: "Société Générale Cameroun",
    phone: "+237 691 78 64 47",
    email: "direction.logistique@sgc.cm",
    city: "Douala / Yaoundé",
    type: "Entreprise",
    totalBookings: 5,
    totalSpent: 2100000,
    status: "Conventionné"
  },
  {
    id: "CUST-004",
    name: "Chantal Etoa",
    phone: "+237 699 12 34 56",
    email: "etoa.chantal@yahoo.fr",
    city: "Yaoundé",
    type: "Particulier",
    totalBookings: 2,
    totalSpent: 240000,
    status: "Actif"
  },
  {
    id: "CUST-005",
    name: "MUPOCAM (Orange Cameroun)",
    phone: "+237 699 00 00 00",
    email: "partenariats@mupocam.cm",
    city: "Yaoundé / Douala",
    type: "Partenaire Conventionné",
    totalBookings: 12,
    totalSpent: 6400000,
    status: "Grand Compte"
  }
];

export const DEFAULT_CONTRACTS = [
  {
    id: "CTR-2026-082",
    contractNumber: "3M-CTR-2026-082",
    bookingId: "3M-RES-1082",
    clientName: "Arnaud Mbarga",
    carName: "Toyota Land Cruiser Prado TXL VIP (Gris Anthracite)",
    driverAssigned: "Martin Essomba (Chauffeur VIP 4x4)",
    securityDeposit: 150000,
    clauses: "Véhicule remis propre avec plein de carburant. Restitution dans le même état. Couverture tous risques VIP 3M.",
    generatedAt: "2026-11-12T11:15:00Z",
    status: "Signé & Actif"
  },
  {
    id: "CTR-2026-081",
    contractNumber: "3M-CTR-2026-081",
    bookingId: "3M-RES-1081",
    clientName: "Délégation MINREX",
    carName: "Toyota Land Cruiser V8 (LC200 Prestige)",
    driverAssigned: "Martin Essomba (Chauffeur VIP 4x4)",
    securityDeposit: 200000,
    clauses: "Mission officielle avec chauffeur 3M agréé. Priorité protocolaire et assistance technique 24/7.",
    generatedAt: "2026-11-10T14:45:00Z",
    status: "En cours"
  }
];

export const DEFAULT_PAYMENTS = [
  {
    id: "PMT-9402",
    bookingId: "3M-RES-1082",
    clientName: "Arnaud Mbarga",
    amount: 240000,
    method: "Orange Money",
    reference: "OM-20261112-98421",
    date: "2026-11-12T11:00:00Z",
    note: "Acompte de 50% sur réservation Prado VIP"
  },
  {
    id: "PMT-9401",
    bookingId: "3M-RES-1081",
    clientName: "Délégation MINREX",
    amount: 390000,
    method: "Virement Bancaire (Afriland)",
    reference: "VIR-AFRILAND-0929743",
    date: "2026-11-10T15:00:00Z",
    note: "Règlement intégral mission officielle V8"
  },
  {
    id: "PMT-9400",
    bookingId: "3M-RES-1080",
    clientName: "Société Générale Cameroun",
    amount: 100000,
    method: "MTN Mobile Money",
    reference: "MOMO-20261113-5512",
    date: "2026-11-13T09:30:00Z",
    note: "Avance sur location Hilux"
  },
  {
    id: "PMT-9399",
    bookingId: "3M-RES-1079",
    clientName: "Chantal Etoa",
    amount: 120000,
    method: "Espèces",
    reference: "RECU-ESP-0481",
    date: "2026-11-10T09:00:00Z",
    note: "Paiement en agence Omnisports"
  }
];

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

export const DEFAULT_CONTACTS = [
  {
    id: "MSG-101",
    name: "Cabinet Me Kamga",
    email: "contact@kamga-avocats.cm",
    phone: "+237 699 45 12 78",
    subject: "Demande devis location mensuelle Berline Prestige",
    message: "Bonjour, nous souhaitons louer la Toyota Camry pour les déplacements de notre cabinet pour une durée de 30 jours à Yaoundé.",
    createdAt: "2026-11-13T08:30:00Z",
    status: "Nouveau"
  },
  {
    id: "MSG-100",
    name: "Sébastien Fouda",
    email: "s.fouda@bicec.cm",
    phone: "+237 671 23 89 01",
    subject: "Réservation Prado VIP pour mariage",
    message: "Disponibilité du Prado Blanc pour le weekend du 28 novembre avec chauffeur en tenue d'apparat.",
    createdAt: "2026-11-12T16:20:00Z",
    status: "Traité"
  }
];

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

export const DEFAULT_SUBSCRIBERS = [
  { id: "sub-1", email: "arnaud.mbarga@gmail.com", createdAt: "2026-11-12T10:30:00Z" },
  { id: "sub-2", email: "direction.logistique@sgc.cm", createdAt: "2026-11-13T09:00:00Z" },
  { id: "sub-3", email: "contact@kamga-avocats.cm", createdAt: "2026-11-13T08:30:00Z" }
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
    description: "Situé à Tsinga, directement en face du siège de la FECAFOOT à Yaoundé, cet appartement meublé grand standing vous offre une suite parentale avec literie de luxe, une cuisine équipée moderne, salle de bain design, climatisation intégrale, groupe électrogène automatique et gardiennage permanent 24/7."
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
    description: "Élégant et chaleureux avec salon contemporain, cuisine américaine laquée, smart TV 55 pouces et connexion fibre optique haut débit."
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
    description: "Conçu pour les familles, cadres et délégations d'affaires recherchant l'espace, la confidentialité et un confort sans compromis."
  }
];


