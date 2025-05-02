import { useState } from 'react';
import { Note } from '../../shared/types/Note';
import { deleteNote } from '../../shared/services/noteService';
import NoteCard from './NoteCard';

interface NoteListProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  activeNoteId?: string;
  onNoteDelete?: (noteId: string) => void;
}

const NoteList = ({ notes, onNoteClick, activeNoteId, onNoteDelete }: NoteListProps) => {
  const [deletedNotes, setDeletedNotes] = useState<string[]>([]);

  // Handle note deletion
  const handleNoteDelete = async (noteId: string) => {
    console.log('NoteList - Deleting note:', noteId);
    // Delete the note using the service
    try {
      await deleteNote(noteId);
      console.log('NoteList - Note deleted from service');

      // Add to deleted notes list to remove from UI
      setDeletedNotes([...deletedNotes, noteId]);

      // Call the parent's onNoteDelete if provided
      if (onNoteDelete) {
        onNoteDelete(noteId);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  // Filter out deleted notes
  const filteredNotes = notes.filter(note => !deletedNotes.includes(note.id));

  // Separate pinned notes from other notes
  const pinnedNotes = filteredNotes.filter(note => note.pinned);
  const otherNotes = filteredNotes.filter(note => !note.pinned);

  return (
    <div className="notes-container flex-1 px-8 py-6 overflow-y-auto bg-background-notes transition-all duration-300">
      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="notes-section mb-8">
          <div className="section-title flex items-center gap-2 text-sm font-medium text-text-tertiary mb-4 uppercase tracking-wider">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>Pinned</span>
          </div>
          <div className="notes-grid grid grid-cols-auto-fill-250 gap-5">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={onNoteClick}
                isActive={note.id === activeNoteId}
                onDelete={handleNoteDelete}
                isPinned={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Notes Section */}
      <div className="notes-section mb-8">
        <div className="section-title flex items-center gap-2 text-sm font-medium text-text-tertiary mb-4 uppercase tracking-wider">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Other Notes</span>
          <span className="text-xs bg-background-tertiary px-2 py-0.5 rounded-full">
            {otherNotes.length}
          </span>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="empty-state flex flex-col items-center justify-center py-12 text-center">
            <div className="empty-icon text-text-tertiary opacity-50 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">No notes yet</h2>
            <p className="text-text-tertiary mb-6">Create your first note to get started</p>
            <button
              className="primary-button flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-md font-medium hover:bg-primary-dark transition-colors"
              onClick={() => {
                // This is just a placeholder - the actual new note functionality is handled in the parent component
                console.log('Create new note clicked in empty state');
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Note
            </button>
          </div>
        ) : (
          <div className="notes-grid grid grid-cols-auto-fill-250 gap-5">
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={onNoteClick}
                isActive={note.id === activeNoteId}
                onDelete={handleNoteDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteList;
