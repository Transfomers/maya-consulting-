import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Image as ImageIcon, Trash2, AlertCircle, Loader2, Plus, GripVertical } from 'lucide-react';
import api from '@/lib/api';
import AdministratorsManager from '@/components/admin/AdministratorsManager';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'organization', label: 'Organization' },
  { id: 'branding', label: 'Branding' },
  { id: 'homepage', label: 'Homepage' },
  { id: 'contact', label: 'Contact' },
  { id: 'social', label: 'Social Media' },
  { id: 'seo', label: 'SEO' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'footer', label: 'Footer' },
  { id: 'email', label: 'Email' },
  { id: 'media', label: 'Media' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'security', label: 'Security' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'legal', label: 'Legal' },
  { id: 'administrators', label: 'Administrators' }
];

const DEFAULT_SETTINGS = {
  general: {
    site_name: 'CAP Entrepreneurs', site_tagline: '', description: '',
    website_url: 'https://capentrepreneurs.org', default_language: 'en',
    timezone: 'UTC', date_format: 'DD/MM/YYYY', default_currency: 'XAF'
  },
  organization: {
    org_name: 'CAP Entrepreneurs', legal_name: '', description: '',
    address: '', city: '', country: '', postal_code: '',
    phone: '', email: '', website: '', registration_info: ''
  },
  branding: {
    logo_main: '', logo_light: '', logo_dark: '', favicon: '',
    primary_color: '#1C4532', secondary_color: '#A3B18A',
    accent_color: '#E07A5F', bg_color: '#FDFCFD'
  },
  homepage: {
    hero_title: '', hero_subtitle: '', hero_description: '',
    hero_image: '', primary_cta_text: '', primary_cta_url: '',
    secondary_cta_text: '', secondary_cta_url: '',
    about_title: '', about_description: '', about_image: '',
    about_cta_text: '', about_cta_url: '',
    stats_json: '[]',
    programs_title: '', programs_description: '', programs_count: '3',
    events_title: '', events_description: '', events_count: '3', events_upcoming_only: 'true',
    events_cta_text: '', events_cta_url: '',
    testimonials_enabled: 'true', testimonials_title: '',
    newsletter_enabled: 'true', newsletter_title: '', newsletter_description: '', newsletter_cta_text: ''
  },
  contact: {
    main_email: '', support_email: '', phone: '', whatsapp: '',
    address: '', business_hours: '',
    form_enabled: 'true', form_recipient: '', form_success_msg: '', form_error_msg: ''
  },
  social: {
    facebook_url: '', instagram_url: '', linkedin_url: '',
    twitter_url: '', youtube_url: '', tiktok_url: '', whatsapp_url: ''
  },
  seo: {
    meta_title: '', meta_description: '', keywords: '',
    og_image: '', twitter_image: '', favicon: '',
    robots: 'index', google_analytics_id: ''
  },
  navigation: {
    menu_json: '[]'
  },
  footer: {
    description: '', logo: '', copyright_text: '© 2026 CAP Entrepreneurs. All rights reserved.',
    privacy_url: '', terms_url: ''
  },
  email: {
    sender_name: 'CAP Entrepreneurs', sender_email: 'noreply@capentrepreneurs.org',
    reply_to: '', form_recipient: '', newsletter_recipient: '',
    smtp_host: '', smtp_port: '', smtp_username: '', smtp_password: '', smtp_encryption: 'tls'
  },
  media: {
    max_upload_size: '5', allowed_types: 'image/jpeg,image/png,image/webp,application/pdf',
    auto_optimize: 'true', default_quality: '80'
  },
  integrations: {
    google_maps_api_key: '', mailchimp_api_key: '', stripe_public_key: '', stripe_secret_key: ''
  },
  security: {
    session_timeout: '120', allowed_domains: ''
  },
  maintenance: {
    enabled: 'false', title: 'Under Maintenance', message: 'We will be back shortly.', contact_info: ''
  },
  legal: {
    privacy_policy_url: '', terms_conditions_url: '', cookie_policy_url: '', legal_notice_url: ''
  }
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
  const [initialSettings, setInitialSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // For JSON arrays (stats, navigation)
  const [navItems, setNavItems] = useState([]);
  const [statItems, setStatItems] = useState([]);

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
        
        try {
          setNavItems(JSON.parse(newSettings.navigation.menu_json || '[]'));
        } catch(e) {}
        try {
          setStatItems(JSON.parse(newSettings.homepage.stats_json || '[]'));
        } catch(e) {}

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
      // Sync JSON arrays back to string before comparing
      const current = { ...settings };
      current.navigation.menu_json = JSON.stringify(navItems);
      current.homepage.stats_json = JSON.stringify(statItems);
      setIsDirty(JSON.stringify(current) !== initialSettings);
    }
  }, [settings, navItems, statItems, initialSettings]);

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
      const current = { ...settings };
      current.navigation.menu_json = JSON.stringify(navItems);
      current.homepage.stats_json = JSON.stringify(statItems);

      Object.keys(current).forEach(category => {
        Object.keys(current[category]).forEach(key => {
          if (key === 'smtp_password' && current[category][key] === '••••••••••••') return;
          if (key === 'stripe_secret_key' && current[category][key] === '••••••••••••') return;
          if (key === 'google_maps_api_key' && current[category][key] === '••••••••••••') return;
          if (key === 'mailchimp_api_key' && current[category][key] === '••••••••••••') return;

          payload.push({
            key,
            value: current[category][key],
            category
          });
        });
      });
      
      await api.put('/admin/settings', { settings: payload });
      setInitialSettings(JSON.stringify(current));
      setIsDirty(false);
      toast.success("Settings saved successfully.");
    } catch (error) {
      toast.error("Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-bone">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading text-forest">Settings</h1>
          <p className="text-sage mt-1">Manage global configuration for CAP Entrepreneurs.</p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-amber-600 flex items-center gap-1 text-sm font-bold">
              <AlertCircle className="h-4 w-4" /> Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 bg-forest text-bone px-6 py-2.5 font-bold uppercase tracking-widest text-sm hover:bg-forest/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col space-x-1 md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap text-left px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
                  activeTab === tab.id
                    ? 'bg-forest/5 text-forest border-l-2 border-forest'
                    : 'text-sage hover:text-forest hover:bg-forest/5 border-l-2 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 bg-white p-8 border border-forest/15 shadow-sm min-h-[600px]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">General Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Site Name" value={settings.general.site_name} onChange={v => handleChange('general', 'site_name', v)} />
                <Input label="Site Tagline" value={settings.general.site_tagline} onChange={v => handleChange('general', 'site_tagline', v)} />
                <Input label="Website URL" type="url" value={settings.general.website_url} onChange={v => handleChange('general', 'website_url', v)} />
                <Select label="Default Language" value={settings.general.default_language} onChange={v => handleChange('general', 'default_language', v)} options={[{val:'en', label:'English'}, {val:'fr', label:'French'}]} />
                <Input label="Timezone" value={settings.general.timezone} onChange={v => handleChange('general', 'timezone', v)} />
                <Select label="Date Format" value={settings.general.date_format} onChange={v => handleChange('general', 'date_format', v)} options={[{val:'DD/MM/YYYY', label:'DD/MM/YYYY'}, {val:'MM/DD/YYYY', label:'MM/DD/YYYY'}, {val:'YYYY-MM-DD', label:'YYYY-MM-DD'}]} />
                <Input label="Default Currency" value={settings.general.default_currency} onChange={v => handleChange('general', 'default_currency', v)} />
              </div>
              <Textarea label="Site Description" value={settings.general.description} onChange={v => handleChange('general', 'description', v)} />
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Organization Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Organization Name" value={settings.organization.org_name} onChange={v => handleChange('organization', 'org_name', v)} />
                <Input label="Legal Name" value={settings.organization.legal_name} onChange={v => handleChange('organization', 'legal_name', v)} />
                <Input label="Phone" value={settings.organization.phone} onChange={v => handleChange('organization', 'phone', v)} />
                <Input label="Email" type="email" value={settings.organization.email} onChange={v => handleChange('organization', 'email', v)} />
                <Input label="Website" type="url" value={settings.organization.website} onChange={v => handleChange('organization', 'website', v)} />
                <Input label="Registration Info" value={settings.organization.registration_info} onChange={v => handleChange('organization', 'registration_info', v)} />
              </div>
              <Textarea label="Address" value={settings.organization.address} onChange={v => handleChange('organization', 'address', v)} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input label="City" value={settings.organization.city} onChange={v => handleChange('organization', 'city', v)} />
                <Input label="Country" value={settings.organization.country} onChange={v => handleChange('organization', 'country', v)} />
                <Input label="Postal Code" value={settings.organization.postal_code} onChange={v => handleChange('organization', 'postal_code', v)} />
              </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Branding Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ImageUpload label="Main Logo" value={settings.branding.logo_main} onChange={v => handleChange('branding', 'logo_main', v)} />
                <ImageUpload label="Favicon" value={settings.branding.favicon} onChange={v => handleChange('branding', 'favicon', v)} />
                <ImageUpload label="Light Logo (for dark backgrounds)" value={settings.branding.logo_light} onChange={v => handleChange('branding', 'logo_light', v)} />
                <ImageUpload label="Dark Logo (for light backgrounds)" value={settings.branding.logo_dark} onChange={v => handleChange('branding', 'logo_dark', v)} />
              </div>

              <h3 className="text-lg font-bold font-heading text-forest pt-6 border-t border-forest/10">Brand Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Input label="Primary Color" type="color" value={settings.branding.primary_color} onChange={v => handleChange('branding', 'primary_color', v)} />
                <Input label="Secondary Color" type="color" value={settings.branding.secondary_color} onChange={v => handleChange('branding', 'secondary_color', v)} />
                <Input label="Accent Color" type="color" value={settings.branding.accent_color} onChange={v => handleChange('branding', 'accent_color', v)} />
                <Input label="Background Color" type="color" value={settings.branding.bg_color} onChange={v => handleChange('branding', 'bg_color', v)} />
              </div>
            </div>
          )}

          {activeTab === 'homepage' && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Homepage Content</h2>
              
              <div className="space-y-4">
                <h3 className="font-bold text-forest uppercase tracking-wider text-sm">Hero Section</h3>
                <Input label="Hero Title" value={settings.homepage.hero_title} onChange={v => handleChange('homepage', 'hero_title', v)} />
                <Input label="Hero Subtitle" value={settings.homepage.hero_subtitle} onChange={v => handleChange('homepage', 'hero_subtitle', v)} />
                <Textarea label="Hero Description" value={settings.homepage.hero_description} onChange={v => handleChange('homepage', 'hero_description', v)} />
                <ImageUpload label="Hero Background Image" value={settings.homepage.hero_image} onChange={v => handleChange('homepage', 'hero_image', v)} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Primary CTA Text" value={settings.homepage.primary_cta_text} onChange={v => handleChange('homepage', 'primary_cta_text', v)} />
                  <Input label="Primary CTA URL" value={settings.homepage.primary_cta_url} onChange={v => handleChange('homepage', 'primary_cta_url', v)} />
                  <Input label="Secondary CTA Text" value={settings.homepage.secondary_cta_text} onChange={v => handleChange('homepage', 'secondary_cta_text', v)} />
                  <Input label="Secondary CTA URL" value={settings.homepage.secondary_cta_url} onChange={v => handleChange('homepage', 'secondary_cta_url', v)} />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-forest/10">
                <h3 className="font-bold text-forest uppercase tracking-wider text-sm">About Section</h3>
                <Input label="About Title" value={settings.homepage.about_title} onChange={v => handleChange('homepage', 'about_title', v)} />
                <Textarea label="About Description" value={settings.homepage.about_description} onChange={v => handleChange('homepage', 'about_description', v)} />
                <ImageUpload label="About Image" value={settings.homepage.about_image} onChange={v => handleChange('homepage', 'about_image', v)} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="CTA Text" value={settings.homepage.about_cta_text} onChange={v => handleChange('homepage', 'about_cta_text', v)} />
                  <Input label="CTA URL" value={settings.homepage.about_cta_url} onChange={v => handleChange('homepage', 'about_cta_url', v)} />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-forest/10">
                <h3 className="font-bold text-forest uppercase tracking-wider text-sm">Statistics</h3>
                <div className="space-y-3">
                  {statItems.map((stat, idx) => (
                    <div key={idx} className="flex gap-4 items-end bg-bone p-4 border border-forest/15">
                      <div className="flex-1">
                        <Input label="Number" value={stat.number} onChange={v => { const n = [...statItems]; n[idx].number = v; setStatItems(n); }} />
                      </div>
                      <div className="flex-1">
                        <Input label="Label" value={stat.label} onChange={v => { const n = [...statItems]; n[idx].label = v; setStatItems(n); }} />
                      </div>
                      <div className="flex-1">
                        <Input label="Icon (Lucide name)" value={stat.icon} onChange={v => { const n = [...statItems]; n[idx].icon = v; setStatItems(n); }} />
                      </div>
                      <button onClick={() => setStatItems(statItems.filter((_, i) => i !== idx))} className="p-2.5 bg-red-100 text-red-600 mb-1 border border-red-200">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setStatItems([...statItems, { number: '', label: '', icon: '' }])} className="flex items-center gap-2 text-forest font-bold text-sm hover:underline">
                    <Plus className="h-4 w-4" /> Add Statistic
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'navigation' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Main Navigation</h2>
              <p className="text-sm text-sage">Manage the links that appear in the public website header.</p>
              
              <div className="space-y-3">
                {navItems.map((nav, idx) => (
                  <div key={idx} className="flex gap-4 items-start bg-bone p-4 border border-forest/15 relative">
                    <div className="mt-8 cursor-move text-sage">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Label" value={nav.label} onChange={v => { const n = [...navItems]; n[idx].label = v; setNavItems(n); }} />
                        <Input label="URL" value={nav.url} onChange={v => { const n = [...navItems]; n[idx].url = v; setNavItems(n); }} />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-forest font-bold">
                        <input type="checkbox" checked={nav.new_tab} onChange={e => { const n = [...navItems]; n[idx].new_tab = e.target.checked; setNavItems(n); }} className="accent-forest" />
                        Open in new tab
                      </label>
                    </div>
                    <button onClick={() => setNavItems(navItems.filter((_, i) => i !== idx))} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button onClick={() => setNavItems([...navItems, { label: '', url: '', new_tab: false }])} className="flex items-center gap-2 text-forest font-bold text-sm hover:underline">
                  <Plus className="h-4 w-4" /> Add Menu Item
                </button>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Contact Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Main Email" type="email" value={settings.contact.main_email} onChange={v => handleChange('contact', 'main_email', v)} />
                <Input label="Support Email" type="email" value={settings.contact.support_email} onChange={v => handleChange('contact', 'support_email', v)} />
                <Input label="Phone Number" value={settings.contact.phone} onChange={v => handleChange('contact', 'phone', v)} />
                <Input label="WhatsApp Number" value={settings.contact.whatsapp} onChange={v => handleChange('contact', 'whatsapp', v)} />
              </div>
              <Textarea label="Address" value={settings.contact.address} onChange={v => handleChange('contact', 'address', v)} />
              <Textarea label="Business Hours (e.g., Monday 08:00 - 17:00)" value={settings.contact.business_hours} onChange={v => handleChange('contact', 'business_hours', v)} />
              
              <div className="pt-6 border-t border-forest/10 space-y-4">
                <h3 className="font-bold text-forest uppercase tracking-wider text-sm">Contact Form Settings</h3>
                <Select label="Enable Contact Form" value={settings.contact.form_enabled} onChange={v => handleChange('contact', 'form_enabled', v)} options={[{val:'true', label:'Enabled'}, {val:'false', label:'Disabled'}]} />
                <Input label="Recipient Email" type="email" value={settings.contact.form_recipient} onChange={v => handleChange('contact', 'form_recipient', v)} />
                <Input label="Success Message" value={settings.contact.form_success_msg} onChange={v => handleChange('contact', 'form_success_msg', v)} />
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Social Media URLs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Facebook" type="url" value={settings.social.facebook_url} onChange={v => handleChange('social', 'facebook_url', v)} />
                <Input label="Instagram" type="url" value={settings.social.instagram_url} onChange={v => handleChange('social', 'instagram_url', v)} />
                <Input label="LinkedIn" type="url" value={settings.social.linkedin_url} onChange={v => handleChange('social', 'linkedin_url', v)} />
                <Input label="X / Twitter" type="url" value={settings.social.twitter_url} onChange={v => handleChange('social', 'twitter_url', v)} />
                <Input label="YouTube" type="url" value={settings.social.youtube_url} onChange={v => handleChange('social', 'youtube_url', v)} />
                <Input label="TikTok" type="url" value={settings.social.tiktok_url} onChange={v => handleChange('social', 'tiktok_url', v)} />
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">SEO Configuration</h2>
              <Input label="Default Meta Title" value={settings.seo.meta_title} onChange={v => handleChange('seo', 'meta_title', v)} />
              <Textarea label="Default Meta Description" value={settings.seo.meta_description} onChange={v => handleChange('seo', 'meta_description', v)} />
              <Input label="Keywords (comma separated)" value={settings.seo.keywords} onChange={v => handleChange('seo', 'keywords', v)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUpload label="Default OG Image" value={settings.seo.og_image} onChange={v => handleChange('seo', 'og_image', v)} />
                <ImageUpload label="Twitter/X Image" value={settings.seo.twitter_image} onChange={v => handleChange('seo', 'twitter_image', v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select label="Robots" value={settings.seo.robots} onChange={v => handleChange('seo', 'robots', v)} options={[{val:'index', label:'Index & Follow'}, {val:'noindex', label:'No Index'}]} />
                <Input label="Google Analytics ID" value={settings.seo.google_analytics_id} onChange={v => handleChange('seo', 'google_analytics_id', v)} />
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Email Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Sender Name" value={settings.email.sender_name} onChange={v => handleChange('email', 'sender_name', v)} />
                <Input label="Sender Email" type="email" value={settings.email.sender_email} onChange={v => handleChange('email', 'sender_email', v)} />
                <Input label="Reply-To Email" type="email" value={settings.email.reply_to} onChange={v => handleChange('email', 'reply_to', v)} />
              </div>

              <h3 className="font-bold text-forest uppercase tracking-wider text-sm pt-6 border-t border-forest/10">SMTP Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="SMTP Host" value={settings.email.smtp_host} onChange={v => handleChange('email', 'smtp_host', v)} />
                <Input label="SMTP Port" value={settings.email.smtp_port} onChange={v => handleChange('email', 'smtp_port', v)} />
                <Input label="SMTP Username" value={settings.email.smtp_username} onChange={v => handleChange('email', 'smtp_username', v)} />
                <Input label="SMTP Password" type="password" value={settings.email.smtp_password} onChange={v => handleChange('email', 'smtp_password', v)} placeholder={settings.email.smtp_password === '••••••••••••' ? '••••••••••••' : ''} />
                <Select label="SMTP Encryption" value={settings.email.smtp_encryption} onChange={v => handleChange('email', 'smtp_encryption', v)} options={[{val:'tls', label:'TLS'}, {val:'ssl', label:'SSL'}, {val:'none', label:'None'}]} />
              </div>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Footer Content</h2>
              <Textarea label="Footer Description" value={settings.footer.description} onChange={v => handleChange('footer', 'description', v)} />
              <ImageUpload label="Footer Logo (Optional)" value={settings.footer.logo} onChange={v => handleChange('footer', 'logo', v)} />
              <Input label="Copyright Text" value={settings.footer.copyright_text} onChange={v => handleChange('footer', 'copyright_text', v)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Privacy Policy URL" type="url" value={settings.footer.privacy_url} onChange={v => handleChange('footer', 'privacy_url', v)} />
                <Input label="Terms & Conditions URL" type="url" value={settings.footer.terms_url} onChange={v => handleChange('footer', 'terms_url', v)} />
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Media Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Maximum Upload Size (MB)" type="number" value={settings.media.max_upload_size} onChange={v => handleChange('media', 'max_upload_size', v)} />
                <Input label="Allowed Mime Types" value={settings.media.allowed_types} onChange={v => handleChange('media', 'allowed_types', v)} />
                <Select label="Auto Optimize Images" value={settings.media.auto_optimize} onChange={v => handleChange('media', 'auto_optimize', v)} options={[{val:'true', label:'Enabled'}, {val:'false', label:'Disabled'}]} />
                <Input label="Default Image Quality (1-100)" type="number" value={settings.media.default_quality} onChange={v => handleChange('media', 'default_quality', v)} />
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">API Integrations</h2>
              <div className="space-y-4">
                <Input label="Google Maps API Key" type="password" value={settings.integrations.google_maps_api_key} onChange={v => handleChange('integrations', 'google_maps_api_key', v)} placeholder={settings.integrations.google_maps_api_key === '••••••••••••' ? '••••••••••••' : ''} />
                <Input label="Mailchimp API Key" type="password" value={settings.integrations.mailchimp_api_key} onChange={v => handleChange('integrations', 'mailchimp_api_key', v)} placeholder={settings.integrations.mailchimp_api_key === '••••••••••••' ? '••••••••••••' : ''} />
                <Input label="Stripe Public Key" value={settings.integrations.stripe_public_key} onChange={v => handleChange('integrations', 'stripe_public_key', v)} />
                <Input label="Stripe Secret Key" type="password" value={settings.integrations.stripe_secret_key} onChange={v => handleChange('integrations', 'stripe_secret_key', v)} placeholder={settings.integrations.stripe_secret_key === '••••••••••••' ? '••••••••••••' : ''} />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Security Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Session Timeout (Minutes)" type="number" value={settings.security.session_timeout} onChange={v => handleChange('security', 'session_timeout', v)} />
                <Input label="Allowed Admin Domains (comma separated)" value={settings.security.allowed_domains} onChange={v => handleChange('security', 'allowed_domains', v)} placeholder="e.g., capentrepreneurs.org" />
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Maintenance Mode</h2>
              <Select label="Maintenance Mode" value={settings.maintenance.enabled} onChange={v => handleChange('maintenance', 'enabled', v)} options={[{val:'true', label:'ON'}, {val:'false', label:'OFF'}]} />
              <Input label="Maintenance Title" value={settings.maintenance.title} onChange={v => handleChange('maintenance', 'title', v)} />
              <Textarea label="Maintenance Message" value={settings.maintenance.message} onChange={v => handleChange('maintenance', 'message', v)} />
              <Input label="Contact Information" value={settings.maintenance.contact_info} onChange={v => handleChange('maintenance', 'contact_info', v)} />
              
              {settings.maintenance.enabled === 'true' && (
                <div className="mt-8 p-6 bg-bone border border-forest/20 text-center">
                  <h4 className="font-heading font-black text-2xl text-forest mb-2">{settings.maintenance.title}</h4>
                  <p className="text-sage">{settings.maintenance.message}</p>
                  <p className="text-sm text-forest mt-4 font-bold">{settings.maintenance.contact_info}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-heading text-forest border-b border-forest/10 pb-3">Legal Pages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Privacy Policy URL" type="url" value={settings.legal.privacy_policy_url} onChange={v => handleChange('legal', 'privacy_policy_url', v)} />
                <Input label="Terms & Conditions URL" type="url" value={settings.legal.terms_conditions_url} onChange={v => handleChange('legal', 'terms_conditions_url', v)} />
                <Input label="Cookie Policy URL" type="url" value={settings.legal.cookie_policy_url} onChange={v => handleChange('legal', 'cookie_policy_url', v)} />
                <Input label="Legal Notice URL" type="url" value={settings.legal.legal_notice_url} onChange={v => handleChange('legal', 'legal_notice_url', v)} />
              </div>
            </div>
          )}

          {activeTab === 'administrators' && (
            <AdministratorsManager />
          )}

        </main>
      </div>
    </div>
  );
}

const Input = ({ label, type = 'text', value, onChange, placeholder = '' }) => (
  <div className="space-y-1">
    <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-none border border-forest/20 px-3 py-2 text-forest focus:border-forest focus:outline-none bg-white transition-colors"
    />
  </div>
);

const Textarea = ({ label, value, onChange, rows = 3 }) => (
  <div className="space-y-1">
    <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-none border border-forest/20 px-3 py-2 text-forest focus:border-forest focus:outline-none bg-white transition-colors resize-none"
    />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div className="space-y-1">
    <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-none border border-forest/20 px-3 py-2 text-forest focus:border-forest focus:outline-none bg-white transition-colors"
    >
      {options.map(opt => (
        <option key={opt.val} value={opt.val}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const ImageUpload = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="block text-xs font-bold uppercase tracking-wider text-sage mb-1">{label}</label>
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Media ID or URL"
        className="w-full rounded-none border border-forest/20 px-3 py-2 text-forest focus:border-forest focus:outline-none bg-white transition-colors"
      />
      {value && (
        <div className="h-10 w-10 border border-forest/20 bg-bone flex items-center justify-center shrink-0">
          <img src={value} alt="" className="max-h-8 max-w-8 object-contain" />
        </div>
      )}
    </div>
  </div>
);
