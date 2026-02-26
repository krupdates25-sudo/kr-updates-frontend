import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  // Theme is driven by Site Settings (backend). Sync from document when it changes.
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    const check = () => {
      setResolvedTheme(root.classList.contains('dark') ? 'dark' : 'light');
    };
    const observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    check();
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {};
  const setSpecificTheme = () => {};

  const value = {
    theme: resolvedTheme,
    resolvedTheme,
    setTheme: setSpecificTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
