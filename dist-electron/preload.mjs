"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
electron.contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => electron.ipcRenderer.invoke("window-minimize"),
  maximize: () => electron.ipcRenderer.invoke("window-maximize"),
  close: () => electron.ipcRenderer.invoke("window-close"),
  moveWindow: (moveX, moveY) => electron.ipcRenderer.invoke("window-move", moveX, moveY),
  togglePin: (shouldPin) => electron.ipcRenderer.invoke("window-toggle-pin", shouldPin),
  isPinned: () => electron.ipcRenderer.invoke("window-is-pinned"),
  setPinState: (noteId, isPinned) => electron.ipcRenderer.invoke("window-set-pin-state", noteId, isPinned)
});
electron.contextBridge.exposeInMainWorld("noteWindow", {
  openNote: (noteId) => electron.ipcRenderer.invoke("open-note", noteId),
  createNote: () => electron.ipcRenderer.invoke("create-note"),
  createNoteWithId: (noteId) => electron.ipcRenderer.invoke("create-note-with-id", noteId),
  getNoteId: () => electron.ipcRenderer.invoke("get-note-id"),
  noteUpdated: (noteId) => electron.ipcRenderer.send("note-updated", noteId)
});
electron.contextBridge.exposeInMainWorld("settings", {
  openSettings: () => electron.ipcRenderer.invoke("open-settings"),
  isSettingsWindow: () => electron.ipcRenderer.invoke("is-settings-window"),
  selectDirectory: () => electron.ipcRenderer.invoke("select-directory"),
  getDefaultSaveLocation: () => electron.ipcRenderer.invoke("get-default-save-location")
});
electron.contextBridge.exposeInMainWorld("fileOps", {
  saveNoteToFile: (noteId, title, content, saveLocation, oldTitle) => electron.ipcRenderer.invoke("save-note-to-file", noteId, title, content, saveLocation, oldTitle),
  deleteNoteFile: (noteId, title, saveLocation) => electron.ipcRenderer.invoke("delete-note-file", noteId, title, saveLocation),
  listNoteFiles: (directoryPath) => electron.ipcRenderer.invoke("list-note-files", directoryPath),
  readNoteFile: (filePath) => electron.ipcRenderer.invoke("read-note-file", filePath)
});
