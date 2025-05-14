import { DEFAULT_HOTKEYS, HotkeyAction } from './hotkeyService';

// Default settings
const DEFAULT_SETTINGS = {
  saveLocation: '', // Will be set to app data directory by default in main process
  autoSave: true,
  autoSaveInterval: 5, // seconds
  theme: 'dim', // Default theme (replaces darkMode)
  hotkeys: DEFAULT_HOTKEYS,
  autoLaunch: false,
  minimizeToTray: true,
  globalHotkeys: {
    newNote: 'CommandOrControl+Alt+N',
    showApp: 'CommandOrControl+Alt+S'
  }
};

// Settings type
export interface AppSettings {
  saveLocation: string;
  autoSave: boolean;
  autoSaveInterval: number;
  theme: string; // Theme name (replaces darkMode)
  darkMode?: boolean; // Kept for backward compatibility
  hotkeys?: Partial<Record<HotkeyAction, string>>;
  autoLaunch?: boolean;
  minimizeToTray?: boolean;
  globalHotkeys?: {
    newNote: string;
    showApp: string;
  };
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

  // Ensure globalHotkeys is properly set
  if (!settings.globalHotkeys) {
    settings.globalHotkeys = DEFAULT_SETTINGS.globalHotkeys;
    console.log('Added default global hotkeys to settings');
  }

  // Save to localStorage
  localStorage.setItem('app_settings', JSON.stringify(settings));
  console.log('Settings saved to localStorage');

  // Update auto-launch setting in the main process
  if (settings.autoLaunch !== undefined) {
    window.settings.setAutoLaunch(settings.autoLaunch)
      .then(success => {
        console.log('Auto-launch setting updated:', success);
      })
      .catch(error => {
        console.error('Error updating auto-launch setting:', error);
      });
  }

  // Sync settings with the main process
  console.log('Syncing settings with main process, global hotkeys:', settings.globalHotkeys);
  window.settings.syncSettings(settings as unknown as Record<string, unknown>)
    .then(success => {
      console.log('Settings synced with main process:', success);

      // After successful sync, notify the main process to update hotkeys
      window.settings.settingsUpdated();
      console.log('Notified main process that settings were updated');
    })
    .catch(error => {
      console.error('Error syncing settings with main process:', error);
    });

  // Notify listeners of the change
  notifySettingsChange(settings);
};

// Initialize settings
export const initSettings = async (): Promise<AppSettings> => {
  console.log('Initializing settings...');
  // Get settings from localStorage
  const storedSettings = getSettings();
  console.log('Stored settings from localStorage:', storedSettings);

  // Try to get settings from the main process
  let mainProcessSettings: Record<string, unknown> = {};
  try {
    mainProcessSettings = await window.settings.getMainProcessSettings();
    console.log('Settings from main process:', mainProcessSettings);
  } catch (error) {
    console.error('Error getting settings from main process:', error);
  }

  let needsUpdate = false;
  let updatedSettings = { ...storedSettings };

  // If we have global hotkeys in the main process but not in localStorage, use those
  if (mainProcessSettings.globalHotkeys && (!storedSettings.globalHotkeys || Object.keys(storedSettings.globalHotkeys).length === 0)) {
    console.log('Using global hotkeys from main process');
    updatedSettings.globalHotkeys = mainProcessSettings.globalHotkeys as {
      newNote: string;
      showApp: string;
    };
    needsUpdate = true;
  }

  // If no save location is set, get the default from the main process
  if (!storedSettings.saveLocation) {
    console.log('No save location found, getting default...');
    try {
      const defaultLocation = await window.settings.getDefaultSaveLocation();
      console.log('Default save location:', defaultLocation);
      updatedSettings.saveLocation = defaultLocation;
      needsUpdate = true;
    } catch (error) {
      console.error('Error getting default save location:', error);
    }
  } else {
    console.log('Using existing save location:', storedSettings.saveLocation);
  }

  // Check auto-launch status
  try {
    const isAutoLaunchEnabled = await window.settings.getAutoLaunch();
    console.log('Auto-launch status:', isAutoLaunchEnabled);

    // If auto-launch setting doesn't match the actual status, update it
    if (storedSettings.autoLaunch !== isAutoLaunchEnabled) {
      updatedSettings.autoLaunch = isAutoLaunchEnabled;
      needsUpdate = true;
    }
  } catch (error) {
    console.error('Error getting auto-launch status:', error);
  }

  // Handle migration from darkMode to theme
  if (updatedSettings.theme === undefined && updatedSettings.darkMode !== undefined) {
    console.log('Migrating from darkMode to theme...');
    // If darkMode is true, use 'dim' theme, otherwise use 'light' theme
    updatedSettings.theme = updatedSettings.darkMode ? 'dim' : 'light';
    needsUpdate = true;
  }

  // Ensure theme is set to a valid value
  if (!updatedSettings.theme || !['dim', 'dark', 'light'].includes(updatedSettings.theme)) {
    console.log('Setting default theme to dim');
    updatedSettings.theme = 'dim';
    needsUpdate = true;
  }

  // Ensure globalHotkeys is set
  if (!updatedSettings.globalHotkeys) {
    console.log('Setting default global hotkeys');
    updatedSettings.globalHotkeys = DEFAULT_SETTINGS.globalHotkeys;
    needsUpdate = true;
  }

  // Save updated settings if needed
  if (needsUpdate) {
    console.log('Updating settings:', updatedSettings);
    saveSettings(updatedSettings);
    return updatedSettings;
  }

  return storedSettings;
};
