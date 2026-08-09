import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";

export default function AdminPostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get("/v1/admin/posts");
      setPosts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
                  <span className={`inline-block px-2 py-1 text-xs font-bold uppercase tracking-wider ${post.status === 'published' ? 'bg-[#4CA743]/10 text-[#4CA743]' : 'bg-sage/10 text-sage'}`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sage">{new Date(post.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <Link to={`/admin/posts/${post.id}/edit`} className="inline-block text-forest hover:text-maple transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  <button className="text-forest hover:text-red-500 transition-colors">
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
