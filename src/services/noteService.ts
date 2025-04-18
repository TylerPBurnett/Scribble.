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
export const createNote = async (): Promise<Note> => {
  const newNote: Note = {
    id: generateId(),
    title: 'Untitled Note', // Set a default title
    content: '<p></p>',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const notes = getNotes();
  saveNotes([newNote, ...notes]);

  // Save to file if a save location is set
  const settings = getSettings();
  console.log('Create Note - Settings:', settings);
  if (settings.saveLocation) {
    console.log('Create Note - Save location found:', settings.saveLocation);
    try {
      // For a new empty note, just create a minimal markdown file
      console.log('Creating new note file with:', {
        id: newNote.id,
        title: newNote.title,
        saveLocation: settings.saveLocation
      });

      try {
        const result = await window.fileOps.saveNoteToFile(
          newNote.id,
          newNote.title,
          '# Untitled Note\n\n',
          settings.saveLocation
        );
        console.log('Create note file result:', result);
      } catch (saveError) {
        console.error('Error creating note file:', saveError);
      }
    } catch (error) {
      console.error('Error saving new note to file:', error);
    }
  } else {
    console.log('Create Note - No save location found in settings');
  }

  return newNote;
};

// Update a note
export const updateNote = async (updatedNote: Note): Promise<Note> => {
  const notes = getNotes();

  // Find the original note to check if title has changed
  const originalNote = notes.find(note => note.id === updatedNote.id);
  const oldTitle = originalNote?.title || '';

  // Check if title has changed
  const titleChanged = originalNote && originalNote.title !== updatedNote.title;
  console.log('Title changed?', {
    oldTitle: originalNote?.title,
    newTitle: updatedNote.title,
    changed: titleChanged
  });

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
  console.log('Settings from getSettings():', settings);
  if (settings.saveLocation) {
    console.log('Save location found:', settings.saveLocation);
    try {
      // Convert HTML content to Markdown
      const markdownContent = htmlToMarkdown(finalNote.content);

      // Add title as H1 at the beginning if it exists
      const titlePrefix = finalNote.title ? `# ${finalNote.title}\n\n` : '';
      const fullContent = titlePrefix + markdownContent;

      // Save to file
      console.log('Calling saveNoteToFile with:', {
        id: finalNote.id,
        title: finalNote.title,
        saveLocation: settings.saveLocation,
        oldTitle
      });

      try {
        // Only pass oldTitle if the title has actually changed
        const titleToPass = titleChanged ? oldTitle : undefined;
        console.log('Passing to saveNoteToFile:', {
          id: finalNote.id,
          title: finalNote.title,
          oldTitle: titleToPass,
          titleChanged
        });

        const result = await window.fileOps.saveNoteToFile(
          finalNote.id,
          finalNote.title,
          fullContent,
          settings.saveLocation,
          titleToPass // Pass the old title only if title changed
        );
        console.log('Save result:', result);
      } catch (saveError) {
        console.error('Error in saveNoteToFile:', saveError);
      }
    } catch (error) {
      console.error('Error saving note to file:', error);
    }
  } else {
    console.log('No save location found in settings');
  }

  return finalNote;
};

// Delete a note
export const deleteNote = async (noteId: string): Promise<void> => {
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
        console.log('Deleting note file:', {
          id: noteToDelete.id,
          title: noteToDelete.title,
          saveLocation: settings.saveLocation
        });

        try {
          const result = await window.fileOps.deleteNoteFile(
            noteToDelete.id,
            noteToDelete.title,
            settings.saveLocation
          );
          console.log('Delete note file result:', result);
        } catch (deleteError) {
          console.error('Error in deleteNoteFile:', deleteError);
        }
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
