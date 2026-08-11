import { useState, useEffect } from "react";
import { FolderTree, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api"; // Assuming api is configured in lib/api

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ name: "", slug: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/categories");
      setCategories(res.data || []);
    } catch (err) {
      toast.error("Failed to load categories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/admin/categories/${isEditing}`, formData);
        toast.success("Category updated");
      } else {
        await api.post("/admin/categories", formData);
        toast.success("Category created");
      }
      setFormData({ name: "", slug: "" });
      setIsEditing(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save category");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete category");
    }
  };

  const handleEdit = (category) => {
    setIsEditing(category.id);
    setFormData({ name: category.name, slug: category.slug });
  };

  if (loading) return <div className="p-8 text-center text-forest/60">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-forest">
          <FolderTree className="h-6 w-6" />
          Categories
        </h1>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 border border-forest/15 p-6 rounded-lg bg-bone/30">
          <h2 className="text-xl font-bold text-forest mb-4">
            {isEditing ? "Edit Category" : "Add New Category"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-forest mb-1">Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-forest/30 bg-transparent px-4 py-2 focus:border-maple focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-forest mb-1">Slug</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full border border-forest/30 bg-transparent px-4 py-2 focus:border-maple focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-forest px-4 py-2 font-bold text-bone hover:bg-maple transition-colors"
              >
                {isEditing ? "Update" : "Create"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(null);
                    setFormData({ name: "", slug: "" });
                  }}
                  className="bg-forest/10 px-4 py-2 font-bold text-forest hover:bg-forest/20 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="overflow-x-auto border border-forest/15 rounded-lg bg-white">
            <table className="w-full text-left text-sm text-forest">
              <thead className="bg-forest/5 text-xs uppercase font-bold border-b border-forest/15">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-forest/60">
                      No categories found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c.id} className="border-b border-forest/5 hover:bg-forest/5">
                      <td className="px-6 py-4 font-bold">{c.name}</td>
                      <td className="px-6 py-4 text-forest/70">{c.slug}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-forest hover:text-maple p-2"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-red-500 hover:text-red-700 p-2 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
