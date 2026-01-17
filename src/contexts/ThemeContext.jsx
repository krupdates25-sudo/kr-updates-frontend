import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  // Force light theme always - no dark mode or system theme
  const [theme] = useState('light');
  const [resolvedTheme] = useState('light');

  // Apply light theme to document on mount and continuously enforce it
  useEffect(() => {
    const enforceLightMode = () => {
      const root = document.documentElement;
      root.classList.remove('dark');
      root.classList.add('light');

      // Also set data attribute for additional targeting
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';

      // Force body background to light mode
      document.body.className = 'light-mode';
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#111827';

      // Store in localStorage
      localStorage.setItem('theme', 'light');
      localStorage.setItem('resolvedTheme', 'light');
    };

    // Enforce immediately
    enforceLightMode();

    // Set up observer to watch for any dark mode class additions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target.classList.contains('dark')) {
            enforceLightMode();
          }
        }
      });
    });

    // Observe document and body for class changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Also enforce on any DOM changes
    const interval = setInterval(enforceLightMode, 100);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Disabled theme toggle functions - always light theme
  const toggleTheme = () => {
    // No-op - theme is always light
  };

  const setSpecificTheme = (newTheme) => {
    // No-op - theme is always light
  };

  const value = {
    theme: 'light',
    resolvedTheme: 'light',
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
