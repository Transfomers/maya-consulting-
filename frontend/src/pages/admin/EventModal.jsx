import React, { useState, useEffect } from "react";
import { X, Trash2, Save, Calendar as CalendarIcon, MapPin, Users, Info, Settings, Clock, Link as LinkIcon, Image as ImageIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import TipTap from "@/components/TipTap";

export default function EventModal({ event, onClose, onSaved }) {
  const isNew = !event || !event.id;
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("basic"); // basic, date, location, registration, extra

  const [formData, setFormData] = useState({
    slug: "",
    status: "draft",
    visibility: "public",
    category_id: "",
    start_date: new Date(),
    end_date: new Date(new Date().getTime() + 60 * 60 * 1000), // +1 hour
    all_day: false,
    timezone: "UTC",
    location: "",
    location_url: "",
    is_online: false,
    meeting_url: "",
    registration_required: false,
    registration_url: "",
    registration_deadline: null,
    max_participants: "",
    featured_image_id: "",
    speaker_ids: [],
    translations: [
      {
        language: "en",
        title: "",
        excerpt: "",
        content: "",
      }
    ]
  });

  useEffect(() => {
    if (event && event.id) {
      setFormData({
        ...event,
        start_date: new Date(event.start_date),
        end_date: new Date(event.end_date),
        translations: event.translations?.length ? event.translations : [{ language: "en", title: "", excerpt: "", content: "" }],
        speaker_ids: event.speakers?.map(s => s.id) || []
      });
    } else if (event) {
      // Pre-filled from calendar slot
      setFormData(prev => ({
        ...prev,
        start_date: event.start_date || prev.start_date,
        end_date: event.end_date || prev.end_date,
        all_day: event.all_day || false
      }));
    }
  }, [event]);

  const updateTranslation = (index, field, value) => {
    const newTranslations = [...formData.translations];
    newTranslations[index] = { ...newTranslations[index], [field]: value };
    
    // Auto generate slug from EN title if it's new
    if (isNew && index === 0 && field === "title") {
      setFormData(prev => ({ ...prev, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }));
    }
    
    setFormData({ ...formData, translations: newTranslations });
  };

  const handleSave = async () => {
    if (!formData.translations[0].title) {
      toast.error("Event title is required");
      return;
    }
    
    setLoading(true);
    try {
      const autoSlug = formData.slug?.trim() || 
        formData.translations[0].title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || 
        `event-${Date.now()}`;

      const payload = {
        ...formData,
        slug: autoSlug,
        category_id: formData.category_id || null,
        featured_image_id: formData.featured_image_id || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants, 10) : null,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        registration_deadline: formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : null,
      };

      if (isNew) {
        await api.post("/admin/events", payload);
        toast.success("Event created successfully");
      } else {
        await api.put(`/admin/events/${event.id}`, payload);
        toast.success("Event updated successfully");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    setLoading(true);
    try {
      await api.delete(`/admin/events/${event.id}`);
      toast.success("Event deleted successfully");
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Failed to delete event");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (isNew) return;
    setLoading(true);
    try {
      await api.post(`/admin/events/${event.id}/duplicate`);
      toast.success("Event duplicated successfully");
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Failed to duplicate event");
    } finally {
      setLoading(false);
    }
  };

  // Convert date to string for input type="datetime-local"
  const toLocalISOString = (date) => {
    if (!date) return "";
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0,16);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="w-full sm:max-w-2xl bg-bone h-full flex flex-col shadow-2xl overflow-hidden relative animate-in slide-in-from-right">
        
        {/* Header */}
        <div className="bg-forest text-bone px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="font-heading font-black text-xl tracking-tight">
            {isNew ? "Create Event" : "Edit Event"}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 hover:bg-forest/50 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-forest/15 bg-white shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: "basic", label: "Basic Info", icon: Info },
            { id: "date", label: "Date & Time", icon: Clock },
            { id: "location", label: "Location", icon: MapPin },
            { id: "registration", label: "Register", icon: Users },
            { id: "extra", label: "Settings", icon: Settings },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.label}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0
                ${tab === t.id ? "text-forest border-b-2 border-forest bg-forest/5" : "text-sage hover:text-forest hover:bg-bone"}
              `}
            >
              <t.icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {tab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Event Title</label>
                <input
                  type="text"
                  value={formData.translations[0].title}
                  onChange={e => updateTranslation(0, "title", e.target.value)}
                  className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                  placeholder="e.g. CAP Entrepreneurs Networking Night"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Short Description / Excerpt</label>
                <textarea
                  value={formData.translations[0].excerpt || ""}
                  onChange={e => updateTranslation(0, "excerpt", e.target.value)}
                  className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Full Description</label>
                <div className="border border-forest/15 bg-white">
                  <TipTap
                    content={formData.translations[0].content || ""}
                    onChange={val => updateTranslation(0, "content", val)}
                  />
                </div>
              </div>
              
              {/* Media Upload Placeholder - Can be connected to AdminMedia later */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Cover Image ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.featured_image_id || ""}
                    onChange={e => setFormData({ ...formData, featured_image_id: e.target.value })}
                    className="flex-1 border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                    placeholder="Paste Media ID here"
                  />
                  <button className="px-4 py-2 border border-forest/15 bg-white text-forest flex items-center gap-2 hover:bg-bone">
                    <ImageIcon className="h-4 w-4" /> Browse
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "date" && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-forest">
                <input
                  type="checkbox"
                  checked={formData.all_day}
                  onChange={e => setFormData({ ...formData, all_day: e.target.checked })}
                  className="accent-forest"
                />
                All Day Event
              </label>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Start</label>
                  <input
                    type={formData.all_day ? "date" : "datetime-local"}
                    value={formData.all_day ? toLocalISOString(formData.start_date).split('T')[0] : toLocalISOString(formData.start_date)}
                    onChange={e => setFormData({ ...formData, start_date: new Date(e.target.value) })}
                    className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">End</label>
                  <input
                    type={formData.all_day ? "date" : "datetime-local"}
                    value={formData.all_day ? toLocalISOString(formData.end_date).split('T')[0] : toLocalISOString(formData.end_date)}
                    onChange={e => setFormData({ ...formData, end_date: new Date(e.target.value) })}
                    className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                >
                  <option value="UTC">UTC</option>
                  <option value="Africa/Douala">West Africa Time (Douala/Yaoundé)</option>
                  <option value="Europe/Paris">Central European Time (Paris)</option>
                  <option value="America/New_York">Eastern Time (New York)</option>
                </select>
              </div>
            </div>
          )}

          {tab === "location" && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-forest">
                <input
                  type="checkbox"
                  checked={formData.is_online}
                  onChange={e => setFormData({ ...formData, is_online: e.target.checked })}
                  className="accent-forest"
                />
                This is an online event
              </label>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Physical Location</label>
                <input
                  type="text"
                  value={formData.location || ""}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                  placeholder="e.g. Yaoundé Conference Centre"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Google Maps URL</label>
                <input
                  type="url"
                  value={formData.location_url || ""}
                  onChange={e => setFormData({ ...formData, location_url: e.target.value })}
                  className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                  placeholder="https://maps.google.com/..."
                />
              </div>

              {formData.is_online && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Meeting Link (Zoom, Meet, etc)</label>
                  <div className="flex relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sage" />
                    <input
                      type="url"
                      value={formData.meeting_url || ""}
                      onChange={e => setFormData({ ...formData, meeting_url: e.target.value })}
                      className="w-full border border-forest/15 bg-white pl-9 pr-3 py-2 text-forest focus:border-forest focus:outline-none"
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "registration" && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-forest">
                <input
                  type="checkbox"
                  checked={formData.registration_required}
                  onChange={e => setFormData({ ...formData, registration_required: e.target.checked })}
                  className="accent-forest"
                />
                Registration Required
              </label>

              {formData.registration_required && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Registration URL (External link if applicable)</label>
                    <input
                      type="url"
                      value={formData.registration_url || ""}
                      onChange={e => setFormData({ ...formData, registration_url: e.target.value })}
                      className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                      placeholder="https://eventbrite.com/..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Registration Deadline</label>
                      <input
                        type="datetime-local"
                        value={toLocalISOString(formData.registration_deadline)}
                        onChange={e => setFormData({ ...formData, registration_deadline: e.target.value ? new Date(e.target.value) : null })}
                        className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Max Participants</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_participants || ""}
                        onChange={e => setFormData({ ...formData, max_participants: parseInt(e.target.value) || null })}
                        className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "extra" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                  >
                    <option value="draft">Brouillon (Draft)</option>
                    <option value="published">Publié (Published)</option>
                    <option value="registration_open">Inscriptions ouvertes (Registration Open)</option>
                    <option value="full">Complet (Full)</option>
                    <option value="completed">Terminé (Completed)</option>
                    <option value="cancelled">Annulé (Cancelled)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">Visibility</label>
                  <select
                    value={formData.visibility}
                    onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                    className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private (Link only)</option>
                    <option value="admin">Admin Only</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-2">URL Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full border border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest focus:outline-none"
                />
                <p className="text-[10px] text-sage mt-1">Leave empty to auto-generate from title</p>
              </div>
            </div>
          )}
          
        </div>

        {/* Footer Actions */}
        <div className="bg-bone border-t border-forest/15 p-3 sm:p-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
          {/* Destructive actions */}
          <div className="flex gap-2">
            {!isNew && (
              <>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-3 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
                <button
                  onClick={handleDuplicate}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-3 py-2 border border-forest/15 bg-white text-forest hover:bg-bone transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  Duplicate
                </button>
                {formData.slug && (
                  <a
                    href={`/events/${formData.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none px-3 py-2 border border-forest/15 bg-white text-forest hover:bg-bone transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Preview</span>
                  </a>
                )}
              </>
            )}
          </div>
          {/* Primary actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-3 py-2 text-sage hover:text-forest transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 py-2 bg-forest text-bone hover:bg-forest/90 transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {loading ? "Saving..." : "Save Event"}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
