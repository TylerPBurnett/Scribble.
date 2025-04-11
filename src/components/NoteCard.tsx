import { useState } from 'react';
import { Note } from '../types/Note';
import './NoteCard.css';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete?: (note: Note) => void;
  isActive?: boolean;
}

const NoteCard = ({ note, onClick, onDelete, isActive = false }: NoteCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

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

  // Generate a random pastel color based on the note ID
  const getNoteColor = () => {
    // Use the first 6 characters of the note ID as a seed
    const seed = note.id.substring(0, 6);
    // Convert to a number and use it to pick from predefined colors
    const colorIndex = parseInt(seed, 36) % noteColors.length;
    return noteColors[colorIndex];
  };

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the note click event
    if (onDelete) {
      onDelete(note);
    }
  };

  return (
    <div
      className={`note-card ${isActive ? 'active' : ''}`}
      style={{ backgroundColor: getNoteColor() }}
      onClick={() => onClick(note)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && onDelete && (
        <button
          className="note-delete-btn"
          onClick={handleDeleteClick}
          aria-label="Delete note"
        >
          ×
        </button>
      )}
      <h3 className="note-title">{note.title || 'New Note'}</h3>
      <p className="note-preview">{getContentPreview(note.content)}</p>
      <div className="note-date">{formatDate(note.createdAt)}</div>
    </div>
  );
};

// Predefined pastel colors for notes
const noteColors = [
  '#ffcdd2', // Light Red
  '#f8bbd0', // Light Pink
  '#e1bee7', // Light Purple
  '#d1c4e9', // Light Deep Purple
  '#c5cae9', // Light Indigo
  '#bbdefb', // Light Blue
  '#b3e5fc', // Light Light Blue
  '#b2ebf2', // Light Cyan
  '#b2dfdb', // Light Teal
  '#c8e6c9', // Light Green
  '#dcedc8', // Light Light Green
  '#f0f4c3', // Light Lime
  '#fff9c4', // Light Yellow
  '#ffecb3', // Light Amber
  '#ffe0b2', // Light Orange
  '#ffccbc', // Light Deep Orange
];

export default NoteCard;
