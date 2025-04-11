import { ipcMain, BrowserWindow, app } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let mainWindow;
const noteWindows = /* @__PURE__ */ new Map();
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#1a1a1a",
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow == null ? void 0 : mainWindow.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
function createNoteWindow(noteId) {
  if (noteWindows.has(noteId)) {
    const existingWindow = noteWindows.get(noteId);
    if (existingWindow) {
      existingWindow.focus();
      return existingWindow;
    }
  }
  const noteWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 500,
    minHeight: 400,
    backgroundColor: "#1a1a1a",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (VITE_DEV_SERVER_URL) {
    noteWindow.loadURL(`${VITE_DEV_SERVER_URL}?noteId=${noteId}`);
  } else {
    noteWindow.loadFile(path.join(RENDERER_DIST, "index.html"), {
      query: { noteId }
    });
  }
  noteWindows.set(noteId, noteWindow);
  noteWindow.on("closed", () => {
    noteWindows.delete(noteId);
  });
  return noteWindow;
}
ipcMain.handle("open-note", (_, noteId) => {
  createNoteWindow(noteId);
  return { success: true };
});
ipcMain.handle("create-note", () => {
  createNoteWindow("new");
  return { success: true };
});
ipcMain.handle("get-note-id", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;
  for (const [noteId, noteWin] of noteWindows.entries()) {
    if (noteWin === win) {
      return noteId;
    }
  }
  return null;
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    mainWindow = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
app.whenReady().then(createMainWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
