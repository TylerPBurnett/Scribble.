import { useState, useEffect, useRef } from 'react';
import { Note } from '../types/Note';
import Tiptap from './Tiptap';
import { updateNote } from '../services/noteService';
import { getSettings, subscribeToSettingsChanges } from '../services/settingsService';
import './NoteEditor.css';

interface NoteEditorProps {
  note: Note;
  onSave?: (note: Note) => void;
}

const NoteEditor = ({ note, onSave }: NoteEditorProps) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Get settings for auto-save
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5000);

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

  // Auto-save when content or title changes
  useEffect(() => {
    // Only set up auto-save if it's enabled
    if (!autoSaveEnabled) {
      return;
    }

    console.log(`Setting up auto-save with interval: ${autoSaveInterval}ms`);

    const saveTimeout = setTimeout(async () => {
      if (note) {
        const updatedNote = {
          ...note,
          title,
          content,
        };
        try {
          console.log('NoteEditor - Saving note:', updatedNote.id);
          const savedNote = await updateNote(updatedNote);
          console.log('NoteEditor - Note saved:', savedNote);
          setLastSaved(savedNote.updatedAt);
          onSave?.(savedNote);

          // Notify other windows that this note has been updated
          window.noteWindow.noteUpdated(note.id);
        } catch (error) {
          console.error('Error saving note:', error);
        }
      }
    }, autoSaveInterval); // Use the interval from settings

    return () => clearTimeout(saveTimeout);
  }, [title, content, note, onSave, autoSaveEnabled, autoSaveInterval]);

  // Format the last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return '';

    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(lastSaved);
  };

  // Dragging functionality
  const [isDragging, setIsDragging] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);

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
    if (isDragging && noteRef.current) {
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
  const handleManualSave = async () => {
    if (note) {
      const updatedNote = {
        ...note,
        title,
        content,
      };
      try {
        console.log('NoteEditor - Manual saving note:', updatedNote.id);
        const savedNote = await updateNote(updatedNote);
        console.log('NoteEditor - Note manually saved:', savedNote);
        setLastSaved(savedNote.updatedAt);
        onSave?.(savedNote);

        // Notify other windows that this note has been updated
        window.noteWindow.noteUpdated(note.id);
      } catch (error) {
        console.error('Error manually saving note:', error);
      }
    }
  };

  return (
    <div className="note-editor" ref={noteRef}>
      <div className="note-editor-header" onMouseDown={handleMouseDown}>
        <div className="note-drag-handle">
          <div className="note-title-container">
            <input
              type="text"
              className="note-title-input"
              value={title}
              onChange={(e) => {
                console.log('Title changed to:', e.target.value);
                setTitle(e.target.value);
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
                  title="Save now"
                >
                  <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {lastSaved && (
                <div className="last-saved">
                  Last saved: {formatLastSaved()}
                </div>
              )}
            </div>

            <div className="note-controls">
              <svg
                className="note-close-icon"
                onClick={handleClose}
                title="Close note"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
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
          onUpdate={setContent}
          placeholder="Start typing here..."
          autofocus={true}
        />
      </div>
    </div>
  );
};

export default NoteEditor;
