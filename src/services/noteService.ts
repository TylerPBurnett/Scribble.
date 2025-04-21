import { Note } from '../types/Note';
import { htmlToMarkdown, markdownToHtml } from '../utils/markdownUtils';
import { getSettings } from './settingsService';

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Get notes from file system
export const getNotes = async (): Promise<Note[]> => {
  const settings = getSettings();
  if (!settings.saveLocation) return [];

  try {
    const files = await window.fileOps.listNoteFiles(settings.saveLocation);
    const notes: Note[] = [];

    for (const file of files) {
      try {
        // Read the file content
        const content = await window.fileOps.readNoteFile(file.path);

        // Extract title from the first line if it's a heading
        let title = file.name.replace(/\.md$/, '');
        let markdownContent = content;

        // If content starts with a markdown heading, use it as the title
        const headingMatch = content.match(/^# (.+)$/m);
        if (headingMatch) {
          title = headingMatch[1];
          // Remove the heading from the content for display
          markdownContent = content.replace(/^# .+\n\n?/, '');
        }

        // Convert markdown to HTML for the editor
        const htmlContent = markdownToHtml(markdownContent);

        // Create a Note object
        const note: Note = {
          id: file.id,
          title,
          content: htmlContent,
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.modifiedAt)
        };

        notes.push(note);
      } catch (error) {
        console.error(`Error processing file ${file.path}:`, error);
      }
    }

    return notes;
  } catch (error) {
    console.error('Error reading notes from file system:', error);
    return [];
  }
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
  // Get the updated note with the new timestamp
  const finalNote = { ...updatedNote, updatedAt: new Date() };

  // Save to file if a save location is set
  const settings = getSettings();
  console.log('Settings from getSettings():', settings);
  if (settings.saveLocation) {
    console.log('Save location found:', settings.saveLocation);
    try {
      // First, check if we need to handle a title change
      // Get all notes to find the original one
      const notes = await getNotes();
      const originalNote = notes.find(note => note.id === updatedNote.id);
      const oldTitle = originalNote?.title || '';
      const titleChanged = originalNote && originalNote.title !== updatedNote.title;

      console.log('Title change check:', {
        oldTitle,
        newTitle: updatedNote.title,
        changed: titleChanged
      });

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
        oldTitle: titleChanged ? oldTitle : undefined
      });

      try {
        const result = await window.fileOps.saveNoteToFile(
          finalNote.id,
          finalNote.title,
          fullContent,
          settings.saveLocation,
          titleChanged ? oldTitle : undefined
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
  // Get all notes to find the one to delete
  const notes = await getNotes();
  const noteToDelete = notes.find(note => note.id === noteId);

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
export const getNoteById = async (noteId: string): Promise<Note | undefined> => {
  const notes = await getNotes();
  return notes.find(note => note.id === noteId);
};
