import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings, getSettings, saveSettings } from '../services/settingsService';
import { ThemeName, themes } from '../styles/theme';

// Theme context interface
interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: typeof themes;
}

// Create the theme context
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dim',
  setTheme: () => {},
  themes,
});

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
  initialSettings?: AppSettings;
}

/**
 * Theme provider component
 * Manages the application theme and provides theme context to child components
 */
export const ThemeProvider = ({
  children,
  initialSettings
}: ThemeProviderProps) => {
  // Get the initial theme from settings or use 'dim' as default
  const [theme, setThemeState] = useState<ThemeName>(
    (initialSettings?.theme as ThemeName) || 'dim'
  );

  // Apply the theme to the document
  useEffect(() => {
    console.log('Applying theme:', theme);
    
    // Apply theme class to document element
    document.documentElement.classList.remove('dim', 'dark', 'light');
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply theme-specific class
    document.documentElement.classList.remove('theme-dim', 'theme-dark', 'theme-light');
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Update settings if needed
    const currentSettings = getSettings();
    if (currentSettings.theme !== theme) {
      console.log('Saving theme to settings:', theme);
      // Save the theme to settings
      saveSettings({
        ...currentSettings,
        theme,
      });

      // If this is the settings window, notify the main window to update its theme
      if (window.settings && typeof window.ipcRenderer !== 'undefined') {
        try {
          console.log('Notifying main process of theme change:', theme);
          // Notify the main process that the theme has changed
          window.ipcRenderer.send('theme-changed', theme);
        } catch (error) {
          console.error('Error notifying theme change:', error);
        }
      }
    }
  }, [theme]);

  // Listen for theme changes from the main process
  useEffect(() => {
    if (!window.ipcRenderer) return;
    
    const handleThemeChanged = (_event: any, newTheme: ThemeName) => {
      console.log('Theme changed from main process:', newTheme);
      setThemeState(newTheme);
    };

    // Add event listener
    window.ipcRenderer.on('theme-changed', handleThemeChanged);

    // Clean up
    return () => {
      window.ipcRenderer.off('theme-changed', handleThemeChanged);
    };
  }, []);

  // Set theme function
  const setTheme = (newTheme: ThemeName) => {
    console.log('Setting theme to:', newTheme);
    setThemeState(newTheme);
  };

  const value = {
    theme,
    setTheme,
    themes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);
