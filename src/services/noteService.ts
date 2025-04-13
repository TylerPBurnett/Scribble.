import { Note } from '../types/Note';
import { htmlToMarkdown } from '../utils/markdownUtils';
import { getSettings } from './settingsService';

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Get notes from localStorage
export const getNotes = (): Note[] => {
  const notesJson = localStorage.getItem('notes');
  if (!notesJson) return [];

  try {
    const notes = JSON.parse(notesJson);
    // Convert string dates back to Date objects
    return notes.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  } catch (error) {
    console.error('Error parsing notes from localStorage:', error);
    return [];
  }
};

// Save notes to localStorage
export const saveNotes = (notes: Note[]): void => {
  localStorage.setItem('notes', JSON.stringify(notes));
};

// Create a new note
export const createNote = (): Note => {
  const newNote: Note = {
    id: generateId(),
    title: '',
    content: '<p></p>',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const notes = getNotes();
  saveNotes([newNote, ...notes]);

  // Save to file if a save location is set
  const settings = getSettings();
  if (settings.saveLocation) {
    try {
      // For a new empty note, just create a minimal markdown file
      window.fileOps.saveNoteToFile(
        newNote.id,
        newNote.title,
        '# Untitled Note\n\n',
        settings.saveLocation
      );
    } catch (error) {
      console.error('Error saving new note to file:', error);
    }
  }

  return newNote;
};

// Update a note
export const updateNote = (updatedNote: Note): Note => {
  const notes = getNotes();
  const updatedNotes = notes.map(note =>
    note.id === updatedNote.id
      ? { ...updatedNote, updatedAt: new Date() }
      : note
  );

  saveNotes(updatedNotes);

  // Get the updated note with the new timestamp
  const finalNote = { ...updatedNote, updatedAt: new Date() };

  // Save to file if a save location is set
  const settings = getSettings();
  if (settings.saveLocation) {
    try {
      // Convert HTML content to Markdown
      const markdownContent = htmlToMarkdown(finalNote.content);

      // Add title as H1 at the beginning if it exists
      const titlePrefix = finalNote.title ? `# ${finalNote.title}\n\n` : '';
      const fullContent = titlePrefix + markdownContent;

      // Save to file
      window.fileOps.saveNoteToFile(
        finalNote.id,
        finalNote.title,
        fullContent,
        settings.saveLocation
      );
    } catch (error) {
      console.error('Error saving note to file:', error);
    }
  }

  return finalNote;
};

// Delete a note
export const deleteNote = (noteId: string): void => {
  const notes = getNotes();

  // Find the note before deleting it
  const noteToDelete = notes.find(note => note.id === noteId);

  // Remove from localStorage
  const filteredNotes = notes.filter(note => note.id !== noteId);
  saveNotes(filteredNotes);

  // Delete the file if a save location is set
  if (noteToDelete) {
    const settings = getSettings();
    if (settings.saveLocation) {
      try {
        window.fileOps.deleteNoteFile(
          noteToDelete.id,
          noteToDelete.title,
          settings.saveLocation
        );
      } catch (error) {
        console.error('Error deleting note file:', error);
      }
    }
  }
};

// Get a note by ID
export const getNoteById = (noteId: string): Note | undefined => {
  const notes = getNotes();
  return notes.find(note => note.id === noteId);
};
