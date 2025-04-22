import { useState, useEffect } from 'react'
import './MainApp.css'
import NoteList from './components/NoteList'
import SettingsWindow from '../settings-window/SettingsWindow'
import TitleBar from '../shared/components/TitleBar'
import { Note } from '../shared/types/Note'
import { getNotes, createNote, deleteNote } from '../shared/services/noteService'
import { initSettings, saveSettings, AppSettings } from '../shared/services/settingsService'

function MainApp() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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
    <div className="app">
      <TitleBar
        title="Scribble"
        onMinimize={() => window.windowControls.minimize()}
        onMaximize={() => window.windowControls.maximize()}
        onClose={() => window.windowControls.close()}
      />
      <div className="app-actions">
        <button className="new-note-btn" onClick={handleNewNote}>
          <span className="plus-icon">+</span> New Note
        </button>
        <button className="settings-btn" onClick={handleOpenSettings}>
          <span className="settings-icon">⚙</span> Settings
        </button>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <main className="app-content">
        <NoteList
          notes={filteredNotes}
          onNoteClick={handleNoteClick}
          activeNoteId={activeNote?.id}
          onNoteDelete={handleNoteDelete}
        />
      </main>

      <footer className="app-footer">
        <div className="save-location">Save location: {appSettings.saveLocation}</div>
      </footer>

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
