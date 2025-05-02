import { ipcMain, BrowserWindow, app, dialog } from "electron";
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
  const isMac = process.platform === "darwin";
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 250,
    minHeight: 300,
    backgroundColor: "#1a1a1a",
    icon: path.join(process.env.APP_ROOT, "src/assets/icon.png"),
    title: "Scribble",
    frame: false,
    // On macOS, use 'hiddenInset' to show the native traffic lights
    // On Windows, use 'hidden' to completely hide the title bar
    titleBarStyle: isMac ? "hiddenInset" : "hidden",
    // Additional macOS-specific settings
    trafficLightPosition: { x: 20, y: 20 },
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
  console.log("Creating note window with ID:", noteId);
  if (noteWindows.has(noteId)) {
    const existingWindow = noteWindows.get(noteId);
    if (existingWindow) {
      console.log("Window already exists, focusing it");
      existingWindow.focus();
      return existingWindow;
    }
  }
  const isMac = process.platform === "darwin";
  console.log("Creating new BrowserWindow for note");
  const noteWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 250,
    minHeight: 300,
    backgroundColor: "#1a1a1a",
    icon: path.join(process.env.APP_ROOT, "src/assets/icon.png"),
    title: "Scribble - Note",
    frame: false,
    // On macOS, use 'hiddenInset' to show the native traffic lights
    // On Windows, use 'hidden' to completely hide the title bar
    titleBarStyle: isMac ? "hiddenInset" : "hidden",
    // Additional macOS-specific settings
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  let url;
  if (VITE_DEV_SERVER_URL) {
    const baseUrl = VITE_DEV_SERVER_URL.endsWith("/") ? VITE_DEV_SERVER_URL : `${VITE_DEV_SERVER_URL}/`;
    url = `${baseUrl}note.html?noteId=${noteId}`;
  } else {
    url = path.join(RENDERER_DIST, "note.html");
  }
  console.log("=== Creating Note Window ===");
  console.log("VITE_DEV_SERVER_URL:", VITE_DEV_SERVER_URL);
  console.log("Note ID:", noteId);
  console.log("Loading URL for note window:", VITE_DEV_SERVER_URL ? url : `${url} with query noteId=${noteId}`);
  if (VITE_DEV_SERVER_URL) {
    noteWindow.loadURL(url);
  } else {
    noteWindow.loadFile(url, {
      query: { noteId }
    });
  }
  noteWindows.set(noteId, noteWindow);
  noteWindow.webContents.on("will-navigate", (event, url2) => {
    console.log(`=== Note window ${noteWindow.id} will navigate to: ${url2} ===`);
    console.log("Current noteId associated with this window:", noteId);
    console.log("Is this window still in the noteWindows Map?", noteWindows.has(noteId) && noteWindows.get(noteId) === noteWindow);
    const urlObj = new URL(url2);
    const isNoteHtml = urlObj.pathname.endsWith("note.html");
    if (!isNoteHtml) {
      event.preventDefault();
      if (VITE_DEV_SERVER_URL) {
        const baseUrl = VITE_DEV_SERVER_URL.endsWith("/") ? VITE_DEV_SERVER_URL : `${VITE_DEV_SERVER_URL}/`;
        const newUrl = `${baseUrl}note.html?noteId=${noteId}`;
        console.log("Reloading with URL:", newUrl);
        noteWindow.loadURL(newUrl);
      } else {
        noteWindow.loadFile(path.join(RENDERER_DIST, "note.html"), {
          query: { noteId }
        });
      }
      console.log("Reloaded window with noteId parameter:", noteId);
    } else {
      if (!urlObj.searchParams.has("noteId")) {
        event.preventDefault();
        urlObj.searchParams.set("noteId", noteId);
        noteWindow.loadURL(urlObj.toString());
        console.log("Added noteId parameter to existing note.html URL:", urlObj.toString());
      }
    }
  });
  noteWindow.on("closed", () => {
    console.log(`Note window closed: ${noteId}`);
    noteWindows.delete(noteId);
  });
  return noteWindow;
}
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return settingsWindow;
  }
  const isMac = process.platform === "darwin";
  const mainWindowSize = mainWindow ? mainWindow.getSize() : [1200, 800];
  settingsWindow = new BrowserWindow({
    width: mainWindowSize[0],
    height: mainWindowSize[1],
    minWidth: 250,
    minHeight: 300,
    backgroundColor: "#1a1a1a",
    icon: path.join(process.env.APP_ROOT, "src/assets/icon.png"),
    title: "Scribble - Settings",
    parent: mainWindow || void 0,
    modal: false,
    // Changed to false to allow it to be a full window
    frame: false,
    // On macOS, use 'hiddenInset' to show the native traffic lights
    // On Windows, use 'hidden' to completely hide the title bar
    titleBarStyle: isMac ? "hiddenInset" : "hidden",
    // Additional macOS-specific settings
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  let url;
  if (VITE_DEV_SERVER_URL) {
    const baseUrl = VITE_DEV_SERVER_URL.endsWith("/") ? VITE_DEV_SERVER_URL : `${VITE_DEV_SERVER_URL}/`;
    url = `${baseUrl}settings.html`;
  } else {
    url = path.join(RENDERER_DIST, "settings.html");
  }
  console.log("Loading URL for settings window:", url);
  if (VITE_DEV_SERVER_URL) {
    settingsWindow.loadURL(url);
  } else {
    settingsWindow.loadFile(url);
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
  console.log("IPC: open-note called with noteId:", noteId);
  const window = createNoteWindow(noteId);
  console.log("Note window created:", window ? "success" : "failed");
  return { success: !!window };
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
  console.log("IPC: create-note called, generated ID:", noteId);
  const window = createNoteWindow(noteId);
  console.log("New note window created:", window ? "success" : "failed");
  return { success: !!window, noteId };
});
ipcMain.handle("create-note-with-id", (_, noteId) => {
  createNoteWindow(noteId);
  return { success: true };
});
ipcMain.handle("get-note-id", (event) => {
  console.log("=== IPC: get-note-id called ===");
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    console.log("No window found for this request");
    return null;
  }
  console.log("Window ID:", win.id);
  console.log("Current noteWindows Map size:", noteWindows.size);
  console.log("noteWindows entries:", Array.from(noteWindows.entries()).map(([id, w]) => ({ id, winId: w.id })));
  for (const [noteId, noteWin] of noteWindows.entries()) {
    if (noteWin === win) {
      console.log("Found note ID for window:", noteId);
      return noteId;
    }
  }
  console.log("This is not a note window");
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
    console.log("Checking for title change:", { oldTitle, newTitle: title });
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
      } else {
        console.log("Cannot rename file:", {
          oldFileExists: fs.existsSync(oldFilePath),
          pathsEqual: oldFilePath === filePath,
          oldFilePath,
          newFilePath: filePath
        });
      }
    } else {
      console.log("No title change detected or invalid old title:", {
        hasOldTitle: !!oldTitle,
        titlesEqual: oldTitle === title,
        oldTitleTrimmed: oldTitle ? oldTitle.trim() : null
      });
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
ipcMain.handle("list-note-files", async (_, directoryPath) => {
  try {
    if (!fs.existsSync(directoryPath)) {
      return [];
    }
    const files = fs.readdirSync(directoryPath);
    const markdownFiles = files.filter((file) => file.endsWith(".md"));
    return Promise.all(markdownFiles.map(async (fileName) => {
      const filePath = path.join(directoryPath, fileName);
      const stats = fs.statSync(filePath);
      const id = fileName.replace(/\.md$/, "");
      console.log("Generated ID from filename:", { fileName, id });
      return {
        name: fileName,
        path: filePath,
        id,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    }));
  } catch (error) {
    console.error("Error listing note files:", error);
    return [];
  }
});
ipcMain.handle("read-note-file", async (_, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, "utf8");
    return content;
  } catch (error) {
    console.error("Error reading note file:", error);
    throw error;
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
