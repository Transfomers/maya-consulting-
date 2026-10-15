import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  BookOpen, Plus, Search, Filter, Download, ExternalLink,
  Edit2, Trash2, CheckCircle, Clock, X, UploadCloud, FileText,
  Tag, Layers, Award, Sparkles, Check
} from "lucide-react";

const RESOURCE_TYPES = [
  { value: "course", label: "Cours / Formation", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "guide", label: "Guide Pratique", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "toolkit", label: "Boîte à Outils (Toolkit)", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "document", label: "Document / Fiche", color: "bg-stone-100 text-stone-700 border-stone-200" },
  { value: "report", label: "Rapport d'Impact", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "video", label: "Vidéo / Webinaire", color: "bg-rose-100 text-rose-800 border-rose-200" },
];

export default function AdminResources() {
  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    category_id: "",
    resource_type: "course",
    file_url: "",
    external_url: "",
    file_size: "",
    mime_type: "",
    author: "Cap Entrepreneurs",
    tags: "",
    is_published: true,
    is_featured: false,
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data || []);
    } catch (err) {
      console.warn("Categories fetch fallback:", err);
    }
  };

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append("resource_type", typeFilter);
      if (categoryFilter) params.append("category_id", categoryFilter);
      if (search) params.append("search", search);

      const res = await api.get(`/admin/resources?${params.toString()}`);
      setResources(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la récupération des ressources");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, search]);

  useEffect(() => {
    fetchCategories();
    fetchResources();
  }, [fetchResources]);

  const openCreateModal = () => {
    setEditingResource(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      category_id: categories[0]?.id || "",
      resource_type: "course",
      file_url: "",
      external_url: "",
      file_size: "",
      mime_type: "",
      author: "Cap Entrepreneurs",
      tags: "Programme, Formation, Transition Numérique",
      is_published: true,
      is_featured: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (res) => {
    setEditingResource(res);
    setFormData({
      title: res.title || "",
      slug: res.slug || "",
      description: res.description || "",
      category_id: res.category_id || "",
      resource_type: res.resource_type || "course",
      file_url: res.file_url || "",
      external_url: res.external_url || "",
      file_size: res.file_size || "",
      mime_type: res.mime_type || "",
      author: res.author || "Cap Entrepreneurs",
      tags: res.tags || "",
      is_published: Boolean(res.is_published),
      is_featured: Boolean(res.is_featured),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await api.post("/admin/resources/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData((prev) => ({
        ...prev,
        file_url: res.data.url,
        file_size: res.data.file_size || `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        mime_type: res.data.mime_type || file.type,
      }));
      toast.success("Document téléversé avec succès");
    } catch (err) {
      console.error(err);
      toast.error("Échec du téléversement du fichier");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }

    setSaving(true);
    try {
      if (editingResource) {
        await api.put(`/admin/resources/${editingResource.id}`, formData);
        toast.success("Ressource mise à jour avec succès");
      } else {
        await api.post("/admin/resources", formData);
        toast.success("Ressource ajoutée au programme avec succès");
      }
      closeModal();
      fetchResources();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Confirmer la suppression de la ressource "${title}" ?`)) return;

    try {
      await api.delete(`/admin/resources/${id}`);
      toast.success("Ressource supprimée");
      fetchResources();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-forest/10 pb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-forest">Ressources & Cours des Programmes</h1>
          <p className="font-sans text-xs text-sage mt-1">
            Gérez les guides, cours, toolkits téléchargeables associés aux programmes structurants.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-forest hover:bg-maple text-white px-4 py-2.5 font-montserrat text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Ajouter une ressource</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 border border-forest/10 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest/40" />
          <input
            type="text"
            placeholder="Rechercher par titre, auteur, tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-forest/15 focus:border-maple outline-none bg-bone/30"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-forest/15 focus:border-maple outline-none bg-bone/30"
        >
          <option value="">Tous les types</option>
          {RESOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-forest/15 focus:border-maple outline-none bg-bone/30"
        >
          <option value="">Tous les programmes / catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Resources Table / List */}
      <div className="bg-white border border-forest/10 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs font-montserrat uppercase tracking-widest text-sage font-bold">
            Chargement des ressources...
          </div>
        ) : resources.length === 0 ? (
          <div className="py-20 text-center">
            <BookOpen className="h-10 w-10 text-forest/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-forest/70">Aucune ressource trouvée.</p>
            <p className="text-xs text-sage mt-1">Créez votre première ressource ou ajustez vos filtres.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-forest/10 font-montserrat uppercase tracking-wider text-forest/60">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Titre & Description</th>
                  <th className="py-3.5 px-4 font-bold">Programme</th>
                  <th className="py-3.5 px-4 font-bold">Type</th>
                  <th className="py-3.5 px-4 font-bold">Fichier</th>
                  <th className="py-3.5 px-4 font-bold">Statut</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {resources.map((res) => {
                  const typeObj = RESOURCE_TYPES.find((t) => t.value === res.resource_type) || RESOURCE_TYPES[0];
                  return (
                    <tr key={res.id} className="hover:bg-bone/20 transition-colors">
                      <td className="py-4 px-4 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-forest leading-snug">{res.title}</span>
                          {res.is_featured && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                              <Sparkles className="w-2.5 h-2.5" /> Vedette
                            </span>
                          )}
                        </div>
                        {res.description && (
                          <p className="text-[11px] text-sage line-clamp-2 mt-1 leading-relaxed">{res.description}</p>
                        )}
                        <span className="text-[10px] text-forest/40 mt-1 block">Auteur : {res.author || "Cap Entrepreneurs"}</span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-serif text-xs font-bold text-forest">
                          <Layers className="h-3 w-3 text-maple" />
                          {res.category?.name || "Général"}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-none ${typeObj.color}`}>
                          {typeObj.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {res.file_url ? (
                          <a
                            href={res.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-forest hover:text-maple font-mono text-[11px] font-semibold transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{res.file_size || "Document"}</span>
                          </a>
                        ) : res.external_url ? (
                          <a
                            href={res.external_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-forest hover:text-maple text-[11px] transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Lien externe</span>
                          </a>
                        ) : (
                          <span className="text-forest/30 text-[11px] italic">Aucun fichier</span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {res.is_published ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" /> Publié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-stone-500 font-semibold text-[11px]">
                            <Clock className="w-3.5 h-3.5" /> Brouillon
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(res)}
                            className="p-1.5 text-forest/60 hover:text-maple transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(res.id, res.title)}
                            className="p-1.5 text-forest/60 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-forest/15 w-full max-w-2xl my-8 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 text-forest/50 hover:text-forest transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-heading text-xl font-bold text-forest mb-1">
              {editingResource ? "Modifier la ressource" : "Ajouter une ressource au programme"}
            </h2>
            <p className="text-xs text-sage mb-6">
              Associez ce guide, cours ou boîte à outils à un programme pour le rendre téléchargeable par la communauté.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                  Titre du cours / guide *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Guide Pratique du Reconditionnement & Économie Circulaire"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-forest/20 focus:border-maple outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                    Programme / Catégorie
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-forest/20 focus:border-maple outline-none bg-white"
                  >
                    <option value="">Sélectionner un programme</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                    Type de ressource
                  </label>
                  <select
                    value={formData.resource_type}
                    onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-forest/20 focus:border-maple outline-none bg-white"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                  Description / Objectifs d'apprentissage
                </label>
                <textarea
                  rows={3}
                  placeholder="Expliquez ce que le lecteur apprendra et comment cette ressource l'aidera..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-forest/20 focus:border-maple outline-none"
                />
              </div>

              {/* File Attachment */}
              <div className="p-4 bg-bone/30 border border-forest/15 space-y-3">
                <span className="block text-xs font-bold uppercase tracking-wider text-forest">
                  Document à télécharger (PDF, ZIP, DOCX...)
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1a1a1a] hover:bg-maple text-white px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors">
                    <UploadCloud className="w-4 h-4" />
                    <span>{uploadingFile ? "Téléversement..." : "Téléverser le fichier"}</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                  </label>

                  {formData.file_url && (
                    <div className="flex items-center gap-2 text-xs text-forest/80 font-mono">
                      <FileText className="w-4 h-4 text-maple" />
                      <span className="truncate max-w-[200px]">{formData.file_url}</span>
                      <span className="text-[10px] text-sage">({formData.file_size || "Fichier prêt"})</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-forest/70 mb-1">
                    Ou URL directe / Lien externe
                  </label>
                  <input
                    type="url"
                    placeholder="https://capentrepreneurs.org/uploads/mon-guide.pdf"
                    value={formData.file_url || formData.external_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-forest/20 focus:border-maple outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                    Auteur / Équipe
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-forest/20 focus:border-maple outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-forest mb-1.5">
                    Mots-clés (séparés par virgules)
                  </label>
                  <input
                    type="text"
                    placeholder="Numérique, Guide, Climat..."
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-forest/20 focus:border-maple outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-forest">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="accent-forest h-4 w-4"
                  />
                  <span>Publier immédiatement</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-forest">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="accent-forest h-4 w-4"
                  />
                  <span>Mettre en avant sur la page Programmes</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-forest/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-forest/20 text-xs font-bold uppercase tracking-wider text-forest hover:bg-forest/5"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingFile}
                  className="bg-forest hover:bg-maple text-white px-6 py-2 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : editingResource ? "Mettre à jour" : "Ajouter la ressource"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
