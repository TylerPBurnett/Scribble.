import { Note } from '../types/Note';

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
  return { ...updatedNote, updatedAt: new Date() };
};

// Delete a note
export const deleteNote = (noteId: string): void => {
  const notes = getNotes();
  const filteredNotes = notes.filter(note => note.id !== noteId);
  saveNotes(filteredNotes);
};

// Get a note by ID
export const getNoteById = (noteId: string): Note | undefined => {
  const notes = getNotes();
  return notes.find(note => note.id === noteId);
};
