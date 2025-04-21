import { useState, useEffect } from 'react'
import './App.css'
import NoteList from './components/NoteList'
import NoteEditor from './components/NoteEditor'
import SettingsWindow from './components/SettingsWindow'
import TitleBar from './components/TitleBar'
import { Note } from './types/Note'
import { getNotes, createNote, getNoteById, deleteNote } from './services/noteService'
import { getSettings, saveSettings, initSettings, AppSettings } from './services/settingsService'

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [isNoteWindow, setIsNoteWindow] = useState(false)
  const [isSettingsWindow, setIsSettingsWindow] = useState(false)
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
        // Initialize settings
        console.log('App.tsx - Initializing settings...')
        const settings = await initSettings()
        console.log('App.tsx - Settings initialized:', settings)
        setAppSettings(settings)

        // Check if this is a settings window
        const isSettings = await window.settings.isSettingsWindow()
        if (isSettings) {
          console.log('This is a settings window')
          setIsSettingsWindow(true)
          return
        }

        // If this is a note window, get the note ID from the URL
        const noteId = await window.noteWindow.getNoteId()
        console.log('getNoteId returned:', noteId)

        if (noteId) {
          console.log('This is a note window for note ID:', noteId)
          setIsNoteWindow(true)

          if (noteId.startsWith('new-')) {
            // Create a new note
            console.log('Creating new note for new window')
            const newNote = await createNote()
            console.log('New note created in note window:', newNote)
            setActiveNote(newNote)
          } else {
            // Load existing note
            console.log('Loading existing note with ID:', noteId)
            const note = await getNoteById(noteId)
            console.log('Loaded note:', note)
            if (note) {
              setActiveNote(note)
            } else {
              console.error('Note not found with ID:', noteId)
            }
          }
        } else {
          // Load notes for the main window
          console.log('This is the main window, loading all notes')
          try {
            const loadedNotes = await getNotes()
            console.log('Loaded notes:', loadedNotes.length)
            setNotes(loadedNotes)
          } catch (error) {
            console.error('Error loading notes:', error)
          }
        }
      } catch (error) {
        console.error('Error during initialization:', error)
      }
    }

    init()
  }, [])

  // Listen for note updates from other windows
  useEffect(() => {
    // Skip this in note windows
    if (isNoteWindow) return

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
  }, [isNoteWindow])

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
    console.log('App.tsx - Saving new settings:', newSettings)
    setAppSettings(newSettings)
    saveSettings(newSettings)
    console.log('App.tsx - Settings saved, current state:', newSettings)
  }

  // Handle note save (for the note window)
  const handleNoteSave = (updatedNote: Note) => {
    setActiveNote(updatedNote)
    // Update the note in the notes list
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === updatedNote.id ? updatedNote : note
      )
    )
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

  // Render the settings window
  if (isSettingsWindow) {
    return (
      <div className="settings-window-container">
        <SettingsWindow
          onClose={() => window.close()}
          initialSettings={appSettings}
          onSave={handleSaveSettings}
        />
      </div>
    )
  }

  // Render the note window
  if (isNoteWindow && activeNote) {
    return (
      <div className="note-window">
        <NoteEditor note={activeNote} onSave={handleNoteSave} />
      </div>
    )
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

export default App
