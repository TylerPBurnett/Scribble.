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
  if (!settingsJson) return DEFAULT_SETTINGS;
  
  try {
    return JSON.parse(settingsJson);
  } catch (error) {
    console.error('Error parsing settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
};

// Save settings to localStorage
export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem('app_settings', JSON.stringify(settings));
};

// Initialize settings
export const initSettings = async (): Promise<AppSettings> => {
  // Get settings from localStorage
  const storedSettings = getSettings();
  
  // If no save location is set, get the default from the main process
  if (!storedSettings.saveLocation) {
    try {
      const defaultLocation = await window.settings.getDefaultSaveLocation();
      const updatedSettings = {
        ...storedSettings,
        saveLocation: defaultLocation,
      };
      saveSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error getting default save location:', error);
      return storedSettings;
    }
  }
  
  return storedSettings;
};
