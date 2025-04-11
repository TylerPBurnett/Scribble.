import { Note } from '../types/Note';
import './NoteCard.css';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  isActive?: boolean;
}

const NoteCard = ({ note, onClick, isActive = false }: NoteCardProps) => {
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
      className={`note-card ${isActive ? 'active' : ''}`} 
      onClick={() => onClick(note)}
    >
      <h3 className="note-title">{note.title || 'New Note'}</h3>
      <p className="note-preview">{getContentPreview(note.content)}</p>
      <div className="note-date">{formatDate(note.createdAt)}</div>
    </div>
  );
};

export default NoteCard;
