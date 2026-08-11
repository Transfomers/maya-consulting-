import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Image as ImageIcon, Trash2, Upload, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'branding', label: 'Branding' },
  { id: 'seo', label: 'SEO' },
  { id: 'social', label: 'Social Media' },
  { id: 'contact', label: 'Contact' },
  { id: 'email', label: 'Email Configuration' },
  { id: 'system', label: 'System' }
];

const DEFAULT_SETTINGS = {
  general: {
    org_name: '', website_name: '', website_url: '', description: '',
    default_language: 'en', timezone: 'UTC'
  },
  branding: {
    site_title: '', site_tagline: '', primary_color: '#0D0E0D',
    secondary_color: '#FDFCFD', accent_color: '#D8C3A5', logo_url: '', favicon_url: ''
  },
  seo: {
    meta_title: '', meta_description: '', keywords: '',
    og_title: '', og_description: '', og_image: '',
    twitter_title: '', twitter_description: '', twitter_image: '',
    robots_index: 'index', robots_follow: 'follow',
    google_analytics_id: '', gsc_verification: ''
  },
  social: {
    facebook_url: '', instagram_url: '', linkedin_url: '',
    twitter_url: '', youtube_url: '', whatsapp_url: '', tiktok_url: ''
  },
  contact: {
    main_email: '', support_email: '', phone: '',
    whatsapp: '', address: '', city: '', country: '',
    google_maps_url: ''
  },
  email: {
    sender_name: '', sender_email: '', reply_to: '',
    smtp_host: '', smtp_port: '', smtp_username: '',
    smtp_password: '', smtp_encryption: 'tls', email_notifications_enabled: 'true'
  },
  system: {
    maintenance_mode: 'false', maintenance_message: '',
    registration_enabled: 'false', comments_enabled: 'false',
    newsletter_enabled: 'true', default_pagination: '10',
    date_format: 'YYYY-MM-DD', time_format: 'HH:mm'
  }
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
  const [initialSettings, setInitialSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        const data = res.data;
        
        const newSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        
        data.forEach(item => {
          if (newSettings[item.category] && newSettings[item.category][item.key] !== undefined) {
            newSettings[item.category][item.key] = item.value || '';
          }
        });
        
        setSettings(newSettings);
        setInitialSettings(JSON.stringify(newSettings));
      } catch (error) {
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (initialSettings) {
      setIsDirty(JSON.stringify(settings) !== initialSettings);
    }
  }, [settings, initialSettings]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = [];
      Object.keys(settings).forEach(category => {
        Object.keys(settings[category]).forEach(key => {
          // don't send file urls in bulk update if we manage them separately, 
          // but backend handles it fine (it just overwrites with same value)
          payload.push({
            key,
            value: settings[category][key],
            category
          });
        });
      });
      
      await api.put('/admin/settings', { settings: payload });
      setInitialSettings(JSON.stringify(settings));
      setIsDirty(false);
      toast.success("Settings saved successfully.");
    } catch (error) {
      toast.error("Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (type, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.post(`/admin/settings/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      handleChange('branding', `${type}_url`, res.data.value);
      toast.success(`${type} uploaded successfully.`);
    } catch (err) {
      toast.error(`Failed to upload ${type}.`);
    }
  };

  const handleFileDelete = async (type) => {
    try {
      await api.delete(`/admin/settings/${type}`);
      handleChange('branding', `${type}_url`, '');
      toast.success(`${type} removed successfully.`);
    } catch (err) {
      toast.error(`Failed to remove ${type}.`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sage" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-forest">Settings</h1>
          <p className="text-sage mt-1">Manage global configuration for CAP Entrepreneurs.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-forest text-bone px-4 py-2 rounded-md font-medium hover:bg-forest/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {isDirty && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-3 text-amber-800">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">You have unsaved changes. Please save before leaving.</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-forest text-bone'
                    : 'text-forest hover:bg-forest/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-white p-6 rounded-lg border border-forest/15 shadow-sm">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-forest border-b border-forest/10 pb-3">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Organization Name" value={settings.general.org_name} onChange={(v) => handleChange('general', 'org_name', v)} />
                <Input label="Website Name" value={settings.general.website_name} onChange={(v) => handleChange('general', 'website_name', v)} />
                <Input label="Website URL" type="url" value={settings.general.website_url} onChange={(v) => handleChange('general', 'website_url', v)} />
                <Input label="Default Language" value={settings.general.default_language} onChange={(v) => handleChange('general', 'default_language', v)} />
                <Input label="Timezone" value={settings.general.timezone} onChange={(v) => handleChange('general', 'timezone', v)} />
              </div>
              <Textarea label="Description" value={settings.general.description} onChange={(v) => handleChange('general', 'description', v)} rows={3} />
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-forest border-b border-forest/10 pb-3">Branding Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-forest">Site Logo</label>
                  <div className="border-2 border-dashed border-forest/20 rounded-lg p-6 flex flex-col items-center justify-center relative bg-bone/30">
                    {settings.branding.logo_url ? (
                      <div className="relative group w-full flex justify-center">
                        <img src={settings.branding.logo_url} alt="Logo" className="max-h-32 object-contain" />
                        <button onClick={() => handleFileDelete('logo')} className="absolute top-0 right-0 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-sage/50" />
                        <div className="mt-4 flex text-sm text-sage">
                          <label className="relative cursor-pointer rounded-md font-medium text-forest focus-within:outline-none hover:text-maple">
                            <span>Upload a file</span>
                            <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileUpload('logo', e)} />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Favicon Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-forest">Site Favicon</label>
                  <div className="border-2 border-dashed border-forest/20 rounded-lg p-6 flex flex-col items-center justify-center relative bg-bone/30">
                    {settings.branding.favicon_url ? (
                      <div className="relative group w-full flex justify-center">
                        <img src={settings.branding.favicon_url} alt="Favicon" className="max-h-16 object-contain" />
                        <button onClick={() => handleFileDelete('favicon')} className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-sage/50" />
                        <div className="mt-4 flex text-sm text-sage">
                          <label className="relative cursor-pointer rounded-md font-medium text-forest focus-within:outline-none hover:text-maple">
                            <span>Upload a favicon</span>
                            <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileUpload('favicon', e)} />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Input label="Site Title" value={settings.branding.site_title} onChange={(v) => handleChange('branding', 'site_title', v)} />
                <Input label="Site Tagline" value={settings.branding.site_tagline} onChange={(v) => handleChange('branding', 'site_tagline', v)} />
                <Input label="Primary Color" type="color" value={settings.branding.primary_color} onChange={(v) => handleChange('branding', 'primary_color', v)} />
                <Input label="Secondary Color" type="color" value={settings.branding.secondary_color} onChange={(v) => handleChange('branding', 'secondary_color', v)} />
                <Input label="Accent Color" type="color" value={settings.branding.accent_color} onChange={(v) => handleChange('branding', 'accent_color', v)} />
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-forest border-b border-forest/10 pb-3">SEO Settings</h2>
              <div className="space-y-4">
                <InputWithCounter label="Meta Title" max={60} value={settings.seo.meta_title} onChange={(v) => handleChange('seo', 'meta_title', v)} />
                <TextareaWithCounter label="Meta Description" max={160} value={settings.seo.meta_description} onChange={(v) => handleChange('seo', 'meta_description', v)} rows={3} />
                <Input label="Keywords (comma separated)" value={settings.seo.keywords} onChange={(v) => handleChange('seo', 'keywords', v)} />
              </div>

              <h3 className="text-lg font-bold text-forest pt-4">Open Graph</h3>
              <div className="space-y-4">
                <Input label="OG Title" value={settings.seo.og_title} onChange={(v) => handleChange('seo', 'og_title', v)} />
                <Textarea label="OG Description" value={settings.seo.og_description} onChange={(v) => handleChange('seo', 'og_description', v)} rows={2} />
                <Input label="OG Image URL" value={settings.seo.og_image} onChange={(v) => handleChange('seo', 'og_image', v)} />
              </div>

              <h3 className="text-lg font-bold text-forest pt-4">Search Engines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select label="Robots Index" value={settings.seo.robots_index} onChange={(v) => handleChange('seo', 'robots_index', v)} options={[{val:'index', label:'Index'}, {val:'noindex', label:'No Index'}]} />
                <Select label="Robots Follow" value={settings.seo.robots_follow} onChange={(v) => handleChange('seo', 'robots_follow', v)} options={[{val:'follow', label:'Follow'}, {val:'nofollow', label:'No Follow'}]} />
                <Input label="Google Analytics ID" value={settings.seo.google_analytics_id} onChange={(v) => handleChange('seo', 'google_analytics_id', v)} />
                <Input label="Google Search Console" value={settings.seo.gsc_verification} onChange={(v) => handleChange('seo', 'gsc_verification', v)} />
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-forest border-b border-forest/10 pb-3">Social Media Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Facebook URL" type="url" value={settings.social.facebook_url} onChange={(v) => handleChange('social', 'facebook_url', v)} />
                <Input label="Instagram URL" type="url" value={settings.social.instagram_url} onChange={(v) => handleChange('social', 'instagram_url', v)} />
                <Input label="LinkedIn URL" type="url" value={settings.social.linkedin_url} onChange={(v) => handleChange('social', 'linkedin_url', v)} />
                <Input label="X/Twitter URL" type="url" value={settings.social.twitter_url} onChange={(v) => handleChange('social', 'twitter_url', v)} />
                <Input label="YouTube URL" type="url" value={settings.social.youtube_url} onChange={(v) => handleChange('social', 'youtube_url', v)} />
                <Input label="WhatsApp URL" type="url" value={settings.social.whatsapp_url} onChange={(v) => handleChange('social', 'whatsapp_url', v)} />
                <Input label="TikTok URL" type="url" value={settings.social.tiktok_url} onChange={(v) => handleChange('social', 'tiktok_url', v)} />
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-forest border-b border-forest/10 pb-3">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Main Email" type="email" value={settings.contact.main_email} onChange={(v) => handleChange('contact', 'main_email', v)} />
                <Input label="Support Email" type="email" value={settings.contact.support_email} onChange={(v) => handleChange('contact', 'support_email', v)} />
                <Input label="Phone Number" value={settings.contact.phone} onChange={(v) => handleChange('contact', 'phone', v)} />
                <Input label="WhatsApp Number" value={settings.contact.whatsapp} onChange={(v) => handleChange('contact', 'whatsapp', v)} />
                <Input label="City" value={settings.contact.city} onChange={(v) => handleChange('contact', 'city', v)} />
                <Input label="Country" value={settings.contact.country} onChange={(v) => handleChange('contact', 'country', v)} />
              </div>
              <Textarea label="Address" value={settings.contact.address} onChange={(v) => handleChange('contact', 'address', v)} rows={3} />
              <Input label="Google Maps URL" type="url" value={settings.contact.google_maps_url} onChange={(v) => handleChange('contact', 'google_maps_url', v)} />
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-forest border-b border-forest/10 pb-3">Email Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Sender Name" value={settings.email.sender_name} onChange={(v) => handleChange('email', 'sender_name', v)} />
                <Input label="Sender Email" type="email" value={settings.email.sender_email} onChange={(v) => handleChange('email', 'sender_email', v)} />
                <Input label="Reply-To Email" type="email" value={settings.email.reply_to} onChange={(v) => handleChange('email', 'reply_to', v)} />
                <Select label="Enable Notifications" value={settings.email.email_notifications_enabled} onChange={(v) => handleChange('email', 'email_notifications_enabled', v)} options={[{val:'true', label:'Yes'}, {val:'false', label:'No'}]} />
              </div>

              <h3 className="text-lg font-bold text-forest pt-4">SMTP Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="SMTP Host" value={settings.email.smtp_host} onChange={(v) => handleChange('email', 'smtp_host', v)} />
                <Input label="SMTP Port" value={settings.email.smtp_port} onChange={(v) => handleChange('email', 'smtp_port', v)} />
                <Input label="SMTP Username" value={settings.email.smtp_username} onChange={(v) => handleChange('email', 'smtp_username', v)} />
                <Input label="SMTP Password" type="password" value={settings.email.smtp_password} onChange={(v) => handleChange('email', 'smtp_password', v)} placeholder={settings.email.smtp_password === '••••••••••••' ? '••••••••••••' : ''} />
                <Select label="SMTP Encryption" value={settings.email.smtp_encryption} onChange={(v) => handleChange('email', 'smtp_encryption', v)} options={[{val:'tls', label:'TLS'}, {val:'ssl', label:'SSL'}, {val:'none', label:'None'}]} />
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-forest border-b border-forest/10 pb-3">System Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select label="Maintenance Mode" value={settings.system.maintenance_mode} onChange={(v) => handleChange('system', 'maintenance_mode', v)} options={[{val:'true', label:'Enabled'}, {val:'false', label:'Disabled'}]} />
                <Input label="Default Pagination Size" type="number" value={settings.system.default_pagination} onChange={(v) => handleChange('system', 'default_pagination', v)} />
                <Select label="Registration Enabled" value={settings.system.registration_enabled} onChange={(v) => handleChange('system', 'registration_enabled', v)} options={[{val:'true', label:'Yes'}, {val:'false', label:'No'}]} />
                <Select label="Comments Enabled" value={settings.system.comments_enabled} onChange={(v) => handleChange('system', 'comments_enabled', v)} options={[{val:'true', label:'Yes'}, {val:'false', label:'No'}]} />
                <Input label="Date Format" value={settings.system.date_format} onChange={(v) => handleChange('system', 'date_format', v)} placeholder="YYYY-MM-DD" />
                <Input label="Time Format" value={settings.system.time_format} onChange={(v) => handleChange('system', 'time_format', v)} placeholder="HH:mm" />
              </div>
              <Textarea label="Maintenance Message" value={settings.system.maintenance_message} onChange={(v) => handleChange('system', 'maintenance_message', v)} rows={3} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const Input = ({ label, type = 'text', value, onChange, placeholder = '' }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-forest">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-forest/20 px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-white"
    />
  </div>
);

const Textarea = ({ label, value, onChange, rows = 3 }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-forest">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-md border border-forest/20 px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-white"
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-forest">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-forest/20 px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-white"
    >
      {options.map(opt => (
        <option key={opt.val} value={opt.val}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const InputWithCounter = ({ label, max, value, onChange }) => (
  <div className="space-y-1">
    <div className="flex justify-between">
      <label className="block text-sm font-medium text-forest">{label}</label>
      <span className={`text-xs ${value.length > max ? 'text-red-500' : 'text-sage'}`}>
        {value.length} / {max}
      </span>
    </div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-forest/20 px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-white"
    />
  </div>
);

const TextareaWithCounter = ({ label, max, value, onChange, rows = 3 }) => (
  <div className="space-y-1">
    <div className="flex justify-between">
      <label className="block text-sm font-medium text-forest">{label}</label>
      <span className={`text-xs ${value.length > max ? 'text-red-500' : 'text-sage'}`}>
        {value.length} / {max}
      </span>
    </div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-md border border-forest/20 px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-white"
    />
  </div>
);
