import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import settingsService from '../services/settingsService';

const SettingsContext = createContext({});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Apply theme and typography from settings to the document (white-labeling)
  const applyThemeAndTypography = useCallback((data) => {
    const root = document.documentElement;
    const theme = data?.theme || 'light';

    const applySystem = () => {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (dark) {
        root.classList.add('dark');
        root.classList.remove('light');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }
    };

    // Theme: light | dark | system
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else if (theme === 'system') {
      applySystem();
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', applySystem);
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    // Typography: CSS variables for whole frontend
    const t = data?.typography;
    if (t) {
      root.style.setProperty('--font-body', t.fontFamily ? `"${t.fontFamily}", sans-serif` : 'Inter, sans-serif');
      root.style.setProperty('--font-heading', t.headingFontFamily ? `"${t.headingFontFamily}", serif` : '"Playfair Display", serif');
      root.style.setProperty('--text-base', t.baseFontSize || '16px');
    }
  }, []);

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.getSettings();
      if (response.success && response.data) {
        const data = response.data;
        setSettings(data);

        // Apply theme and typography from backend (white-labeling)
        applyThemeAndTypography(data);

        // Update favicon if available
        if (data.siteFavicon) {
          updateFavicon(data.siteFavicon);
        }

        // Update page title if site name is available
        if (data.siteName) {
          document.title = data.siteName;
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.message);
      // Set default settings if fetch fails
      setSettings({
        siteName: 'News Blog',
        siteLogo: null,
        siteFavicon: null,
      });
    } finally {
      setLoading(false);
    }
  }, [applyThemeAndTypography]);

  // Update favicon in document head
  const updateFavicon = (faviconUrl) => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach((link) => link.remove());

    // Add new favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = faviconUrl;
    document.head.appendChild(link);
  };

  // Refresh settings
  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const value = useMemo(
    () => ({
      settings,
      loading,
      error,
      refreshSettings,
    }),
    [settings, loading, error, refreshSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
};
