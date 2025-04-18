// Default settings
const DEFAULT_SETTINGS = {
  saveLocation: '', // Will be set to app data directory by default in main process
  autoSave: true,
  autoSaveInterval: 5, // seconds
  darkMode: true,
};

// Settings type
export interface AppSettings {
  saveLocation: string;
  autoSave: boolean;
  autoSaveInterval: number;
  darkMode: boolean;
}

// Get settings from localStorage
export const getSettings = (): AppSettings => {
  const settingsJson = localStorage.getItem('app_settings');
  console.log('Raw settings from localStorage:', settingsJson);
  if (!settingsJson) {
    console.log('No settings found, returning defaults');
    return DEFAULT_SETTINGS;
  }

  try {
    const settings = JSON.parse(settingsJson);
    console.log('Parsed settings:', settings);
    return settings;
  } catch (error) {
    console.error('Error parsing settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
};

// Event system for settings changes
type SettingsChangeListener = (settings: AppSettings) => void;
const settingsChangeListeners: SettingsChangeListener[] = [];

// Subscribe to settings changes
export const subscribeToSettingsChanges = (listener: SettingsChangeListener): () => void => {
  settingsChangeListeners.push(listener);

  // Return unsubscribe function
  return () => {
    const index = settingsChangeListeners.indexOf(listener);
    if (index !== -1) {
      settingsChangeListeners.splice(index, 1);
    }
  };
};

// Notify all listeners of settings changes
const notifySettingsChange = (settings: AppSettings): void => {
  settingsChangeListeners.forEach(listener => listener(settings));
};

// Save settings to localStorage
export const saveSettings = (settings: AppSettings): void => {
  console.log('Saving settings to localStorage:', settings);
  localStorage.setItem('app_settings', JSON.stringify(settings));

  // Notify listeners of the change
  notifySettingsChange(settings);
};

// Initialize settings
export const initSettings = async (): Promise<AppSettings> => {
  console.log('Initializing settings...');
  // Get settings from localStorage
  const storedSettings = getSettings();
  console.log('Stored settings:', storedSettings);

  // If no save location is set, get the default from the main process
  if (!storedSettings.saveLocation) {
    console.log('No save location found, getting default...');
    try {
      const defaultLocation = await window.settings.getDefaultSaveLocation();
      console.log('Default save location:', defaultLocation);
      const updatedSettings = {
        ...storedSettings,
        saveLocation: defaultLocation,
      };
      console.log('Updated settings with default location:', updatedSettings);
      saveSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error getting default save location:', error);
      return storedSettings;
    }
  } else {
    console.log('Using existing save location:', storedSettings.saveLocation);
  }

  return storedSettings;
};
