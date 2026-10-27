// 3M SERVICES - CATALOGUE AUTOMOBILE 2025
// Fournisseur expérimenté de services automobiles basé à Yaoundé, Région du Centre, Cameroun.
// Vente de voitures | Location de véhicules | Location d'appartements
// Slogan: "Le confort de votre foyer, dans nos véhicules"

export const CATALOG_INFO = {
  company: "3M SERVICES",
  catalogTitle: "CATALOGUE AUTOMOBILE 2025",
  tagline: "Le confort de votre foyer, dans nos véhicules",
  aboutShort: "3M services est un fournisseur expérimenté de services automobiles basé dans la région du centre, plus précisément dans la ville de Yaoundé.",
  aboutFull: "3M Services est un fournisseur expérimenté de services automobiles et immobiliers de premier plan basé à Yaoundé dans la région du Centre. Nous proposons la vente de véhicules neufs et d'occasion sélectionnés, la location de véhicules tout confort (avec ou sans chauffeur) ainsi que la location d'appartements meublés haut standing. Notre mission : vous offrir le confort de votre foyer, dans nos véhicules.",
  location: "Yaoundé, Région du Centre, Cameroun",
  phone: "+237 691 78 64 47",
  whatsapp: "237691786447",
  email: "contact@3mservice.shop",
  website: "https://www.3mservice.shop",
  services: [
    {
      id: "vente",
      title: "Vente de Voitures",
      description: "Véhicules neufs (0 km) sous garantie et occasions certifiées rigoureusement inspectées. Commande sur mesure toutes marques.",
      icon: "Car",
    },
    {
      id: "location-vehicules",
      title: "Location de Véhicules",
      description: "Berlines, SUV 4x4 et véhicules de prestige disponibles pour courte, moyenne ou longue durée à Yaoundé et dans tout le Cameroun.",
      icon: "Key",
    },
    {
      id: "location-appartements",
      title: "Location d'Appartements",
      description: "Appartements meublés de haut standing, climatisés, sécurisés 24h/24 avec wifi et parking privé pour vos séjours d'affaires ou de vacances.",
      icon: "Home",
    },
    {
      id: "commandes-speciales",
      title: "Commandes sur Mesure",
      description: "Importation personnalisée depuis l'Europe, l'Amérique ou l'Asie de n'importe quel modèle selon votre cahier des charges.",
      icon: "ShieldCheck",
    }
  ]
};

export const CATALOG_SECTIONS = [
  {
    number: "01",
    title: "LES SUV",
    slug: "suv",
    subtitle: "Puissance, polyvalence et confort sur les routes urbaines et interurbaines",
    count: 4,
    heroImage: "/images/cars/jeep-grand-cherokee-front.webp",
  },
  {
    number: "02",
    title: "LES MERCEDES-BENZ",
    slug: "mercedes",
    subtitle: "L'élégance suprême, la technologie allemande et le prestige statutaire",
    count: 2,
    heroImage: "/images/cars/mercedes-classe-e-front.webp",
  },
  {
    number: "03",
    title: "LES KIA (NEUVES - PARTIE 1)",
    slug: "kia-part1",
    subtitle: "Berlines et compactes 0 KM garanties",
    count: 0,
    heroImage: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    number: "04",
    title: "LES KIA (NEUVES - PARTIE 2)",
    slug: "kia-part2",
    subtitle: "Crossovers et monospaces familiaux 0 KM",
    count: 0,
    heroImage: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    number: "05",
    title: "LES KIA (NEUVES - PARTIE 3)",
    slug: "kia-part3",
    subtitle: "SUV haut de gamme neufs 0 KM",
    count: 1,
    heroImage: "/images/cars/kia-sportage-front.webp",
  },
  {
    number: "06",
    title: "LES KIA (OCCASIONS CERTIFIÉES)",
    slug: "kia-occasions",
    subtitle: "Occasions sélectionnées et révisées",
    count: 0,
    heroImage: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    number: "07",
    title: "LES TOYOTA (PARTIE 1)",
    slug: "toyota-part1",
    subtitle: "Légendaire fiabilité",
    count: 1,
    heroImage: "/images/cars/toyota-camry-front.webp",
  },
  {
    number: "08",
    title: "LES TOYOTA (PARTIE 2)",
    slug: "toyota-part2",
    subtitle: "Baroudeurs et citadines",
    count: 0,
    heroImage: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    number: "09",
    title: "LES TOYOTA (PARTIE 3)",
    slug: "toyota-part3",
    subtitle: "Économiques et robustes",
    count: 0,
    heroImage: "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    number: "10",
    title: "LES HYUNDAI (PARTIE 1)",
    slug: "hyundai-part1",
    subtitle: "SUV & crossovers réputés",
    count: 1,
    heroImage: "/images/cars/hyundai-santafe-front.webp",
  },
  {
    number: "11",
    title: "LES HYUNDAI (PARTIE 2)",
    slug: "hyundai-part2",
    subtitle: "Berlines dynamiques et grands SUV",
    count: 0,
    heroImage: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    number: "12",
    title: "SUR COMMANDE & SERVICES 3M",
    slug: "sur-commande",
    subtitle: "Et bien d'autres marques sur commandes... Vente, location véhicules & appartements",
    count: 0,
    heroImage: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=compress&cs=tinysrgb&w=1200",
  }
];

export const VEHICLES = [
  {
    id: "suv-00-jeep",
    section: "01",
    sectionTitle: "LES SUV",
    model: "JEEP GRAND CHEROKEE V6 (ÉDITION MUPOCAM)",
    brand: "Jeep",
    year: 2022,
    engine: "Essence V6 3.6L Pentastar",
    transmission: "Automatique 8 rapports 4x4",
    seats: "5 places cuir premium",
    condition: "Occasion Révisée",
    mileage: "Certifié Faible Km",
    interior: "Sellerie cuir perforé & finitions luxe",
    image: "/images/cars/jeep-grand-cherokee-front.webp",
    photos: [
      "/images/cars/jeep-grand-cherokee-front.webp",
      "/images/cars/jeep-grand-cherokee-rear.webp"
    ],
    description: "Modèle vedette de l'affiche officielle MUPOCAM (Mutuelle du Personnel Orange Cameroun). SUV de prestige tout-terrain, disponible immédiatement à la vente au comptant ou en formule leasing / paiement échelonné à l'agence 3M Services Nouvelle route - Omnisports.",
    features: [
      "Programme Leasing conventionné MUPOCAM (Orange Cameroun)",
      "Transmission intégrale Quadra-Trac 4x4 tout-terrain",
      "Écran tactile Uconnect avec navigation GPS",
      "Toit ouvrant panoramique",
      "Caméra de recul et capteurs 360°",
      "Garantie révision 3M Services"
    ],
    price: "Sur devis • Éligible Leasing MUPOCAM",
    isMupocam: true,
    status: "Disponible"
  },
  {
    id: "suv-02-prado",
    section: "01",
    sectionTitle: "LES SUV",
    model: "TOYOTA LAND CRUISER PRADO TXL (VIP 4X4)",
    brand: "Toyota",
    year: 2022,
    engine: "V6 4.0L Essence / D-4D Diesel",
    transmission: "Automatique 6 rapports 4x4",
    seats: "7 places en cuir",
    condition: "Occasion Certifiée",
    mileage: "Certifié",
    interior: "Cuir intégral haut de gamme 7 places",
    image: "/images/cars/toyota-prado-txl-front.webp",
    photos: [
      "/images/cars/toyota-prado-txl-front.webp",
      "/images/cars/toyota-prado-rear.webp"
    ],
    description: "Le SUV 4x4 de référence absolue à Yaoundé pour missions officielles, cortèges de mariage, délégations diplomatiques et voyages tout-terrain au Cameroun. Confort royal, robustesse légendaire et sécurité maximale.",
    features: [
      "Véhicule officiel VIP pour cortèges et délégations",
      "Transmission intégrale 4x4 baroudeur avec blocage différentiel",
      "Climatisation tri-zone indépendante avant/arrière",
      "7 vraies places avec sièges cuir modulables",
      "Disponible avec ou sans chauffeur expérimenté",
      "Réservation prioritaire WhatsApp 3M Services"
    ],
    price: "À partir de 90 000 FCFA / jour • Vente sur devis",
    status: "Disponible"
  },
  {
    id: "suv-01",
    section: "01",
    sectionTitle: "LES SUV",
    model: "TOYOTA RAV4 2021",
    brand: "Toyota",
    year: 2021,
    engine: "Essence 2.5L Dynamic Force",
    transmission: "Automatique",
    seats: "5 places",
    condition: "Occasion Récente",
    mileage: "Certifié",
    interior: "Confort supérieur",
    image: "/images/cars/toyota-rav4-front.webp",
    photos: [
      "/images/cars/toyota-rav4-front.webp"
    ],
    description: "SUV moderne, économique et dynamique, parfait pour la circulation à Yaoundé et les voyages en famille.",
    features: [
      "Climatisation automatique bizone",
      "Caméra de recul haute définition",
      "Écran tactile multimédia CarPlay / Android",
      "Sécurité active Toyota Safety Sense",
      "Consommation maîtrisée et grand coffre"
    ],
    price: "Sur devis • Location dès 50 000 FCFA / jour",
    status: "Disponible"
  },
  {
    id: "merc-01",
    section: "02",
    sectionTitle: "LES MERCEDES-BENZ",
    model: "MERCEDES CLASSE E 2011 (W212)",
    brand: "Mercedes-Benz",
    year: 2011,
    engine: "Diesel BlueTEC",
    transmission: "Automatique 7G-Tronic",
    seats: "5 places",
    condition: "Occasion",
    mileage: "Inspecté & Garanti",
    interior: "Sellerie cuir & inserts ronce de noyer",
    image: "/images/cars/mercedes-classe-e-front.webp",
    photos: [
      "/images/cars/mercedes-classe-e-front.webp",
      "/images/cars/mercedes-classe-e-rear.webp"
    ],
    description: "Berline routière de référence alliant standing, insonorisation remarquable et grande sécurité routière.",
    features: [
      "Intérieur cuir luxueux et boiseries nobles",
      "Boîte automatique 7G-Tronic fluide",
      "Climatisation automatique Thermatic",
      "Système audio haute fidélité",
      "Régulateur et limiteur de vitesse Tempomat"
    ],
    price: "Sur devis • Vente & Location",
    status: "Disponible"
  },
  {
    id: "merc-02-ml350",
    section: "02",
    sectionTitle: "LES MERCEDES-BENZ",
    model: "MERCEDES ML 350 4MATIC (W166)",
    brand: "Mercedes-Benz",
    year: 2013,
    engine: "Essence V6 3.5L / Diesel BlueTEC",
    transmission: "Automatique 7G-Tronic 4MATIC",
    seats: "5 places cuir luxe",
    condition: "Occasion Certifiée",
    mileage: "Certifié",
    interior: "Intérieur cuir noir surpiqué & toit ouvrant",
    image: "/images/cars/mercedes-ml350-front.webp",
    photos: [
      "/images/cars/mercedes-ml350-front.webp"
    ],
    description: "Grand SUV de luxe allemand avec transmission 4MATIC intégrale permanente. Puissance, présence statutaire et confort de première classe pour vos déplacements d'affaires.",
    features: [
      "Transmission intégrale permanente 4MATIC",
      "Suspension pneumatique grand confort",
      "Pack multimédia Comand avec caméra de recul",
      "Hayon arrière électrique motorisé",
      "Sécurité et prestige Mercedes-Benz"
    ],
    price: "Sur devis • Location VIP & Vente",
    status: "Disponible"
  },
  {
    id: "suv-03-fortuner",
    section: "01",
    sectionTitle: "LES SUV",
    model: "TOYOTA FORTUNER EX 4X4 (2023)",
    brand: "Toyota",
    year: 2023,
    engine: "2.4L / 2.8L Diesel Turbo D-4D",
    transmission: "Automatique 6 rapports 4x4",
    seats: "7 places tout confort",
    condition: "Neuve (0 km)",
    mileage: "0 km",
    interior: "Sellerie cuir d'origine & climatisation arrière",
    image: "/images/cars/toyota-fortuner-front.webp",
    photos: [
      "/images/cars/toyota-fortuner-front.webp"
    ],
    description: "SUV baroudeur 7 places de dernière génération, neuf 0 km. Conçu pour surmonter tous les défis routiers camerounais avec robustesse, élégance et climatisation intégrale renforcée.",
    features: [
      "Véhicule neuf 0 KM disponible en commande sur mesure",
      "Vrai châssis baroudeur tout-terrain 7 places",
      "Système tactile multimédia avec Bluetooth",
      "Feux bi-LED et jantes alliage 18 pouces",
      "Accompagnement leasing bancaire ou MUPOCAM"
    ],
    price: "Sur devis • Éligible Leasing",
    status: "Disponible"
  },
  {
    id: "kia-01-sportage",
    section: "05",
    sectionTitle: "LES KIA (NEUVES - PARTIE 3)",
    model: "KIA SPORTAGE GT-LINE 2024 (NQ5)",
    brand: "Kia",
    year: 2024,
    engine: "Essence Turbo Smartstream",
    transmission: "Automatique DCT",
    seats: "5 places",
    condition: "Neuve (0 km)",
    mileage: "0 km",
    interior: "Double écran incurvé panoramique & sièges baquets cuir/alcantara",
    image: "/images/cars/kia-sportage-front.webp",
    photos: [
      "/images/cars/kia-sportage-front.webp"
    ],
    description: "Le SUV compact le plus futuriste du marché, neuf 0 KM garanti. Design avant-gardiste, technologie embarquée de pointe et confort digne des berlines de luxe.",
    features: [
      "Véhicule neuf 0 km sous garantie constructeur",
      "Double écran incurvé 12.3 pouces avec navigation",
      "Caméras 360° et aides à la conduite Drive Wise",
      "Finitions sport GT-Line noir laqué et chrome",
      "Livrable à Yaoundé ou Douala"
    ],
    price: "Sur devis • Vente Véhicule Neuf Garanti",
    status: "Disponible"
  },
  {
    id: "hyundai-01-santafe",
    section: "10",
    sectionTitle: "LES HYUNDAI (PARTIE 1)",
    model: "HYUNDAI SANTA FE 4X4",
    brand: "Hyundai",
    year: 2019,
    engine: "Essence 2.4L / Diesel CRDi",
    transmission: "Automatique HTRAC 4x4",
    seats: "7 places familiales",
    condition: "Occasion Révisée",
    mileage: "Inspecté",
    interior: "Confort familial 7 places climatisées",
    image: "/images/cars/hyundai-santafe-front.webp",
    photos: [
      "/images/cars/hyundai-santafe-front.webp"
    ],
    description: "SUV familial par excellence, grand standing avec transmission 4x4 HTRAC. Espace généreux pour 7 passagers et bagages, idéal pour voyages interurbains au Cameroun.",
    features: [
      "Système 4 roues motrices intelligent HTRAC",
      "Grand espace habitable 7 places modulables",
      "Climatisation bizone avec diffuseurs arrières",
      "Sécurité SmartSense et freinage d'urgence"
    ],
    price: "Sur devis • Location & Vente",
    status: "Disponible"
  },
  {
    id: "toyota-01-camry",
    section: "07",
    sectionTitle: "LES TOYOTA (PARTIE 1)",
    model: "TOYOTA CAMRY LUXURY 2.5V",
    brand: "Toyota",
    year: 2019,
    engine: "Essence 2.5L Dual VVT-i",
    transmission: "Automatique Direct Shift",
    seats: "5 places prestige",
    condition: "Occasion Prestige",
    mileage: "Certifié",
    interior: "Sellerie cuir noir & finitions chromées",
    image: "/images/cars/toyota-camry-front.webp",
    photos: [
      "/images/cars/toyota-camry-front.webp"
    ],
    description: "La grande berline de référence mondiale. Fiabilité Toyota inégalée, confort acoustique souverain et présence statutaire élégante pour dirigeants et missions d'affaires.",
    features: [
      "Berline statutaire de prestige mondial",
      "Suspension grand confort sur goudron et chaussée dégradée",
      "Système audio premium et climatisation puissante",
      "Disponible pour missions professionnelles à Yaoundé"
    ],
    price: "Sur devis • Vente & Location avec Chauffeur",
    status: "Disponible"
  }
];

export const APARTMENTS = [
  {
    id: "apt-01",
    title: "Appartement Prestige Tsinga (Face FECAFOOT)",
    type: "T3 Meublé Haut Standing",
    location: "Tsinga (Face FECAFOOT), Yaoundé",
    rooms: "2 Chambres • 2 Salons • 2 Salles de bain",
    price: "65 000 FCFA / nuitée (Dégressif au mois)",
    amenities: [
      "Face FECAFOOT Tsinga",
      "Climatisation intégrale",
      "Wifi Fibre Optique",
      "Sécurité 24/7",
      "Groupe électrogène automatique",
      "Parking privé fermé",
      "Cuisine équipée neuve"
    ],
    image: "/Asset/appartements/appartement-meuble-suite-parentale.webp",
    images: [
      "/Asset/appartements/appartement-meuble-suite-parentale.webp",
      "/Asset/appartements/appartement-meuble-cuisine-equipee.webp",
      "/Asset/appartements/appartement-meuble-chambre-bleue.webp",
      "/Asset/appartements/appartement-meuble-salle-de-bain.webp",
      "/Asset/appartements/appartement-meuble-chambre-confort.webp"
    ],
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
    amenities: [
      "Face FECAFOOT Tsinga",
      "Climatisation",
      "Smart TV 55\"",
      "Cuisine américaine laquée",
      "Eau chaude continue",
      "Gardiennage jour & nuit",
      "Accès goudronné direct"
    ],
    image: "/Asset/appartements/appartement-meuble-chambre-bleue.webp",
    images: [
      "/Asset/appartements/appartement-meuble-chambre-bleue.webp",
      "/Asset/appartements/appartement-meuble-cuisine-equipee.webp",
      "/Asset/appartements/appartement-meuble-salle-de-bain.webp",
      "/Asset/appartements/appartement-meuble-suite-parentale.webp"
    ],
    status: "Disponible",
    description: "Situé à Tsinga face à la FECAFOOT à Yaoundé, profitez d'un intérieur chaleureux et contemporain avec chambre climatisée, lit velours, cuisine équipée, eau chaude, sécurité 24/7 et accès direct aux commodités."
  },
  {
    id: "apt-03",
    title: "Grand Standing Tsinga (Face FECAFOOT)",
    type: "T4 Meublé Terrasse & Standing",
    location: "Tsinga (Face FECAFOOT), Yaoundé",
    rooms: "3 Chambres • Double Salon • 3 Salles d'eau",
    price: "90 000 FCFA / nuitée",
    amenities: [
      "Face FECAFOOT Tsinga",
      "Terrasse privée",
      "Climatisation intégrale",
      "Wifi Haut Débit",
      "Groupe électrogène automatique",
      "Conciergerie privée 3M"
    ],
    image: "/Asset/appartements/appartement-meuble-chambre-confort.webp",
    images: [
      "/Asset/appartements/appartement-meuble-chambre-confort.webp",
      "/Asset/appartements/appartement-meuble-suite-parentale.webp",
      "/Asset/appartements/appartement-meuble-cuisine-equipee.webp",
      "/Asset/appartements/appartement-meuble-salle-de-bain.webp",
      "/Asset/appartements/appartement-meuble-chambre-bleue.webp"
    ],
    status: "Disponible",
    description: "Un espace d'exception situé à Tsinga, en face de la FECAFOOT à Yaoundé. Suites spacieuses tout confort, literie hôtelière 5 étoiles, cuisine moderne laquée et prestations haut de gamme pour délégations et séjours de prestige."
  },
  {
    id: "apt-04",
    title: "Résidence Standing Oyomabang (Bientôt disponible)",
    type: "Studios & Appartements Meublés — Coming Soon",
    location: "Oyomabang, Yaoundé",
    rooms: "Studios & T2/T3 en finition haut standing",
    price: "Bientôt disponible • Pré-réservation par appel au +237 691 78 64 47",
    amenities: [
      "Ouverture très prochaine",
      "Oyomabang Yaoundé",
      "Climatisation intégrale",
      "Groupe électrogène automatique",
      "Wifi Fibre Optique",
      "Sécurité & Gardiennage 24/7",
      "Parking fermé sécurisé"
    ],
    image: "/Asset/appartements/appartement-meuble-suite-parentale.webp",
    images: [
      "/Asset/appartements/appartement-meuble-suite-parentale.webp",
      "/Asset/appartements/appartement-meuble-chambre-confort.webp",
      "/Asset/appartements/appartement-meuble-cuisine-equipee.webp",
      "/Asset/appartements/appartement-meuble-chambre-bleue.webp"
    ],
    status: "Coming Soon",
    description: "Bientôt disponible ! Nouvelle résidence meublée de haut standing à Oyomabang, Yaoundé. Finitions soignées, sécurité 24/7, groupe électrogène automatique. Contactez-nous dès maintenant par téléphone au +237 691 78 64 47 pour pré-réserver votre logement en priorité."
  }
];
