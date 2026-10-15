import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Download, Search, CheckCircle2,
  BookOpen, Sparkles, Filter, ArrowRight,
  ShieldCheck, Loader2, X, ExternalLink
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
    description: "Grille d'audit et gabarit Excel opérationnel pour mesurer l'empreinte de son parc technologique et structurer un programme d'approvisionnement reconditionné.",
    author: "Équipe Conseil Cap Entrepreneurs",
    tags: ["Gabarit", "OBNL", "Bilan Carbone Tech", "Approvisionnement"],
    file_size: "1.8 Mo",
    mime_type: "application/vnd.ms-excel",
    file_url: "/assets/guides/gabarit-audit-parc-tech-obnl.xlsx",
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
          setResources(res.data);
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

  const openDownloadModal = (res) => {
    setActiveResource(res);
    setDownloadSuccess(false);
    setDownloadModalOpen(true);
  };

  const handleDownloadSubmit = async (e) => {
    e.preventDefault();
    if (!email || !fullName) {
      toast.error(isEn ? "Please fill in all required fields." : "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setSubmittingDownload(true);
    try {
      // 1. Record lead submission
      await api.post("/submissions", {
        form_type: "resource_download",
        data: {
          resource_id: activeResource.id,
          resource_title: activeResource.title,
          full_name: fullName,
          email: email.trim().toLowerCase(),
          profile_type: profileType,
          newsletter_opt_in: newsletterConsent
        }
      });

      // 2. Optionally register to newsletter
      if (newsletterConsent) {
        try {
          await api.post("/newsletter/subscribe", {
            email: email.trim().toLowerCase(),
            first_name: fullName.split(" ")[0],
            consent: true,
            source: `resource_download_${activeResource.slug || activeResource.id}`
          });
        } catch (_) {
          // Ignore if already subscribed
        }
      }

      setDownloadSuccess(true);
      toast.success(isEn ? "Your download is ready!" : "Votre document est prêt pour le téléchargement !");

      // Trigger automatic simulated file download / open
      const targetUrl = activeResource.file_url || activeResource.external_url || "#";
      if (targetUrl.startsWith("http")) {
        window.open(targetUrl, "_blank");
      }
    } catch (err) {
      toast.error(isEn ? "Error processing your request. Please try again." : "Erreur lors de la validation. Veuillez réessayer.");
    } finally {
      setSubmittingDownload(false);
    }
  };

  // Categories list
  const categories = [
    { id: "all", label: isEn ? "All Resources" : "Toutes les ressources" },
    { id: "Cap Green Lab", label: isEn ? "Cap Green Lab & Circular Tech" : "Cap Green Lab & Tech Circulaire" },
    { id: "AgriConnect", label: isEn ? "AgriConnect & Rural Farming" : "AgriConnect & Agriculture Rurale" },
    { id: "Safe Vibe", label: isEn ? "Safe Vibe & Digital Media" : "Safe Vibe & Médias Numériques" },
    { id: "Créatif & Social", label: isEn ? "Women & Social Enterprise" : "Femmes, Créatif & Social" },
    { id: "Global Festival", label: isEn ? "Global Festival & International" : "Global Festival & International" },
  ];

  // Types list
  const types = [
    { id: "all", label: isEn ? "All Types" : "Tous les formats" },
    { id: "guide", label: isEn ? "Guides (PDF)" : "Guides Pratiques" },
    { id: "course", label: isEn ? "Courses & Manuals" : "Cours & Manuels" },
    { id: "toolkit", label: isEn ? "Toolkits & Packs" : "Boîtes à outils" },
    { id: "template", label: isEn ? "Templates & Audits" : "Gabarits & Modèles" },
  ];

  const filteredResources = resources.filter((res) => {
    const matchesCategory =
      selectedCategory === "all" ||
      (res.program && res.program.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (res.category_name && res.category_name.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (res.category?.name && res.category.name.toLowerCase().includes(selectedCategory.toLowerCase()));

    const matchesType = selectedType === "all" || res.resource_type === selectedType;

    const matchesSearch =
      !searchQuery ||
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (res.tags && (Array.isArray(res.tags) ? res.tags.join(" ") : res.tags).toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesType && matchesSearch;
  });

  return (
    <div className="bg-bone min-h-screen text-forest selection:bg-maple selection:text-white">
      {/* Hero Header Section */}
      <section className="border-b border-forest/15 pt-16 pb-14 px-5 md:px-10 lg:px-16 bg-[#FDFCFD]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2 w-2 rounded-full bg-[#B84A39]" />
              <span className="font-heading text-[10.5px] font-bold uppercase tracking-[0.25em] text-[#B84A39]">
                {isEn ? "PROGRAMS & KNOWLEDGE • DOWNLOADABLE RESOURCES" : "PROGRAMMES & SAVOIR-FAIRE • RESSOURCES TÉLÉCHARGEABLES"}
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-forest mb-4 leading-[1.08]">
              {isEn ? "Guides, Courses & Toolkits" : "Guides, Cours & Boîtes à Outils"}
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="max-w-2xl text-sm md:text-base text-forest/75 leading-relaxed font-sans font-normal">
              {isEn
                ? "Access our complete library of practical guides, circular technical manuals, and digital frameworks designed to empower entrepreneurs, cooperatives, and community organizations."
                : "Accédez en libre téléchargement à nos manuels techniques, guides d'impact et cadres méthodologiques conçus pour propulser entrepreneurs, coopératives et organismes à but non lucratif."}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="sticky top-[69px] z-30 bg-bone/90 backdrop-blur-md border-b border-forest/15 py-4 px-5 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Categories Pill Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-heading font-bold uppercase tracking-wider rounded-full transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-forest text-bone shadow-xs"
                    : "bg-forest/5 text-forest/70 hover:bg-forest/10 hover:text-forest"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-forest/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? "Search by keyword..." : "Rechercher un guide ou cours..."}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-forest/20 focus:outline-none focus:border-[#B84A39]"
            />
          </div>
        </div>
      </section>

      {/* Resource Cards Grid */}
      <section className="py-12 md:py-16 px-5 md:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#B84A39] mx-auto mb-3" />
              <p className="font-heading text-xs font-bold uppercase tracking-widest text-forest/60">
                Chargement de la bibliothèque...
              </p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="py-24 text-center bg-white border border-forest/15 p-8 max-w-lg mx-auto">
              <BookOpen className="w-10 h-10 text-forest/30 mx-auto mb-3" />
              <h3 className="font-heading text-lg font-bold text-forest mb-1">
                Aucun document trouvé
              </h3>
              <p className="text-xs text-forest/60 mb-4">
                Essayez d'ajuster vos critères de recherche ou sélectionnez une autre catégorie.
              </p>
              <button
                onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
                className="bg-forest text-bone font-heading text-xs font-bold uppercase tracking-wider px-4 py-2"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((res, index) => (
                <Reveal key={res.id || index} delay={0.05 * (index % 6)}>
                  <div className="bg-white border border-forest/15 p-6 flex flex-col justify-between h-full hover:border-[#B84A39] transition-all duration-300 group shadow-xs">
                    <div>
                      {/* Badge bar */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-forest/5 text-[#B84A39] border border-forest/10 font-heading">
                          {res.resource_type === "course"
                            ? (isEn ? "COURSE & MANUAL" : "COURS & MANUEL")
                            : res.resource_type === "toolkit"
                            ? (isEn ? "TOOLKIT" : "BOÎTE À OUTILS")
                            : res.resource_type === "template"
                            ? (isEn ? "TEMPLATE" : "GABARIT")
                            : (isEn ? "GUIDE PDF" : "GUIDE PRATIQUE")}
                        </span>
                        <span className="text-[11px] font-mono text-forest/50">
                          {res.file_size || "PDF"}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-heading text-base md:text-lg font-bold text-forest mb-2.5 leading-snug group-hover:text-[#B84A39] transition-colors">
                        {res.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-forest/75 leading-relaxed line-clamp-3 mb-4 font-sans">
                        {res.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {(Array.isArray(res.tags) ? res.tags : (res.tags || "").split(",")).slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-forest/60 bg-forest/5 px-2 py-0.5 rounded"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer with Author and Download CTA */}
                    <div className="pt-4 border-t border-forest/10 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="text-[10px] uppercase font-bold text-forest/40 block">
                          Émis par
                        </span>
                        <span className="text-xs text-forest/70 font-medium truncate block">
                          {res.author || "CAP Entrepreneurs"}
                        </span>
                      </div>

                      <button
                        onClick={() => openDownloadModal(res)}
                        className="bg-forest text-bone hover:bg-[#B84A39] font-heading text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 transition-colors flex items-center gap-2 whitespace-nowrap shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Télécharger</span>
                      </button>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Banner Stripe */}
      <NewsletterSubscribe variant="banner" source="resources_page" />

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
                <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-heading text-xl font-bold text-forest">
                  {isEn ? "Document ready to download!" : "Votre document est prêt !"}
                </h3>
                <p className="text-xs text-forest/70 max-w-sm mx-auto leading-relaxed">
                  Merci de votre intérêt pour les ressources de CAP Entrepreneurs. Votre téléchargement a démarré automatiquement.
                </p>

                <div className="pt-2">
                  <a
                    href={activeResource.file_url || "#"}
                    download
                    className="inline-flex items-center justify-center gap-2 bg-[#B84A39] hover:bg-[#a03e30] text-bone font-heading text-xs font-bold uppercase tracking-wider px-6 py-3 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Relancer le téléchargement</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setDownloadModalOpen(false)}
                  className="text-xs text-forest/60 hover:text-forest underline block mx-auto pt-2"
                >
                  Fermer la fenêtre
                </button>
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#B84A39] block mb-1">
                  ACCÈS AU DOCUMENT
                </span>
                <h3 className="font-heading text-lg font-bold text-forest mb-1 leading-snug">
                  {activeResource.title}
                </h3>
                <p className="text-xs text-forest/60 mb-5">
                  Remplissez ce court formulaire pour recevoir l'accès immédiat et gratuit à ce guide.
                </p>

                <form onSubmit={handleDownloadSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[11px] text-forest/80 mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="ex. Murielle Kouadio"
                      className="w-full bg-forest/5 border border-forest/20 px-3.5 py-2.5 text-forest focus:outline-none focus:border-[#B84A39]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[11px] text-forest/80 mb-1">
                      Courriel professionnel ou personnel *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@organisation.org"
                      className="w-full bg-forest/5 border border-forest/20 px-3.5 py-2.5 text-forest focus:outline-none focus:border-[#B84A39]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-[11px] text-forest/80 mb-1">
                      Profil / Organisation
                    </label>
                    <select
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value)}
                      className="w-full bg-forest/5 border border-forest/20 px-3.5 py-2.5 text-forest focus:outline-none"
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
                      className="mt-0.5 h-3.5 w-3.5 rounded border-forest/30 text-[#B84A39] focus:ring-[#B84A39]"
                    />
                    <label htmlFor="resource-newsletter-optin" className="text-[11px] text-forest/70 leading-tight cursor-pointer">
                      Je souhaite recevoir les prochaines parutions, avis de publication et guides d'impact de CAP Entrepreneurs.
                    </label>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={submittingDownload}
                      className="w-full bg-forest hover:bg-[#B84A39] text-bone font-heading text-xs font-bold uppercase tracking-wider py-3.5 px-6 transition-colors flex items-center justify-center gap-2 shadow-xs"
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

                  <p className="text-[10px] text-forest/40 text-center pt-1">
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
