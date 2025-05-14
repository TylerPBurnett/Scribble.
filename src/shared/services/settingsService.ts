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
    toggleApp: 'CommandOrControl+Alt+S'  // canonical
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
    toggleApp?: string;  // canonical property name
    showApp?: string;    // legacy alias, derived programmatically when needed
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
    settings = {                        // create a shallow copy first
      ...settings,
      globalHotkeys: { ...DEFAULT_SETTINGS.globalHotkeys }
    };
    console.log('Added default global hotkeys to settings');
  } else {
    // Migrate from showApp to toggleApp if needed (prioritize toggleApp as canonical)
    if (settings.globalHotkeys.showApp && !settings.globalHotkeys.toggleApp) {
      settings.globalHotkeys.toggleApp = settings.globalHotkeys.showApp;
      console.log('Migrated from showApp to toggleApp (canonical property)');
    }

    // Always ensure showApp is set based on toggleApp for backward compatibility
    if (settings.globalHotkeys.toggleApp) {
      settings.globalHotkeys.showApp = settings.globalHotkeys.toggleApp;
    }
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
  console.log('Syncing settings with main process, global hotkeys:', JSON.stringify(settings.globalHotkeys, null, 2));

  // Create a deep copy to ensure we're not passing references
  const settingsCopy = JSON.parse(JSON.stringify(settings));

  // Log the exact object we're sending to the main process
  console.log('Full settings object being sent to main process:', JSON.stringify(settingsCopy, null, 2));

  // First sync the settings to the main process
  window.settings.syncSettings(settingsCopy as unknown as Record<string, unknown>)
    .then(async success => {
      console.log('Settings synced with main process:', success);

      // Set up acknowledgment listener before sending the update
      const acknowledgmentPromise = new Promise<boolean>((resolve) => {
        // Use type assertion to access the new method
        type SettingsWithAcknowledgement = typeof window.settings & {
          onSettingsUpdateAcknowledged?: (callback: (acknowledged: boolean) => void) => () => void;
        };
        const onSettingsUpdateAcknowledged = (window.settings as SettingsWithAcknowledgement).onSettingsUpdateAcknowledged;

        if (typeof onSettingsUpdateAcknowledged === 'function') {
          const cleanup = onSettingsUpdateAcknowledged((acknowledged: boolean) => {
            console.log('Received settings update acknowledgment:', acknowledged);
            cleanup(); // Remove the listener once we get a response
            resolve(acknowledged);
          });

          // Set a timeout in case we don't get an acknowledgment
          setTimeout(() => {
            cleanup(); // Clean up the listener
            console.warn('No acknowledgment received from main process after 2 seconds');
            resolve(false);
          }, 2000);
        } else {
          // If the function doesn't exist (older app version), resolve immediately
          console.warn('onSettingsUpdateAcknowledged not available, skipping acknowledgment wait');
          resolve(true);
        }
      });

      // After successful sync, notify the main process to update hotkeys
      window.settings.settingsUpdated();
      console.log('Notified main process that settings were updated');

      // Wait for acknowledgment or timeout
      const acknowledged = await acknowledgmentPromise;

      if (!acknowledged) {
        console.warn('Settings update was not acknowledged by main process, verifying manually');
      }

      // Verify settings were saved correctly by explicitly requesting confirmation
      try {
        // Get the updated settings from the main process
        const mainProcessSettings = await window.settings.getMainProcessSettings();
        console.log('Verification - settings in main process after sync:',
          JSON.stringify(mainProcessSettings, null, 2));

        if (mainProcessSettings.globalHotkeys) {
          console.log('Verification - global hotkeys in main process:',
            JSON.stringify(mainProcessSettings.globalHotkeys, null, 2));

          // Compare with what we sent
          const mainHotkeys = mainProcessSettings.globalHotkeys as {
            newNote: string;
            toggleApp?: string;
            showApp?: string;
          };

          const hotkeysMatch =
            mainHotkeys.newNote === settings.globalHotkeys?.newNote &&
            (
              // Check both toggleApp and showApp properties properly
              (settings.globalHotkeys?.toggleApp !== undefined ?
                mainHotkeys.toggleApp === settings.globalHotkeys.toggleApp : true) &&
              (settings.globalHotkeys?.showApp !== undefined ?
                mainHotkeys.showApp === settings.globalHotkeys.showApp : true)
            );

          console.log(`Verification - hotkeys match what we sent: ${hotkeysMatch}`);

          // If hotkeys don't match, try to resync them
          if (!hotkeysMatch) {
            console.warn('Hotkeys in main process do not match what was sent. Attempting to resync...');
            await window.settings.syncSettings(settingsCopy as unknown as Record<string, unknown>);
            window.settings.settingsUpdated();
            console.log('Settings resynced due to verification mismatch');
          }
        } else {
          console.error('Verification - No global hotkeys found in main process settings!');
        }
      } catch (error) {
        console.error('Error verifying settings in main process:', error);
      }
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
  const updatedSettings = { ...storedSettings };

  // If we have global hotkeys in the main process but not in localStorage, use those
  if (mainProcessSettings.globalHotkeys && (!storedSettings.globalHotkeys || Object.keys(storedSettings.globalHotkeys).length === 0)) {
    console.log('Using global hotkeys from main process');
    updatedSettings.globalHotkeys = {
      ...(mainProcessSettings.globalHotkeys as {
        newNote: string;
        toggleApp?: string;
        showApp?: string;
      })
    };

    // Migrate from showApp to toggleApp if needed
    if (updatedSettings.globalHotkeys.showApp && !updatedSettings.globalHotkeys.toggleApp) {
      updatedSettings.globalHotkeys.toggleApp = updatedSettings.globalHotkeys.showApp;
    }
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
    updatedSettings.globalHotkeys = { ...DEFAULT_SETTINGS.globalHotkeys };
    needsUpdate = true;
  } else {
    // Migrate from showApp to toggleApp if needed (prioritize toggleApp as canonical)
    if (updatedSettings.globalHotkeys.showApp && !updatedSettings.globalHotkeys.toggleApp) {
      console.log('Migrating from showApp to toggleApp (canonical property)');
      updatedSettings.globalHotkeys.toggleApp = updatedSettings.globalHotkeys.showApp;
      needsUpdate = true;
    }

    // Always ensure showApp is set based on toggleApp for backward compatibility
    if (updatedSettings.globalHotkeys.toggleApp &&
        (!updatedSettings.globalHotkeys.showApp ||
         updatedSettings.globalHotkeys.showApp !== updatedSettings.globalHotkeys.toggleApp)) {
      console.log('Setting showApp based on toggleApp for backward compatibility');
      updatedSettings.globalHotkeys.showApp = updatedSettings.globalHotkeys.toggleApp;
      needsUpdate = true;
    }
  }

  // Save updated settings if needed
  if (needsUpdate) {
    console.log('Updating settings:', updatedSettings);
    saveSettings(updatedSettings);
    return updatedSettings;
  }

  return storedSettings;
};
