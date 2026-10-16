import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Plus, Trash2, Search, Filter, Copy, ExternalLink, FolderTree, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function AdminPostList() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [duplicatingId, setDuplicatingId] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
    setPage(1);
  }, [search, statusFilter, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data || []);
    } catch (err) {
      console.warn("Failed to fetch categories", err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (categoryFilter) params.append("category_id", categoryFilter);
      
      const res = await api.get(`/admin/posts/?${params.toString()}`);
      setPosts(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des articles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive de l'article « ${title} » ?`)) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      toast.success("Article supprimé avec succès");
      fetchPosts();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDuplicate = async (id) => {
    setDuplicatingId(id);
    try {
      const res = await api.post(`/admin/posts/${id}/duplicate`);
      toast.success("Article dupliqué en brouillon avec succès !");
      fetchPosts();
    } catch (err) {
      toast.error("Échec de la duplication");
    } finally {
      setDuplicatingId(null);
    }
  };

  const getTitle = (post) => {
    if (!post.translations || post.translations.length === 0) return post.slug;
    const fr = post.translations.find(t => t.language === 'fr');
    const en = post.translations.find(t => t.language === 'en');
    return fr?.title || en?.title || post.translations[0]?.title || post.slug;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "review":
      case "in_review":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "archived":
        return "bg-stone-200 text-stone-700 border-stone-300";
      case "draft":
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const paginatedPosts = posts.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(posts.length / pageSize) || 1;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-forest/15 pb-4">
        <div>
          <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Gestion des Articles</h1>
          <p className="text-xs text-sage mt-1">Cycle de vie complet : rédaction, bilinguisme, révision, programmation et archivage.</p>
        </div>
        <Link
          to="/admin/posts/new"
          className="flex items-center gap-2 bg-[#701EF8] hover:bg-[#5f17d3] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" /> Rédiger un Article
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="relative sm:col-span-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage" />
          <input 
            type="text" 
            placeholder="Rechercher par titre ou mot-clé..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-forest/15 bg-white text-xs focus:outline-none focus:border-[#701EF8]"
          />
        </div>
        <div className="relative sm:col-span-3">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sage" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-forest/15 bg-white text-xs focus:outline-none focus:border-[#701EF8] cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="published">Publiés (Published)</option>
            <option value="draft">Brouillons (Draft)</option>
            <option value="review">En Révision (Review)</option>
            <option value="scheduled">Programmés (Scheduled)</option>
            <option value="archived">Archivés (Archived)</option>
          </select>
        </div>
        <div className="relative sm:col-span-3">
          <FolderTree className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sage" />
          <select 
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-forest/15 bg-white text-xs focus:outline-none focus:border-[#701EF8] cursor-pointer"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-forest/15 overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs text-forest">
          <thead className="border-b border-forest/15 bg-bone/50 text-[11px] uppercase tracking-wider text-sage">
            <tr>
              <th className="px-5 py-3.5 font-bold">Titre & Slug</th>
              <th className="px-5 py-3.5 font-bold">Catégorie</th>
              <th className="px-5 py-3.5 font-bold">Langues</th>
              <th className="px-5 py-3.5 font-bold">Statut</th>
              <th className="px-5 py-3.5 font-bold">Date de publication</th>
              <th className="px-5 py-3.5 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/15">
            {loading ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-sage">Chargement des articles...</td></tr>
            ) : paginatedPosts.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-sage">Aucun article ne correspond aux critères.</td></tr>
            ) : paginatedPosts.map((post) => {
              const title = getTitle(post);
              const langs = (post.translations || []).map(t => t.language.toUpperCase());
              return (
                <tr key={post.id} className="hover:bg-bone/30 transition-colors">
                  <td className="px-5 py-4 font-medium max-w-xs">
                    <p className="font-bold text-forest hover:text-[#701EF8] transition-colors">{title}</p>
                    <p className="text-[10px] text-sage font-mono mt-0.5 truncate">{post.slug}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-forest/80 font-medium">
                      {post.category?.name || "Non classé"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      {["FR", "EN", "AR"].map((l) => (
                        <span
                          key={l}
                          className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                            langs.includes(l)
                              ? "bg-forest/10 text-forest font-bold"
                              : "bg-neutral-100 text-neutral-400"
                          }`}
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusBadge(post.status)}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sage text-[11px]">
                    {post.published_at 
                      ? new Date(post.published_at).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" })
                      : new Date(post.created_at).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Voir sur le site public"
                        className="p-1.5 text-sage hover:text-forest transition-colors rounded hover:bg-forest/5"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDuplicate(post.id)}
                        disabled={duplicatingId === post.id}
                        title="Dupliquer cet article"
                        className="p-1.5 text-sage hover:text-[#701EF8] transition-colors rounded hover:bg-forest/5 disabled:opacity-50"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <Link
                        to={`/admin/posts/${post.id}/edit`}
                        title="Modifier l'article"
                        className="p-1.5 text-sage hover:text-forest transition-colors rounded hover:bg-forest/5"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id, title)}
                        title="Supprimer l'article"
                        className="p-1.5 text-sage hover:text-red-500 transition-colors rounded hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-forest/15 flex items-center justify-between text-xs text-sage bg-bone/30">
            <span>Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, posts.length)} sur {posts.length} articles</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 border border-forest/20 rounded disabled:opacity-30 hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-bold text-forest">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 border border-forest/20 rounded disabled:opacity-30 hover:bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

