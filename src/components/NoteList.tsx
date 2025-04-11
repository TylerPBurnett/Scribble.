import { Note } from '../types/Note';
import NoteCard from './NoteCard';
import './NoteList.css';

interface NoteListProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  activeNoteId?: string;
}

const NoteList = ({ notes, onNoteClick, activeNoteId }: NoteListProps) => {
  return (
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
            isActive={note.id === activeNoteId}
          />
        ))
      )}
    </div>
  );
};

export default NoteList;
