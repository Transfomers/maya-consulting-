import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Image as ImageIcon, Trash2, Edit2, X, Search, Filter, HardDrive, Copy, Check, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AdminMedia() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, referenced, unreferenced
  const [editingMedia, setEditingMedia] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/media");
      setMedia(res.data || []);
    } catch (err) {
      toast.error("Erreur lors du chargement de la médiathèque");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleDelete = async (m) => {
    if (m.is_referenced || m.references_count > 0) {
      alert(`Action refusée : Ce média est actuellement utilisé par ${m.references_count} publication(s) (articles ou événements). Vous ne pouvez pas le supprimer sans retirer d'abord sa référence.`);
      return;
    }
    if (!window.confirm(`Confirmez-vous la suppression du fichier « ${m.filename} » ?`)) return;
    try {
      await api.delete(`/admin/media/${m.id}`);
      toast.success("Média supprimé avec succès");
      loadMedia();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Échec de la suppression");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    try {
      toast.loading("Téléversement en cours...", { id: "upload" });
      await api.post("/admin/media/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Fichier téléversé avec succès !", { id: "upload" });
      loadMedia();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Échec du téléversement", { id: "upload" });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMedia) return;
    
    try {
      await api.put(`/admin/media/${editingMedia.id}`, {
        alt_text: editingMedia.alt_text,
        caption: editingMedia.caption
      });
      toast.success("Métadonnées du média mises à jour");
      setEditingMedia(null);
      loadMedia();
    } catch (err) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const origin = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api.*$/, "") : "";
    return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleCopyUrl = (m) => {
    const fullUrl = getMediaUrl(m.url);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(m.id);
    toast.success("Lien de l'image copié dans le presse-papier !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "Taille N/A";
    const k = 1024;
    const sizes = ["Octets", "Ko", "Mo", "Go"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const filteredMedia = media.filter((m) => {
    const matchesSearch = 
      m.filename.toLowerCase().includes(search.toLowerCase()) ||
      (m.alt_text || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.caption || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "referenced") return m.is_referenced || m.references_count > 0;
    if (filterType === "unreferenced") return !m.is_referenced && (m.references_count === 0 || !m.references_count);
    return true;
  });

  const totalBytes = media.reduce((acc, m) => acc + (m.size_bytes || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-forest/15 pb-4">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Médiathèque & Fichiers</h1>
          <p className="text-xs text-sage mt-1">Gestion centralisée des visuels, documents et médias réutilisables.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-sage font-medium bg-forest/5 px-3 py-2 rounded border border-forest/10 flex items-center gap-1.5">
            <HardDrive className="h-3.5 w-3.5 text-forest" />
            <span>{media.length} fichiers</span>
            {totalBytes > 0 && <span>• {formatBytes(totalBytes)}</span>}
          </span>
          <label className="cursor-pointer px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#E20713] hover:bg-[#C4050F] transition-colors shadow-xs inline-flex items-center gap-1.5">
            <span>+ Téléverser un Fichier</span>
            <input type="file" accept="image/*,.pdf,.mp4" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="relative sm:col-span-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sage" />
          <input 
            type="text" 
            placeholder="Rechercher par nom de fichier, texte alternatif ou légende..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-forest/15 bg-white text-xs focus:outline-none focus:border-[#E20713]"
          />
        </div>
        <div className="relative sm:col-span-4">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sage" />
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-forest/15 bg-white text-xs focus:outline-none focus:border-[#E20713] cursor-pointer"
          >
            <option value="all">Tous les médias ({media.length})</option>
            <option value="referenced">Utilisés par des articles/événements</option>
            <option value="unreferenced">Non référencés (orphelins)</option>
          </select>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-sage">Chargement des médias...</div>
        ) : filteredMedia.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sage border border-dashed border-forest/15 bg-white">
            <ImageIcon className="h-10 w-10 mx-auto mb-2 text-forest/30" />
            <p className="font-bold text-forest">Aucun média trouvé</p>
            <p className="text-xs text-sage mt-1">Téléversez des images ou documents pour les réutiliser dans vos contenus.</p>
          </div>
        ) : (
          filteredMedia.map(m => (
            <div key={m.id} className="relative group border border-forest/15 bg-white aspect-square flex flex-col justify-between overflow-hidden shadow-xs hover:border-[#E20713] transition-all">
              <img src={getMediaUrl(m.url)} alt={m.alt_text || "Media"} className="object-cover w-full h-full" />
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                {m.is_referenced ? (
                  <span className="bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                    En ligne ({m.references_count})
                  </span>
                ) : (
                  <span className="bg-stone-700/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                    Non lié
                  </span>
                )}
                {!m.alt_text && (
                  <span className="bg-amber-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                    Sans Alt
                  </span>
                )}
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                <div>
                  <p className="text-xs truncate font-bold text-white">{m.filename}</p>
                  <p className="text-[10px] text-neutral-300 mt-0.5 font-mono">
                    {formatBytes(m.size_bytes)}
                  </p>
                  {m.alt_text && (
                    <p className="text-[10.5px] text-neutral-300 line-clamp-2 mt-1.5 italic">
                      "{m.alt_text}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/20">
                  <button
                    onClick={() => handleCopyUrl(m)}
                    className="p-1.5 bg-white/20 hover:bg-white text-white hover:text-black rounded transition-colors"
                    title="Copier le lien"
                  >
                    {copiedId === m.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>

                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setEditingMedia(m)}
                      className="p-1.5 bg-white/20 hover:bg-white text-white hover:text-black rounded transition-colors"
                      title="Modifier les métadonnées"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(m)}
                      className={`p-1.5 rounded transition-colors ${
                        m.is_referenced ? "bg-white/10 text-neutral-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white"
                      }`}
                      title={m.is_referenced ? "Média protégé (en cours d'utilisation)" : "Supprimer le média"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Metadata Modal */}
      {editingMedia && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 max-w-md w-full relative shadow-xl border border-forest/15">
            <button 
              onClick={() => setEditingMedia(null)}
              className="absolute top-4 right-4 text-sage hover:text-forest"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-heading text-lg font-black text-forest mb-1">Métadonnées du Média</h2>
            <p className="text-xs text-sage mb-4 truncate font-mono">{editingMedia.filename}</p>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-forest mb-1">Texte Alternatif (Alt Text) *</label>
                <input 
                  type="text" 
                  value={editingMedia.alt_text || ""}
                  onChange={e => setEditingMedia({...editingMedia, alt_text: e.target.value})}
                  className="w-full border border-forest/20 bg-[#FAFAFA] px-3.5 py-2 text-xs focus:border-[#E20713] focus:bg-white focus:outline-none"
                  placeholder="Description du contenu de l'image pour l'accessibilité..."
                />
                <p className="text-[10px] text-sage mt-1">Requis pour l'accessibilité RGAA / WCAG et le SEO Google.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-forest mb-1">Légende / Caption</label>
                <textarea 
                  value={editingMedia.caption || ""}
                  onChange={e => setEditingMedia({...editingMedia, caption: e.target.value})}
                  rows={2}
                  className="w-full border border-forest/20 bg-[#FAFAFA] px-3.5 py-2 text-xs focus:border-[#E20713] focus:bg-white focus:outline-none resize-none"
                  placeholder="Légende affichée sous l'image..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 bg-[#E20713] hover:bg-[#C4050F] text-white py-2 text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                >
                  Enregistrer
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingMedia(null)}
                  className="bg-neutral-100 hover:bg-neutral-200 text-forest py-2 px-4 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

