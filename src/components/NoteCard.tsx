import { useState } from 'react';
import { Note } from '../types/Note';
import { deleteNote } from '../services/noteService';
import './NoteCard.css';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  isActive?: boolean;
  onDelete?: (noteId: string) => void;
}

const NoteCard = ({ note, onClick, isActive = false, onDelete }: NoteCardProps) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Assign a color based on the note ID (for consistent colors)
  const getNoteColor = () => {
    const colors = ['color-pink', 'color-yellow', 'color-blue', 'color-green'];
    // Use the last character of the ID to determine the color
    const lastChar = note.id.charAt(note.id.length - 1);
    const colorIndex = parseInt(lastChar, 16) % colors.length;
    return colors[colorIndex];
  };

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the note click
    setShowConfirmDelete(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the note click
    if (onDelete) {
      onDelete(note.id);
    } else {
      // Fallback if onDelete prop is not provided
      deleteNote(note.id);
      // Reload notes (this is not ideal, but works as a fallback)
      window.location.reload();
    }
  };

  // Handle cancel delete
  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the note click
    setShowConfirmDelete(false);
  };
  // Format date to display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Get a preview of the content (strip HTML and limit length)
  const getContentPreview = (content: string) => {
    // Remove HTML tags
    const plainText = content.replace(/<[^>]*>/g, '');
    // Limit to 100 characters
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  return (
    <div
      className={`note-card ${isActive ? 'active' : ''} ${getNoteColor()}`}
      onClick={() => onClick(note)}
    >
      {/* Delete button */}
      <button
        className="note-delete-btn"
        onClick={handleDeleteClick}
        title="Delete note"
      >
        ×
      </button>

      <h3 className="note-title">{note.title || 'Untitled Note'}</h3>
      <p className="note-preview">{getContentPreview(note.content)}</p>
      <div className="note-date">{formatDate(note.createdAt)}</div>

      {/* Confirmation dialog */}
      {showConfirmDelete && (
        <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
          <div className="delete-confirm-content">
            <p>Are you sure you want to delete this note?</p>
            <div className="delete-confirm-actions">
              <button onClick={handleConfirmDelete}>Delete</button>
              <button onClick={handleCancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCard;
