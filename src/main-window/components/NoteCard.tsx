import { useState, useEffect } from 'react';
import { Note } from '../../shared/types/Note';
import { deleteNote } from '../../shared/services/noteService';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  isActive?: boolean;
  onDelete?: (noteId: string) => void;
  isPinned?: boolean;
}

const NoteCard = ({ note, onClick, isActive = false, onDelete, isPinned = false }: NoteCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isContextMenu, setIsContextMenu] = useState(false);

  // Effect to close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isContextMenu && showMenu) {
        setShowMenu(false);
        setIsContextMenu(false);
      }
    };

    // Add event listener when context menu is open
    if (isContextMenu && showMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    // Clean up event listener
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isContextMenu, showMenu]);

  // Assign a color based on the note ID (for consistent colors)
  const getNoteColor = () => {
    const colors = [
      { border: 'border-l-note-slate', className: 'slate' },
      { border: 'border-l-note-sky', className: 'sky' },
      { border: 'border-l-note-emerald', className: 'emerald' },
      { border: 'border-l-note-amber', className: 'amber' },
      { border: 'border-l-note-rose', className: 'rose' },
      { border: 'border-l-note-violet', className: 'violet' }
    ];

    // Default to first color if note ID is missing
    if (!note || !note.id) {
      return colors[0];
    }

    // Use the last character of the ID to determine the color
    const lastChar = note.id.charAt(note.id.length - 1);
    const colorIndex = parseInt(lastChar, 16) % colors.length || 0; // Default to 0 if NaN
    return colors[colorIndex];
  };

  // Toggle dropdown menu
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the note click
    setShowMenu(!showMenu);
    setIsContextMenu(false);
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default browser context menu
    e.stopPropagation(); // Prevent triggering the note click

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Menu dimensions (approximate)
    const menuWidth = 150;
    const menuHeight = 120;

    // Calculate position to ensure menu stays within viewport
    let x = e.clientX;
    let y = e.clientY;

    // Adjust if menu would go off right edge
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }

    // Adjust if menu would go off bottom edge
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }

    // Position the menu at the adjusted cursor location
    setMenuPosition({ x, y });
    setIsContextMenu(true);
    setShowMenu(true);
  };

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the note click
    setShowMenu(false);
    setShowConfirmDelete(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the note click
    if (onDelete) {
      onDelete(note.id);
    } else {
      // Fallback if onDelete prop is not provided
      console.log('NoteCard - Deleting note (fallback):', note.id);
      try {
        await deleteNote(note.id);
        console.log('NoteCard - Note deleted');
        // Notify other windows that this note has been deleted
        window.noteWindow.noteUpdated(note.id);
        // Reload notes (this is not ideal, but works as a fallback)
        window.location.reload();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  // Handle cancel delete
  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the note click
    setShowConfirmDelete(false);
  };

  // Format date to display
  const formatDate = (date: Date) => {
    // Calculate time ago (similar to formatDistanceToNow from date-fns)
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    // Fall back to standard date format for older dates
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Get a preview of the content (strip HTML and limit length)
  const getContentPreview = (content: string) => {
    // Remove HTML tags but preserve line breaks and basic formatting
    const plainText = content
      .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> to newlines
      .replace(/<p[^>]*>/gi, '')      // Remove opening <p> tags
      .replace(/<\/p>/gi, '\n')       // Convert closing </p> tags to newlines
      .replace(/<h[1-6][^>]*>/gi, '') // Remove opening heading tags
      .replace(/<\/h[1-6]>/gi, '\n')  // Convert closing heading tags to newlines
      .replace(/<li[^>]*>/gi, '• ')   // Convert list items to bullets
      .replace(/<\/li>/gi, '\n')      // Add newlines after list items
      .replace(/<[^>]*>/g, '');       // Remove all other HTML tags

    // Limit to 120 characters for more content display
    return plainText.length > 120 ? plainText.substring(0, 120) + '...' : plainText;
  };

  const colorInfo = getNoteColor();

  return (
    <div
      className={`note-card ${colorInfo.className} ${isActive ? 'selected' : ''} bg-background-titlebar rounded-lg overflow-hidden flex flex-col ${colorInfo.border} border-l-3 shadow-none transition-all duration-200 cursor-pointer h-note-card-compact
        hover:translate-y-[-2px] hover:shadow-none group`}
      onClick={() => onClick(note)}
      onContextMenu={handleContextMenu}
    >
      {/* Note Header */}
      <div className="note-header px-3 py-1.5 flex items-center justify-between border-b-0">
        <h3 className="note-title text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] text-text">
          {note.title || 'Untitled Note'}
        </h3>
        <div className="note-actions flex items-center gap-1 relative">
          {/* Pin icon */}
          {isPinned && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pin-icon text-primary">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          )}

          {/* More options button - only visible on hover */}
          <button
            className="more-button w-5 h-5 flex items-center justify-center bg-transparent border-none text-text-tertiary rounded hover:bg-background-notes/30 hover:text-text opacity-0 group-hover:opacity-100"
            onClick={toggleMenu}
            title="More options"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              className={`dropdown-menu absolute ${
                isContextMenu
                  ? 'fixed'
                  : 'top-full right-0'
              } bg-background-titlebar rounded-md ${
                isContextMenu ? 'shadow-[0_5px_15px_rgba(0,0,0,0.3)]' : 'shadow-md'
              } z-50 min-w-[150px] overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
              style={isContextMenu ? { top: menuPosition.y, left: menuPosition.x } : {}}
            >
              <button
                className="flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-text-secondary text-left cursor-pointer transition-colors hover:bg-background-notes/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onClick(note); // Open the note for editing
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit</span>
              </button>
              <button
                className="flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-text-secondary text-left cursor-pointer transition-colors hover:bg-background-notes/30"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  console.log('Duplicate note:', note.id);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Duplicate</span>
              </button>
              <button
                className="delete-action flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-danger text-left cursor-pointer transition-colors hover:bg-background-notes/30"
                onClick={handleDeleteClick}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note Content */}
      <div className="note-content flex-1 px-3 py-1 text-[10px] text-text-secondary overflow-hidden whitespace-pre-line">
        {getContentPreview(note.content) || <span className="empty-content italic text-text-tertiary">No content</span>}
      </div>

      {/* Note Footer */}
      <div className="note-footer px-3 py-1 flex items-center justify-between text-[10px] text-text-tertiary bg-background-titlebar/80">
        <span className="note-date">{formatDate(note.createdAt)}</span>
      </div>

      {/* Confirmation dialog */}
      {showConfirmDelete && (
        <div
          className="absolute inset-0 bg-background-titlebar/95 flex items-center justify-center z-10 rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center p-4">
            <p className="m-0 mb-4 text-text">Are you sure you want to delete this note?</p>
            <div className="flex justify-center gap-3">
              <button
                className="primary-button px-4 py-2 rounded bg-danger text-white border-none text-sm cursor-pointer transition-all duration-200 hover:bg-danger/90"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
              <button
                className="px-4 py-2 rounded bg-transparent text-text border border-border/20 text-sm cursor-pointer transition-all duration-200 hover:bg-background-notes/30"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCard;
