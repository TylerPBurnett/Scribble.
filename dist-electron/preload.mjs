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
electron.contextBridge.exposeInMainWorld("noteWindow", {
  openNote: (noteId) => electron.ipcRenderer.invoke("open-note", noteId),
  createNote: () => electron.ipcRenderer.invoke("create-note"),
  getNoteId: () => electron.ipcRenderer.invoke("get-note-id")
});
electron.contextBridge.exposeInMainWorld("settings", {
  openSettings: () => electron.ipcRenderer.invoke("open-settings"),
  isSettingsWindow: () => electron.ipcRenderer.invoke("is-settings-window"),
  selectDirectory: () => electron.ipcRenderer.invoke("select-directory"),
  getDefaultSaveLocation: () => electron.ipcRenderer.invoke("get-default-save-location")
});
