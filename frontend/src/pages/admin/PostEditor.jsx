import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import TipTap from "@/components/TipTap";
import { Save, ArrowLeft, Plus, Trash2, Image as ImageIcon, Eye } from "lucide-react";
import { toast } from "sonner";

export default function AdminPostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [lang, setLang] = useState("en"); // en, fr, ar
  const [categories, setCategories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const defaultTranslations = {
    en: { title: "", slug: "", excerpt: "", content: "", seo_title: "", seo_description: "", focus_keyword: "", canonical_url: "", allow_index: true, allow_follow: true },
    fr: { title: "", slug: "", excerpt: "", content: "", seo_title: "", seo_description: "", focus_keyword: "", canonical_url: "", allow_index: true, allow_follow: true },
    ar: { title: "", slug: "", excerpt: "", content: "", seo_title: "", seo_description: "", focus_keyword: "", canonical_url: "", allow_index: true, allow_follow: true },
  };

  const [formData, setFormData] = useState({
    slug: "",
    status: "draft",
    category_id: "",
    featured_image_id: null,
    featured_image_url: null, // UI only
    references: [],
    translations: defaultTranslations
  });

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchPost();
    }
  }, [id, isEditing]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPost = async () => {
    try {
      const res = await api.get(`/admin/posts/${id}`);
      const post = res.data;
      
      const newTranslations = { ...defaultTranslations };
      if (post.translations) {
        post.translations.forEach(t => {
          newTranslations[t.language] = { ...defaultTranslations[t.language], ...t };
        });
      }

      setFormData({
        slug: post.slug || "",
        status: post.status || "draft",
        category_id: post.category_id || "",
        featured_image_id: post.featured_image_id || null,
        featured_image_url: post.featured_image?.url || null,
        references: post.references || [],
        translations: newTranslations
      });
    } catch (err) {
      toast.error("Failed to load article");
      console.error(err);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleTranslationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [lang]: {
          ...prev.translations[lang],
          [field]: value
        }
      }
    }));
  };

  const handleCheckboxChange = (field, e) => {
    handleTranslationChange(field, e.target.checked);
  };

  const addReference = () => {
    setFormData(prev => ({
      ...prev,
      references: [...prev.references, { title: "", publisher: "", author: "", url: "", publication_date: "", description: "" }]
    }));
  };

  const updateReference = (index, field, value) => {
    const newRefs = [...formData.references];
    newRefs[index][field] = value;
    setFormData({ ...formData, references: newRefs });
  };

  const removeReference = (index) => {
    const newRefs = [...formData.references];
    newRefs.splice(index, 1);
    setFormData({ ...formData, references: newRefs });
  };

  const handleFeaturedImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await api.post("/admin/media/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setFormData({
        ...formData,
        featured_image_id: res.data.id,
        featured_image_url: res.data.url
      });
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error("Image upload failed");
    }
  };

  const handleSave = async (status) => {
    setIsSaving(true);
    try {
      const payload = {
        slug: formData.slug || formData.translations.en.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status,
        category_id: formData.category_id || null,
        featured_image_id: formData.featured_image_id,
        references: formData.references.filter(r => r.title.trim() !== ""),
        translations: Object.entries(formData.translations)
          .filter(([_, t]) => t.title.trim() !== '')
          .map(([l, t]) => ({ language: l, ...t }))
      };
      
      if (payload.translations.length === 0) {
        toast.error("At least one language title is required.");
        setIsSaving(false);
        return;
      }

      if (isEditing) {
        await api.put(`/admin/posts/${id}`, payload);
        toast.success("Post updated successfully!");
      } else {
        const res = await api.post("/admin/posts", payload);
        toast.success("Post created successfully!");
        navigate(`/admin/posts/${res.data.id}/edit`);
      }
      setLastSaved(new Date());
    } catch (err) {
      toast.error("Failed to save post");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    // In a real app we'd save draft and open preview mode or new tab
    handleSave('draft').then(() => {
      // Mock open preview
      toast.success("Preview opened in new window (Mock)");
    });
  };

  // Google SEO Preview Logic
  const seoTitle = formData.translations[lang].seo_title || formData.translations[lang].title || "Article Title";
  const seoDesc = formData.translations[lang].seo_description || formData.translations[lang].excerpt || "No description provided.";
  const seoSlug = formData.translations[lang].slug || formData.slug || "article-slug";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/posts")} className="text-sage hover:text-forest transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading text-3xl font-black tracking-tight text-forest">
            {isEditing ? "Edit Article" : "Create Article"}
          </h1>
          {lastSaved && <span className="text-xs text-sage ml-4">Last saved: {lastSaved.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-forest border border-forest/25 hover:bg-forest hover:text-bone transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Eye className="h-4 w-4" /> Preview
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-forest border border-forest/25 hover:bg-forest hover:text-bone transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-bone bg-forest hover:bg-forest/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {isSaving ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Language Switcher */}
          <div className="flex border-b border-forest/15">
            {["en", "fr", "ar"].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                  lang === l ? "border-b-2 border-forest text-forest" : "text-sage hover:text-forest"
                }`}
              >
                {l === 'en' ? 'English' : l === 'fr' ? 'Français' : 'العربية'}
                {formData.translations[l].title && <span className="text-green-500 text-lg leading-none">✓</span>}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Title</label>
              <input
                type="text"
                value={formData.translations[lang].title}
                onChange={(e) => handleTranslationChange("title", e.target.value)}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                className="w-full border border-forest/15 bg-white px-4 py-3 text-forest focus:border-forest focus:outline-none"
                placeholder="Enter title..."
              />
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-sage">Excerpt</label>
                <span className="text-xs text-sage">{formData.translations[lang].excerpt.length} / 160</span>
              </div>
              <textarea
                value={formData.translations[lang].excerpt}
                onChange={(e) => handleTranslationChange("excerpt", e.target.value)}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                rows={3}
                className="w-full border border-forest/15 bg-white px-4 py-3 text-forest focus:border-forest focus:outline-none resize-none"
                placeholder="Brief summary..."
              />
            </div>

            <div className={lang === 'ar' ? 'text-right' : 'text-left'}>
              <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Content</label>
              <TipTap
                content={formData.translations[lang].content}
                onChange={(html) => handleTranslationChange("content", html)}
              />
            </div>
          </div>

          {/* SEO Section */}
          <div className="bg-white border border-forest/15 p-6 space-y-6">
            <h2 className="text-lg font-bold font-heading text-forest">SEO Optimization ({lang.toUpperCase()})</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage">SEO Title</label>
                  <span className={`text-xs ${formData.translations[lang].seo_title.length > 60 ? 'text-red-500' : 'text-sage'}`}>
                    {formData.translations[lang].seo_title.length} / 60
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.translations[lang].seo_title}
                  onChange={(e) => handleTranslationChange("seo_title", e.target.value)}
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  className="w-full border border-forest/15 bg-white px-4 py-3 text-sm focus:border-forest focus:outline-none"
                  placeholder="Leave empty to use article title"
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage">Meta Description</label>
                  <span className={`text-xs ${formData.translations[lang].seo_description.length > 160 ? 'text-red-500' : 'text-sage'}`}>
                    {formData.translations[lang].seo_description.length} / 160
                  </span>
                </div>
                <textarea
                  value={formData.translations[lang].seo_description}
                  onChange={(e) => handleTranslationChange("seo_description", e.target.value)}
                  dir={lang === 'ar' ? 'rtl' : 'ltr'}
                  rows={2}
                  className="w-full border border-forest/15 bg-white px-4 py-3 text-sm focus:border-forest focus:outline-none resize-none"
                  placeholder="Leave empty to use article excerpt"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Focus Keyword</label>
                  <input
                    type="text"
                    value={formData.translations[lang].focus_keyword}
                    onChange={(e) => handleTranslationChange("focus_keyword", e.target.value)}
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    className="w-full border border-forest/15 bg-white px-4 py-3 text-sm focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Canonical URL</label>
                  <input
                    type="text"
                    value={formData.translations[lang].canonical_url}
                    onChange={(e) => handleTranslationChange("canonical_url", e.target.value)}
                    className="w-full border border-forest/15 bg-white px-4 py-3 text-sm focus:border-forest focus:outline-none"
                    placeholder={`https://capentrepreneurs.org/${lang}/news/slug`}
                  />
                </div>
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.translations[lang].allow_index}
                    onChange={(e) => handleCheckboxChange("allow_index", e)}
                    className="accent-forest"
                  />
                  <span className="text-sm font-medium text-forest">Allow Index</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.translations[lang].allow_follow}
                    onChange={(e) => handleCheckboxChange("allow_follow", e)}
                    className="accent-forest"
                  />
                  <span className="text-sm font-medium text-forest">Allow Follow</span>
                </label>
              </div>
            </div>

            {/* Google Preview */}
            <div className="mt-8 p-4 bg-[#f8f9fa] border border-[#dadce0] rounded-lg font-sans">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sage mb-4 font-heading">Google Preview</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-[#202124]">
                  <span className="bg-[#f1f3f4] rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">C</span>
                  CAP Entrepreneurs
                </div>
                <div className="text-sm text-[#4d5156] truncate">
                  https://capentrepreneurs.org/{lang}/news/{seoSlug}
                </div>
                <div className="text-xl text-[#1a0dab] hover:underline cursor-pointer truncate">
                  {seoTitle}
                </div>
                <div className="text-sm text-[#4d5156] line-clamp-2">
                  {seoDesc}
                </div>
              </div>
            </div>
          </div>

          {/* References */}
          <div className="bg-white border border-forest/15 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-heading text-forest">References & Citations</h2>
              <button onClick={addReference} className="text-forest hover:text-maple transition-colors flex items-center gap-1 text-sm font-bold">
                <Plus className="h-4 w-4" /> Add Reference
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.references.map((ref, index) => (
                <div key={index} className="border border-forest/15 p-4 relative group">
                  <button onClick={() => removeReference(index)} className="absolute top-4 right-4 text-sage hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-sage mb-1">Title *</label>
                      <input type="text" value={ref.title} onChange={e => updateReference(index, "title", e.target.value)} className="w-full border border-forest/15 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-sage mb-1">URL</label>
                      <input type="text" value={ref.url} onChange={e => updateReference(index, "url", e.target.value)} className="w-full border border-forest/15 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-sage mb-1">Author</label>
                      <input type="text" value={ref.author} onChange={e => updateReference(index, "author", e.target.value)} className="w-full border border-forest/15 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-sage mb-1">Publisher</label>
                      <input type="text" value={ref.publisher} onChange={e => updateReference(index, "publisher", e.target.value)} className="w-full border border-forest/15 px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              ))}
              {formData.references.length === 0 && (
                <p className="text-sm text-sage text-center py-4">No references added yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-forest/15 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-forest border-b border-forest/15 pb-2">Global Settings</h3>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Global Slug</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full border border-forest/15 bg-white px-4 py-2 text-sm focus:border-forest focus:outline-none"
                placeholder="Auto-generated if empty"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Category</label>
              <select
                name="category_id"
                value={formData.category_id || ""}
                onChange={handleChange}
                className="w-full border border-forest/15 bg-white px-4 py-2 text-sm focus:border-forest focus:outline-none"
              >
                <option value="">Select Category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white border border-forest/15 p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-forest border-b border-forest/15 pb-2">Featured Image</h3>
            
            {formData.featured_image_url ? (
              <div className="relative group">
                <img src={formData.featured_image_url} alt="Featured" className="w-full h-48 object-cover border border-forest/15" />
                <button 
                  onClick={() => setFormData({ ...formData, featured_image_id: null, featured_image_url: null })}
                  className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-forest/25 p-8 text-center flex flex-col items-center justify-center group hover:border-forest/50 transition-colors">
                <ImageIcon className="h-8 w-8 text-sage mb-3 group-hover:text-forest transition-colors" />
                <label className="cursor-pointer">
                  <span className="text-sm font-bold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest">Click to upload</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFeaturedImageUpload} />
                </label>
                <p className="text-xs text-sage mt-2">JPEG, PNG, WebP up to 5MB</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
