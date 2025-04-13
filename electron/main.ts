import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const require = createRequire(import.meta.url)
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

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 250,
    minHeight: 300,
    backgroundColor: '#1a1a1a',
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createNoteWindow(noteId: string) {
  // Check if window already exists
  if (noteWindows.has(noteId)) {
    const existingWindow = noteWindows.get(noteId)
    if (existingWindow) {
      existingWindow.focus()
      return existingWindow
    }
  }

  // Create new window
  const noteWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 250,
    minHeight: 300,
    backgroundColor: '#1a1a1a',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load the same URL as the main window but with a query parameter
  if (VITE_DEV_SERVER_URL) {
    noteWindow.loadURL(`${VITE_DEV_SERVER_URL}?noteId=${noteId}`)
  } else {
    noteWindow.loadFile(path.join(RENDERER_DIST, 'index.html'), {
      query: { noteId }
    })
  }

  // Store the window reference
  noteWindows.set(noteId, noteWindow)

  // Clean up when window is closed
  noteWindow.on('closed', () => {
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

  // Create settings window
  settingsWindow = new BrowserWindow({
    width: 550,
    height: 600,
    minWidth: 250,
    minHeight: 300,
    backgroundColor: '#1a1a1a',
    parent: mainWindow || undefined,
    modal: true,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load the same URL as the main window but with a settings parameter
  if (VITE_DEV_SERVER_URL) {
    settingsWindow.loadURL(`${VITE_DEV_SERVER_URL}?settings=true`)
  } else {
    settingsWindow.loadFile(path.join(RENDERER_DIST, 'index.html'), {
      query: { settings: 'true' }
    })
  }

  // Clean up when window is closed
  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  return settingsWindow
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
  createNoteWindow(noteId)
  return { success: true }
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

ipcMain.handle('create-note', () => {
  // The actual note creation happens in the renderer process
  // This just opens a new window for a new note
  createNoteWindow('new')
  return { success: true }
})

ipcMain.handle('get-note-id', (event) => {
  // Find the window that sent this request
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return null

  // Check if this is a note window
  for (const [noteId, noteWin] of noteWindows.entries()) {
    if (noteWin === win) {
      return noteId
    }
  }

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

app.whenReady().then(createMainWindow)
