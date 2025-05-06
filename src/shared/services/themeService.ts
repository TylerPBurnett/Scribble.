import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings, getSettings, saveSettings } from './settingsService';
import { applyThemeToDocument } from '../utils/themeUtils';

// Define the available themes
export type ThemeName = 'dim' | 'dark' | 'light';

// Theme interface
export interface Theme {
  name: ThemeName;
  label: string;
  description: string;
  // Preview colors for the theme selector
  preview: {
    background: string;
    foreground: string;
    primary: string;
    card: string;
  };
}

// Define the themes
export const themes: Record<ThemeName, Theme> = {
  dim: {
    name: 'dim',
    label: 'Dim',
    description: 'The original Scribble theme with muted colors',
    preview: {
      background: '#282a36',
      foreground: '#f8f8f2',
      primary: '#f59e0b',
      card: '#21222c',
    },
  },
  dark: {
    name: 'dark',
    label: 'Dark',
    description: 'A true dark theme with deeper blacks and higher contrast',
    preview: {
      background: '#121212',
      foreground: '#ffffff',
      primary: '#f59e0b',
      card: '#1a1a1a',
    },
  },
  light: {
    name: 'light',
    label: 'Light',
    description: 'A light theme with white background and dark text',
    preview: {
      background: '#ffffff',
      foreground: '#333333',
      primary: '#f59e0b',
      card: '#f8f8f8',
    },
  },
};

// Theme context interface
interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: Record<ThemeName, Theme>;
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

// Theme provider component
export const ThemeProvider = ({
  children,
  initialSettings
}: ThemeProviderProps) => {
  // Get the initial theme from settings or use 'dim' as default
  const [theme, setThemeState] = useState<ThemeName>(
    (initialSettings?.theme as ThemeName) || 'dim'
  );

  // Force a re-render when theme changes
  const [updateKey, setUpdateKey] = useState(0);

  // Apply the theme to the document
  useEffect(() => {
    console.log('Applying theme:', theme, 'updateKey:', updateKey);

    // Apply theme to document using the utility function
    applyThemeToDocument(theme);

    // Log the current classes on the document element for debugging
    console.log('Document classes after update:', document.documentElement.className);
    console.log('Document data-theme attribute:', document.documentElement.getAttribute('data-theme'));
    console.log('Body classes after update:', document.body.className);

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

    // Force a small timeout to ensure the CSS has time to apply
    setTimeout(() => {
      console.log('Theme application complete');
    }, 100);
  }, [theme, updateKey]);

  // Listen for theme changes from the main process
  useEffect(() => {
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
    // Force a re-render after a short delay
    setTimeout(() => {
      setUpdateKey(prev => prev + 1);
    }, 50);
  };

  const value = {
    theme,
    setTheme,
    themes
  };

  return React.createElement(
    ThemeContext.Provider,
    { value },
    children
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);
