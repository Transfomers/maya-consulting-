import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useSettings } from "@/lib/SettingsContext";

const ROUTE_SEO = {
  "/": {
    title: "3M Services Yaoundé | Location de Voitures, Prado et Appartements Meublés",
    desc: "Découvrez 3M Services à Yaoundé : location de voitures, Toyota Prado, véhicules avec chauffeur, appartements meublés, vente de véhicules et solutions de leasing au Cameroun. Consultez notre catalogue et contactez-nous pour réserver.",
  },
  "/location-voiture-yaounde": {
    title: "Location de Voiture à Yaoundé (Avec ou Sans Chauffeur) | 3M Services",
    desc: "Agence de location de voiture à Yaoundé : Toyota Prado, SUV 4x4, berlines de luxe. Formules avec ou sans chauffeur, transfert aéroport Nsimalen. Meilleurs tarifs et réservation WhatsApp (+237 691 78 64 47).",
  },
  "/location-de-voiture-yaounde": {
    title: "Location de Voiture à Yaoundé (Avec ou Sans Chauffeur) | 3M Services",
    desc: "Agence de location de voiture à Yaoundé : Toyota Prado, SUV 4x4, berlines de luxe. Formules avec ou sans chauffeur, transfert aéroport Nsimalen. Meilleurs tarifs et réservation WhatsApp (+237 691 78 64 47).",
  },
  "/location-prado-yaounde": {
    title: "Location Toyota Prado à Yaoundé | Location 4x4 & SUV VIP - 3M Services",
    desc: "Location de Toyota Land Cruiser Prado à Yaoundé : SUV 4x4 de prestige avec chauffeur VIP pour cortèges, réceptions officielles, mariages et missions au Cameroun. Réservez chez 3M Services (+237 691 78 64 47).",
  },
  "/location-toyota-prado-yaounde": {
    title: "Location Toyota Prado à Yaoundé | Location 4x4 & SUV VIP - 3M Services",
    desc: "Location de Toyota Land Cruiser Prado à Yaoundé : SUV 4x4 de prestige avec chauffeur VIP pour cortèges, réceptions officielles, mariages et missions au Cameroun. Réservez chez 3M Services (+237 691 78 64 47).",
  },
  "/appartement-meuble-bastos": {
    title: "Appartement Meublé à Tsinga (Face FECAFOOT) & Yaoundé | 3M Services",
    desc: "Appartements meublés grand standing à Yaoundé : résidence à Tsinga directement en face de la FECAFOOT et ouverture prochaine à Oyomabang (Coming Soon). Climatisation, groupe automatique 24/7, Wi-Fi fibre. Appelez le +237 691 78 64 47.",
  },
  "/appartement-meuble-tsinga": {
    title: "Appartement Meublé à Tsinga (Face FECAFOOT) & Yaoundé | 3M Services",
    desc: "Appartements meublés grand standing à Yaoundé : résidence à Tsinga directement en face de la FECAFOOT et ouverture prochaine à Oyomabang (Coming Soon). Climatisation, groupe automatique 24/7, Wi-Fi fibre. Appelez le +237 691 78 64 47.",
  },
  "/appartement-meuble-tsinga-fecafoot": {
    title: "Appartement Meublé à Tsinga (Face FECAFOOT) & Yaoundé | 3M Services",
    desc: "Appartements meublés grand standing à Yaoundé : résidence à Tsinga directement en face de la FECAFOOT et ouverture prochaine à Oyomabang (Coming Soon). Climatisation, groupe automatique 24/7, Wi-Fi fibre. Appelez le +237 691 78 64 47.",
  },
  "/appartement-meuble-yaounde": {
    title: "Location Appartement Meublé Yaoundé | Tsinga (Face FECAFOOT), Omnisports & Oyomabang - 3M Services",
    desc: "Location d'appartements et studios meublés à Yaoundé : Tsinga (en face de la FECAFOOT), Omnisports et bientôt Oyomabang. Logements climatisés avec groupe électrogène permanent, Wifi fibre optique et sécurité 24/7. Appelez le +237 691 78 64 47.",
  },
  "/appartement-meuble-essos": {
    title: "Appartement Meublé à Yaoundé | Tsinga, Omnisports & Oyomabang - 3M Services",
    desc: "Location d'appartements et studios meublés à Yaoundé. Logements tout confort, climatisés, sécurisés 24/7 avec groupe automatique pour court et long séjour. Appelez le +237 691 78 64 47.",
  },
  "/appartement-meuble-oyomabang": {
    title: "Appartement Meublé Standing à Oyomabang Yaoundé | Bientôt Disponible - 3M Services",
    desc: "Résidence standing meublée à Oyomabang (Yaoundé) - Bientôt disponible chez 3M Services. Appartements modernes, groupe électrogène permanent, réserve d'eau, parking gardé 24/7. Contact & pré-réservations : +237 691 78 64 47.",
  },
  "/vente-voiture-leasing-cameroun": {
    title: "Vente de Voitures & Leasing MUPOCAM à Yaoundé | 3M Services Cameroun",
    desc: "Achat et vente de voitures à Yaoundé : véhicules neufs 0 km et occasions certifiées. Programme exclusif de vente en leasing et facilités de paiement échelonné avec la convention MUPOCAM Orange Cameroun.",
  },
  "/vente-voiture-yaounde": {
    title: "Vente de Voitures & Véhicules d'Occasion à Yaoundé | 3M Services",
    desc: "Achetez votre véhicule au meilleur prix à Yaoundé : SUV, berlines, 4x4 garantis et révisés chez 3M Services.",
  },
  "/boutique": {
    title: "Vente de Voitures à Yaoundé | Véhicules Neufs, Occasions & Appartements Meublés - 3M SERVICES",
    desc: "Vente de voitures à Yaoundé : SUV (Jeep, Toyota RAV4), berlines Mercedes-Benz, utilitaires et appartements meublés climatisés à Tsinga (Face FECAFOOT), Omnisports et bientôt Oyomabang. Contact : +237 691 78 64 47.",
  },
  "/vente-de-voiture": {
    title: "Vente de Voitures à Yaoundé | Véhicules Neufs (0 km) & Occasions Certifiées - 3M SERVICES",
    desc: "Achat et vente de voitures à Yaoundé : découvrez notre showroom de véhicules neufs 0 km sous garantie constructeur et occasions certifiées rigoureusement inspectées. Appelez le +237 691 78 64 47.",
  },
  "/appartements": {
    title: "Appartements Meublés Haut Standing à Tsinga (Face FECAFOOT) & Yaoundé | Bientôt Oyomabang - 3M SERVICES",
    desc: "Location d'appartements meublés sécurisés 24/7 avec groupe électrogène, Wi-Fi fibre optique et climatisation à Yaoundé (Tsinga Face FECAFOOT, Omnisports, et ouverture prochaine à Oyomabang). Appelez le +237 691 78 64 47.",
  },
  "/about": {
    title: "À Propos de 3M SERVICES | Concessionnaire & Immobilier d'Excellence à Yaoundé",
    desc: "Découvrez l'histoire, les engagements et le catalogue de 3M SERVICES à Yaoundé. Partenaire officiel MUPOCAM Orange Cameroun pour la mobilité et le logement.",
  },
  "/contact": {
    title: "Contact & Réservation (+237 691 78 64 47) | Agences Omnisports & Tsinga - 3M SERVICES Yaoundé",
    desc: "Contactez l'équipe 3M SERVICES par téléphone ou WhatsApp au +237 691 78 64 47 ou au +237 653 76 17 28. Agences situées à la Nouvelle route Omnisports et à Tsinga (Face FECAFOOT), Yaoundé.",
  },
  "/services": {
    title: "Nos Services | Vente Auto, Location, Leasing MUPOCAM & Appartements - 3M SERVICES Yaoundé",
    desc: "Solutions complètes de mobilité et d'hébergement : vente de véhicules neufs et d'occasion, location courte et longue durée, convention leasing MUPOCAM et appartements meublés.",
  },
  "/blog": {
    title: "Actualités & Conseils Auto & Immo Cameroun | Blog 3M SERVICES Yaoundé",
    desc: "Guides d'achat de véhicules, actualités du marché automobile et immobilier à Yaoundé, conseils d'entretien et nouveautés 3M SERVICES.",
  },
  "/panier": {
    title: "Mon Panier de Commande | Véhicules & Appartements - 3M SERVICES Yaoundé",
    desc: "Consultez votre panier de commande de véhicules neufs, d'occasion certifiées et d'appartements meublés à Yaoundé chez 3M SERVICES. Commande directe via WhatsApp (+237 691 78 64 47).",
  },
  "/privacy": {
    title: "Politique de Confidentialité | 3M SERVICES Yaoundé",
    desc: "Politique de confidentialité et protection des données personnelles de 3M SERVICES à Yaoundé, Cameroun.",
  },
};

const DEFAULT_KEYWORDS = "location de voiture yaounde, location voiture yaounde, agence de location de voiture yaounde, louer une voiture a yaounde, location voiture avec chauffeur yaounde, location voiture sans chauffeur yaounde, prix location voiture yaounde, location voiture pas chere yaounde, location prado yaounde, location toyota prado yaounde, louer prado a yaounde, prix location prado yaounde, location 4x4 yaounde, location suv yaounde, location voiture vip yaounde, location land cruiser yaounde, appartement meuble yaounde, location appartement meuble yaounde, studio meuble yaounde, appartement meuble a louer yaounde, appartement meuble tsinga, appartement meuble face fecafoot, appartement meuble fecafoot yaounde, appartement meuble oyomabang, appartement meuble courte duree yaounde, prix appartement meuble yaounde, residence meublee yaounde, vente de voiture yaounde, voiture a vendre yaounde, achat voiture a credit cameroun, vente voiture en leasing cameroun, voiture paiement echelonne yaounde, vehicule en leasing cameroun, 3mservice shop, 3m service yaounde, 3m services";

export default function SEOHead() {
  const settings = useSettings();
  const location = useLocation();

  const currentPath = location.pathname;
  const routeMeta = ROUTE_SEO[currentPath] || {};

  const cleanSiteName = (settings?.general?.site_name && !settings.general.site_name.toLowerCase().includes("cap"))
    ? settings.general.site_name
    : "3M SERVICES";

  const cleanMetaTitle = (settings?.seo?.meta_title && !settings.seo.meta_title.toLowerCase().includes("cap"))
    ? settings.seo.meta_title
    : null;

  const title = routeMeta.title || cleanMetaTitle || `${cleanSiteName} | Vente de Voitures & Appartements Meublés à Yaoundé`;
  const desc = routeMeta.desc || settings?.seo?.meta_description || settings?.general?.description || "3M SERVICES - Vente et location de véhicules & appartements de prestige à Yaoundé, Cameroun.";
  const keywords = settings?.seo?.keywords || DEFAULT_KEYWORDS;
  const ogImage = settings?.seo?.og_image || "https://www.3mservice.shop/Asset/logo-3m-services.png";
  const robots = settings?.seo?.robots || "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
  const canonicalUrl = `https://www.3mservice.shop${currentPath === "/" ? "" : currentPath}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="3M SERVICE Shop" />
      <meta property="og:locale" content="fr_CM" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}

