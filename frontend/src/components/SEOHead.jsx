import { Helmet } from "react-helmet-async";
import { useSettings } from "@/lib/SettingsContext";

export default function SEOHead() {
  const settings = useSettings();
  
  if (!settings) return null;
  
  const title = settings?.seo?.meta_title || settings?.general?.site_name || "CAP Entrepreneurs";
  const desc = settings?.seo?.meta_description || settings?.general?.description || "Empowering entrepreneurs.";
  const keywords = settings?.seo?.keywords || "";
  const ogImage = settings?.seo?.og_image || "";
  const robots = settings?.seo?.robots || "index, follow";

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={desc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />
      
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  );
}
