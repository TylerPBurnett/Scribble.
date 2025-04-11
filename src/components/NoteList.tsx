import { useState } from 'react';
import { Note } from '../types/Note';
import NoteCard from './NoteCard';
import ConfirmDialog from './ConfirmDialog';
import './NoteList.css';

interface NoteListProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onNoteDelete?: (note: Note) => void;
  activeNoteId?: string;
}

const NoteList = ({ notes, onNoteClick, onNoteDelete, activeNoteId }: NoteListProps) => {
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (noteToDelete && onNoteDelete) {
      onNoteDelete(noteToDelete);
    }
    setNoteToDelete(null);
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setNoteToDelete(null);
  };

  // Handle delete request
  const handleDeleteRequest = (note: Note) => {
    setNoteToDelete(note);
  };

  return (
    <>
      <div className="note-list">
        {notes.length === 0 ? (
          <div className="no-notes">
            <p>No notes yet. Create your first note!</p>
          </div>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={onNoteClick}
              onDelete={onNoteDelete ? handleDeleteRequest : undefined}
              isActive={note.id === activeNoteId}
            />
          ))
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={noteToDelete !== null}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title || 'Untitled Note'}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default NoteList;
