import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Image as ImageIcon, Trash2, Edit2, X } from "lucide-react";
import { toast } from "sonner";

export default function AdminMedia() {
  const [media, setMedia] = useState([]);
  const [editingMedia, setEditingMedia] = useState(null);

  const loadMedia = async () => {
    try {
      const res = await api.get("/admin/media");
      setMedia(res.data);
    } catch (err) {
      toast.error("Failed to load media");
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image? Ensure it is not used in any posts first!")) return;
    try {
      await api.delete(`/admin/media/${id}`);
      toast.success("Image deleted");
      loadMedia();
    } catch (err) {
      toast.error("Failed to delete image. It might be in use.");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Only image files are allowed");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    try {
      toast.loading("Uploading...", { id: "upload" });
      await api.post("/admin/media/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Uploaded successfully", { id: "upload" });
      loadMedia();
    } catch (err) {
      toast.error("Upload failed", { id: "upload" });
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
      toast.success("Media updated");
      setEditingMedia(null);
      loadMedia();
    } catch (err) {
      toast.error("Failed to update media");
    }
  };

  const getMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const origin = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api.*$/, "") : "";
    return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-black tracking-tight text-forest">Media Library</h1>
        <label className="cursor-pointer px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-bone bg-forest hover:bg-forest/90 transition-colors">
          Upload Image
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {media.map(m => (
          <div key={m.id} className="relative group border border-forest/15 bg-white aspect-square flex flex-col items-center justify-center overflow-hidden">
            <img src={getMediaUrl(m.url)} alt={m.alt_text || "Media"} className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
              <p className="text-white text-xs truncate break-all font-bold">{m.filename}</p>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setEditingMedia(m)}
                  className="p-1.5 bg-forest text-white hover:bg-forest/80 transition-colors rounded-sm"
                  title="Edit Metadata"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(m.id)}
                  className="p-1.5 bg-red-500 text-white hover:bg-red-600 transition-colors rounded-sm"
                  title="Delete Image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {!m.alt_text && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                No Alt Text
              </div>
            )}
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full py-12 text-center text-sage border border-dashed border-forest/15">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No media found. Upload your first image!</p>
          </div>
        )}
      </div>

      {editingMedia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 max-w-md w-full relative">
            <button 
              onClick={() => setEditingMedia(null)}
              className="absolute top-4 right-4 text-sage hover:text-forest"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-heading text-xl font-black text-forest mb-4">Edit Media Details</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Alt Text</label>
                <input 
                  type="text" 
                  value={editingMedia.alt_text || ""}
                  onChange={e => setEditingMedia({...editingMedia, alt_text: e.target.value})}
                  className="w-full border border-forest/15 bg-white px-3 py-2 text-sm focus:border-forest focus:outline-none"
                  placeholder="Describe the image for screen readers"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Caption</label>
                <textarea 
                  value={editingMedia.caption || ""}
                  onChange={e => setEditingMedia({...editingMedia, caption: e.target.value})}
                  rows={2}
                  className="w-full border border-forest/15 bg-white px-3 py-2 text-sm focus:border-forest focus:outline-none resize-none"
                  placeholder="Image caption"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-forest text-white py-2 text-sm font-bold uppercase tracking-widest hover:bg-forest/90 transition-colors"
              >
                Save Details
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
