import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FolderTree, Plus, Edit2, Trash2, Search, FileText, Download, CalendarDays, Archive, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    slug: "", 
    description: "", 
    display_order: 0, 
    is_archived: false 
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/categories");
      setCategories(res.data || []);
    } catch (err) {
      toast.error("Erreur lors du chargement des catégories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSlugify = (name) => {
    return name
      .toLowerCase()
      .trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    if (!isEditing) {
      setFormData(prev => ({ ...prev, name, slug: handleSlugify(name) }));
    } else {
      setFormData(prev => ({ ...prev, name }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/admin/categories/${isEditing}`, formData);
        toast.success("Catégorie mise à jour avec succès");
      } else {
        await api.post("/admin/categories", formData);
        toast.success("Catégorie créée avec succès");
      }
      setFormData({ name: "", slug: "", description: "", display_order: 0, is_archived: false });
      setIsEditing(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Échec de l'enregistrement de la catégorie");
    }
  };

  const handleDelete = async (category) => {
    const totalUsage = (category.posts_count || 0) + (category.resources_count || 0) + (category.events_count || 0);
    if (totalUsage > 0) {
      alert(`Action refusée : Cette catégorie est associée à ${category.posts_count || 0} article(s), ${category.resources_count || 0} ressource(s) et ${category.events_count || 0} événement(s). Vous devez d'abord réassigner ces contenus ou archiver la catégorie.`);
      return;
    }
    if (!window.confirm(`Confirmez-vous la suppression de la catégorie « ${category.name} » ?`)) return;
    try {
      await api.delete(`/admin/categories/${category.id}`);
      toast.success("Catégorie supprimée");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const handleEdit = (category) => {
    setIsEditing(category.id);
    setFormData({ 
      name: category.name, 
      slug: category.slug, 
      description: category.description || "", 
      display_order: category.display_order || 0, 
      is_archived: category.is_archived || false 
    });
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-forest/15 pb-4">
        <div>
          <h1 className="flex items-center gap-2.5 font-heading text-3xl font-black tracking-tight text-forest">
            <FolderTree className="h-7 w-7 text-[#701EF8]" />
            Catégories & Taxonomies
          </h1>
          <p className="text-xs text-sage mt-1">Classification transversale pour les articles, cours/ressources et événements.</p>
        </div>
        <div className="text-xs text-sage font-medium bg-forest/5 px-3 py-1.5 rounded border border-forest/10">
          Total : <strong className="text-forest font-bold">{categories.length} catégories</strong>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        
        {/* Form Panel (5 cols) */}
        <div className="lg:col-span-4 border border-forest/15 p-6 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-forest/10 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-forest">
              {isEditing ? "Modifier la catégorie" : "Ajouter une catégorie"}
            </h2>
            {isEditing && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                Édition
              </span>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-forest mb-1">Nom de la catégorie *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="Ex. Transition Numérique"
                className="w-full border border-forest/20 bg-[#FAFAFA] px-3.5 py-2 text-xs focus:border-[#701EF8] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-forest mb-1">Identifiant (Slug) *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="transition-numerique"
                className="w-full border border-forest/20 bg-[#FAFAFA] px-3.5 py-2 text-xs font-mono focus:border-[#701EF8] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-forest mb-1">Description éditoriale</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Courte description de l'axe thématique..."
                className="w-full border border-forest/20 bg-[#FAFAFA] px-3.5 py-2 text-xs focus:border-[#701EF8] focus:bg-white focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-forest mb-1">Ordre d'affichage</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-full border border-forest/20 bg-[#FAFAFA] px-3.5 py-2 text-xs focus:border-[#701EF8] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_archived}
                    onChange={(e) => setFormData({ ...formData, is_archived: e.target.checked })}
                    className="accent-[#701EF8]"
                  />
                  <span className="font-bold text-forest text-xs">Archivée</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-[#701EF8] hover:bg-[#5f17d3] px-4 py-2.5 font-bold uppercase tracking-wider text-white text-xs transition-colors shadow-xs"
              >
                {isEditing ? "Enregistrer" : "Créer la catégorie"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(null);
                    setFormData({ name: "", slug: "", description: "", display_order: 0, is_archived: false });
                  }}
                  className="bg-neutral-100 px-4 py-2.5 font-bold uppercase tracking-wider text-forest text-xs hover:bg-neutral-200 transition-colors"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sage" />
            <input 
              type="text" 
              placeholder="Filtrer les catégories..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-forest/15 bg-white text-xs focus:outline-none focus:border-[#701EF8]"
            />
          </div>

          <div className="overflow-x-auto border border-forest/15 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-forest">
              <thead className="bg-bone/50 text-[11px] uppercase font-bold text-sage border-b border-forest/15">
                <tr>
                  <th className="px-5 py-3.5">Nom & Description</th>
                  <th className="px-4 py-3.5">Slug</th>
                  <th className="px-4 py-3.5 text-center">Contenus liés</th>
                  <th className="px-4 py-3.5 text-center">Ordre</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-sage">Chargement des catégories...</td></tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-sage">
                      Aucune catégorie trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((c) => {
                    const totalUsage = (c.posts_count || 0) + (c.resources_count || 0) + (c.events_count || 0);
                    return (
                      <tr key={c.id} className="hover:bg-bone/30 transition-colors">
                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-forest">{c.name}</span>
                            {c.is_archived && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-stone-200 text-stone-700 rounded">
                                Archivée
                              </span>
                            )}
                          </div>
                          {c.description && (
                            <p className="text-[11px] text-sage line-clamp-1 mt-0.5">{c.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-sage">{c.slug}</td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex items-center gap-2 text-[10px]">
                            <span title={`${c.posts_count || 0} articles`} className="inline-flex items-center gap-1 font-bold text-forest">
                              <FileText className="h-3 w-3 text-sage" /> {c.posts_count || 0}
                            </span>
                            <span title={`${c.resources_count || 0} ressources`} className="inline-flex items-center gap-1 font-bold text-forest">
                              <Download className="h-3 w-3 text-sage" /> {c.resources_count || 0}
                            </span>
                            <span title={`${c.events_count || 0} événements`} className="inline-flex items-center gap-1 font-bold text-forest">
                              <CalendarDays className="h-3 w-3 text-sage" /> {c.events_count || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-sage">{c.display_order || 0}</td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(c)}
                              title="Modifier la catégorie"
                              className="p-1.5 text-sage hover:text-forest transition-colors rounded hover:bg-forest/5"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(c)}
                              title={totalUsage > 0 ? "Catégorie en cours d'utilisation" : "Supprimer la catégorie"}
                              className={`p-1.5 transition-colors rounded ${
                                totalUsage > 0 ? "text-neutral-300 cursor-not-allowed" : "text-sage hover:text-red-500 hover:bg-red-50"
                              }`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

