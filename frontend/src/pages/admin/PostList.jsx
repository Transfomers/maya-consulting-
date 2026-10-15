import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Plus, Trash2, Search, Filter } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function AdminPostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [search, statusFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      
      const res = await api.get(`/admin/posts/?${params.toString()}`);
      setPosts(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this article?")) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      toast.success("Article deleted");
      fetchPosts();
    } catch (err) {
      toast.error("Failed to delete article");
    }
  };

  const getTitle = (post) => {
    if (!post.translations || post.translations.length === 0) return post.slug;
    const en = post.translations.find(t => t.language === 'en');
    return en ? en.title : post.translations[0].title;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Articles</h1>
        <Link
          to="/admin/posts/new"
          className="flex items-center gap-2 bg-forest px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-bone transition-colors hover:bg-forest/90"
        >
          <Plus className="h-4 w-4" /> Create Article
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage" />
          <input 
            type="text" 
            placeholder="Search articles..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-forest/15 bg-white text-sm focus:outline-none focus:border-forest"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage" />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-forest/15 bg-white text-sm focus:outline-none focus:border-forest appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-forest/15 overflow-hidden">
        <table className="w-full text-left text-sm text-forest">
          <thead className="border-b border-forest/15 bg-bone/50 text-xs uppercase tracking-wider text-sage">
            <tr>
              <th className="px-6 py-4 font-bold">Title</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Date</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/15">
            {loading ? (
              <tr><td colSpan="4" className="px-6 py-8 text-center text-sage">Loading...</td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-8 text-center text-sage">No articles found.</td></tr>
            ) : posts.map((post) => (
              <tr key={post.id} className="hover:bg-bone/30">
                <td className="px-6 py-4 font-medium">{getTitle(post)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 text-xs font-bold uppercase tracking-wider ${post.status === 'published' ? 'bg-maple/10 text-maple' : 'bg-sage/10 text-sage'}`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sage">{new Date(post.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <Link to={`/admin/posts/${post.id}/edit`} className="inline-block text-forest hover:text-maple transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  <button onClick={() => handleDelete(post.id)} className="text-forest hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
