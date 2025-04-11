/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
  noteWindow: {
    openNote: (noteId: string) => Promise<any>
    createNote: () => Promise<any>
    getNoteId: () => Promise<string | null>
  }
  settings: {
    openSettings: () => Promise<any>
    isSettingsWindow: () => Promise<boolean>
    selectDirectory: () => Promise<{ canceled: boolean, filePaths: string[] }>
    getDefaultSaveLocation: () => Promise<string>
  }
}
