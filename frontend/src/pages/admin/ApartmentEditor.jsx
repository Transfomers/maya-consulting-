import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Building2,
  MapPin,
  Check,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Star,
  Layers,
  X
} from "lucide-react";
import { toast } from "sonner";
import { getApartments, saveApartment } from "@/data/apartmentStorage";

const DEFAULT_AMENITIES_OPTIONS = [
  "Climatisation",
  "Wifi Fibre Optique",
  "Sécurité 24/7",
  "Groupe électrogène",
  "Parking privé",
  "Smart TV Canal+",
  "Cuisine équipée",
  "Eau chaude continue",
  "Ménage inclus",
  "Vue panoramique",
  "Machine à laver",
  "Piscine",
];

export default function ApartmentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const isNew = !id || id === "new";

  const [form, setForm] = useState({
    id: "",
    title: "",
    type: "T3 Meublé Haut Standing",
    location: "Bastos, Yaoundé",
    rooms: "2 Chambres • 2 Salons • 2 Salles de bain",
    price: "60 000 FCFA / nuitée",
    amenities: ["Climatisation", "Wifi Fibre Optique", "Sécurité 24/7", "Groupe électrogène", "Parking privé"],
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=compress&cs=tinysrgb&w=1200",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=compress&cs=tinysrgb&w=1200",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=compress&cs=tinysrgb&w=1200",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=compress&cs=tinysrgb&w=1200"
    ],
    status: "Disponible",
    description: "",
  });

  const [customAmenity, setCustomAmenity] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      const all = getApartments();
      const found = all.find((a) => String(a.id) === String(id));
      if (found) {
        const primaryImage = found.image || (found.images && found.images[0]) || "";
        const allImages = Array.isArray(found.images) && found.images.length > 0
          ? found.images
          : primaryImage ? [primaryImage] : [];

        setForm({
          ...found,
          image: primaryImage,
          images: allImages,
          amenities: Array.isArray(found.amenities) ? found.amenities : [],
        });
      } else {
        toast.error("Appartement introuvable.");
        navigate("/admin/apartments");
      }
    } else {
      setForm((prev) => ({
        ...prev,
        id: `apt-${Date.now().toString().slice(-6)}`,
      }));
    }
  }, [id, isNew, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleAmenity = (item) => {
    setForm((prev) => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== item)
          : [...prev.amenities, item],
      };
    });
  };

  const handleAddCustomAmenity = () => {
    if (!customAmenity.trim()) return;
    if (!form.amenities.includes(customAmenity.trim())) {
      setForm((prev) => ({
        ...prev,
        amenities: [...prev.amenities, customAmenity.trim()],
      }));
    }
    setCustomAmenity("");
  };

  // Upload photo files from computer
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/v1/apartments/upload-photo", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            uploadedUrls.push(data.url);
          }
        } else {
          // Fallback to base64 DataURL
          const reader = new FileReader();
          const base64Url = await new Promise((resolve) => {
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(base64Url);
        }
      } catch (err) {
        // Fallback to base64 DataURL
        const reader = new FileReader();
        const base64Url = await new Promise((resolve) => {
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(file);
        });
        uploadedUrls.push(base64Url);
      }
    }

    setForm((prev) => {
      const newImages = [...prev.images, ...uploadedUrls];
      return {
        ...prev,
        images: newImages,
        image: prev.image || newImages[0] || "",
      };
    });

    setUploading(false);
    toast.success(`${uploadedUrls.length} photo(s) ajoutée(s) !`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Add image by URL
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    setForm((prev) => {
      const updated = [...prev.images, url];
      return {
        ...prev,
        images: updated,
        image: prev.image || url,
      };
    });
    setNewImageUrl("");
    toast.success("Photo ajoutée à la galerie !");
  };

  // Remove photo from gallery
  const handleRemoveImage = (indexToRemove) => {
    setForm((prev) => {
      const updatedImages = prev.images.filter((_, idx) => idx !== indexToRemove);
      let newMain = prev.image;
      if (prev.image === prev.images[indexToRemove]) {
        newMain = updatedImages[0] || "";
      }
      return {
        ...prev,
        images: updatedImages,
        image: newMain,
      };
    });
  };

  // Set photo as primary cover
  const handleSetPrimaryImage = (url) => {
    setForm((prev) => ({ ...prev, image: url }));
    toast.info("Photo principale définie pour la carte boutique !");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Veuillez renseigner le nom de l'appartement.");
      return;
    }

    const payload = {
      ...form,
      image: form.image || form.images[0] || "",
      images: form.images.length > 0 ? form.images : form.image ? [form.image] : [],
    };

    setSaving(true);
    try {
      await saveApartment(payload);
      toast.success(isNew ? "Appartement créé avec succès !" : "Appartement mis à jour !");
      navigate("/admin/apartments");
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/apartments"
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xs transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#E20713] text-white text-[10px] font-bold uppercase tracking-widest rounded-xs">
                IMMOBILIER
              </span>
              <span className="text-xs text-gray-400 font-mono">ID: {form.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-black text-gray-900 tracking-tight mt-0.5">
              {isNew ? "Ajouter un Nouvel Appartement" : `Modifier : ${form.title}`}
            </h1>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2.5 bg-[#E20713] hover:bg-[#c00610] text-white font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 rounded-xs shadow-sm transition-all disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "Enregistrement..." : "Enregistrer"}</span>
        </button>
      </div>

      {/* Main Grid: Form (7 cols) + Live Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white p-6 border border-gray-200 rounded-sm shadow-xs space-y-6">
          
          {/* General info */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono border-b border-gray-100 pb-2">
              1. Informations Générales
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Nom / Titre du Logement *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ex: Appartement Prestige Bastos"
                required
                className="w-full text-sm font-semibold border border-gray-300 rounded-xs px-3 py-2.5 focus:outline-none focus:border-[#E20713]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Type de Logement
                </label>
                <input
                  type="text"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  placeholder="Ex: T3 Meublé Haut Standing"
                  className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2.5 focus:outline-none focus:border-[#E20713]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Quartier & Ville
                </label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Ex: Bastos, Yaoundé"
                  className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2.5 focus:outline-none focus:border-[#E20713]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Configuration des Pièces
                </label>
                <input
                  type="text"
                  name="rooms"
                  value={form.rooms}
                  onChange={handleChange}
                  placeholder="Ex: 2 Chambres • 2 Salons • 2 Salles de bain"
                  className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2.5 focus:outline-none focus:border-[#E20713]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Tarif / Modalité (FCFA)
                </label>
                <input
                  type="text"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Ex: 60 000 FCFA / nuitée"
                  className="w-full text-xs font-bold text-[#E20713] border border-gray-300 rounded-xs px-3 py-2.5 focus:outline-none focus:border-[#E20713]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Statut de Disponibilité
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2.5 bg-white focus:outline-none focus:border-[#E20713]"
              >
                <option value="Disponible">Disponible (En ligne)</option>
                <option value="Occupé">Occupé (Réservé)</option>
                <option value="En maintenance">En maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Description Détaillée
              </label>
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Décrivez les atouts, le confort, la literie et les accès de l'appartement..."
                className="w-full text-xs border border-gray-300 rounded-xs p-3 focus:outline-none focus:border-[#E20713]"
              />
            </div>
          </div>

          {/* Photos & Gallery Management Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">
                  2. Galerie Photos de l'Appartement ({form.images.length})
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Uploadez plusieurs photos (Salon, Chambres, Cuisine, Salles de bain) pour les clients.
                </p>
              </div>

              {/* Upload button triggering hidden file input */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-xs transition-colors shadow-xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploading ? "Upload en cours..." : "Uploader Photos"}</span>
                </button>
              </div>
            </div>

            {/* URL input fallback */}
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Ou coller une URL d'image (https://...)"
                className="text-xs border border-gray-300 rounded-xs px-3 py-2 flex-1 focus:outline-none focus:border-[#E20713]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold uppercase rounded-xs"
              >
                Ajouter URL
              </button>
            </div>

            {/* Gallery Thumbnails List */}
            {form.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {form.images.map((imgUrl, index) => {
                  const isMain = form.image === imgUrl;
                  return (
                    <div
                      key={index}
                      className={`relative group aspect-[16/11] bg-gray-100 rounded-xs overflow-hidden border-2 transition-all ${
                        isMain ? "border-[#E20713] shadow-md" : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Main Photo Badge */}
                      {isMain && (
                        <div className="absolute top-1.5 left-1.5 bg-[#E20713] text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                          <Star className="h-2.5 w-2.5 fill-white" />
                          <span>Principale</span>
                        </div>
                      )}

                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-xs"
                            title="Supprimer cette photo"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        {!isMain && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(imgUrl)}
                            className="w-full py-1 bg-white/90 hover:bg-white text-gray-900 text-[10px] font-bold uppercase tracking-wider rounded-xs text-center"
                          >
                            Mettre en Principale
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-xs text-center">
                <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600 font-medium">Aucune photo dans la galerie.</p>
                <p className="text-[11px] text-gray-400">Cliquez sur « Uploader Photos » pour sélectionner des images depuis votre ordinateur.</p>
              </div>
            )}
          </div>

          {/* Amenities Multi-Selection */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">
              3. Équipements & Prestations Incluses
            </h2>

            <div className="flex flex-wrap gap-2">
              {DEFAULT_AMENITIES_OPTIONS.map((item) => {
                const checked = form.amenities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleAmenity(item)}
                    className={`px-3 py-1.5 rounded-xs text-xs font-medium transition-colors flex items-center gap-1.5 border ${
                      checked
                        ? "bg-[#E20713] text-white border-[#E20713]"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {checked && <Check className="h-3 w-3" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                placeholder="Ajouter un autre équipement..."
                className="text-xs border border-gray-300 rounded-xs px-3 py-1.5 flex-1 focus:outline-none focus:border-[#E20713]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomAmenity();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomAmenity}
                className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase rounded-xs"
              >
                Ajouter
              </button>
            </div>
          </div>
        </form>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono">
              Aperçu Carte Boutique
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-xs">
              {form.status}
            </span>
          </div>

          {/* Card Mockup */}
          <div className="bg-white border border-gray-200 shadow-md rounded-xs overflow-hidden">
            <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
              <img
                src={form.image || form.images[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"}
                alt={form.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-[#111827]/90 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xs backdrop-blur-xs">
                {form.type}
              </div>

              {form.images.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-0.5 text-[10px] font-mono rounded-xs backdrop-blur-xs flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  <span>{form.images.length} photos</span>
                </div>
              )}
            </div>

            {/* Gallery Thumbnail Preview */}
            {form.images.length > 1 && (
              <div className="flex gap-1.5 p-2 bg-gray-50 border-b border-gray-100 overflow-x-auto no-scrollbar">
                {form.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    onClick={() => handleSetPrimaryImage(img)}
                    className={`h-10 w-14 object-cover rounded-xs cursor-pointer border ${
                      form.image === img ? "border-[#E20713]" : "border-gray-200 opacity-60 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading font-black text-lg text-gray-900 leading-tight">
                    {form.title || "Titre de l'appartement"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-[#E20713]" />
                    <span>{form.location || "Quartier, Yaoundé"}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xs border border-gray-100 font-medium">
                {form.rooms}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {form.amenities.slice(0, 4).map((a) => (
                  <span key={a} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-xs">
                    {a}
                  </span>
                ))}
                {form.amenities.length > 4 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-gray-500">
                    +{form.amenities.length - 4} autres
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-gray-500 block font-mono">Tarif indicatif</span>
                  <span className="text-sm font-black text-[#E20713]">{form.price}</span>
                </div>
                <div className="px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-xs">
                  WhatsApp Direct
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
