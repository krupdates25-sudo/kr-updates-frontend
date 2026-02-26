import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Loader,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Search,
  Wrench,
  Eye,
  EyeOff,
  Palette,
  Type,
} from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import CloudinaryUpload from '../components/common/CloudinaryUpload';
import settingsService from '../services/settingsService';
import { useSettings } from '../contexts/SettingsContext';

const SOCIAL_PLATFORMS = [
  {
    platform: 'facebook',
    label: 'Facebook',
    Icon: Facebook,
    iconClassName: 'text-blue-600',
    placeholder: 'https://facebook.com/yourpage',
  },
  {
    platform: 'twitter',
    label: 'Twitter',
    Icon: Twitter,
    iconClassName: 'text-blue-400',
    placeholder: 'https://twitter.com/yourhandle',
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    Icon: Instagram,
    iconClassName: 'text-pink-600',
    placeholder: 'https://instagram.com/yourhandle',
  },
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    Icon: Linkedin,
    iconClassName: 'text-blue-700',
    placeholder: 'https://linkedin.com/company/yourcompany',
  },
  {
    platform: 'youtube',
    label: 'YouTube',
    Icon: Youtube,
    iconClassName: 'text-red-600',
    placeholder: 'https://youtube.com/@yourchannel',
  },
];

const normalizeSocialProfiles = (data) => {
  const existing = Array.isArray(data?.socialProfiles) ? data.socialProfiles : [];
  const byPlatform = new Map(
    existing
      .filter((p) => p && p.platform)
      .map((p) => [String(p.platform).toLowerCase(), p])
  );

  return SOCIAL_PLATFORMS.map(({ platform }) => {
    const p = byPlatform.get(platform);
    const url =
      p?.url ??
      data?.socialLinks?.[platform] ??
      '';

    const enabled = typeof p?.enabled === 'boolean' ? p.enabled : !!url;
    const placements = Array.isArray(p?.placements) ? p.placements : [];

    return {
      platform,
      url,
      enabled,
      placements,
    };
  });
};

const socialProfilesToLinks = (profiles) => {
  const links = {};
  for (const p of profiles || []) {
    if (!p?.platform) continue;
    links[p.platform] = p.url || '';
  }
  return links;
};

const Settings = () => {
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    siteLogo: '',
    siteFavicon: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    socialProfiles: SOCIAL_PLATFORMS.map(({ platform }) => ({
      platform,
      url: '',
      enabled: false,
      placements: [],
    })),
    seo: {
      metaTitle: '',
      metaDescription: '',
      metaKeywords: [],
    },
    maintenanceMode: false,
    maintenanceMessage: '',
    theme: 'light',
    typography: {
      fontFamily: 'Inter',
      headingFontFamily: 'Playfair Display',
      baseFontSize: '16px',
    },
  });

  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettings();
      if (response.success && response.data) {
        const socialProfiles = normalizeSocialProfiles(response.data);
        setSettings({
          siteName: response.data.siteName || '',
          siteDescription: response.data.siteDescription || '',
          siteLogo: response.data.siteLogo || '',
          siteFavicon: response.data.siteFavicon || '',
          contactEmail: response.data.contactEmail || '',
          contactPhone: response.data.contactPhone || '',
          address: response.data.address || '',
          socialProfiles,
          seo: {
            metaTitle: response.data.seo?.metaTitle || '',
            metaDescription: response.data.seo?.metaDescription || '',
            metaKeywords: response.data.seo?.metaKeywords || [],
          },
          maintenanceMode: response.data.maintenanceMode || false,
          maintenanceMessage: response.data.maintenanceMessage || '',
          theme: response.data.theme || 'light',
          typography: {
            fontFamily: response.data.typography?.fontFamily || 'Inter',
            headingFontFamily: response.data.typography?.headingFontFamily || 'Playfair Display',
            baseFontSize: response.data.typography?.baseFontSize || '16px',
          },
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setErrorMessage('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setSettings((prev) => ({
          ...prev,
          [parent]: {
            ...(prev[parent] || {}),
            [child]: type === 'checkbox' ? checked : value,
          },
        }));
      } else if (parts.length === 3) {
        const [parent, mid, child] = parts;
        setSettings((prev) => ({
          ...prev,
          [parent]: {
            ...(prev[parent] || {}),
            [mid]: {
              ...(prev[parent]?.[mid] || {}),
              [child]: type === 'checkbox' ? checked : value,
            },
          },
        }));
      }
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const updateSocialProfile = (platform, patch) => {
    setSettings((prev) => ({
      ...prev,
      socialProfiles: prev.socialProfiles.map((p) =>
        p.platform === platform ? { ...p, ...patch } : p
      ),
    }));
  };

  const setSocialPlacement = (platform, placement, isEnabled) => {
    setSettings((prev) => ({
      ...prev,
      socialProfiles: prev.socialProfiles.map((p) => {
        if (p.platform !== platform) return p;
        const placements = Array.isArray(p.placements) ? p.placements : [];
        const next = isEnabled
          ? Array.from(new Set([...placements, placement]))
          : placements.filter((x) => x !== placement);
        return { ...p, placements: next };
      }),
    }));
  };

  const handleLogoUpload = (url) => {
    setSettings((prev) => ({
      ...prev,
      siteLogo: url,
    }));
  };

  const handleLogoRemove = () => {
    setSettings((prev) => ({
      ...prev,
      siteLogo: '',
    }));
  };

  const handleFaviconUpload = (url) => {
    setSettings((prev) => ({
      ...prev,
      siteFavicon: url,
    }));
  };

  const handleFaviconRemove = () => {
    setSettings((prev) => ({
      ...prev,
      siteFavicon: '',
    }));
  };

  const handleAddKeyword = () => {
    const keywords = Array.isArray(settings.seo?.metaKeywords) ? settings.seo.metaKeywords : [];
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setSettings((prev) => {
        const prevSeo = prev.seo || {};
        const prevKeywords = Array.isArray(prevSeo.metaKeywords) ? prevSeo.metaKeywords : [];
        return {
          ...prev,
          seo: {
            ...prevSeo,
            metaKeywords: [...prevKeywords, trimmed],
          },
        };
      });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword) => {
    setSettings((prev) => {
      const prevSeo = prev.seo || {};
      const prevKeywords = Array.isArray(prevSeo.metaKeywords) ? prevSeo.metaKeywords : [];
      return {
        ...prev,
        seo: {
          ...prevSeo,
          metaKeywords: prevKeywords.filter((k) => k !== keyword),
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');

      const payload = {
        ...settings,
        // Ensure seo.metaKeywords is always an array for the API
        seo: {
          ...settings.seo,
          metaKeywords: Array.isArray(settings.seo?.metaKeywords) ? settings.seo.metaKeywords : [],
        },
        // Keep legacy fields in sync (backend also syncs, but this helps older code)
        socialLinks: socialProfilesToLinks(settings.socialProfiles),
      };

      const response = await settingsService.updateSettings(payload);

      if (response.success) {
        setSuccessMessage('Settings updated successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
        // Refresh settings context to update logo and favicon immediately
        await refreshSettings();
      } else {
        setErrorMessage(response.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setErrorMessage(
        error.response?.data?.message ||
          'Failed to update settings. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const FONT_OPTIONS = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Playfair Display',
    'Merriweather',
    'Noto Sans Devanagari',
  ];

  return (
    <PageLayout activeTab="settings" contentClassName="bg-gray-50 dark:bg-gray-50" defaultSidebarOpen={false}>
      <div className="p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-50 min-h-screen">
        <div className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <SettingsIcon className="w-8 h-8 text-blue-600 dark:text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">
                  Site Settings
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-600">
                Manage your site information, branding, and configuration
              </p>
            </div>

            {/* Messages */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-50 border border-green-200 dark:border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-700" />
                <p className="text-green-800 dark:text-green-800">
                  {successMessage}
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-50 border border-red-200 dark:border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-700" />
                <p className="text-red-800 dark:text-red-800">{errorMessage}</p>
              </div>
            )}

            {/* Settings Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="bg-white dark:bg-white rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Basic Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      Site Name *
                    </label>
                    <input
                      type="text"
                      name="siteName"
                      value={settings.siteName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                      placeholder="Your Site Name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      Site Description
                    </label>
                    <textarea
                      name="siteDescription"
                      value={settings.siteDescription}
                      onChange={handleInputChange}
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                      placeholder="A brief description of your site"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                      {settings.siteDescription.length}/500 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Theme - White-labeling */}
              <div className="bg-white dark:bg-white rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 mb-6 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Theme
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-600 mb-4">
                  Choose the default theme for your website. This applies across the entire frontend.
                </p>
                <div className="flex flex-wrap gap-4">
                  {['light', 'dark', 'system'].map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={option}
                        checked={settings.theme === option}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, theme: e.target.value }))
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-700 capitalize">
                        {option === 'system' ? 'System (follow device)' : option}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Typography - White-labeling */}
              <div className="bg-white dark:bg-white rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 mb-6 flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Typography
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-600 mb-4">
                  Set fonts and base font size for the whole website. Changes apply across the frontend.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      Body font
                    </label>
                    <select
                      name="typography.fontFamily"
                      value={settings.typography.fontFamily}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      Heading font
                    </label>
                    <select
                      name="typography.headingFontFamily"
                      value={settings.typography.headingFontFamily}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      Base font size
                    </label>
                    <select
                      name="typography.baseFontSize"
                      value={settings.typography.baseFontSize}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                    >
                      {['14px', '15px', '16px', '17px', '18px'].map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Logo & Favicon */}
              <div className="bg-white dark:bg-white rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 mb-6 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Branding
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      Site Logo
                    </label>
                    <CloudinaryUpload
                      type="image"
                      onUpload={handleLogoUpload}
                      currentImage={settings.siteLogo}
                      onRemove={handleLogoRemove}
                    />
                    {settings.siteLogo && (
                      <div className="mt-2">
                        <img
                          src={settings.siteLogo}
                          alt="Site Logo"
                          className="h-20 object-contain rounded"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      Favicon
                    </label>
                    <CloudinaryUpload
                      type="image"
                      onUpload={handleFaviconUpload}
                      currentImage={settings.siteFavicon}
                      onRemove={handleFaviconRemove}
                    />
                    {settings.siteFavicon && (
                      <div className="mt-2">
                        <img
                          src={settings.siteFavicon}
                          alt="Favicon"
                          className="h-16 w-16 object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white dark:bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 mb-6 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={settings.contactEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                      placeholder="contact@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={settings.contactPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={settings.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white dark:bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 mb-6">
                  Social Media Links
                </h2>

                <div className="space-y-5">
                  {SOCIAL_PLATFORMS.map(({ platform, label, Icon, iconClassName, placeholder }) => {
                    const profile =
                      settings.socialProfiles.find((p) => p.platform === platform) ||
                      { platform, url: '', enabled: false, placements: [] };

                    const inFollowSection = Array.isArray(profile.placements)
                      ? profile.placements.includes('dashboard_follow')
                      : false;

                    return (
                      <div
                        key={platform}
                        className="rounded-lg border border-gray-200 dark:border-gray-200 p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${iconClassName}`} />
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-900">
                              {label}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-700">
                              <input
                                type="checkbox"
                                checked={!!profile.enabled}
                                onChange={(e) =>
                                  updateSocialProfile(platform, { enabled: e.target.checked })
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              Enabled
                            </label>

                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-700">
                              <input
                                type="checkbox"
                                checked={inFollowSection}
                                onChange={(e) =>
                                  setSocialPlacement(
                                    platform,
                                    'dashboard_follow',
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              Show in “Follow” section
                            </label>
                          </div>
                        </div>

                        <input
                          type="url"
                          value={profile.url || ''}
                          onChange={(e) =>
                            updateSocialProfile(platform, { url: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                          placeholder={placeholder}
                        />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-600">
                          Tip: To hide this icon everywhere it’s used, turn off <b>Enabled</b>.
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEO Settings */}
              <div className="bg-white dark:bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 mb-6 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  SEO Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      name="seo.metaTitle"
                      value={settings.seo?.metaTitle ?? ''}
                      onChange={handleInputChange}
                      maxLength={60}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                      placeholder="SEO Title (max 60 characters)"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                      {(settings.seo?.metaTitle ?? '').length}/60 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      name="seo.metaDescription"
                      value={settings.seo?.metaDescription ?? ''}
                      onChange={handleInputChange}
                      rows={3}
                      maxLength={160}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                      placeholder="SEO Description (max 160 characters)"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                      {(settings.seo?.metaDescription ?? '').length}/160 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                      Meta Keywords
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddKeyword();
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                        placeholder="Add keyword and press Enter"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(settings.seo?.metaKeywords) ? settings.seo.metaKeywords : []).map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-100 text-blue-800 dark:text-blue-800 rounded-full text-sm"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="hover:text-blue-600 dark:hover:text-blue-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="bg-white dark:bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-900 mb-6 flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Maintenance Mode
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-700 flex items-center gap-2">
                      {settings.maintenanceMode ? (
                        <EyeOff className="w-4 h-4 text-red-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-green-600" />
                      )}
                      Enable Maintenance Mode
                    </label>
                  </div>

                  {settings.maintenanceMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-700 mb-2">
                        Maintenance Message
                      </label>
                      <textarea
                        name="maintenanceMessage"
                        value={settings.maintenanceMessage}
                        onChange={handleInputChange}
                        rows={3}
                        maxLength={500}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                        placeholder="We'll be back soon! Site is under maintenance."
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-600 mt-1">
                        {settings.maintenanceMessage.length}/500 characters
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={fetchSettings}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-300 text-gray-700 dark:text-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
