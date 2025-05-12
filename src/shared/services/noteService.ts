import { Note } from '../types/Note';
import { htmlToMarkdown, markdownToHtml } from '../utils/markdownUtils';
import { getSettings } from './settingsService';

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper function to parse metadata from HTML comments
const parseMetadata = (content: string): { metadata: Record<string, any>, content: string } => {
  // Look for metadata in HTML comment at the end of the file
  // Format: <!-- scribble-metadata: {"color":"#fff9c4","pinned":true} -->
  const metadataRegex = /<!-- scribble-metadata: (.*?) -->\s*$/;
  const match = content.match(metadataRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  try {
    // Parse the JSON metadata
    const metadataJson = match[1];
    const metadata = JSON.parse(metadataJson);

    // Remove the metadata comment from content
    const contentWithoutMetadata = content.replace(metadataRegex, '');

    return {
      metadata,
      content: contentWithoutMetadata
    };
  } catch (error) {
    console.error('Error parsing metadata JSON:', error);
    return { metadata: {}, content };
  }
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
        const fileContent = await window.fileOps.readNoteFile(file.path);

        // Parse metadata from HTML comments
        const { metadata, content } = parseMetadata(fileContent);

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
        // We'll use the file ID as the note ID to ensure consistency
        // This is important for file renaming to work correctly
        const note: Note = {
          id: file.id,
          title,
          content: htmlContent,
          createdAt: new Date(file.createdAt),
          updatedAt: new Date(file.modifiedAt),
          // Add metadata properties
          color: metadata.color,
          pinned: metadata.pinned
        };

        console.log('Created note from file:', {
          fileId: file.id,
          fileName: file.name,
          noteId: note.id,
          noteTitle: note.title,
          color: note.color,
          pinned: note.pinned
        });

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
  // Create a new note with a temporary ID
  const newNote: Note = {
    id: generateId(),
    title: 'Untitled Note', // Set a default title
    content: '<p></p>',
    createdAt: new Date(),
    updatedAt: new Date(),
    // Add a flag to indicate this is a new note that hasn't been saved yet
    _isNew: true
  };

  // We don't immediately save the file to disk
  // This prevents creating multiple files as the user edits the title
  // The first save will happen when the user makes changes or when they blur the title field
  console.log('Created new note with temporary ID:', newNote.id);

  return newNote;
};

// Update a note
export const updateNote = async (updatedNote: Note): Promise<Note> => {
  // Get the updated note with the new timestamp
  const finalNote = {
    ...updatedNote,
    updatedAt: new Date(),
    // Remove the _isNew flag if it exists - the note is now being saved
    _isNew: undefined
  };

  // Save to file if a save location is set
  const settings = getSettings();
  console.log('Settings from getSettings():', settings);
  if (settings.saveLocation) {
    console.log('Save location found:', settings.saveLocation);

    // Check if this is a new note being saved for the first time
    const isFirstSave = updatedNote._isNew === true;

    // If this is a new note being saved for the first time, handle it specially
    if (isFirstSave) {
      console.log('First save of a new note with custom title:', updatedNote.title);
      // We'll skip the file lookup since there shouldn't be a file yet

      // Convert HTML content to Markdown
      const markdownContent = htmlToMarkdown(finalNote.content);

      // Add title as H1 at the beginning if it exists
      const titlePrefix = finalNote.title ? `# ${finalNote.title}\n\n` : '';

      // Create metadata as JSON in HTML comment at the end of the file
      const metadata: Record<string, any> = {};
      if (finalNote.color) {
        metadata.color = finalNote.color;
      }
      if (finalNote.pinned !== undefined) {
        metadata.pinned = finalNote.pinned;
      }

      // Only add metadata comment if there's actual metadata to store
      const metadataComment = Object.keys(metadata).length > 0
        ? `\n\n<!-- scribble-metadata: ${JSON.stringify(metadata)} -->`
        : '';

      const fullContent = titlePrefix + markdownContent + metadataComment;

      // Save directly with the custom title
      try {
        const result = await window.fileOps.saveNoteToFile(
          finalNote.id,
          finalNote.title,
          fullContent,
          settings.saveLocation
        );
        console.log('First save result:', result);
        return finalNote;
      } catch (saveError) {
        console.error('Error in first saveNoteToFile:', saveError);
        return finalNote;
      }
    }

    try {
      // For existing notes, we need to find the current file name on disk
      // This is more reliable than using getNotes() which might not have the latest info
      let oldTitle = '';
      let titleChanged = false;

      try {
        // List all files in the directory
        const files = await window.fileOps.listNoteFiles(settings.saveLocation);
        console.log('Files in directory:', files.map(f => ({ name: f.name, id: f.id })));

        // Try to find a file that matches this note's ID
        // We need to be more flexible in finding the file since the ID might not match the filename exactly
        // First try exact ID match
        let matchingFile = files.find(file => file.id === updatedNote.id);

        // If not found, try to find by creating a safe version of the note ID
        if (!matchingFile) {
          const safeNoteId = updatedNote.id.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
          matchingFile = files.find(file => file.id === safeNoteId);
        }

        // If still not found, try to find by the note title (this is a fallback)
        if (!matchingFile) {
          const safeTitleToFind = updatedNote.title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
          matchingFile = files.find(file => {
            const safeFileName = file.name.replace(/\.md$/, '');
            return safeFileName === safeTitleToFind;
          });
        }

        console.log('Matching file found:', matchingFile ? { name: matchingFile.name, id: matchingFile.id } : 'Not found');

        if (matchingFile) {
          // Extract the title from the filename
          const fileNameWithoutExt = matchingFile.name.replace(/\.md$/, '');

          // We need to compare using the same safe title format that was used to create the file
          const oldSafeTitle = fileNameWithoutExt;
          const newSafeTitle = updatedNote.title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();

          // Store the original title for the file rename operation
          oldTitle = fileNameWithoutExt;

          // Check if the safe versions of the titles are different
          titleChanged = oldSafeTitle !== newSafeTitle;

          console.log('Direct file comparison:', {
            fileNameWithoutExt,
            oldSafeTitle,
            newSafeTitle,
            newTitle: updatedNote.title,
            changed: titleChanged
          });
        }
      } catch (fileError) {
        console.error('Error finding original file:', fileError);
      }

      console.log('Final title change decision:', {
        oldTitle,
        newTitle: updatedNote.title,
        changed: titleChanged
      });

      // Convert HTML content to Markdown
      const markdownContent = htmlToMarkdown(finalNote.content);

      // Add title as H1 at the beginning if it exists
      const titlePrefix = finalNote.title ? `# ${finalNote.title}\n\n` : '';

      // Create metadata as JSON in HTML comment at the end of the file
      const metadata: Record<string, any> = {};
      if (finalNote.color) {
        metadata.color = finalNote.color;
      }
      if (finalNote.pinned !== undefined) {
        metadata.pinned = finalNote.pinned;
      }

      // Only add metadata comment if there's actual metadata to store
      const metadataComment = Object.keys(metadata).length > 0
        ? `\n\n<!-- scribble-metadata: ${JSON.stringify(metadata)} -->`
        : '';

      const fullContent = titlePrefix + markdownContent + metadataComment;

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
  console.log('Getting note by ID:', noteId);
  const notes = await getNotes();

  // First try exact ID match
  let note = notes.find(note => note.id === noteId);

  // If not found, try to find by creating a safe version of the note ID
  if (!note) {
    const safeNoteId = noteId.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    note = notes.find(note => note.id === safeNoteId);
    console.log('Trying safe note ID:', safeNoteId, note ? 'Found' : 'Not found');
  }

  // If still not found, try to find by matching the ID with the safe version of the title
  if (!note) {
    note = notes.find(note => {
      const safeTitle = note.title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
      return safeTitle === noteId || noteId.includes(safeTitle) || safeTitle.includes(noteId);
    });
    console.log('Trying partial title match:', note ? 'Found' : 'Not found');
  }

  return note;
};
