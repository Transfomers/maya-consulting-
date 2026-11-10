import React, { createContext, useContext, useState, useEffect } from "react";

const translations = {
  fr: {
    // Nav
    nav_home: "Accueil",
    nav_about: "À Propos",
    nav_models: "Nos Véhicules",
    nav_apartments: "Nos Appartements",
    nav_team: "Notre Équipe",
    nav_contact: "Contact",
    nav_whatsapp: "WhatsApp 24/7",
    nav_app: "App",

    // Hero
    hero_sub: "Planifiez votre trajet à partir de Yaoundé",
    hero_title: "Voyagez en grand avec",
    hero_title_1: "Voyagez en grand",
    hero_title_2: "avec",
    hero_desc: "Location de véhicules de prestige, Toyota Prado VIP, berlines avec chauffeur professionnel et conciergerie 24/7 au Cameroun.",
    hero_book: "Réserver",
    hero_fleet: "Explorer Notre Flotte",
    hero_fleet_mobile: "Flotte",
    nav_book_cta: "Réserver",

    // Booking form
    book_title: "Réserver un Véhicule",
    book_error: "Veuillez renseigner tous les champs requis !",
    book_done: "Votre demande de réservation a été transmise à notre conciergerie 3M SERVICES sur WhatsApp !",
    book_car_type: "Type de Véhicule",
    book_car_type_placeholder: "Choisir un véhicule",
    book_pickup: "Prise en charge",
    book_pickup_loc: "Prise en charge",
    book_pickup_placeholder: "Choisir le lieu de prise",
    book_dropoff: "Restitution",
    book_dropoff_loc: "Restitution",
    book_dropoff_placeholder: "Choisir le lieu de restitution",
    book_pickup_date: "Date de départ",
    book_dropoff_date: "Date de retour",
    book_search: "Rechercher",
    price_unit: "/ jour",

    // Modal
    modal_title: "Confirmer votre Réservation 3M SERVICES",
    modal_summary_title: "Récapitulatif de la Réservation",
    modal_edit_booking: "Modifier",
    modal_save_changes: "Valider les modifications",
    modal_cancel_edit: "Annuler",
    modal_info: "Dès l'envoi de votre réservation, notre conciergerie 24/7 valide votre véhicule et prépare votre contrat immédiatement.",
    modal_dates_title: "Lieux & Dates",
    modal_pickup_date: "Date de Prise en Charge",
    modal_dropoff_date: "Date de Restitution",
    modal_pickup_loc: "Prise en Charge",
    modal_dropoff_loc: "Restitution",
    modal_car: "Véhicule :",
    modal_personal: "Coordonnées Personnelles",
    modal_fname: "Prénom",
    modal_lname: "Nom",
    modal_phone: "Téléphone / WhatsApp",
    modal_age: "Âge",
    modal_email: "Adresse Email",
    modal_address: "Adresse / Quartier",
    modal_city: "Ville",
    modal_postal: "Repère / Code Postal",
    modal_newsletter: "Je souhaite recevoir les offres exclusives de 3M SERVICES.",
    modal_confirm_btn: "Confirmer sur WhatsApp (+237 691 78 64 47)",
    modal_confirm_email_btn: "Envoyer par Email (contact@3mservice.shop)",
    modal_confirm_email_sub: "Transmission directe au service commercial",
    modal_download_pdf_btn: "Télécharger le Bon de Réservation (PDF)",
    required: "Ce champ est requis.",

    // Plan trip
    plan_sub: "Planifiez votre trajet dès maintenant",
    plan_title: "Réservation de véhicule simple & rapide",
    step1_title: "1. Choisissez votre Véhicule",
    step1_desc: "Large sélection de SUV 4x4, Toyota Prado VIP et berlines pour Yaoundé et le Cameroun.",
    step2_title: "2. Contactez notre Conciergerie",
    step2_desc: "Nos conseillers 24/7 organisent immédiatement votre contrat et vos options VIP (+237 691 78 64 47).",
    step3_title: "3. Prenez la Route",
    step3_desc: "Prise en charge à Omnisports, à Nsimalen ou livraison VIP à domicile avec ou sans chauffeur.",

    // Pick car
    fleet_sub: "Nos Véhicules",
    fleet_title: "Notre Flotte de Location",
    fleet_desc: "Choisissez parmi nos véhicules récents et révisés pour vos missions professionnelles, séjours ou voyages à partir de Yaoundé et au Cameroun.",
    spec_model: "Modèle",
    spec_brand: "Marque",
    spec_year: "Année",
    spec_doors: "Places",
    spec_ac: "Climatisation",
    spec_trans: "Boîte",
    spec_fuel: "Carburant",
    reserve_now: "RÉSERVER MAINTENANT",
    catalogue_btn: "Catalogue",
    swipe_hint: "Glissez pour changer de véhicule ⟵ ⟶",

    // Banner
    banner_title: "Voyagez au meilleur tarif à partir de Yaoundé avec 3M SERVICES !",
    banner_desc: "Accueil Aéroport Nsimalen • Chauffeurs VIP Bilingues • Assistance 24/7",

    // Choose us
    choose_sub: "Pourquoi Nous Choisir",
    choose_title: "Le meilleur standing automobile à partir de Yaoundé",
    choose_desc: "Découvrez une expérience d'exception avec 3M SERVICES. Que ce soit pour la location d'un Toyota Prado VIP, l'achat d'un véhicule neuf en leasing ou un séjour dans nos résidences meublées à Tsinga (face FECAFOOT), nous vous offrons le plus haut niveau de confort.",
    choose_more: "Télécharger le Catalogue (PDF)",
    box1_title: "Trajets Urbains & Régionaux",
    box1_desc: "Circulez sereinement à partir de Yaoundé et rejoignez Douala, Kribi ou Bafoussam dans des véhicules 4x4 sécurisés.",
    box2_title: "Tarifs Tout Compris",
    box2_desc: "Profitez de tarifs transparents en FCFA avec assurance et chauffeur professionnel inclus.",
    box3_title: "Zéro Frais Cachés",
    box3_desc: "Transparence totale et restitution rigoureuse de la caution dès la fin de votre location.",

    // Download section
    download_badge: "Application Mobile & PWA Officielle",
    download_title: "Téléchargez l'application 3M SERVICES pour une expérience optimale",
    download_desc: "Installez l'application 3M SERVICES directement sur l'écran d'accueil de votre smartphone pour un accès instantané en 1 clic à notre flotte VIP, réservez vos Toyota Prado et échangez avec notre conciergerie 24/7 même hors-connexion.",
    download_pwa_btn: "Ajouter à l'écran d'accueil",
    download_pwa_sub: "Installer l'application PWA gratuite",

    // Testimonials
    testi_sub: "Avis Vérifiés",
    testi_title: "Témoignages Clients 3M SERVICES",
    testi_desc: "Découvrez la satisfaction de nos clients professionnels, délégations et membres de la diaspora ayant fait confiance à 3M SERVICES à partir de Yaoundé.",
    testi_1_quote: "« Nous avons loué la Toyota Prado TXL pour une mission d'une semaine entre Yaoundé et Kribi. Véhicule impeccable, chauffeur ponctuel et courtois. Service d'une qualité rare ! »",
    testi_1_name: "Arnaud Mbarga",
    testi_1_role: "Cadre d'entreprise",
    testi_2_quote: "« Accueil chaleureux dès l'atterrissage à Nsimalen. Véhicule récent, climatisé et réservation combinée avec l'appartement à Tsinga face FECAFOOT. Expérience parfaite ! »",
    testi_2_name: "Chantal Nguemo",
    testi_2_role: "Paris / Yaoundé (Diaspora)",

    // Team
    team_sub: "3M SERVICES YAOUNDÉ • DIRECTION & EXPLOITATION",
    team_title: "Notre Équipe de Direction",
    team_desc: "Une équipe expérimentée et passionnée, dédiée à l'excellence de votre mobilité et au confort de vos séjours au Cameroun.",

    // FAQ
    faq_sub: "FAQ",
    faq_title: "Foire Aux Questions 3M SERVICES",
    faq_desc: "Tout ce que vous devez savoir pour votre location de voiture à partir de Yaoundé et vos déplacements au Cameroun.",
    faq_q1: "1. Comment réserver un véhicule chez 3M SERVICES ?",
    faq_a1: "La réservation est immédiate : choisissez votre véhicule dans notre formulaire en ligne, appelez notre équipe ou contactez-nous directement sur WhatsApp au +237 691 78 64 47. Nous confirmons la disponibilité et préparons votre contrat en quelques minutes.",
    faq_q2: "2. Proposez-vous un service de chauffeur professionnel ?",
    faq_a2: "Oui, tous nos véhicules (Toyota Prado VIP, berlines, SUV) sont disponibles avec des chauffeurs bilingues, courtois et expérimentés sur les axes de Yaoundé et les trajets interurbains (Douala, Kribi, Bafoussam).",
    faq_q3: "3. Assurez-vous la navette vers l'Aéroport de Yaoundé-Nsimalen ?",
    faq_a3: "Oui, notre service navette 24/7 prend en charge votre accueil dès la sortie de l'aéroport avec une pancarte nominative et assure votre transfert en toute sérénité vers votre hôtel, domicile ou résidence meublée.",

    // Footer
    footer_desc: "Location de véhicules de prestige, Toyota Prado VIP, vente de voitures, formule avec chauffeur professionnel et conciergerie 24/7 à partir de Yaoundé, Cameroun.",
    footer_nav: "Navigation",
    footer_home: "Accueil",
    footer_about: "À Propos",
    footer_fleet: "Nos Véhicules",
    footer_newsletter: "Newsletter",
    footer_newsletter_sub: "Abonnez-vous pour recevoir en avant-première nos offres exclusives et nouveaux arrivages de véhicules.",
    footer_email_placeholder: "Votre adresse email",
    footer_subscribe: "S'abonner",
  },
  en: {
    // Nav
    nav_home: "Home",
    nav_about: "About",
    nav_models: "Our Vehicles",
    nav_apartments: "Our Apartments",
    nav_team: "Our Team",
    nav_contact: "Contact",
    nav_whatsapp: "WhatsApp 24/7",
    nav_app: "App",

    // Hero
    hero_sub: "Plan your trip from Yaoundé",
    hero_title: "Travel in style with",
    hero_title_1: "Travel in style",
    hero_title_2: "with",
    hero_desc: "Premium car rentals, Toyota Prado VIP, luxury sedans with professional drivers and 24/7 concierge services across Cameroon.",
    hero_book: "Book a Car",
    hero_fleet: "Explore Our Fleet",
    hero_fleet_mobile: "Fleet",
    nav_book_cta: "Book a Car",

    // Booking form
    book_title: "Book a Car",
    book_error: "Please fill all required fields !",
    book_done: "Your reservation request has been successfully submitted and sent to 3M SERVICES concierge on WhatsApp !",
    book_car_type: "Select Your Car Type",
    book_car_type_placeholder: "Select your car type",
    book_pickup: "Pick-up",
    book_pickup_loc: "Pick-up",
    book_pickup_placeholder: "Select pick-up location",
    book_dropoff: "Drop-off",
    book_dropoff_loc: "Drop-off",
    book_dropoff_placeholder: "Select drop-off location",
    book_pickup_date: "Pick-up",
    book_dropoff_date: "Drop-off",
    book_search: "Search",
    price_unit: "/ rent per day",

    // Modal
    modal_title: "Confirm Your Reservation (3M SERVICES)",
    modal_summary_title: "Booking Summary",
    modal_edit_booking: "Edit",
    modal_save_changes: "Save Changes",
    modal_cancel_edit: "Cancel",
    modal_info: "Upon sending your request, our 24/7 concierge validates your vehicle and prepares your rental contract immediately.",
    modal_dates_title: "Dates & Locations",
    modal_pickup_date: "Pick-up Date",
    modal_dropoff_date: "Drop-off Date",
    modal_pickup_loc: "Pick-up Location",
    modal_dropoff_loc: "Drop-off Location",
    modal_car: "Car :",
    modal_personal: "Personal Information",
    modal_fname: "First Name",
    modal_lname: "Last Name",
    modal_phone: "Phone Number / WhatsApp",
    modal_age: "Age",
    modal_email: "Email Address",
    modal_address: "Address / Neighborhood",
    modal_city: "City",
    modal_postal: "Postal Code / Landmark",
    modal_newsletter: "I would like to receive exclusive offers from 3M SERVICES.",
    modal_confirm_btn: "Confirm via WhatsApp (+237 691 78 64 47)",
    modal_confirm_email_btn: "Send via Email (contact@3mservice.shop)",
    modal_confirm_email_sub: "Direct delivery to 3M sales desk",
    modal_download_pdf_btn: "Download Reservation Form (PDF)",
    required: "This field is required.",

    // Plan trip
    plan_sub: "Plan your trip now",
    plan_title: "Quick & Easy Car Rental",
    step1_title: "1. Select Your Car",
    step1_desc: "We offer a wide range of vehicles for all your driving needs in Yaoundé and across Cameroon.",
    step2_title: "2. Contact Our Concierge",
    step2_desc: "Our 24/7 dedicated agents are ready to prepare your contract and VIP options (+237 691 78 64 47).",
    step3_title: "3. Let's Drive",
    step3_desc: "Airport pickup (Nsimalen), Omnisports showroom or VIP doorstep delivery with or without driver.",

    // Pick car
    fleet_sub: "Our Vehicles",
    fleet_title: "Our rental fleet",
    fleet_desc: "Choose from a variety of our amazing vehicles to rent for your next adventure or business trip",
    spec_model: "Model",
    spec_brand: "Brand",
    spec_year: "Year",
    spec_doors: "Seats",
    spec_ac: "Air Conditioning",
    spec_trans: "Transmission",
    spec_fuel: "Fuel",
    reserve_now: "RESERVE NOW",
    catalogue_btn: "Catalogue",
    swipe_hint: "Swipe to switch vehicle ⟵ ⟶",

    // Banner
    banner_title: "Save big with our affordable car rentals from Yaoundé !",
    banner_desc: "Nsimalen Airport Meet & Greet • Bilingual VIP Chauffeurs • 24/7 Assistance",

    // Choose us
    choose_sub: "Why Choose Us",
    choose_title: "Best Quality & Luxury Fleet from Yaoundé",
    choose_desc: "Experience luxury and excellence with 3M SERVICES. From Toyota Prado VIP rentals to furnished residences in Tsinga (opp. FECAFOOT), we deliver high-end service.",
    choose_more: "Download Catalogue (PDF)",
    box1_title: "Cross-Country Drive",
    box1_desc: "Travel safely across Yaoundé, Douala, Kribi, or Bafoussam in certified 4x4 SUVs.",
    box2_title: "All Inclusive Pricing",
    box2_desc: "Transparent rates in FCFA with insurance and experienced drivers available.",
    box3_title: "No Hidden Charges",
    box3_desc: "Clear rental agreements and prompt deposit refund upon car return.",

    // Download section
    download_badge: "Official Mobile & PWA App",
    download_title: "Download our 3M SERVICES app to get the most out of it",
    download_desc: "Install the 3M SERVICES app directly on your smartphone home screen for instant 1-click access to our VIP fleet, fast Prado bookings, and 24/7 concierge support even offline.",
    download_pwa_btn: "Add to Home Screen",
    download_pwa_sub: "Install free PWA app",

    // Testimonials
    testi_sub: "Verified Reviews",
    testi_title: "Client Testimonials 3M SERVICES",
    testi_desc: "Discover what corporate clients, delegations, and diaspora members say about their experience with 3M SERVICES from Yaoundé.",
    testi_1_quote: "\"We rented the Toyota Prado TXL for a week-long executive trip between Yaoundé and Kribi. Spotless vehicle, punctual and courteous chauffeur. Outstanding quality!\"",
    testi_1_name: "Arnaud Mbarga",
    testi_1_role: "Corporate Executive",
    testi_2_quote: "\"Warm welcome upon landing at Nsimalen Airport. Recent AC vehicle and seamless combo booking with the furnished flat in Tsinga opposite FECAFOOT. Flawless service!\"",
    testi_2_name: "Chantal Nguemo",
    testi_2_role: "Paris / Yaoundé (Diaspora)",

    // Team
    team_sub: "3M SERVICES YAOUNDÉ • LEADERSHIP TEAM",
    team_title: "Our Executive Leadership",
    team_desc: "An experienced and passionate team dedicated to executive mobility and comfort in Cameroon.",

    // FAQ
    faq_sub: "FAQ",
    faq_title: "Frequently Asked Questions (3M SERVICES)",
    faq_desc: "Everything you need to know about renting a car from Yaoundé and traveling across Cameroon.",
    faq_q1: "1. How do I book a vehicle with 3M SERVICES?",
    faq_a1: "Booking is instant: select your vehicle using our online booking form, call our team, or message us directly on WhatsApp at +237 691 78 64 47. We verify availability and prepare your rental agreement within minutes.",
    faq_q2: "2. Do you provide professional chauffeur services?",
    faq_a2: "Yes, all our vehicles (Toyota Prado VIP, sedans, luxury SUVs) are available with bilingual, courteous, and highly experienced drivers for trips in Yaoundé as well as intercity routes (Douala, Kribi, Bafoussam).",
    faq_q3: "3. Do you provide airport shuttle services to Yaoundé-Nsimalen Airport?",
    faq_a3: "Yes, our 24/7 airport transfer service welcomes you at airport arrivals with a personalized name sign and guarantees smooth, secure transportation to your hotel, home, or furnished apartment.",

    // Footer
    footer_desc: "Luxury car rentals, Toyota Prado VIP, car sales, professional driver services and 24/7 concierge from Yaoundé, Cameroon.",
    footer_nav: "Navigation",
    footer_home: "Home",
    footer_about: "About",
    footer_fleet: "Our Vehicles",
    footer_newsletter: "Newsletter",
    footer_newsletter_sub: "Subscribe to receive our exclusive offers and latest vehicle arrivals in advance.",
    footer_email_placeholder: "Your email address",
    footer_subscribe: "Subscribe",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // 1. Check saved language in localStorage
    const saved = localStorage.getItem("3m_lang");
    if (saved === "fr" || saved === "en") return saved;

    // 2. Default to device language
    try {
      const browserLang = (
        navigator.language ||
        navigator.userLanguage ||
        "fr"
      ).toLowerCase();
      if (browserLang.startsWith("en")) return "en";
    } catch (e) {
      // fallback
    }
    return "fr";
  });

  useEffect(() => {
    localStorage.setItem("3m_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === "fr" ? "en" : "fr"));
  };

  const t = (key, fallback = "") => {
    return translations[lang]?.[key] || translations["fr"]?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

export default LanguageContext;

