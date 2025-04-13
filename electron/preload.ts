import { ipcRenderer, contextBridge, BrowserWindow } from 'electron'

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
})
