import { useState, useEffect } from 'react'
import './App.css'
import NoteList from './components/NoteList'
import NoteEditor from './components/NoteEditor'
import { Note } from './types/Note'
import { getNotes, createNote, getNoteById } from './services/noteService'

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [isNoteWindow, setIsNoteWindow] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [saveLocation, setSaveLocation] = useState('/Users/justinsmith/Documents/StickyNotes')

  // Load notes on startup
  useEffect(() => {
    const loadedNotes = getNotes()
    setNotes(loadedNotes)

    // If this is a note window, get the note ID from the URL
    const checkIfNoteWindow = async () => {
      const noteId = await window.noteWindow.getNoteId()
      if (noteId) {
        setIsNoteWindow(true)
        if (noteId === 'new') {
          // Create a new note
          const newNote = createNote()
          setActiveNote(newNote)
        } else {
          // Load existing note
          const note = getNoteById(noteId)
          if (note) {
            setActiveNote(note)
          }
        }
      }
    }

    checkIfNoteWindow()
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
    await window.noteWindow.createNote()
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
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon">S</span>
          <h1>Scribble</h1>
        </div>
        <div className="app-actions">
          <button className="new-note-btn" onClick={handleNewNote}>
            <span className="plus-icon">+</span> New Note
          </button>
          <button className="settings-btn">
            <span className="settings-icon">⚙</span> Settings
          </button>
        </div>
      </header>

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
        />
      </main>

      <footer className="app-footer">
        <div className="save-location">Save location: {saveLocation}</div>
      </footer>
    </div>
  )
}

export default App
