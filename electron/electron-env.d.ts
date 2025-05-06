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
    createNoteWithId: (noteId: string) => Promise<any>
    getNoteId: () => Promise<string | null>
    noteUpdated: (noteId: string) => void
  }
  settings: {
    openSettings: () => Promise<any>
    isSettingsWindow: () => Promise<boolean>
    selectDirectory: () => Promise<{ canceled: boolean, filePaths: string[] }>
    getDefaultSaveLocation: () => Promise<string>
  }
  fileOps: {
    saveNoteToFile: (noteId: string, title: string, content: string, saveLocation: string, oldTitle?: string) => Promise<{ success: boolean, filePath?: string, error?: string }>
    deleteNoteFile: (noteId: string, title: string, saveLocation: string) => Promise<{ success: boolean, error?: string }>
    listNoteFiles: (directoryPath: string) => Promise<Array<{ name: string, path: string, id: string, createdAt: Date, modifiedAt: Date }>>
    readNoteFile: (filePath: string) => Promise<string>
  }
  windowControls: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    moveWindow: (moveX: number, moveY: number) => Promise<void>
    togglePin: (shouldPin: boolean) => Promise<boolean>
    isPinned: () => Promise<boolean>
    setPinState: (noteId: string, isPinned: boolean) => Promise<boolean>
  }

}
