import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useSettings } from "@/lib/SettingsContext";

const ROUTE_SEO = {
  "/": {
    title: "3M SERVICE Shop | Vente de Voitures & Appartements Meublés à Yaoundé - 3M SERVICES",
    desc: "3M SERVICES Shop Yaoundé (+237 691 78 64 47) : Fournisseur de référence à Yaoundé (Bastos & Omnisports). Vente de véhicules 0 km et occasions certifiées, location automobile, appartements meublés grand standing et leasing MUPOCAM Orange Cameroun.",
  },
  "/boutique": {
    title: "Boutique & Catalogue | Voitures Neuves, Occasions & Appartements Meublés - 3M SERVICES Yaoundé",
    desc: "Explorez le catalogue 3M SERVICES : SUV (Jeep, Toyota RAV4), berlines Mercedes-Benz, utilitaires et appartements meublés climatisés à Bastos et Omnisports Yaoundé.",
  },
  "/appartements": {
    title: "Appartements Meublés Haut Standing à Bastos & Omnisport Yaoundé | 3M SERVICES",
    desc: "Location d'appartements meublés sécurisés 24/7 avec groupe électrogène, Wi-Fi fibre optique et climatisation à Yaoundé (Bastos, Omnisports, Le Golfe). Contact WhatsApp : +237 691 78 64 47.",
  },
  "/about": {
    title: "À Propos de 3M SERVICES | Concessionnaire & Immobilier d'Excellence à Yaoundé",
    desc: "Découvrez l'histoire, les engagements et le réseau de 3M SERVICES à Yaoundé. Partenaire officiel MUPOCAM Orange Cameroun pour la mobilité et le logement.",
  },
  "/contact": {
    title: "Contact & WhatsApp (+237 691 78 64 47) | Agences Omnisports & Bastos - 3M SERVICES Yaoundé",
    desc: "Contactez l'équipe 3M SERVICES par téléphone ou WhatsApp au +237 691 78 64 47 ou au +237 653 76 17 28. Agences situées à la Nouvelle route Omnisports et à Bastos, Yaoundé.",
  },
  "/services": {
    title: "Nos Services | Vente Auto, Location, Leasing MUPOCAM & Appartements - 3M SERVICES Yaoundé",
    desc: "Solutions complètes de mobilité et d'hébergement : vente de véhicules neufs et d'occasion, location courte et longue durée, convention leasing MUPOCAM et appartements meublés.",
  },
  "/blog": {
    title: "Actualités & Conseils Auto & Immo Cameroun | Blog 3M SERVICES Yaoundé",
    desc: "Guides d'achat de véhicules, actualités du marché automobile et immobilier à Yaoundé, conseils d'entretien et nouveautés 3M SERVICES.",
  },
};

const DEFAULT_KEYWORDS = "3mservice shop, 3m service, 3m services, 3m service yaounde, 3m services yaounde, 3m service cameroun, 3m services bastos, 3m services omnisport yaounde, 3m services oyomabang, vente de voiture yaounde, achat voiture yaounde, location voiture yaounde, appartements meubles yaounde, bastos yaounde, leasing mupocam orange cameroun, concessionnaire automobile yaounde, 3m consulting";

export default function SEOHead() {
  const settings = useSettings();
  const location = useLocation();

  const currentPath = location.pathname;
  const routeMeta = ROUTE_SEO[currentPath] || {};

  const title = routeMeta.title || settings?.seo?.meta_title || settings?.general?.site_name || "3M SERVICE Shop | Vente de Voitures & Appartements Meublés à Yaoundé - 3M SERVICES";
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

