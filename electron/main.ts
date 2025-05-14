import { app, BrowserWindow, ipcMain, dialog, screen, Tray, Menu, globalShortcut, nativeImage } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import Store from 'electron-store'
// @ts-expect-error no type definitions available
import AutoLaunch from 'auto-launch'

// Type for settings
interface SettingsType {
  hotkeys?: {
    newNote?: string;
    [key: string]: string | undefined;
  };
  globalHotkeys?: {
    newNote: string;
    showApp: string;
    [key: string]: string;
  };
  [key: string]: unknown;
}

// Create a store for window state
const windowStateStore = new Store({
  name: 'window-state',
  defaults: {
    mainWindow: {
      width: 1200,
      height: 800,
      x: undefined,
      y: undefined,
      isMaximized: false
    }
  }
});

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST



let mainWindow: BrowserWindow | null
let settingsWindow: BrowserWindow | null = null
const noteWindows = new Map<string, BrowserWindow>()
let tray: Tray | null = null
let isQuitting = false

// Create auto launcher
const scribbleAutoLauncher = new AutoLaunch({
  name: 'Scribble',
  path: app.getPath('exe'),
})

function createMainWindow() {
  // Configure window differently based on platform
  const isMac = process.platform === 'darwin'

  // Get stored window state
  const mainWindowState = windowStateStore.get('mainWindow') as {
    width: number;
    height: number;
    x?: number;
    y?: number;
    isMaximized: boolean;
  };

  // Check if the saved position is still on a connected screen
  let validPosition = false;
  if (mainWindowState.x !== undefined && mainWindowState.y !== undefined) {
    const displays = screen.getAllDisplays();
    validPosition = displays.some(display => {
      const bounds = display.bounds;
      return (
        mainWindowState.x! >= bounds.x &&
        mainWindowState.y! >= bounds.y &&
        mainWindowState.x! < bounds.x + bounds.width &&
        mainWindowState.y! < bounds.y + bounds.height
      );
    });
  }

  // Create the browser window with saved state or defaults
  mainWindow = new BrowserWindow({
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: validPosition ? mainWindowState.x : undefined,
    y: validPosition ? mainWindowState.y : undefined,
    minWidth: 250,
    minHeight: 300,
    backgroundColor: '#1a1a1a',
    // Use the new rounded-corner icon
    icon: path.join(process.env.APP_ROOT, 'src/assets/icon2-512.png'),
    title: 'Scribble',
    frame: false,
    // On macOS, use 'hiddenInset' to show the native traffic lights
    // On Windows, use 'hidden' to completely hide the title bar
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    // Additional macOS-specific settings
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Maximize window if it was maximized before
  if (mainWindowState.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  // Save window state on resize, move, maximize, and unmaximize
  const saveWindowState = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const isMaximized = mainWindow.isMaximized();

    // Only update position if the window is not maximized
    if (!isMaximized) {
      const [width, height] = mainWindow.getSize();
      const [x, y] = mainWindow.getPosition();

      windowStateStore.set('mainWindow', {
        width,
        height,
        x,
        y,
        isMaximized
      });
    } else {
      // Just update the maximized state
      windowStateStore.set('mainWindow.isMaximized', isMaximized);
    }
  };

  // Add event listeners to save window state
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('maximize', saveWindowState);
  mainWindow.on('unmaximize', saveWindowState);

  // Save window state before the window is destroyed
  mainWindow.on('close', saveWindowState);

  // Handle close event - minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    // If we're not actually quitting the app, just hide the window
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
      return false
    }
    return true
  })

  // Clean up when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  })

  // Handle minimize event - minimize to tray
  mainWindow.on('minimize', (event: Electron.Event) => {
    event.preventDefault()
    mainWindow?.hide()
  })
}

function createNoteWindow(noteId: string) {
  console.log('Creating note window with ID:', noteId)

  // Check if window already exists
  if (noteWindows.has(noteId)) {
    const existingWindow = noteWindows.get(noteId)
    if (existingWindow) {
      console.log('Window already exists, focusing it')
      existingWindow.focus()
      return existingWindow
    }
  }

  // Create new window
  console.log('Creating new BrowserWindow for note')

  // Get stored note window state or use defaults
  const noteWindowDefaults = windowStateStore.get('noteWindowDefaults', {
    width: 600,
    height: 500
  }) as { width: number; height: number };

  const noteWindow = new BrowserWindow({
    width: noteWindowDefaults.width,
    height: noteWindowDefaults.height,
    minWidth: 250,
    minHeight: 300,
    backgroundColor: '#1a1a1a',
    // Use the new rounded-corner icon
    icon: path.join(process.env.APP_ROOT, 'src/assets/icon2-512.png'),
    title: 'Scribble - Note',
    frame: false,
    // Use 'hidden' for both macOS and Windows to completely hide the title bar
    // This disables the native traffic lights on macOS for note windows only
    titleBarStyle: 'hidden',
    // Completely hide the traffic lights on macOS
    titleBarOverlay: false,
    // Don't show traffic lights at all
    trafficLightPosition: { x: -20, y: -20 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load the note.html file instead of index.html
  let url;
  if (VITE_DEV_SERVER_URL) {
    // In development mode, we need to handle the URL carefully
    // The VITE_DEV_SERVER_URL might be something like http://localhost:5173/
    // We need to make sure we're loading note.html with the noteId parameter
    const baseUrl = VITE_DEV_SERVER_URL.endsWith('/') ?
      VITE_DEV_SERVER_URL :
      `${VITE_DEV_SERVER_URL}/`;
    url = `${baseUrl}note.html?noteId=${noteId}`;
  } else {
    // In production mode, we load the file directly
    url = path.join(RENDERER_DIST, 'note.html');
  }

  console.log('=== Creating Note Window ===');
  console.log('VITE_DEV_SERVER_URL:', VITE_DEV_SERVER_URL);
  console.log('Note ID:', noteId);
  console.log('Loading URL for note window:', VITE_DEV_SERVER_URL ? url : `${url} with query noteId=${noteId}`)

  if (VITE_DEV_SERVER_URL) {
    noteWindow.loadURL(url)
  } else {
    noteWindow.loadFile(url, {
      query: { noteId }
    })
  }



  // Store the window reference
  noteWindows.set(noteId, noteWindow)

  // Add a handler for navigation events (including refreshes)
  noteWindow.webContents.on('will-navigate', (event, url) => {
    console.log(`=== Note window ${noteWindow.id} will navigate to: ${url} ===`);
    console.log('Current noteId associated with this window:', noteId);
    console.log('Is this window still in the noteWindows Map?', noteWindows.has(noteId) && noteWindows.get(noteId) === noteWindow);

    // Only prevent navigation if it's not already to a note.html URL
    const urlObj = new URL(url);
    const isNoteHtml = urlObj.pathname.endsWith('note.html');

    if (!isNoteHtml) {
      // Prevent the default navigation
      event.preventDefault();

      // Instead, reload the window with the noteId parameter
      if (VITE_DEV_SERVER_URL) {
        const baseUrl = VITE_DEV_SERVER_URL.endsWith('/') ?
          VITE_DEV_SERVER_URL :
          `${VITE_DEV_SERVER_URL}/`;
        const newUrl = `${baseUrl}note.html?noteId=${noteId}`;
        console.log('Reloading with URL:', newUrl);
        noteWindow.loadURL(newUrl);
      } else {
        noteWindow.loadFile(path.join(RENDERER_DIST, 'note.html'), {
          query: { noteId }
        });
      }

      console.log('Reloaded window with noteId parameter:', noteId);
    } else {
      // If it's already a note.html URL, make sure it has the noteId parameter
      if (!urlObj.searchParams.has('noteId')) {
        event.preventDefault();
        urlObj.searchParams.set('noteId', noteId);
        noteWindow.loadURL(urlObj.toString());
        console.log('Added noteId parameter to existing note.html URL:', urlObj.toString());
      }
    }
  });

  // Save note window size when closed to use as default for future windows
  noteWindow.on('close', () => {
    // Only save size if the window is not maximized and not destroyed
    if (!noteWindow.isDestroyed() && !noteWindow.isMaximized()) {
      const [width, height] = noteWindow.getSize();
      windowStateStore.set('noteWindowDefaults', { width, height });
    }
  });

  // Clean up when window is closed
  noteWindow.on('closed', () => {
    console.log(`Note window closed: ${noteId}`);
    noteWindows.delete(noteId)
  })

  return noteWindow
}

function createSettingsWindow() {
  // Don't create multiple settings windows
  if (settingsWindow) {
    settingsWindow.focus()
    return settingsWindow
  }

  // Configure window differently based on platform
  const isMac = process.platform === 'darwin'

  // Get stored settings window state or use main window size as default
  const settingsWindowState = windowStateStore.get('settingsWindow', {
    width: 800,
    height: 600,
    x: undefined,
    y: undefined
  }) as { width: number; height: number; x?: number; y?: number };

  // If main window exists, center the settings window relative to it
  let x: number | undefined = settingsWindowState.x;
  let y: number | undefined = settingsWindowState.y;

  if (mainWindow && (x === undefined || y === undefined)) {
    const mainBounds = mainWindow.getBounds();
    const settingsSize = { width: settingsWindowState.width, height: settingsWindowState.height };

    // Center the settings window on the main window
    x = Math.round(mainBounds.x + (mainBounds.width - settingsSize.width) / 2);
    y = Math.round(mainBounds.y + (mainBounds.height - settingsSize.height) / 2);
  }

  settingsWindow = new BrowserWindow({
    width: settingsWindowState.width,
    height: settingsWindowState.height,
    x,
    y,
    minWidth: 250,
    minHeight: 300,
    backgroundColor: '#1a1a1a',
    // Use the new rounded-corner icon
    icon: path.join(process.env.APP_ROOT, 'src/assets/icon2-512.png'),
    title: 'Scribble - Settings',
    parent: mainWindow || undefined,
    modal: false, // Changed to false to allow it to be a full window
    frame: false,
    // On macOS, use 'hiddenInset' to show the native traffic lights
    // On Windows, use 'hidden' to completely hide the title bar
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    // Additional macOS-specific settings
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load the settings.html file instead of index.html
  let url;
  if (VITE_DEV_SERVER_URL) {
    // In development mode, we need to handle the URL carefully
    const baseUrl = VITE_DEV_SERVER_URL.endsWith('/') ?
      VITE_DEV_SERVER_URL :
      `${VITE_DEV_SERVER_URL}/`;
    url = `${baseUrl}settings.html`;
  } else {
    // In production mode, we load the file directly
    url = path.join(RENDERER_DIST, 'settings.html');
  }

  console.log('Loading URL for settings window:', url)

  if (VITE_DEV_SERVER_URL) {
    settingsWindow.loadURL(url)
  } else {
    settingsWindow.loadFile(url)
  }

  // Save window state before closing
  settingsWindow.on('close', () => {
    if (!settingsWindow || settingsWindow.isDestroyed()) return;

    // Save the current window state
    const [width, height] = settingsWindow.getSize();
    const [x, y] = settingsWindow.getPosition();

    windowStateStore.set('settingsWindow', {
      width,
      height,
      x,
      y
    });
  });

  // Clean up when window is closed
  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  return settingsWindow
}

// Create tray icon
function createTray() {
  // Create tray icon
  const iconPath = path.join(process.env.APP_ROOT, 'src/assets/icon-64.png')
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

  tray = new Tray(trayIcon)

  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Scribble',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        } else {
          createMainWindow()
        }
      }
    },
    {
      label: 'New Note',
      click: () => {
        // Generate a unique ID for the new note
        const noteId = `new-${Date.now().toString(36)}`
        createNoteWindow(noteId)

        // Show main window if it's hidden
        if (mainWindow && !mainWindow.isVisible()) {
          mainWindow.show()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        createSettingsWindow()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  // Set tray properties
  tray.setToolTip('Scribble')
  tray.setContextMenu(contextMenu)

  // Show window on tray icon click
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus()
      } else {
        mainWindow.show()
      }
    } else {
      createMainWindow()
    }
  })
}

// Default global hotkeys
const DEFAULT_GLOBAL_HOTKEYS = {
  newNote: 'CommandOrControl+Alt+N',
  showApp: 'CommandOrControl+Alt+S'
};

// Register global hotkeys
function registerGlobalHotkeys() {
  // First, unregister ALL global shortcuts to ensure no old ones remain
  console.log('Unregistering all global shortcuts');
  globalShortcut.unregisterAll();

  // Get settings to check for custom hotkeys
  const settingsStore = new Store({ name: 'settings' });
  const settings = settingsStore.get('settings') as SettingsType || {};

  console.log('Full settings from store:', JSON.stringify(settings, null, 2));

  // Get global hotkeys from settings
  const globalHotkeys = settings.globalHotkeys || DEFAULT_GLOBAL_HOTKEYS;

  // Log the hotkeys we're about to register
  console.log('Registering global hotkeys:', JSON.stringify(globalHotkeys, null, 2));

  // Compare with defaults to see if they're different
  const usingDefaults =
    globalHotkeys.newNote === DEFAULT_GLOBAL_HOTKEYS.newNote &&
    globalHotkeys.showApp === DEFAULT_GLOBAL_HOTKEYS.showApp;

  console.log(`Using default hotkeys: ${usingDefaults}`);

  // Also unregister the default hotkeys explicitly to be extra safe
  try {
    globalShortcut.unregister(DEFAULT_GLOBAL_HOTKEYS.newNote);
    globalShortcut.unregister(DEFAULT_GLOBAL_HOTKEYS.showApp);
  } catch (e) {
    // Ignore errors when unregistering
  }

  // Try to unregister any other potential hotkeys that might be registered
  try {
    // Unregister common variations
    globalShortcut.unregister('CommandOrControl+Alt+N');
    globalShortcut.unregister('CommandOrControl+Alt+S');
    globalShortcut.unregister('Command+Alt+N');
    globalShortcut.unregister('Command+Alt+S');
    globalShortcut.unregister('Control+Alt+N');
    globalShortcut.unregister('Control+Alt+S');
  } catch (e) {
    // Ignore errors when unregistering
  }

  // Register global hotkey for creating a new note
  const newNoteHotkey = globalHotkeys.newNote;
  if (newNoteHotkey) {
    try {
      console.log(`Attempting to register global hotkey for new note: ${newNoteHotkey}`);

      // Ensure the hotkey is properly formatted
      const formattedHotkey = formatAccelerator(newNoteHotkey);
      console.log(`Formatted hotkey for new note: ${formattedHotkey}`);

      const success = globalShortcut.register(formattedHotkey, () => {
        // Generate a unique ID for the new note
        const noteId = `new-${Date.now().toString(36)}`;
        createNoteWindow(noteId);

        // Show main window if it's hidden
        if (mainWindow && !mainWindow.isVisible()) {
          mainWindow.show();
        }
      });

      if (success) {
        console.log(`Successfully registered global hotkey for new note: ${formattedHotkey}`);
      } else {
        console.error(`Failed to register global hotkey for new note: ${formattedHotkey} - registration returned false`);
      }
    } catch (error) {
      console.error(`Error registering global hotkey for new note: ${newNoteHotkey}`, error);
    }
  } else {
    console.log('No new note hotkey defined, skipping registration');
  }

  // Register global hotkey for showing the app
  const showAppHotkey = globalHotkeys.showApp;
  if (showAppHotkey) {
    try {
      console.log(`Attempting to register global hotkey for showing app: ${showAppHotkey}`);

      // Ensure the hotkey is properly formatted
      const formattedHotkey = formatAccelerator(showAppHotkey);
      console.log(`Formatted hotkey for show app: ${formattedHotkey}`);

      const success = globalShortcut.register(formattedHotkey, () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      });

      if (success) {
        console.log(`Successfully registered global hotkey for showing app: ${formattedHotkey}`);
      } else {
        console.error(`Failed to register global hotkey for showing app: ${formattedHotkey} - registration returned false`);
      }
    } catch (error) {
      console.error(`Error registering global hotkey for showing app: ${showAppHotkey}`, error);
    }
  } else {
    console.log('No show app hotkey defined, skipping registration');
  }

  // Check all registered shortcuts
  const allRegisteredShortcuts = [];

  // Check if our hotkeys are registered
  if (newNoteHotkey && globalShortcut.isRegistered(formatAccelerator(newNoteHotkey))) {
    allRegisteredShortcuts.push(formatAccelerator(newNoteHotkey));
  }

  if (showAppHotkey && globalShortcut.isRegistered(formatAccelerator(showAppHotkey))) {
    allRegisteredShortcuts.push(formatAccelerator(showAppHotkey));
  }

  // Also check default hotkeys
  if (globalShortcut.isRegistered(DEFAULT_GLOBAL_HOTKEYS.newNote)) {
    allRegisteredShortcuts.push(DEFAULT_GLOBAL_HOTKEYS.newNote);
  }

  if (globalShortcut.isRegistered(DEFAULT_GLOBAL_HOTKEYS.showApp)) {
    allRegisteredShortcuts.push(DEFAULT_GLOBAL_HOTKEYS.showApp);
  }

  console.log('Currently registered global shortcuts:', allRegisteredShortcuts);
  console.log('Global hotkeys registration complete');
}

// Helper function to ensure hotkeys are properly formatted for Electron's accelerator
function formatAccelerator(hotkey: string): string {
  if (!hotkey) return '';

  // Split the hotkey into parts
  const parts = hotkey.split('+');

  // Sort modifiers to come first
  const modifiers = ['CommandOrControl', 'Command', 'Control', 'Alt', 'Option', 'Shift', 'Meta'];
  parts.sort((a, b) => {
    const aIndex = modifiers.indexOf(a);
    const bIndex = modifiers.indexOf(b);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });

  // Join the parts back together
  return parts.join('+');
}

// Get default save location
function getDefaultSaveLocation() {
  const userDataPath = app.getPath('userData')
  const savePath = path.join(userDataPath, 'Notes')

  // Create directory if it doesn't exist
  if (!fs.existsSync(savePath)) {
    fs.mkdirSync(savePath, { recursive: true })
  }

  return savePath
}

// IPC handlers
ipcMain.handle('open-note', (_, noteId) => {
  console.log('IPC: open-note called with noteId:', noteId)
  const window = createNoteWindow(noteId)
  console.log('Note window created:', window ? 'success' : 'failed')
  return { success: !!window }
})

// Listen for note updates and relay to main window
ipcMain.on('note-updated', (_, noteId) => {
  // Relay the update to the main window if it exists
  if (mainWindow) {
    mainWindow.webContents.send('note-updated', noteId)
  }
})

// Window control handlers
ipcMain.handle('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.minimize()
})

ipcMain.handle('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

ipcMain.handle('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.close()
})

ipcMain.handle('window-move', (event, moveX, moveY) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    const [x, y] = win.getPosition()
    win.setPosition(x + moveX, y + moveY)
  }
})

ipcMain.handle('window-toggle-pin', (event, shouldPin) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    win.setAlwaysOnTop(shouldPin)

    // Find the noteId for this window
    let noteId = null
    for (const [id, noteWin] of noteWindows.entries()) {
      if (noteWin === win) {
        noteId = id
        break
      }
    }

    // Log the pin state change
    console.log(`Window pin state changed for note ${noteId}: ${shouldPin}`)

    return win.isAlwaysOnTop()
  }
  return false
})

ipcMain.handle('window-is-pinned', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    return win.isAlwaysOnTop()
  }
  return false
})

ipcMain.handle('window-set-pin-state', (_, noteId, isPinned) => {
  // Find the window for this note
  const win = noteWindows.get(noteId)
  if (win) {
    win.setAlwaysOnTop(isPinned)
    console.log(`Set window pin state for note ${noteId}: ${isPinned}`)
    return true
  }
  return false
})

ipcMain.handle('create-note', () => {
  // Generate a unique ID for the new note
  const noteId = `new-${Date.now().toString(36)}`
  console.log('IPC: create-note called, generated ID:', noteId)
  const window = createNoteWindow(noteId)
  console.log('New note window created:', window ? 'success' : 'failed')
  return { success: !!window, noteId }
})

ipcMain.handle('create-note-with-id', (_, noteId) => {
  createNoteWindow(noteId)
  return { success: true }
})

ipcMain.handle('get-note-id', (event) => {
  console.log('=== IPC: get-note-id called ===')
  // Find the window that sent this request
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) {
    console.log('No window found for this request')
    return null
  }

  console.log('Window ID:', win.id)
  console.log('Current noteWindows Map size:', noteWindows.size)
  console.log('noteWindows entries:', Array.from(noteWindows.entries()).map(([id, w]) => ({ id, winId: w.id })))

  // Check if this is a note window
  for (const [noteId, noteWin] of noteWindows.entries()) {
    if (noteWin === win) {
      console.log('Found note ID for window:', noteId)
      return noteId
    }
  }

  console.log('This is not a note window')
  return null // This is the main window or an unknown window
})

// Settings IPC handlers
ipcMain.handle('open-settings', () => {
  createSettingsWindow()
  return { success: true }
})

ipcMain.handle('is-settings-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  return win === settingsWindow
})

ipcMain.handle('select-directory', async () => {
  if (!mainWindow && !settingsWindow) return { canceled: true }

  const result = await dialog.showOpenDialog(settingsWindow || mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Save Location'
  })

  return result
})

ipcMain.handle('get-default-save-location', () => {
  return getDefaultSaveLocation()
})

// File operation handlers
ipcMain.handle('save-note-to-file', async (_, noteId, title, content, saveLocation, oldTitle = '') => {
    console.log('Saving note to file:', { noteId, title, saveLocation, oldTitle });
  try {
    // Ensure the directory exists
    if (!fs.existsSync(saveLocation)) {
      fs.mkdirSync(saveLocation, { recursive: true })
    }

    // Create a safe filename from the title or use 'untitled_note' if title is empty
    const safeTitle = title && title.trim() ?
      title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() :
      'untitled_note_' + noteId.substring(0, 8)

    console.log('Creating filename from title:', { title, safeTitle })

    // Create the full path
    const filePath = path.join(saveLocation, `${safeTitle}.md`)

    // Check if the title has changed and we need to rename the file
    console.log('Checking for title change:', { oldTitle, newTitle: title });
    if (oldTitle && oldTitle !== title && oldTitle.trim()) {
      const oldSafeTitle = oldTitle.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const oldFilePath = path.join(saveLocation, `${oldSafeTitle}.md`)

      console.log('Title changed, handling file rename:', {
        oldTitle,
        newTitle: title,
        oldFilePath,
        newFilePath: filePath
      })

      // Check if old file exists and rename it
      if (fs.existsSync(oldFilePath) && oldFilePath !== filePath) {
        try {
          console.log(`Renaming file from ${oldFilePath} to ${filePath}`)
          // Rename the file instead of deleting and creating a new one
          fs.renameSync(oldFilePath, filePath)
          console.log('File renamed successfully')
        } catch (renameErr) {
          console.error('Error renaming file:', renameErr)
          // If rename fails, we'll create a new file below
        }
      } else {
        console.log('Cannot rename file:', {
          oldFileExists: fs.existsSync(oldFilePath),
          pathsEqual: oldFilePath === filePath,
          oldFilePath,
          newFilePath: filePath
        })
      }
    } else {
      console.log('No title change detected or invalid old title:', {
        hasOldTitle: !!oldTitle,
        titlesEqual: oldTitle === title,
        oldTitleTrimmed: oldTitle ? oldTitle.trim() : null
      });
    }

    // Write the file (either new file or update existing)
    console.log('Writing to file path:', filePath)
    fs.writeFileSync(filePath, content, 'utf8')
    console.log('File written successfully')

    return { success: true, filePath }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error saving note to file:', error)
    return { success: false, error: errorMessage }
  }
})

ipcMain.handle('delete-note-file', async (_, noteId, title, saveLocation) => {
  try {
    // Create a safe filename from the title or use 'untitled_note' if title is empty
    const safeTitle = title && title.trim() ?
      title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() :
      'untitled_note_' + noteId.substring(0, 8)

    console.log('Creating filename from title:', { title, safeTitle })

    // Create the full path
    const filePath = path.join(saveLocation, `${safeTitle}.md`)

    // Check if file exists before deleting
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting note file:', error)
    return { success: false, error: errorMessage }
  }
})

// List all markdown files in a directory
ipcMain.handle('list-note-files', async (_, directoryPath) => {
  try {
    if (!fs.existsSync(directoryPath)) {
      return []
    }

    const files = fs.readdirSync(directoryPath)
    const markdownFiles = files.filter(file => file.endsWith('.md'))

    return Promise.all(markdownFiles.map(async (fileName) => {
      const filePath = path.join(directoryPath, fileName)
      const stats = fs.statSync(filePath)

      // For simplicity, we'll use the filename without extension as the ID
      // This ensures that when we search for a file by ID, we can find it
      const id = fileName.replace(/\.md$/, '')
      console.log('Generated ID from filename:', { fileName, id })

      return {
        name: fileName,
        path: filePath,
        id,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    }))
  } catch (error: unknown) {
    console.error('Error listing note files:', error)
    return []
  }
})

// Read a markdown file
ipcMain.handle('read-note-file', async (_, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    const content = fs.readFileSync(filePath, 'utf8')
    return content
  } catch (error: unknown) {
    console.error('Error reading note file:', error)
    throw error
  }
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    mainWindow = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

// Auto-launch IPC handlers
ipcMain.handle('set-auto-launch', async (_, enabled) => {
  try {
    if (enabled) {
      await scribbleAutoLauncher.enable()
    } else {
      await scribbleAutoLauncher.disable()
    }
    return enabled
  } catch (error) {
    console.error('Error setting auto-launch:', error)
    return false
  }
})

ipcMain.handle('get-auto-launch', async () => {
  try {
    return await scribbleAutoLauncher.isEnabled()
  } catch (error) {
    console.error('Error getting auto-launch status:', error)
    return false
  }
})

// Sync settings from renderer to main process
ipcMain.handle('sync-settings', (_, settings) => {
  try {
    console.log('Syncing settings from renderer to main process:', settings);

    // Ensure globalHotkeys is properly set
    if (!settings.globalHotkeys) {
      settings.globalHotkeys = DEFAULT_GLOBAL_HOTKEYS;
      console.log('Added default global hotkeys to settings');
    }

    // Create a settings store if it doesn't exist
    const settingsStore = new Store({ name: 'settings' });

    // Save the entire settings object
    settingsStore.set('settings', settings);

    console.log('Settings synced successfully');

    // Unregister all shortcuts
    globalShortcut.unregisterAll();

    // Register them again with new settings
    registerGlobalHotkeys();

    // Verify that the hotkeys were registered
    const globalHotkeys = settings.globalHotkeys;
    if (globalHotkeys) {
      const newNoteRegistered = globalHotkeys.newNote ?
        globalShortcut.isRegistered(formatAccelerator(globalHotkeys.newNote)) : false;

      const showAppRegistered = globalHotkeys.showApp ?
        globalShortcut.isRegistered(formatAccelerator(globalHotkeys.showApp)) : false;

      console.log('Hotkey registration verification:', {
        newNote: globalHotkeys.newNote,
        newNoteRegistered,
        showApp: globalHotkeys.showApp,
        showAppRegistered
      });
    }

    return true;
  } catch (error) {
    console.error('Error syncing settings:', error);
    return false;
  }
});

// Get settings from main process
ipcMain.handle('get-main-process-settings', () => {
  try {
    const settingsStore = new Store({ name: 'settings' });
    const settings = settingsStore.get('settings');
    console.log('Retrieved settings from main process:', settings);
    return settings || {};
  } catch (error) {
    console.error('Error getting main process settings:', error);
    return {};
  }
});

// Update global hotkeys when settings change
ipcMain.on('settings-updated', () => {
  console.log('Received settings-updated event');

  // Unregister all shortcuts first
  console.log('Unregistering all shortcuts due to settings update');
  globalShortcut.unregisterAll();

  // Explicitly unregister default hotkeys and common variations
  try {
    globalShortcut.unregister(DEFAULT_GLOBAL_HOTKEYS.newNote);
    globalShortcut.unregister(DEFAULT_GLOBAL_HOTKEYS.showApp);
    globalShortcut.unregister('CommandOrControl+Alt+N');
    globalShortcut.unregister('CommandOrControl+Alt+S');
    globalShortcut.unregister('Command+Alt+N');
    globalShortcut.unregister('Command+Alt+S');
    globalShortcut.unregister('Control+Alt+N');
    globalShortcut.unregister('Control+Alt+S');
  } catch (e) {
    // Ignore errors when unregistering
  }

  // Get the latest settings
  const settingsStore = new Store({ name: 'settings' });
  const settings = settingsStore.get('settings') as SettingsType || {};

  console.log('Retrieved latest settings for hotkey registration:',
    settings.globalHotkeys ? JSON.stringify(settings.globalHotkeys, null, 2) : 'No global hotkeys found');

  // Ensure globalHotkeys is properly set
  if (!settings.globalHotkeys) {
    console.log('No global hotkeys found in settings, using defaults');
    settings.globalHotkeys = DEFAULT_GLOBAL_HOTKEYS;
    settingsStore.set('settings', settings);
  }

  // Register them again with new settings
  registerGlobalHotkeys();

  // Verify registration
  if (settings.globalHotkeys) {
    const newNoteHotkey = settings.globalHotkeys.newNote;
    const showAppHotkey = settings.globalHotkeys.showApp;

    if (newNoteHotkey) {
      const formattedHotkey = formatAccelerator(newNoteHotkey);
      const isRegistered = globalShortcut.isRegistered(formattedHotkey);
      console.log(`New note hotkey ${newNoteHotkey} (formatted: ${formattedHotkey}) registered: ${isRegistered}`);

      // Check if default is still registered
      const defaultRegistered = globalShortcut.isRegistered(DEFAULT_GLOBAL_HOTKEYS.newNote);
      console.log(`Default new note hotkey still registered: ${defaultRegistered}`);
    }

    if (showAppHotkey) {
      const formattedHotkey = formatAccelerator(showAppHotkey);
      const isRegistered = globalShortcut.isRegistered(formattedHotkey);
      console.log(`Show app hotkey ${showAppHotkey} (formatted: ${formattedHotkey}) registered: ${isRegistered}`);

      // Check if default is still registered
      const defaultRegistered = globalShortcut.isRegistered(DEFAULT_GLOBAL_HOTKEYS.showApp);
      console.log(`Default show app hotkey still registered: ${defaultRegistered}`);
    }
  }

  // Log all registered shortcuts
  console.log('All registered shortcuts after update completed');
})

// Handle theme changes
ipcMain.on('theme-changed', (event, theme) => {
  console.log('Theme changed in main process:', theme);

  // Get the sender window
  const senderWindow = BrowserWindow.fromWebContents(event.sender);

  // Relay the theme change to all windows
  BrowserWindow.getAllWindows().forEach(win => {
    // Don't send back to the sender window to avoid loops
    if (win !== senderWindow) {
      console.log(`Sending theme-changed event to window ${win.id}`);
      win.webContents.send('theme-changed', theme);
    } else {
      console.log(`Skipping sender window ${win.id}`);
    }
  });
})

// Set the app user model id for Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.tylerburnett.scribble')
}

// Set the dock icon for macOS as early as possible
if (process.platform === 'darwin' && app.dock) {
  try {
    // Use the new rounded-corner icon for the dock
    const pngIconPath = path.join(process.env.APP_ROOT, 'src/assets/icon2-512.png')
    console.log('Setting dock icon with new rounded PNG path:', pngIconPath)

    // Check if the file exists
    if (fs.existsSync(pngIconPath)) {
      // Create a native image from the PNG file
      const dockIcon = nativeImage.createFromPath(pngIconPath)

      if (!dockIcon.isEmpty()) {
        console.log('Setting dock icon with dimensions:', dockIcon.getSize())
        app.dock.setIcon(dockIcon)
      } else {
        console.error('Failed to load PNG icon, it appears to be empty')

        // Try with the original icon as a last resort
        const originalIconPath = path.join(process.env.APP_ROOT, 'src/assets/icon2-512.png')
        if (fs.existsSync(originalIconPath)) {
          const originalIcon = nativeImage.createFromPath(originalIconPath)
          app.dock.setIcon(originalIcon)
        }
      }
    } else {
      console.error('PNG icon file does not exist:', pngIconPath)

      // Try with the original icon as a last resort
      const originalIconPath = path.join(process.env.APP_ROOT, 'src/assets/icon2-512.png')
      if (fs.existsSync(originalIconPath)) {
        const originalIcon = nativeImage.createFromPath(originalIconPath)
        app.dock.setIcon(originalIcon)
      }
    }
  } catch (error) {
    console.error('Error setting dock icon:', error)
  }
}

// When app is ready
app.whenReady().then(() => {
  // Set the dock icon again when the app is ready (as a backup)
  if (process.platform === 'darwin' && app.dock) {
    try {
      const pngIconPath = path.join(process.env.APP_ROOT, 'src/assets/icon2-512.png')
      if (fs.existsSync(pngIconPath)) {
        const dockIcon = nativeImage.createFromPath(pngIconPath)
        app.dock.setIcon(dockIcon)
        console.log('Dock icon set again when app is ready')
      }
    } catch (error) {
      console.error('Error setting dock icon in whenReady:', error)
    }
  }

  // Create main window
  createMainWindow()

  // Create tray icon
  createTray()

  // Register global hotkeys
  registerGlobalHotkeys()
})

// Handle the before-quit event
app.on('before-quit', () => {
  isQuitting = true

  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})
