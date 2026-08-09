import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminMedia() {
  const [media, setMedia] = useState([]);

  const loadMedia = async () => {
    try {
      const res = await api.get("/v1/admin/media");
      setMedia(res.data);
    } catch (err) {
      toast.error("Failed to load media");
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await api.delete(`/v1/admin/media/${id}`);
      toast.success("Image deleted");
      loadMedia();
    } catch (err) {
      toast.error("Failed to delete image");
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    try {
      toast.loading("Uploading...", { id: "upload" });
      await api.post("/v1/admin/media/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Uploaded successfully", { id: "upload" });
      loadMedia();
    } catch (err) {
      toast.error("Upload failed", { id: "upload" });
    }
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
          <div key={m.id} className="relative group border border-forest/15 bg-white aspect-square flex items-center justify-center overflow-hidden">
            <img src={api.defaults.baseURL.replace('/api', '') + m.url} alt={m.alt_text || "Media"} className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
              <p className="text-white text-xs truncate mb-2">{m.filename}</p>
              <button 
                onClick={() => handleDelete(m.id)}
                className="self-end p-1 bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full py-12 text-center text-sage border border-dashed border-forest/15">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No media found. Upload your first image!</p>
          </div>
        )}
      </div>
    </div>
  );
}
