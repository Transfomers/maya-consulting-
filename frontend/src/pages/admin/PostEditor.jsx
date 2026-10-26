import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Car,
  ArrowLeft,
  Save,
  Trash2,
  Check,
  Fuel,
  Gauge,
  Users,
  Calendar,
  Image as ImageIcon,
  ArrowRight,
  ShoppingCart,
  CheckCircle2,
  Upload,
  Globe,
  Plus,
  Star,
  Loader2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { getCarById, createCar, updateCar, deleteCar } from "@/data/catalogStorage";
import { CATALOG_SECTIONS } from "@/data/catalogVehicles";

const SAMPLE_CAR_IMAGES = [
  { label: "Toyota SUV / RAV4", url: "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=compress&cs=tinysrgb&w=800" },
  { label: "Mercedes Maybach Luxe", url: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=compress&cs=tinysrgb&w=800" },
  { label: "Mercedes Classe S / E", url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=compress&cs=tinysrgb&w=800" },
  { label: "Toyota Hilux 2024", url: "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=compress&cs=tinysrgb&w=800" },
  { label: "Land Cruiser LC300 / Prado", url: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=compress&cs=tinysrgb&w=800" },
  { label: "Kia Sportage / Sonet 2025", url: "https://images.unsplash.com/photo-1570733577526-2a818c7d91d0?auto=compress&cs=tinysrgb&w=800" },
  { label: "Kia Seltos / Crossover", url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=compress&cs=tinysrgb&w=800" },
  { label: "Hyundai Santa Fe / Tucson", url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=compress&cs=tinysrgb&w=800" },
  { label: "Berline Économique Yaris/Rio", url: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=compress&cs=tinysrgb&w=800" },
];

export default function AdminPostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    model: "",
    brand: "Toyota",
    section: "01",
    year: "2024",
    engine: "Essence",
    transmission: "Automatique",
    seats: "5 places",
    condition: "Neuve",
    mileage: "0 km",
    interior: "Cuir",
    price: "Sur devis • Éligible Leasing",
    isMupocam: true,
    status: "Disponible",
    image: SAMPLE_CAR_IMAGES[0].url,
    photos: [SAMPLE_CAR_IMAGES[0].url],
    description: "",
    featuresText: "Climatisation renforcée\nDirection assistée\nCaméra de recul\nBluetooth & Multimédia\nJantes alliage",
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [webImageUrl, setWebImageUrl] = useState("");

  useEffect(() => {
    if (isEditing) {
      const existing = getCarById(id);
      if (existing) {
        const primaryImg = existing.image || (existing.photos && existing.photos[0]) || SAMPLE_CAR_IMAGES[0].url;
        const photosList = Array.isArray(existing.photos) && existing.photos.length > 0
          ? existing.photos
          : [primaryImg];

        setFormData({
          model: existing.model || "",
          brand: existing.brand || "Toyota",
          section: existing.section || "01",
          year: String(existing.year || "2024"),
          engine: existing.engine || "Essence",
          transmission: existing.transmission || "Automatique",
          seats: existing.seats || "5 places",
          condition: existing.condition || "Occasion",
          mileage: existing.mileage || (existing.condition === "Neuve" ? "0 km" : "Certifié"),
          interior: existing.interior || "Cuir",
          price: existing.price || "Sur devis • Éligible Leasing",
          isMupocam: existing.isMupocam !== undefined ? Boolean(existing.isMupocam) : true,
          status: existing.status || "Disponible",
          image: primaryImg,
          photos: photosList,
          description: existing.description || "",
          featuresText: Array.isArray(existing.features) ? existing.features.join("\n") : "",
        });
      } else {
        toast.error("Véhicule introuvable.");
        navigate("/admin/posts");
      }
    }
  }, [id, isEditing, navigate]);

  // Upload local photos from device/computer
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      try {
        const uploadData = new FormData();
        uploadData.append("file", file);

        let url = null;
        try {
          const res = await fetch("/api/v1/vehicles/upload-photo", {
            method: "POST",
            body: uploadData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.url) url = data.url;
          }
        } catch (_) {}

        if (!url) {
          // Fallback to base64 DataURL
          const reader = new FileReader();
          url = await new Promise((resolve) => {
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsDataURL(file);
          });
        }

        if (url) uploadedUrls.push(url);
      } catch (err) {
        console.error("Upload error", err);
      }
    }

    if (uploadedUrls.length > 0) {
      setFormData((prev) => {
        const newPhotos = [...uploadedUrls, ...(prev.photos || [])];
        return {
          ...prev,
          image: uploadedUrls[0],
          photos: newPhotos,
        };
      });
      toast.success(`${uploadedUrls.length} photo(s) ajoutée(s) avec succès !`);
    } else {
      toast.error("Échec du téléversement de la photo.");
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Add web image URL
  const handleAddWebImageUrl = (e) => {
    if (e) e.preventDefault();
    const cleanUrl = webImageUrl.trim();
    if (!cleanUrl) {
      toast.error("Veuillez saisir un lien d'image web valide.");
      return;
    }
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://") && !cleanUrl.startsWith("/uploads/") && !cleanUrl.startsWith("/Asset/")) {
      toast.error("Le lien doit débuter par https:// ou http://");
      return;
    }

    setFormData((prev) => {
      const newPhotos = [cleanUrl, ...(prev.photos || []).filter((p) => p !== cleanUrl)];
      return {
        ...prev,
        image: cleanUrl,
        photos: newPhotos,
      };
    });
    setWebImageUrl("");
    toast.success("Photo ajoutée depuis le lien web !");
  };

  // Set photo as primary
  const handleSetPrimary = (photoUrl) => {
    setFormData((prev) => ({
      ...prev,
      image: photoUrl,
    }));
    toast.info("Photo principale mise à jour.");
  };

  // Remove photo from gallery
  const handleRemovePhoto = (photoUrl) => {
    setFormData((prev) => {
      const filtered = (prev.photos || []).filter((p) => p !== photoUrl);
      const nextPrimary = prev.image === photoUrl ? (filtered[0] || SAMPLE_CAR_IMAGES[0].url) : prev.image;
      return {
        ...prev,
        image: nextPrimary,
        photos: filtered.length > 0 ? filtered : [SAMPLE_CAR_IMAGES[0].url],
      };
    });
    toast.info("Photo retirée de la galerie.");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.model.trim()) {
      toast.error("Veuillez saisir le modèle du véhicule.");
      return;
    }

    setLoading(true);
    const features = formData.featuresText
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (isEditing) {
        updateCar(id, {
          ...formData,
          year: parseInt(formData.year, 10) || new Date().getFullYear(),
          features,
        });
        toast.success(`Le véhicule « ${formData.model} » a été mis à jour avec succès !`);
      } else {
        createCar({
          ...formData,
          year: parseInt(formData.year, 10) || new Date().getFullYear(),
          features,
        });
        toast.success(`Le nouveau véhicule « ${formData.model} » a été ajouté au catalogue !`);
      }
      navigate("/admin/posts");
    } catch (err) {
      console.error(err);
      toast.error("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Confirmez-vous la suppression définitive du véhicule « ${formData.model} » ?`)) {
      deleteCar(id);
      toast.success("Véhicule supprimé du catalogue.");
      navigate("/admin/posts");
    }
  };

  const isNew = formData.condition === "Neuve" || formData.mileage === "0 km";

  return (
    <div className="p-6 md:p-10 space-y-8 bg-gray-50 min-h-screen text-gray-900 font-sans">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/posts"
            className="p-2 border border-gray-300 bg-white hover:border-[#E20713] hover:text-[#E20713] transition-colors rounded-xs"
            title="Retour à la liste"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-bold">
              3M SERVICES • GESTION AUTOMOBILE
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-gray-900">
              {isEditing ? `Modifier : ${formData.model}` : "Ajouter un Véhicule au Parc"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-xs"
            >
              <Trash2 className="h-4 w-4" />
              <span>Supprimer</span>
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-[#E20713] hover:bg-[#C4050F] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 rounded-xs"
          >
            <Save className="h-4 w-4" />
            <span>{isEditing ? "Enregistrer les Modifications" : "Publier au Catalogue"}</span>
          </button>
        </div>
      </div>

      {/* Editor Grid: Left Form (7 cols), Right Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form Fields Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6 bg-white p-6 md:p-8 border border-gray-200 shadow-xs rounded-sm">
          
          {/* 1. Main Info */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 font-mono pb-2 border-b border-gray-100 mb-4">
              1. Informations Générales
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Modèle complet du véhicule *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: TOYOTA RAV4 2021, MERCEDES Maybach 2018, KIA Rio 2023..."
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] font-bold rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Marque *
                </label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] font-medium rounded-xs"
                >
                  <option value="Toyota">Toyota</option>
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                  <option value="Kia">Kia</option>
                  <option value="Hyundai">Hyundai</option>
                  <option value="Nissan">Nissan</option>
                  <option value="Jeep">Jeep</option>
                  <option value="BMW">BMW</option>
                  <option value="Audi">Audi</option>
                  <option value="Lexus">Lexus</option>
                  <option value="Land Rover">Land Rover</option>
                  <option value="Ford">Ford</option>
                  <option value="Autre">Autre marque</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Section du Catalogue *
                </label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] font-medium rounded-xs"
                >
                  {CATALOG_SECTIONS.map((sec) => (
                    <option key={sec.number} value={sec.number}>
                      {sec.number} • {sec.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Technical Specs & Pricing */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 font-mono pb-2 border-b border-gray-100 mb-4">
              2. Fiche Technique, Prix & MUPOCAM
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Prix de vente affiché / Formule Leasing *
                </label>
                <input
                  type="text"
                  placeholder="ex: Sur devis • Éligible Leasing, 8 500 000 FCFA..."
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] font-bold text-[#E20713] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Année de mise en circulation *
                </label>
                <input
                  type="text"
                  placeholder="ex: 2024, 2022, 2015, 2011..."
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] rounded-xs"
                />
              </div>
            </div>

            {/* MUPOCAM Leasing Badge Toggle */}
            <div className="p-3 bg-orange-50/60 border border-orange-200 rounded-xs flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-orange-950 block">Éligibilité Leasing MUPOCAM</span>
                <span className="text-[11px] text-orange-800">
                  Affiche le badge officiel « MUPOCAM ✓ » sur la fiche et propose le paiement échelonné.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isMupocam}
                  onChange={(e) => setFormData({ ...formData, isMupocam: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7900]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Moteur (Carburant)
                </label>
                <input
                  type="text"
                  placeholder="ex: Essence, Diesel, Essence V6 3.6L..."
                  value={formData.engine}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Transmission
                </label>
                <input
                  type="text"
                  placeholder="ex: Automatique, Manuelle 4*2, Auto 4*4"
                  value={formData.transmission}
                  onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Nombre de places / Sellerie
                </label>
                <input
                  type="text"
                  placeholder="ex: 5 places, 7 places en cuir"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  État / Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] rounded-xs"
                >
                  <option value="Neuve">Neuve (0 km)</option>
                  <option value="Occasion">Occasion Certifiée</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Compteur / Kilométrage
                </label>
                <input
                  type="text"
                  placeholder="ex: 0 km, 52 000 km, Certifié"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Disponibilité
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] rounded-xs"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Réservé">Réservé</option>
                  <option value="Vendu">Vendu</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Media & Image Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 font-mono">
                3. Photographies du Véhicule
              </h3>
              <span className="text-[11px] font-mono text-gray-500 font-bold">
                {(formData.photos || []).length} photo(s)
              </span>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Upload & Link options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Upload file from computer / device */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-gray-300 hover:border-[#E20713] bg-gray-50 hover:bg-red-50/20 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-gray-200 flex items-center justify-center text-gray-600 group-hover:text-[#E20713] mb-2 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#E20713]" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </div>
                <p className="text-xs font-bold text-gray-900 group-hover:text-[#E20713] transition-colors">
                  {uploading ? "Téléversement en cours..." : "Téléverser depuis l'appareil"}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Cliquez pour choisir une photo (JPG, PNG, WEBP)
                </p>
              </div>

              {/* Option B: Add web image link */}
              <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1">
                    <Globe className="h-4 w-4 text-[#E20713]" />
                    <span>Ajouter par lien web (URL)</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2">
                    Collez l'adresse web directe d'une photo en ligne.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={webImageUrl}
                    onChange={(e) => setWebImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddWebImageUrl();
                      }
                    }}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#E20713]"
                  />
                  <button
                    type="button"
                    onClick={handleAddWebImageUrl}
                    className="px-3 py-1.5 bg-[#E20713] hover:bg-[#C4050F] text-white text-[11px] font-bold rounded transition-colors whitespace-nowrap"
                  >
                    + Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Photo Gallery Grid */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2">
                Galerie sélectionnée pour ce véhicule :
              </label>

              {(!formData.photos || formData.photos.length === 0) ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center text-xs text-gray-500">
                  Aucune photo pour l'instant. Utilisez les boutons ci-dessus pour ajouter des photos.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {formData.photos.map((photoUrl, idx) => {
                    const isPrimary = formData.image === photoUrl;
                    return (
                      <div
                        key={idx}
                        className={`relative rounded-lg overflow-hidden border-2 bg-gray-100 group aspect-video sm:aspect-4/3 ${
                          isPrimary ? "border-[#E20713] shadow-xs ring-2 ring-[#E20713]/20" : "border-gray-200"
                        }`}
                      >
                        <img
                          src={photoUrl}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = SAMPLE_CAR_IMAGES[0].url; }}
                        />

                        {/* Primary Badge */}
                        {isPrimary && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#E20713] text-white text-[9px] font-bold font-mono uppercase rounded shadow-xs flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 fill-white" />
                            <span>Principale</span>
                          </span>
                        )}

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(photoUrl)}
                              className="px-2 py-1 bg-white text-gray-900 hover:bg-gray-100 text-[10px] font-bold rounded transition-colors shadow-xs"
                              title="Définir comme photo principale"
                            >
                              Définir principale
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photoUrl)}
                            className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors shadow-xs"
                            title="Supprimer cette photo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Presets Library */}
            <div className="pt-2">
              <span className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">
                Ou choisir une photo prédéfinie de notre bibliothèque :
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SAMPLE_CAR_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        image: sample.url,
                        photos: [sample.url, ...(prev.photos || []).filter((p) => p !== sample.url)],
                      }));
                      toast.info(`Photo « ${sample.label} » sélectionnée.`);
                    }}
                    className={`text-left p-1.5 border text-[10px] flex items-center gap-1.5 transition-colors truncate rounded ${
                      formData.image === sample.url
                        ? "bg-[#E20713] text-white border-[#E20713]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <ImageIcon className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{sample.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Editorial & Features */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 font-mono pb-2 border-b border-gray-100 mb-4">
              4. Description & Équipements
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Description commerciale
                </label>
                <textarea
                  rows={3}
                  placeholder="Présentation du confort, de l'état mécanique et des atouts du véhicule..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] resize-none rounded-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Points forts & équipements (1 par ligne)
                </label>
                <textarea
                  rows={4}
                  placeholder="Climatisation bizone&#10;Caméra de recul&#10;Sellerie cuir..."
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-300 focus:outline-none focus:border-[#E20713] font-mono text-[11px] rounded-xs"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <Link
              to="/admin/posts"
              className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900"
            >
              Annuler
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[#E20713] hover:bg-[#C4050F] text-white text-xs font-bold uppercase tracking-widest transition-colors shadow flex items-center gap-2 rounded-xs"
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? "Enregistrer" : "Créer le Véhicule"}</span>
            </button>
          </div>

        </form>

        {/* Live Preview Column (Matching exact card on Boutique & Home) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono">
              Aperçu en Direct (Carte Boutique & Accueil)
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
              formData.status === "Disponible" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            }`}>
              {formData.status}
            </span>
          </div>

          {/* Preview Card matching user's exact screenshot */}
          <div className="bg-white border border-gray-200 overflow-hidden shadow-md rounded-sm">
            <div className="relative h-60 w-full overflow-hidden bg-gray-100">
              <img
                src={formData.image}
                alt="Aperçu"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.src = SAMPLE_CAR_IMAGES[0].url;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2 py-0.5 bg-black/80 text-white text-[10px] font-mono font-bold uppercase rounded-xs">
                  SECTION {formData.section}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-xs ${
                  isNew ? "bg-emerald-600 text-white" : "bg-amber-500 text-black"
                }`}>
                  {formData.condition}
                </span>
              </div>

              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 bg-white text-gray-900 text-[10px] font-mono font-bold rounded-xs shadow-xs">
                  {formData.year ? `Année ${formData.year}` : (formData.mileage || "Disponible")}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-[10px] font-mono uppercase tracking-widest text-red-300">
                  {CATALOG_SECTIONS.find((s) => s.number === formData.section)?.title || "3M SERVICES"}
                </p>
                <h4 className="text-xl font-heading font-black text-white leading-tight mt-0.5 drop-shadow">
                  {formData.model || "Titre du Modèle"}
                </h4>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Price / Leasing Indicator */}
              <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded border border-gray-100">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
                    PRIX DE VENTE / LEASING
                  </span>
                  <span className="text-sm font-extrabold text-[#E20713]">
                    {formData.price || (isNew ? "Neuve 0 km • Prix sur devis" : "Sur devis • Éligible Leasing")}
                  </span>
                </div>
                {formData.isMupocam && (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider rounded border border-orange-200">
                    MUPOCAM ✓
                  </span>
                )}
              </div>

              {/* Specs Matrix */}
              <div className="grid grid-cols-2 gap-2 text-xs border-b border-gray-100 pb-3">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Fuel className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                  <span className="truncate">{formData.engine}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Gauge className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                  <span className="truncate">{formData.transmission}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Users className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                  <span>{formData.seats}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Calendar className="h-3.5 w-3.5 text-[#E20713] flex-shrink-0" />
                  <span>{formData.year ? `Année ${formData.year}` : (formData.mileage || "Disponible")}</span>
                </div>
              </div>

              {/* Buttons mockup */}
              <div className="pt-2 flex items-center gap-2">
                <div className="flex-1 py-2 px-3 bg-white border border-gray-300 text-gray-900 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-xs">
                  <span>VOIR DÉTAILS</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <div className="flex-1 py-2 px-3 bg-[#E20713] text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-xs">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>AJOUTER</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 text-center">
            Toute modification est synchronisée sur le serveur et immédiatement visible sur le showroom et la boutique en production.
          </p>
        </div>

      </div>

    </div>
  );
}
