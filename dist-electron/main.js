import { ipcMain, BrowserWindow, dialog, app } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let mainWindow;
let settingsWindow = null;
const noteWindows = /* @__PURE__ */ new Map();
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 250,
    minHeight: 300,
    backgroundColor: "#1a1a1a",
    icon: path.join(process.env.APP_ROOT, "src/assets/icon.png"),
    title: "Scribble",
    frame: false,
    titleBarStyle: "hidden",
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
    minWidth: 250,
    minHeight: 300,
    backgroundColor: "#1a1a1a",
    icon: path.join(process.env.APP_ROOT, "src/assets/icon.png"),
    title: "Scribble - Note",
    frame: false,
    titleBarStyle: "hidden",
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
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return settingsWindow;
  }
  settingsWindow = new BrowserWindow({
    width: 550,
    height: 600,
    minWidth: 250,
    minHeight: 300,
    backgroundColor: "#1a1a1a",
    icon: path.join(process.env.APP_ROOT, "src/assets/icon.png"),
    title: "Scribble - Settings",
    parent: mainWindow || void 0,
    modal: true,
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (VITE_DEV_SERVER_URL) {
    settingsWindow.loadURL(`${VITE_DEV_SERVER_URL}?settings=true`);
  } else {
    settingsWindow.loadFile(path.join(RENDERER_DIST, "index.html"), {
      query: { settings: "true" }
    });
  }
  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
  return settingsWindow;
}
function getDefaultSaveLocation() {
  const userDataPath = app.getPath("userData");
  const savePath = path.join(userDataPath, "Notes");
  if (!fs.existsSync(savePath)) {
    fs.mkdirSync(savePath, { recursive: true });
  }
  return savePath;
}
ipcMain.handle("open-note", (_, noteId) => {
  createNoteWindow(noteId);
  return { success: true };
});
ipcMain.on("note-updated", (_, noteId) => {
  if (mainWindow) {
    mainWindow.webContents.send("note-updated", noteId);
  }
});
ipcMain.handle("window-minimize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});
ipcMain.handle("window-maximize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});
ipcMain.handle("window-close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});
ipcMain.handle("window-move", (event, moveX, moveY) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    const [x, y] = win.getPosition();
    win.setPosition(x + moveX, y + moveY);
  }
});
ipcMain.handle("create-note", () => {
  const noteId = `new-${Date.now().toString(36)}`;
  createNoteWindow(noteId);
  return { success: true, noteId };
});
ipcMain.handle("create-note-with-id", (_, noteId) => {
  createNoteWindow(noteId);
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
ipcMain.handle("open-settings", () => {
  createSettingsWindow();
  return { success: true };
});
ipcMain.handle("is-settings-window", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win === settingsWindow;
});
ipcMain.handle("select-directory", async () => {
  if (!mainWindow && !settingsWindow) return { canceled: true };
  const result = await dialog.showOpenDialog(settingsWindow || mainWindow, {
    properties: ["openDirectory", "createDirectory"],
    title: "Select Save Location"
  });
  return result;
});
ipcMain.handle("get-default-save-location", () => {
  return getDefaultSaveLocation();
});
ipcMain.handle("save-note-to-file", async (_, noteId, title, content, saveLocation, oldTitle = "") => {
  console.log("Saving note to file:", { noteId, title, saveLocation, oldTitle });
  try {
    if (!fs.existsSync(saveLocation)) {
      fs.mkdirSync(saveLocation, { recursive: true });
    }
    const safeTitle = title && title.trim() ? title.trim().replace(/[^a-z0-9]/gi, "_").toLowerCase() : "untitled_note_" + noteId.substring(0, 8);
    console.log("Creating filename from title:", { title, safeTitle });
    const filePath = path.join(saveLocation, `${safeTitle}.md`);
    if (oldTitle && oldTitle !== title && oldTitle.trim()) {
      const oldSafeTitle = oldTitle.trim().replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const oldFilePath = path.join(saveLocation, `${oldSafeTitle}.md`);
      console.log("Title changed, handling file rename:", {
        oldTitle,
        newTitle: title,
        oldFilePath,
        newFilePath: filePath
      });
      if (fs.existsSync(oldFilePath) && oldFilePath !== filePath) {
        try {
          console.log(`Renaming file from ${oldFilePath} to ${filePath}`);
          fs.renameSync(oldFilePath, filePath);
          console.log("File renamed successfully");
        } catch (renameErr) {
          console.error("Error renaming file:", renameErr);
        }
      }
    }
    console.log("Writing to file path:", filePath);
    fs.writeFileSync(filePath, content, "utf8");
    console.log("File written successfully");
    return { success: true, filePath };
  } catch (error) {
    console.error("Error saving note to file:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
});
ipcMain.handle("delete-note-file", async (_, noteId, title, saveLocation) => {
  try {
    const safeTitle = title && title.trim() ? title.trim().replace(/[^a-z0-9]/gi, "_").toLowerCase() : "untitled_note_" + noteId.substring(0, 8);
    console.log("Creating filename from title:", { title, safeTitle });
    const filePath = path.join(saveLocation, `${safeTitle}.md`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting note file:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
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
if (process.platform === "win32") {
  app.setAppUserModelId("com.tylerburnett.scribble");
}
app.whenReady().then(createMainWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
