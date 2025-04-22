import { useState, useEffect } from 'react'
import './NoteApp.css'
import NoteEditor from './components/NoteEditor'
import { Note } from '../shared/types/Note'
import { getNoteById, createNote } from '../shared/services/noteService'
import { initSettings } from '../shared/services/settingsService'

function NoteApp() {
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load note on startup
  useEffect(() => {
    const init = async () => {
      try {
        console.log('=== NoteApp Initialization Start ===');
        console.log('Window location:', window.location.href);

        // Initialize settings (needed for note operations)
        await initSettings()

        // Get the note ID from the URL query parameters
        const urlParams = new URLSearchParams(window.location.search)
        const noteId = urlParams.get('noteId')
        console.log('Note ID from URL parameters:', noteId)

        if (!noteId) {
          setError('No note ID provided')
          setIsLoading(false)
          return
        }

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
            setError(`Note not found with ID: ${noteId}`)
          }
        }
      } catch (error) {
        console.error('Error during initialization:', error)
        setError('Failed to load note')
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  // Handle note save
  const handleNoteSave = (updatedNote: Note) => {
    setActiveNote(updatedNote)
  }

  // Show loading state
  if (isLoading) {
    return <div className="note-window loading">Loading note...</div>
  }

  // Show error state
  if (error) {
    return <div className="note-window error">{error}</div>
  }

  // Show note editor
  if (activeNote) {
    return (
      <div className="note-window">
        <NoteEditor note={activeNote} onSave={handleNoteSave} />
      </div>
    )
  }

  // Fallback
  return <div className="note-window error">Failed to load note</div>
}

export default NoteApp
