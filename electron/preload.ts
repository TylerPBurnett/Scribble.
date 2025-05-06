import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// Expose window control functions
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  moveWindow: (moveX: number, moveY: number) => ipcRenderer.invoke('window-move', moveX, moveY),
  togglePin: (shouldPin: boolean) => ipcRenderer.invoke('window-toggle-pin', shouldPin),
  isPinned: () => ipcRenderer.invoke('window-is-pinned'),
  setPinState: (noteId: string, isPinned: boolean) => ipcRenderer.invoke('window-set-pin-state', noteId, isPinned),
})

// Expose specific APIs for note management
contextBridge.exposeInMainWorld('noteWindow', {
  openNote: (noteId: string) => ipcRenderer.invoke('open-note', noteId),
  createNote: () => ipcRenderer.invoke('create-note'),
  createNoteWithId: (noteId: string) => ipcRenderer.invoke('create-note-with-id', noteId),
  getNoteId: () => ipcRenderer.invoke('get-note-id'),
  noteUpdated: (noteId: string) => ipcRenderer.send('note-updated', noteId),
})

// Expose specific APIs for settings management
contextBridge.exposeInMainWorld('settings', {
  openSettings: () => ipcRenderer.invoke('open-settings'),
  isSettingsWindow: () => ipcRenderer.invoke('is-settings-window'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDefaultSaveLocation: () => ipcRenderer.invoke('get-default-save-location'),
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('set-auto-launch', enabled),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  settingsUpdated: () => ipcRenderer.send('settings-updated'),
  themeChanged: (theme: string) => ipcRenderer.send('theme-changed', theme),
})

// Expose file operation APIs
contextBridge.exposeInMainWorld('fileOps', {
  saveNoteToFile: (noteId: string, title: string, content: string, saveLocation: string, oldTitle?: string) =>
    ipcRenderer.invoke('save-note-to-file', noteId, title, content, saveLocation, oldTitle),
  deleteNoteFile: (noteId: string, title: string, saveLocation: string) =>
    ipcRenderer.invoke('delete-note-file', noteId, title, saveLocation),
  listNoteFiles: (directoryPath: string) =>
    ipcRenderer.invoke('list-note-files', directoryPath),
  readNoteFile: (filePath: string) =>
    ipcRenderer.invoke('read-note-file', filePath),
})


