import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');

  // Initialize theme from user preferences or localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const userTheme = user?.theme;

    if (userTheme) {
      setTheme(userTheme);
    } else if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('system');
    }
  }, [user?.theme]);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      let finalTheme = theme;

      if (theme === 'system') {
        finalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }

      setResolvedTheme(finalTheme);

      // Apply theme to document
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(finalTheme);

      // Also set data attribute for additional targeting
      root.setAttribute('data-theme', finalTheme);

      // Force body background for immediate visual feedback
      document.body.className =
        finalTheme === 'dark' ? 'dark-mode' : 'light-mode';

      // Debug logging
      console.log('Theme applied:', {
        selectedTheme: theme,
        resolvedTheme: finalTheme,
        documentClasses: root.classList.toString(),
        bodyClass: document.body.className,
      });

      // Store in localStorage
      localStorage.setItem('theme', theme);
      localStorage.setItem('resolvedTheme', finalTheme);
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const setSpecificTheme = (newTheme) => {
    if (['light', 'dark', 'system'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const value = {
    theme,
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
