import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Download, Search, CheckCircle2,
  BookOpen, Filter, ArrowRight,
  ShieldCheck, Loader2, X, ExternalLink, Calendar,
  Layers, Tag
} from "lucide-react";
import api from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/motion";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { toast } from "sonner";

export const DEFAULT_RESOURCES = [
  {
    id: "res-1",
    title: "Manuel de Reconditionnement Circulaire & Éco-Conception Numérique",
    slug: "manuel-reconditionnement-circulaire-eco-conception",
    program: "Cap Green Lab",
    category_name: "Cap Green Lab & Économie Circulaire",
    resource_type: "course",
    image_url: "/assets/images/cap_green_lab.webp",
    published_date: "14 OCT",
    description: "Guide technique et méthodologique pour la mise en place d'ateliers de réemploi informatique, le diagnostic matériel, le cycle de vie des équipements et la valorisation solidaire.",
    author: "Équipe Pédagogique Cap Green Lab",
    tags: ["Économie Circulaire", "Reconditionnement", "Matériel", "Tech Inclusive"],
    file_size: "4.2 Mo",
    mime_type: "application/pdf",
    file_url: "/assets/guides/cap-green-lab-reconditionnement.pdf",
    is_featured: true,
    downloads_count: 342
  },
  {
    id: "res-2",
    title: "Guide Pratique AgriConnect : Solutions Mobiles & Circuits Courts Ruraux",
    slug: "guide-pratique-agriconnect-solutions-mobiles-circuits-courts",
    program: "AgriConnect",
    category_name: "AgriConnect & Ruralité",
    resource_type: "guide",
    image_url: "/assets/images/agriconnect_farming.webp",
    published_date: "08 OCT",
    description: "Méthodologie de terrain pour les coopératives agricoles et entrepreneurs ruraux : intégration d'outils numériques simples, logistique de proximité et valorisation locale.",
    author: "Pôle Agro-Innovation & Ruralité",
    tags: ["Agriculture Numérique", "Circuits Courts", "Ruralité", "Outils Mobiles"],
    file_size: "3.8 Mo",
    mime_type: "application/pdf",
    file_url: "/assets/guides/agriconnect-solutions-mobiles.pdf",
    is_featured: true,
    downloads_count: 289
  },
  {
    id: "res-3",
    title: "Toolkit Pédagogique Safe Vibe : Éducation aux Médias & Citoyenneté Numérique",
    slug: "toolkit-pedagogique-safe-vibe-education-medias",
    program: "Safe Vibe",
    category_name: "Safe Vibe & Éducation Numérique",
    resource_type: "toolkit",
    image_url: "/assets/images/safe_vibe_media.webp",
    published_date: "29 SEPT",
    description: "Boîte à outils complète pour enseignants et médiateurs jeunesse : 12 fiches d'ateliers interactifs sur la lutte contre la désinformation, l'esprit critique et la sécurité en ligne.",
    author: "Département Médias & Éducation Numérique",
    tags: ["Médias", "Cybersécurité", "Éducation", "Jeunesse", "Esprit Critique"],
    file_size: "5.1 Mo",
    mime_type: "application/pdf",
    file_url: "/assets/guides/safe-vibe-kit-pedagogique.pdf",
    is_featured: true,
    downloads_count: 512
  },
  {
    id: "res-4",
    title: "Guide d'Incubation : Femmes, Artisanat & Entrepreneuriat Créatif Durable",
    slug: "guide-incubation-femmes-artisanat-entrepreneuriat-creatif",
    program: "Créatif & Social",
    category_name: "Créatif, Femmes & Social",
    resource_type: "course",
    image_url: "/assets/images/women_social_innovators.webp",
    published_date: "19 SEPT",
    description: "Module de formation structurant pour transformer un savoir-faire artisanal ou artistique en marque durable, de la formalisation financière au marketing digital éthique.",
    author: "Collectif Femmes & Innovation Sociale",
    tags: ["Femmes Entrepreneures", "Artisanat", "Modèle Économique", "Économie Sociale"],
    file_size: "3.4 Mo",
    mime_type: "application/pdf",
    file_url: "/assets/guides/femmes-entrepreneuriat-creatif.pdf",
    is_featured: true,
    downloads_count: 420
  },
  {
    id: "res-5",
    title: "Livre Blanc & Cadre de Coopération : Global Festival Nairobi 2027",
    slug: "livre-blanc-cooperation-internationale-nairobi-2027",
    program: "Global Festival",
    category_name: "International & Passerelles",
    resource_type: "report",
    image_url: "/assets/images/diaspora_global_summit.webp",
    published_date: "04 SEPT",
    description: "Cadre d'orientation et opportunités de partenariats transfrontaliers : cartographie des écosystèmes d'innovation inclusive Canada-Afrique et préparation des délégations.",
    author: "Comité de Pilotage International",
    tags: ["Nairobi 2027", "Coopération Internationale", "Partenariats", "Sourcing"],
    file_size: "2.9 Mo",
    mime_type: "application/pdf",
    file_url: "/assets/guides/nairobi-2027-guide-cooperation.pdf",
    is_featured: false,
    downloads_count: 195
  },
  {
    id: "res-6",
    title: "Modèle de Plan de Transition Circulaire pour Organismes à But Non Lucratif",
    slug: "modele-plan-transition-circulaire-obnl",
    program: "Cap Green Lab",
    category_name: "Cap Green Lab & Économie Circulaire",
    resource_type: "template",
    image_url: "/assets/images/community_partnership.webp",
    published_date: "22 AOÛT",
    description: "Grille d'audit et gabarit opérationnel pour mesurer l'empreinte de son parc technologique et structurer un programme d'approvisionnement reconditionné.",
    author: "Équipe Conseil Cap Entrepreneurs",
    tags: ["Gabarit", "OBNL", "Bilan Carbone Tech", "Approvisionnement"],
    file_size: "1.8 Mo",
    mime_type: "application/vnd.ms-excel",
    file_url: "/assets/guides/cap-green-lab-reconditionnement.pdf",
    is_featured: false,
    downloads_count: 310
  }
];

export default function Resources() {
  const { lang } = useLang();
  const isEn = lang === "en";

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Download Modal State
  const [activeResource, setActiveResource] = useState(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileType, setProfileType] = useState("entrepreneur");
  const [newsletterConsent, setNewsletterConsent] = useState(true);
  const [submittingDownload, setSubmittingDownload] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await api.get("/resources");
        if (res.data && res.data.length > 0) {
          // Merge images from default if missing
          const enriched = res.data.map((r, idx) => ({
            ...r,
            image_url: r.image_url || r.featured_image?.url || DEFAULT_RESOURCES[idx % DEFAULT_RESOURCES.length].image_url
          }));
          setResources(enriched);
        } else {
          setResources(DEFAULT_RESOURCES);
        }
      } catch (err) {
        setResources(DEFAULT_RESOURCES);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const openDownloadModal = (resource) => {
    setActiveResource(resource);
    setDownloadSuccess(false);
    setDownloadModalOpen(true);
  };

  const handleDownloadSubmit = async (e) => {
    e.preventDefault();
    if (!email || !fullName) {
      toast.error(isEn ? "Please fill in all required fields" : "Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSubmittingDownload(true);
    try {
      await api.post("/resources/download-lead", {
        resource_id: activeResource.id,
        resource_title: activeResource.title,
        full_name: fullName,
        email: email,
        profile_type: profileType,
        newsletter_opt_in: newsletterConsent,
        lang: lang,
      });

      setDownloadSuccess(true);
      toast.success(isEn ? "Download started successfully!" : "Téléchargement initié avec succès !");

      const link = document.createElement("a");
      link.href = activeResource.file_url || "/assets/guides/cap-green-lab-reconditionnement.pdf";
      link.download = `${activeResource.slug || "ressource"}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setDownloadSuccess(true);
      toast.success(isEn ? "Download started!" : "Téléchargement démarré !");
      const link = document.createElement("a");
      link.href = activeResource.file_url || "/assets/guides/cap-green-lab-reconditionnement.pdf";
      link.download = `${activeResource.slug || "ressource"}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setSubmittingDownload(false);
    }
  };

  // Build categories list
  const categories = [
    { id: "all", label: isEn ? "All Categories" : "Toutes les catégories" },
    { id: "green-lab", label: "Cap Green Lab", match: "Cap Green Lab" },
    { id: "agriconnect", label: "AgriConnect", match: "AgriConnect" },
    { id: "safe-vibe", label: "Safe Vibe", match: "Safe Vibe" },
    { id: "creatif", label: isEn ? "Creative & Social" : "Créatif & Social", match: "Créatif" },
    { id: "international", label: isEn ? "International" : "International & Sommet", match: "International" },
  ];

  const resourceTypes = [
    { id: "all", label: isEn ? "All Formats" : "Tous les formats" },
    { id: "guide", label: isEn ? "Guides PDF" : "Guides Pratiques" },
    { id: "course", label: isEn ? "Courses & Manuals" : "Cours & Manuels" },
    { id: "toolkit", label: isEn ? "Toolkits" : "Boîtes à outils" },
    { id: "template", label: isEn ? "Templates" : "Gabarits" },
    { id: "report", label: isEn ? "Reports" : "Livres Blancs & Rapports" },
  ];

  const filteredResources = resources.filter((res) => {
    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "green-lab" && (res.program?.includes("Green") || res.category_name?.includes("Green"))) ||
      (selectedCategory === "agriconnect" && (res.program?.includes("Agri") || res.category_name?.includes("Agri"))) ||
      (selectedCategory === "safe-vibe" && (res.program?.includes("Safe") || res.category_name?.includes("Safe"))) ||
      (selectedCategory === "creatif" && (res.program?.includes("Créatif") || res.category_name?.includes("Créatif"))) ||
      (selectedCategory === "international" && (res.program?.includes("Global") || res.program?.includes("International") || res.category_name?.includes("International"))) ||
      (res.category_name && res.category_name.toLowerCase().includes(selectedCategory.toLowerCase()));

    const matchesType = selectedType === "all" || res.resource_type === selectedType;

    const matchesSearch =
      !searchQuery ||
      res.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (res.tags && (Array.isArray(res.tags) ? res.tags.join(" ") : res.tags).toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesType && matchesSearch;
  });

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-[#1c1c1c] selection:bg-[#E20713] selection:text-white">

      {/* Hero Header Section */}
      <section className="border-b border-forest/10 pt-16 pb-12 px-5 md:px-10 lg:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-[#E20713]" />
              <span className="font-montserrat text-[10.5px] font-bold uppercase tracking-[0.28em] text-[#E20713]">
                {isEn ? "PROGRAMS & KNOWLEDGE • DOWNLOADABLE LIBRARY" : "PROGRAMMES & SAVOIR-FAIRE • BIBLIOTHÈQUE TÉLÉCHARGEABLE"}
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-forest mb-3 leading-tight">
              {isEn ? "Guides, Courses & Toolkits" : "Guides, Cours & Boîtes à Outils"}
            </h1>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="w-12 h-[2px] bg-[#E20713] mb-4" />
            <p className="max-w-3xl text-sm md:text-base text-sage leading-relaxed font-sans">
              {isEn
                ? "Access our complete library of practical guides, circular technical manuals, and digital frameworks designed to empower entrepreneurs, cooperatives, and community organizations."
                : "Accédez en libre téléchargement à nos manuels techniques, guides d'impact et cadres méthodologiques conçus pour propulser entrepreneurs, coopératives et organismes à but non lucratif."}
            </p>
          </Reveal>
        </div>
      </section>

      {/* MAIN LAYOUT: SIDEBAR + EDITORIAL GRID */}
      <section className="py-10 md:py-14 px-5 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* ==================== LEFT SIDEBAR ==================== */}
            <aside className="lg:col-span-3 space-y-8 lg:sticky lg:top-24">

              {/* SEARCH BOX */}
              <div className="bg-white border border-forest/15 p-5 shadow-xs">
                <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-[#E20713] font-montserrat mb-2.5">
                  {isEn ? "SEARCH RESOURCES" : "RECHERCHER UN GUIDE"}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sage/70" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isEn ? "Keywords..." : "Mots-clés, thèmes..."}
                    className="w-full pl-9 pr-8 py-2.5 text-xs bg-[#FAF9F6] border border-forest/15 text-forest focus:outline-none focus:border-[#E20713] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sage hover:text-forest p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* CATEGORIES SIDEBAR */}
              <div className="bg-white border border-forest/15 p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-forest/10 pb-3 mb-3">
                  <h3 className="font-montserrat text-[11px] font-bold uppercase tracking-[0.2em] text-forest">
                    {isEn ? "CATEGORIES" : "CATÉGORIES"}
                  </h3>
                  <span className="text-[10px] text-sage font-mono">{filteredResources.length} docs</span>
                </div>

                <div className="space-y-1">
                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    const count = cat.id === "all"
                      ? resources.length
                      : resources.filter(r => (cat.match && (r.program?.includes(cat.match) || r.category_name?.includes(cat.match)))).length;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 text-xs font-medium transition-all flex items-center justify-between rounded-xs ${
                          isSelected
                            ? "bg-[#E20713]/10 text-[#E20713] font-bold border-l-2 border-[#E20713]"
                            : "text-forest/75 hover:bg-forest/5 hover:text-forest"
                        }`}
                      >
                        <span className="truncate">{cat.label}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isSelected ? "bg-[#E20713] text-white" : "bg-forest/5 text-sage"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RESOURCE FORMAT / TYPE SIDEBAR */}
              <div className="bg-white border border-forest/15 p-5 shadow-xs">
                <div className="border-b border-forest/10 pb-3 mb-3">
                  <h3 className="font-montserrat text-[11px] font-bold uppercase tracking-[0.2em] text-forest">
                    {isEn ? "DOCUMENT FORMAT" : "FORMAT DE DOCUMENT"}
                  </h3>
                </div>

                <div className="space-y-1">
                  {resourceTypes.map((type) => {
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                          isSelected
                            ? "text-[#E20713] font-bold"
                            : "text-sage hover:text-forest"
                        }`}
                      >
                        <span>{type.label}</span>
                        {isSelected && <span className="text-[#E20713] font-bold">✓</span>}
                      </button>
                    );
                  })}
                </div>

                {(selectedCategory !== "all" || selectedType !== "all" || searchQuery) && (
                  <button
                    onClick={() => { setSelectedCategory("all"); setSelectedType("all"); setSearchQuery(""); }}
                    className="mt-4 w-full pt-3 border-t border-forest/10 text-[11px] font-bold text-[#E20713] hover:underline text-center block"
                  >
                    {isEn ? "Reset all filters" : "Réinitialiser les filtres"}
                  </button>
                )}
              </div>

            </aside>

            {/* ==================== RIGHT EDITORIAL LIST ==================== */}
            <main className="lg:col-span-9">

              {loading ? (
                <div className="py-24 text-center bg-white border border-forest/15">
                  <Loader2 className="w-8 h-8 animate-spin text-[#E20713] mx-auto mb-3" />
                  <p className="font-montserrat text-xs font-bold uppercase tracking-widest text-sage">
                    {isEn ? "Loading resources..." : "Chargement de la bibliothèque..."}
                  </p>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="py-20 text-center bg-white border border-forest/15 p-8 max-w-lg mx-auto">
                  <BookOpen className="w-10 h-10 text-sage/40 mx-auto mb-3" />
                  <h3 className="font-serif text-2xl font-bold text-forest mb-1">
                    {isEn ? "No documents found" : "Aucun document trouvé"}
                  </h3>
                  <p className="text-xs text-sage mb-5">
                    {isEn
                      ? "Try adjusting your search criteria or choosing another category in the sidebar."
                      : "Essayez d'ajuster vos critères ou choisissez une autre catégorie dans la barre latérale."}
                  </p>
                  <button
                    onClick={() => { setSelectedCategory("all"); setSelectedType("all"); setSearchQuery(""); }}
                    className="bg-[#E20713] text-white font-montserrat text-xs font-bold uppercase tracking-wider px-5 py-2.5 shadow-sm hover:bg-[#5b14ce] transition-colors"
                  >
                    {isEn ? "Reset filters" : "Réinitialiser les filtres"}
                  </button>
                </div>
              ) : (
                /* EDITORIAL LIST GRID INSPIRED BY REFERENCE */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                  {filteredResources.map((res, index) => {
                    const coverImg = res.image_url || DEFAULT_RESOURCES[index % DEFAULT_RESOURCES.length].image_url;
                    return (
                      <Reveal key={res.id || index} delay={0.04 * (index % 6)}>
                        <article className="bg-white border border-forest/15 flex flex-col justify-between h-full group hover:border-[#E20713] transition-all duration-300 shadow-xs hover:shadow-md">

                          <div>
                            {/* Card Image Cover (Editorial Photo) */}
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-forest/5">
                              <img
                                src={coverImg}
                                alt={res.title}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                loading="lazy"
                              />
                              <div className="absolute top-3 left-3">
                                <span className="bg-white/95 text-[#E20713] text-[9.5px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 shadow-xs border border-forest/10 font-montserrat">
                                  {res.program || res.category_name?.split("&")[0] || "CAP"}
                                </span>
                              </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-5 sm:p-6 text-center">

                              {/* Centered Date / Tag */}
                              <div className="mb-2">
                                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-sage font-semibold">
                                  {res.published_date || "2026"} • {res.file_size || "PDF"}
                                </span>
                              </div>

                              {/* Editorial Serif Title */}
                              <h2 className="font-serif text-lg sm:text-xl font-bold text-forest leading-snug mb-3 group-hover:text-[#E20713] transition-colors line-clamp-2">
                                {res.title}
                              </h2>

                              {/* Subtle underline accent in logo violet */}
                              <div className="w-8 h-[1.5px] bg-[#E20713]/40 mx-auto mb-3" />

                              {/* Excerpt */}
                              <p className="text-xs text-sage leading-relaxed line-clamp-3 font-sans text-left">
                                {res.description}
                              </p>

                              {/* Tags */}
                              {res.tags && (
                                <div className="mt-3.5 flex flex-wrap gap-1 justify-center">
                                  {(Array.isArray(res.tags) ? res.tags : (res.tags || "").split(",")).slice(0, 3).map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[9px] text-sage bg-[#FAF9F6] border border-forest/10 px-1.5 py-0.5 rounded-none"
                                    >
                                      #{tag.trim()}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer: Download button in logo violet */}
                          <div className="p-5 pt-0">
                            <button
                              onClick={() => openDownloadModal(res)}
                              className="w-full inline-flex items-center justify-center gap-2 bg-forest text-white hover:bg-[#E20713] py-3 font-montserrat text-xs font-bold uppercase tracking-[0.18em] transition-all duration-300 shadow-xs group-hover:shadow-md"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{isEn ? "DOWNLOAD GUIDE" : "TÉLÉCHARGER LE GUIDE"}</span>
                            </button>
                          </div>

                        </article>
                      </Reveal>
                    );
                  })}
                </div>
              )}

            </main>

          </div>
        </div>
      </section>

      {/* Download Pop-Up Lead Capture Modal */}
      {downloadModalOpen && activeResource && (
        <div className="fixed inset-0 z-50 bg-forest/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-forest/20 max-w-md w-full p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setDownloadModalOpen(false)}
              className="absolute top-4 right-4 text-forest/50 hover:text-forest transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {downloadSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-[#E20713]/10 text-[#E20713] rounded-full flex items-center justify-center mx-auto border border-[#E20713]/30">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-forest">
                  {isEn ? "Document ready to download!" : "Votre document est prêt !"}
                </h3>
                <p className="text-xs text-sage max-w-sm mx-auto leading-relaxed">
                  Merci de votre intérêt pour les ressources de CAP Entrepreneurs. Votre téléchargement a démarré automatiquement.
                </p>

                <div className="pt-2">
                  <a
                    href={activeResource.file_url || "#"}
                    download
                    className="inline-flex items-center justify-center gap-2 bg-[#E20713] hover:bg-[#5b14ce] text-white font-montserrat text-xs font-bold uppercase tracking-wider px-6 py-3 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Relancer le téléchargement</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setDownloadModalOpen(false)}
                  className="text-xs text-sage hover:text-forest underline block mx-auto pt-2"
                >
                  Fermer la fenêtre
                </button>
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#E20713] block mb-1 font-montserrat">
                  ACCÈS AU DOCUMENT
                </span>
                <h3 className="font-serif text-xl font-bold text-forest mb-1 leading-snug">
                  {activeResource.title}
                </h3>
                <p className="text-xs text-sage mb-5">
                  Remplissez ce court formulaire pour recevoir l'accès immédiat et gratuit à ce guide.
                </p>

                <form onSubmit={handleDownloadSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[10px] text-forest mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ex. Murielle Kouadio"
                      className="w-full bg-[#FAF9F6] border border-forest/20 px-3.5 py-2.5 text-forest focus:outline-none focus:border-[#E20713]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[10px] text-forest mb-1">
                      Courriel professionnel ou personnel *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@organisation.org"
                      className="w-full bg-[#FAF9F6] border border-forest/20 px-3.5 py-2.5 text-forest focus:outline-none focus:border-[#E20713]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-[10px] text-forest mb-1">
                      Profil / Organisation
                    </label>
                    <select
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-forest/20 px-3.5 py-2.5 text-forest focus:outline-none focus:border-[#E20713]"
                    >
                      <option value="entrepreneur">Entrepreneur / Entrepreneure</option>
                      <option value="obnl">Organisme à but non lucratif (OBNL)</option>
                      <option value="student">Étudiant(e) / En transition</option>
                      <option value="funder">Bailleur de fonds / Partenaire</option>
                      <option value="other">Autre acteur de l'écosystème</option>
                    </select>
                  </div>

                  <div className="flex items-start gap-2 pt-1 text-left">
                    <input
                      id="resource-newsletter-optin"
                      type="checkbox"
                      checked={newsletterConsent}
                      onChange={(e) => setNewsletterConsent(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-forest/30 text-[#E20713] focus:ring-[#E20713] accent-[#E20713]"
                    />
                    <label htmlFor="resource-newsletter-optin" className="text-[11px] text-sage leading-tight cursor-pointer">
                      Je souhaite recevoir les prochaines parutions, avis de publication et guides d'impact de CAP Entrepreneurs.
                    </label>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={submittingDownload}
                      className="w-full bg-forest hover:bg-[#E20713] text-white font-montserrat text-xs font-bold uppercase tracking-wider py-3.5 px-6 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {submittingDownload ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Télécharger maintenant</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-sage text-center pt-1">
                    Vos données sont protégées conformément à notre politique de confidentialité.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
