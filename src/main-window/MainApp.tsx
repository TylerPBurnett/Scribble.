import { useState, useEffect } from 'react'
import NoteList from './components/NoteList'
import SettingsWindow from '../settings-window/SettingsWindow'
import TitleBar from '../shared/components/TitleBar'
import Sidebar from './components/Sidebar'
import { Note } from '../shared/types/Note'
import { getNotes, createNote, deleteNote } from '../shared/services/noteService'
import { initSettings, saveSettings, AppSettings } from '../shared/services/settingsService'

function MainApp() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [appSettings, setAppSettings] = useState<AppSettings>({
    saveLocation: '',
    autoSave: true,
    autoSaveInterval: 5,
    darkMode: true,
  })

  // Load notes and settings on startup
  useEffect(() => {
    const init = async () => {
      try {
        console.log('=== MainApp Initialization Start ===');

        // Initialize settings
        console.log('MainApp - Initializing settings...')
        const settings = await initSettings()
        console.log('MainApp - Settings initialized:', settings)
        setAppSettings(settings)

        // Load notes for the main window
        console.log('This is the main window, loading all notes')

        try {
          const loadedNotes = await getNotes()
          console.log('Loaded notes:', loadedNotes.length)
          setNotes(loadedNotes)
        } catch (error) {
          console.error('Error loading notes:', error)
        }
      } catch (error) {
        console.error('Error during initialization:', error)
      }
    }

    init()
  }, [])

  // Listen for note updates from other windows
  useEffect(() => {
    // Set up listener for note updates
    const handleNoteUpdated = async (_event: any, noteId: string) => {
      console.log('Note updated:', noteId)
      // Reload all notes from file system
      try {
        const updatedNotes = await getNotes()
        setNotes(updatedNotes)
      } catch (error) {
        console.error('Error reloading notes after update:', error)
      }
    }

    // Add event listener
    window.ipcRenderer.on('note-updated', handleNoteUpdated)

    // Clean up
    return () => {
      window.ipcRenderer.off('note-updated', handleNoteUpdated)
    }
  }, [])

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true

    const lowerQuery = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    )
  })

  // Handle note click
  const handleNoteClick = async (note: Note) => {
    // Open the note in a new window
    await window.noteWindow.openNote(note.id)
  }

  // Handle creating a new note
  const handleNewNote = async () => {
    try {
      // Create a new note in the main window
      console.log('Creating new note...')
      const newNote = await createNote()
      console.log('New note created:', newNote)

      // Use the createNote IPC method directly instead of openNote
      // This will create a new window with a temporary ID and then create the note
      console.log('Creating note window directly via IPC')
      const result = await window.noteWindow.createNote()
      console.log('Result from creating note window:', result)

      // Notify other windows that a new note has been created
      window.noteWindow.noteUpdated(newNote.id)
    } catch (error) {
      console.error('Error creating new note:', error)
    }
  }

  // Handle opening settings
  const handleOpenSettings = () => {
    setShowSettings(true)
  }

  // Handle saving settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    console.log('MainApp - Saving new settings:', newSettings)
    setAppSettings(newSettings)
    saveSettings(newSettings)
    console.log('MainApp - Settings saved, current state:', newSettings)
  }

  // Handle note deletion
  const handleNoteDelete = async (noteId: string) => {
    console.log('Deleting note:', noteId)
    // Delete the note using the service
    await deleteNote(noteId)
    console.log('Note deleted from storage')

    // Update the notes list by reloading from file system
    try {
      const updatedNotes = await getNotes()
      setNotes(updatedNotes)
    } catch (error) {
      console.error('Error reloading notes after deletion:', error)
      // Fallback to filtering the current notes list
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId))
    }

    // Notify other windows that this note has been deleted
    window.noteWindow.noteUpdated(noteId)
    console.log('Note deletion complete')
  }

  // Render the main window
  return (
    <div className="app-container flex flex-col h-screen bg-background text-text">
      {/* Title Bar - Now spans the full width */}
      <TitleBar
        title="Scribble"
        onMinimize={() => window.windowControls.minimize()}
        onMaximize={() => window.windowControls.maximize()}
        onClose={() => window.windowControls.close()}
      />

      {/* Content area - contains sidebar and main content */}
      <div className="content-area flex flex-1 overflow-hidden">
        {/* Sidebar with integrated toggle button */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={handleOpenSettings}
        />

        {/* Main Content */}
        <div className="main-content flex flex-col flex-1 overflow-hidden">

        {/* Header */}
        <div className={`app-header flex items-center justify-between ${sidebarOpen ? 'pl-6' : 'pl-0'} pr-6 py-3 bg-background-secondary border-b border-border transition-all duration-300`}>
          {/* Search container */}
          <div className="search-container relative w-full max-w-md">
            <div className="search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              type="text"
              className="search-input w-full py-2 pl-10 pr-4 bg-background-tertiary border border-transparent rounded-md text-sm text-text placeholder-text-tertiary focus:outline-none focus:border-primary transition-colors"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions flex items-center gap-3">
            <button
              className="new-note-button flex items-center justify-center w-10 h-10 bg-primary text-black rounded-md hover:bg-primary-dark transition-colors"
              onClick={handleNewNote}
              title="New Note"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <NoteList
          notes={filteredNotes}
          onNoteClick={handleNoteClick}
          activeNoteId={activeNote?.id}
          onNoteDelete={handleNoteDelete}
          sidebarOpen={sidebarOpen}
        />
      </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsWindow
          onClose={() => setShowSettings(false)}
          initialSettings={appSettings}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  )
}

export default MainApp
