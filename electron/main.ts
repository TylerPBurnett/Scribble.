import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

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
    icon: path.join(process.env.APP_ROOT, 'src/assets/icon.png'),
    title: 'Scribble',
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
  const noteWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 250,
    minHeight: 300,
    backgroundColor: '#1a1a1a',
    icon: path.join(process.env.APP_ROOT, 'src/assets/icon.png'),
    title: 'Scribble - Note',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Load the same URL as the main window but with a query parameter
  const url = VITE_DEV_SERVER_URL ?
    `${VITE_DEV_SERVER_URL}?noteId=${noteId}` :
    path.join(RENDERER_DIST, 'index.html')

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
    icon: path.join(process.env.APP_ROOT, 'src/assets/icon.png'),
    title: 'Scribble - Settings',
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
  console.log('IPC: get-note-id called')
  // Find the window that sent this request
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) {
    console.log('No window found for this request')
    return null
  }

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
      }
    }

    // Write the file (either new file or update existing)
    console.log('Writing to file path:', filePath)
    fs.writeFileSync(filePath, content, 'utf8')
    console.log('File written successfully')

    return { success: true, filePath }
  } catch (error: any) {
    console.error('Error saving note to file:', error)
    return { success: false, error: error.message || 'Unknown error' }
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
  } catch (error: any) {
    console.error('Error deleting note file:', error)
    return { success: false, error: error.message || 'Unknown error' }
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

      // Generate an ID from the filename
      const id = fileName.replace(/\.md$/, '')

      return {
        name: fileName,
        path: filePath,
        id,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    }))
  } catch (error: any) {
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
  } catch (error: any) {
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

// Set the app user model id for Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.tylerburnett.scribble')
}

app.whenReady().then(createMainWindow)
