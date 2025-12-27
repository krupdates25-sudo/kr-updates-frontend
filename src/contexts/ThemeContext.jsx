import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  // Force light theme always - no dark mode or system theme
  const [theme] = useState('light');
  const [resolvedTheme] = useState('light');

  // Apply light theme to document on mount
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');

    // Also set data attribute for additional targeting
    root.setAttribute('data-theme', 'light');

    // Force body background to light mode
    document.body.className = 'light-mode';

    // Store in localStorage
    localStorage.setItem('theme', 'light');
    localStorage.setItem('resolvedTheme', 'light');
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
