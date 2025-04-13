import { useState, useEffect } from 'react';
import { Note } from '../types/Note';
import Tiptap from './Tiptap';
import { updateNote } from '../services/noteService';
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
    const saveTimeout = setTimeout(() => {
      if (note) {
        const updatedNote = {
          ...note,
          title,
          content,
        };
        const savedNote = updateNote(updatedNote);
        setLastSaved(savedNote.updatedAt);
        onSave?.(savedNote);

        // Notify other windows that this note has been updated
        window.noteWindow.noteUpdated(note.id);
      }
    }, 1000); // Save after 1 second of inactivity

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

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <input
          type="text"
          className="note-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Note"
        />
        {lastSaved && (
          <div className="last-saved">
            Last saved: {formatLastSaved()}
          </div>
        )}
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
