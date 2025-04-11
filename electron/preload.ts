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

// Expose specific APIs for note management
contextBridge.exposeInMainWorld('noteWindow', {
  openNote: (noteId: string) => ipcRenderer.invoke('open-note', noteId),
  createNote: () => ipcRenderer.invoke('create-note'),
  getNoteId: () => ipcRenderer.invoke('get-note-id'),
})

// Expose specific APIs for settings management
contextBridge.exposeInMainWorld('settings', {
  openSettings: () => ipcRenderer.invoke('open-settings'),
  isSettingsWindow: () => ipcRenderer.invoke('is-settings-window'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDefaultSaveLocation: () => ipcRenderer.invoke('get-default-save-location'),
})
