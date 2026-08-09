import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import TipTap from "@/components/TipTap";
import { Save, ArrowLeft, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function AdminPostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [lang, setLang] = useState("en"); // en, fr, ar
  
  const [formData, setFormData] = useState({
    slug: "",
    status: "draft",
    category_id: null,
    featured_image_id: null,
    featured_image_url: null, // UI only
    references: [],
    translations: {
      en: { title: "", slug: "", excerpt: "", content: "", seo_title: "", seo_description: "", focus_keyword: "", canonical_url: "", allow_index: true, allow_follow: true },
      fr: { title: "", slug: "", excerpt: "", content: "", seo_title: "", seo_description: "", focus_keyword: "", canonical_url: "", allow_index: true, allow_follow: true },
      ar: { title: "", slug: "", excerpt: "", content: "", seo_title: "", seo_description: "", focus_keyword: "", canonical_url: "", allow_index: true, allow_follow: true },
    }
  });

  useEffect(() => {
    if (isEditing) {
      toast.error("Editing existing posts requires single post API endpoint implementation");
    }
  }, [id, isEditing]);

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
      const res = await api.post("/v1/admin/media/upload", fd, {
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
    try {
      const payload = {
        slug: formData.slug || formData.translations.en.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status,
        category_id: null,
        featured_image_id: formData.featured_image_id,
        references: formData.references.filter(r => r.title.trim() !== ""),
        translations: Object.entries(formData.translations)
          .filter(([_, t]) => t.title.trim() !== '')
          .map(([l, t]) => ({ language: l, ...t }))
      };
      
      if (payload.translations.length === 0) {
        toast.error("At least one language title is required.");
        return;
      }

      await api.post("/v1/admin/posts", payload);
      toast.success("Post saved successfully!");
      navigate("/admin/posts");
    } catch (err) {
      toast.error("Failed to save post");
      console.error(err);
    }
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
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('draft')}
            className="px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-forest border border-forest/25 hover:bg-forest hover:text-bone transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            className="px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-bone bg-forest hover:bg-forest/90 transition-colors flex items-center gap-2"
          >
            <Save className="h-4 w-4" /> Publish
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
                className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                  lang === l ? "border-b-2 border-forest text-forest" : "text-sage hover:text-forest"
                }`}
              >
                {l === 'en' ? 'English' : l === 'fr' ? 'Français' : 'العربية'}
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
              <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Excerpt</label>
              <textarea
                value={formData.translations[lang].excerpt}
                onChange={(e) => handleTranslationChange("excerpt", e.target.value)}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
                rows={3}
                className="w-full border border-forest/15 bg-white px-4 py-3 text-forest focus:border-forest focus:outline-none resize-none"
                placeholder="Brief summary..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Content</label>
              <TipTap
                content={formData.translations[lang].content}
                onChange={(html) => handleTranslationChange("content", html)}
              />
            </div>
          </div>

          {/* SEO Section */}
          <div className="bg-white border border-forest/15 p-6 space-y-6">
            <h3 className="font-heading text-xl font-bold text-forest border-b border-forest/15 pb-2">SEO Optimization</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">SEO Title</label>
                  <input
                    type="text"
                    value={formData.translations[lang].seo_title}
                    onChange={(e) => handleTranslationChange("seo_title", e.target.value)}
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    className="w-full border border-forest/15 bg-bone px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                    placeholder="Custom SEO Title"
                  />
                  <div className="text-right text-xs mt-1 text-sage">
                    {(formData.translations[lang].seo_title || "").length} / 60
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Meta Description</label>
                  <textarea
                    value={formData.translations[lang].seo_description}
                    onChange={(e) => handleTranslationChange("seo_description", e.target.value)}
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    rows={3}
                    className="w-full border border-forest/15 bg-bone px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none resize-none"
                    placeholder="Meta Description"
                  />
                  <div className="text-right text-xs mt-1 text-sage">
                    {(formData.translations[lang].seo_description || "").length} / 160
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Focus Keyword</label>
                  <input
                    type="text"
                    value={formData.translations[lang].focus_keyword}
                    onChange={(e) => handleTranslationChange("focus_keyword", e.target.value)}
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    className="w-full border border-forest/15 bg-bone px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                  />
                </div>
                
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm text-forest">
                    <input 
                      type="checkbox" 
                      checked={formData.translations[lang].allow_index}
                      onChange={(e) => handleCheckboxChange("allow_index", e)}
                    />
                    Allow Index
                  </label>
                  <label className="flex items-center gap-2 text-sm text-forest">
                    <input 
                      type="checkbox" 
                      checked={formData.translations[lang].allow_follow}
                      onChange={(e) => handleCheckboxChange("allow_follow", e)}
                    />
                    Allow Follow
                  </label>
                </div>
              </div>

              {/* Google Preview */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Google Preview</label>
                <div className="bg-white border border-gray-200 p-4 rounded-md shadow-sm font-sans">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px]">C</div>
                    <div className="text-xs text-gray-800">CAP Entrepreneurs</div>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    https://capentrepreneurs.org/{lang}/news/{seoSlug}
                  </div>
                  <div className="text-xl text-[#1a0dab] font-medium hover:underline cursor-pointer mb-1 truncate">
                    {seoTitle}
                  </div>
                  <div className="text-sm text-[#4d5156] line-clamp-2">
                    {seoDesc}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* References */}
          <div className="bg-white border border-forest/15 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-forest/15 pb-2">
              <h3 className="font-heading text-xl font-bold text-forest">References & Citations</h3>
              <button onClick={addReference} className="text-xs flex items-center gap-1 font-bold uppercase tracking-wider text-forest hover:text-sage">
                <Plus className="h-4 w-4" /> Add Reference
              </button>
            </div>
            
            {formData.references.map((ref, idx) => (
              <div key={idx} className="p-4 border border-forest/15 bg-bone space-y-4 relative group">
                <button 
                  onClick={() => removeReference(idx)} 
                  className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={ref.title}
                    onChange={(e) => updateReference(idx, "title", e.target.value)}
                    placeholder="Title (Required)"
                    className="border border-forest/15 bg-white px-3 py-2 text-sm focus:outline-none w-full"
                  />
                  <input
                    type="text"
                    value={ref.author}
                    onChange={(e) => updateReference(idx, "author", e.target.value)}
                    placeholder="Author"
                    className="border border-forest/15 bg-white px-3 py-2 text-sm focus:outline-none w-full"
                  />
                  <input
                    type="text"
                    value={ref.publisher}
                    onChange={(e) => updateReference(idx, "publisher", e.target.value)}
                    placeholder="Publisher"
                    className="border border-forest/15 bg-white px-3 py-2 text-sm focus:outline-none w-full"
                  />
                  <input
                    type="text"
                    value={ref.publication_date}
                    onChange={(e) => updateReference(idx, "publication_date", e.target.value)}
                    placeholder="Publication Date"
                    className="border border-forest/15 bg-white px-3 py-2 text-sm focus:outline-none w-full"
                  />
                  <input
                    type="text"
                    value={ref.url}
                    onChange={(e) => updateReference(idx, "url", e.target.value)}
                    placeholder="URL (Optional)"
                    className="border border-forest/15 bg-white px-3 py-2 text-sm focus:outline-none w-full col-span-2"
                  />
                </div>
              </div>
            ))}
            {formData.references.length === 0 && (
              <div className="text-center py-6 text-sm text-sage">No references added yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-forest/15 p-5 space-y-4">
            <h3 className="font-heading text-lg font-bold text-forest border-b border-forest/15 pb-2">Global Settings</h3>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Global URL Slug</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full border border-forest/15 bg-bone px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none"
                placeholder="auto-generated-if-empty"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Category</label>
              <select className="w-full border border-forest/15 bg-bone px-3 py-2 text-sm text-forest focus:border-forest focus:outline-none">
                <option value="">Entrepreneurship</option>
                <option value="">Programs</option>
                <option value="">Community</option>
              </select>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white border border-forest/15 p-5 space-y-4">
            <h3 className="font-heading text-lg font-bold text-forest border-b border-forest/15 pb-2">Featured Image</h3>
            
            {formData.featured_image_url ? (
              <div className="relative group">
                <img 
                  src={api.defaults.baseURL.replace('/api', '') + formData.featured_image_url} 
                  alt="Featured" 
                  className="w-full h-auto border border-forest/15" 
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <label className="cursor-pointer px-3 py-1 bg-white text-forest text-xs font-bold uppercase">
                    Change Image
                    <input type="file" className="hidden" accept="image/*" onChange={handleFeaturedImageUpload} />
                  </label>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-forest/15 bg-bone w-full h-32 flex flex-col items-center justify-center cursor-pointer hover:border-forest/30 transition-colors">
                <ImageIcon className="h-8 w-8 text-sage mb-2" />
                <span className="text-xs text-sage font-bold uppercase tracking-wider">Upload Image</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFeaturedImageUpload} />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
