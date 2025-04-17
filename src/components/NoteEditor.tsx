import { useState, useEffect, useRef } from 'react';
import { Note } from '../types/Note';
import Tiptap from './Tiptap';
import { updateNote } from '../services/noteService';
import { getSettings } from '../services/settingsService';
import './NoteEditor.css';

interface NoteEditorProps {
  note: Note;
  onSave?: (note: Note) => void;
}

const NoteEditor = ({ note, onSave }: NoteEditorProps) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save when content or title changes
  useEffect(() => {
    // Get settings for auto-save interval
    const settings = getSettings();
    const autoSaveEnabled = settings.autoSave;
    const autoSaveInterval = settings.autoSaveInterval * 1000; // Convert to milliseconds

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
  }, [title, content, note, onSave]);

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
          <div className="note-controls">
            <button className="note-close-btn" onClick={handleClose} title="Close note">
              ×
            </button>
          </div>
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
        <div className="note-header-actions">
          <button
            className="save-btn"
            onClick={handleManualSave}
            title="Save now"
          >
            💾
          </button>
          {lastSaved && (
            <div className="last-saved">
              Last saved: {formatLastSaved()}
            </div>
          )}
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
