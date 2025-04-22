import { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '../../shared/types/Note';
import Tiptap from './Tiptap';
import { updateNote } from '../../shared/services/noteService';
import { getSettings, subscribeToSettingsChanges } from '../../shared/services/settingsService';
import './NoteEditor.css';

interface NoteEditorProps {
  note: Note;
  onSave?: (note: Note) => void;
}

const NoteEditor = ({ note, onSave }: NoteEditorProps) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isDirty, setIsDirty] = useState(false);

  // Get settings for auto-save
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5000);

  // Use refs to store the latest values for use in debounced functions
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const noteDataRef = useRef(note);
  const isDirtyRef = useRef(isDirty);

  // Ref for the DOM element
  const editorDomRef = useRef<HTMLDivElement>(null);

  // Update refs when state changes
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    noteDataRef.current = note;
  }, [note]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Load settings on component mount and subscribe to changes
  useEffect(() => {
    // Initial settings load
    const settings = getSettings();
    setAutoSaveEnabled(settings.autoSave);
    setAutoSaveInterval(settings.autoSaveInterval * 1000); // Convert to milliseconds

    // Subscribe to settings changes
    const unsubscribe = subscribeToSettingsChanges((newSettings) => {
      console.log('Settings changed in NoteEditor:', newSettings);
      setAutoSaveEnabled(newSettings.autoSave);
      setAutoSaveInterval(newSettings.autoSaveInterval * 1000);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Define a stable save function that uses refs to access the latest state
  const saveNote = useCallback(async () => {
    const currentNote = noteDataRef.current;
    const currentTitle = titleRef.current;
    const currentContent = contentRef.current;

    if (!currentNote) return;

    const updatedNote = {
      ...currentNote,
      title: currentTitle,
      content: currentContent,
    };

    try {
      console.log('NoteEditor - Saving note:', updatedNote.id);
      const savedNote = await updateNote(updatedNote);
      console.log('NoteEditor - Note saved:', savedNote);

      // Update the note reference with the saved note
      // This is crucial for subsequent renames to work correctly
      noteDataRef.current = savedNote;
      console.log('NoteEditor - Updated note reference:', noteDataRef.current);

      onSave?.(savedNote);

      // Notify other windows that this note has been updated
      // Use the saved note ID which might have changed if the title was changed
      window.noteWindow.noteUpdated(savedNote.id);

      // Reset dirty state after successful save
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [onSave]);

  // Create a debounced version of saveNote
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null;

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          if (isDirtyRef.current) {
            saveNote();
          }
        }, autoSaveInterval);
      };
    })(),
    [saveNote, autoSaveInterval]
  );

  // Trigger auto-save when content or title changes
  useEffect(() => {
    // Mark as dirty when content or title changes
    setIsDirty(true);
  }, [title, content]);

  // Trigger debounced save when isDirty changes
  useEffect(() => {
    if (isDirty && autoSaveEnabled) {
      console.log(`Triggering debounced save with interval: ${autoSaveInterval}ms`);
      debouncedSave();
    }
  }, [isDirty, autoSaveEnabled, debouncedSave]);

  // Last saved time formatting removed

  // Dragging functionality
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the title bar
    if ((e.target as HTMLElement).closest('.note-drag-handle')) {
      setIsDragging(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      // Use IPC to move the window instead of remote
      window.windowControls.moveWindow(e.movementX, e.movementY);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleClose = () => {
    window.windowControls.close();
  };

  // Manual save function
  const handleManualSave = () => {
    console.log('Manual save triggered');
    saveNote();
  };

  // Content update handler
  const handleContentUpdate = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  return (
    <div className="note-editor" ref={editorDomRef}>
      <div className="note-editor-header" onMouseDown={handleMouseDown}>
        <div className="note-drag-handle">
          <div className="note-title-container">
            {/* Back to basics with a simple input */}
            <input
              type="text"
              className="note-title-input"
              value={title}
              onChange={(e) => {
                const newTitle = e.target.value;
                console.log('Title changed to:', newTitle);
                setTitle(newTitle);
              }}
              placeholder="Untitled Note"
            />
          </div>

          <div className="note-header-right">
            <div className="note-header-actions">
              {!autoSaveEnabled && (
                <svg
                  className="save-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  onClick={handleManualSave}
                >
                  <title>Save now</title>
                  <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {/* Last saved timestamp removed */}
            </div>

            <div className="note-controls">
              <svg
                className="note-close-icon"
                onClick={handleClose}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Close note</title>
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="note-editor-content">
        <Tiptap
          content={content}
          onUpdate={handleContentUpdate}
          placeholder="Start typing here..."
          autofocus={true}
        />
      </div>
    </div>
  );
};

export default NoteEditor;
