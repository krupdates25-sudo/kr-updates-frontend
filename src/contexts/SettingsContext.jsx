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

  // Fetch settings on mount
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.getSettings();
      if (response.success && response.data) {
        setSettings(response.data);

        // Update favicon if available
        if (response.data.siteFavicon) {
          updateFavicon(response.data.siteFavicon);
        }

        // Update page title if site name is available
        if (response.data.siteName) {
          document.title = response.data.siteName;
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
  }, []);

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
