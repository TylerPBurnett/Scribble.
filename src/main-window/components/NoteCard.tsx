import { useState, useEffect } from 'react';
import { Note } from '../../shared/types/Note';
import { deleteNote, updateNote } from '../../shared/services/noteService';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  isActive?: boolean;
  onDelete?: (noteId: string) => void;
  isPinned?: boolean;
}

const NoteCard = ({ note, onClick, isActive = false, onDelete, isPinned = false }: NoteCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isContextMenu, setIsContextMenu] = useState(false);

  // Define color options
  const colorOptions = [
    { name: 'Yellow', value: '#fff9c4' }, // Default sticky note color
    { name: 'White', value: '#ffffff' },
    { name: 'Black', value: '#333333' },
    { name: 'Pastel Green', value: '#d0f0c0' },
    { name: 'Pastel Blue', value: '#b5d8eb' },
    { name: 'Pastel Purple', value: '#d8c2ef' },
    { name: 'Pastel Pink', value: '#f4c2c2' },
    { name: 'Pastel Gray', value: '#d3d3d3' }
  ];

  // Effect to handle context menu
  useEffect(() => {
    // Function to close the menu when clicking anywhere
    const handleGlobalClick = () => {
      if (showMenu) {
        setShowMenu(false);
        setIsContextMenu(false);
      }
    };

    // Add global click listener to close menu
    if (showMenu) {
      // Add with a slight delay to prevent immediate closing
      const timeoutId = setTimeout(() => {
        window.addEventListener('click', handleGlobalClick);
      }, 50);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('click', handleGlobalClick);
      };
    }

    return undefined;
  }, [showMenu]);

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
    // Prevent default browser context menu and note click
    e.preventDefault();
    e.stopPropagation();

    // Close any existing menu first
    setShowMenu(false);
    setIsContextMenu(false);

    // Calculate position, ensuring menu stays within viewport
    const x = Math.min(e.clientX, window.innerWidth - 160);
    const y = Math.min(e.clientY, window.innerHeight - 200);

    console.log('Opening context menu at:', x, y);

    // Use setTimeout to ensure state updates happen after current event cycle
    setTimeout(() => {
      setMenuPosition({ x, y });
      setIsContextMenu(true);
      setShowMenu(true);
    }, 0);

    // Stop event propagation
    return false;
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

    // Limit to 180 characters for more content display
    return plainText.length > 180 ? plainText.substring(0, 180) + '...' : plainText;
  };

  // Get note color styling
  const getNoteColorStyle = () => {
    // If note has a custom color, use it
    if (note.color) {
      // For dark background, use light text
      if (note.color === '#333333') {
        return {
          backgroundColor: note.color,
          color: '#ffffff',
          headerBg: '#444444',
          footerBg: '#444444'
        };
      }
      // For white background, use dark text
      else if (note.color === '#ffffff') {
        return {
          backgroundColor: note.color,
          color: '#333333',
          headerBg: '#f8f8f8',
          footerBg: '#f8f8f8'
        };
      }
      // For other colors, use default text color
      else {
        return {
          backgroundColor: note.color,
          color: '',
          headerBg: note.color,
          footerBg: note.color
        };
      }
    }

    // Default styling
    return {
      backgroundColor: '#192734',
      color: '',
      headerBg: '',
      footerBg: ''
    };
  };

  const colorStyle = getNoteColorStyle();
  const colorInfo = getNoteColor();

  return (
    <>
      {/* Context Menu Overlay - rendered at the root level */}
      {showMenu && isContextMenu && (
        <div
          className="fixed inset-0 z-[9998] bg-transparent"
          onClick={() => {
            setShowMenu(false);
            setIsContextMenu(false);
          }}
        >
          <div
            className="fixed bg-[#192734] rounded-md shadow-[0_5px_15px_rgba(0,0,0,0.3)] z-[9999] min-w-[160px] overflow-hidden border border-white/10"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              top: menuPosition.y,
              left: menuPosition.x,
            }}
          >
            <button
              className="flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-text-secondary text-left cursor-pointer transition-colors hover:bg-background-notes/30"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMenu(false);
                setIsContextMenu(false);
                // Small delay to ensure menu is closed before action
                setTimeout(() => {
                  onClick(note); // Open the note for editing
                }, 10);
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
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMenu(false);
                setIsContextMenu(false);
                // Small delay to ensure menu is closed before action
                setTimeout(() => {
                  console.log('Duplicate note:', note.id);
                }, 10);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Duplicate</span>
            </button>
            <button
              className={`flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none ${isPinned ? 'text-amber-500' : 'text-text-secondary'} text-left cursor-pointer transition-colors hover:bg-background-notes/30`}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMenu(false);
                setIsContextMenu(false);
                // Small delay to ensure menu is closed before action
                setTimeout(() => {
                  // Toggle pin state
                  // Create a deep copy of the note to ensure we don't lose any properties
                  const updatedNote = {
                    ...note,
                    pinned: !isPinned,
                    // Ensure content is preserved exactly as it was
                    content: note.content
                  };
                  // Update the note in the database
                  updateNote(updatedNote).then(() => {
                    // Notify other windows that this note has been updated
                    window.noteWindow.noteUpdated(note.id);
                    // Reload the main window to reflect the changes
                    window.location.reload();
                  });
                }, 10);
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={isPinned ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{isPinned ? 'Unpin' : 'Pin'}</span>
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-text-secondary text-left cursor-pointer transition-colors hover:bg-background-notes/30"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMenu(false);
                setIsContextMenu(false);
                // Small delay to ensure menu is closed before action
                setTimeout(() => {
                  setShowColorPicker(true);
                }, 10);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
              </svg>
              <span>Change Color</span>
            </button>
            <button
              className="delete-action flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-danger text-left cursor-pointer transition-colors hover:bg-background-notes/30"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMenu(false);
                setIsContextMenu(false);
                // Small delay to ensure menu is closed before action
                setTimeout(() => {
                  handleDeleteClick(e);
                }, 10);
              }}
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
        </div>
      )}

      <div
        className={`note-card ${colorInfo.className} ${isActive ? 'selected' : ''} rounded-lg overflow-hidden flex flex-col ${colorInfo.border} border-l-3 shadow-none transition-all duration-200 cursor-pointer h-note-card
          hover:translate-y-[-2px] hover:shadow-none group`}
        onClick={() => onClick(note)}
        onContextMenu={handleContextMenu}
        style={{
          backgroundColor: colorStyle.backgroundColor,
          color: colorStyle.color
        }}
      >
      {/* Note Header */}
      <div
        className="note-header px-3 py-1.5 flex items-center justify-between border-b-0"
        style={{ backgroundColor: colorStyle.headerBg || '' }}
      >
        <h3 className="note-title text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]">
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

          {/* Regular Dropdown Menu (non-context menu) */}
          {showMenu && !isContextMenu && (
            <div
              className="dropdown-menu absolute bg-[#192734] rounded-md shadow-[0_5px_15px_rgba(0,0,0,0.3)] z-[100] min-w-[160px] overflow-hidden border border-white/10"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              style={{
                top: '30px',
                right: '0px',
              }}
            >
              <button
                className="flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-text-secondary text-left cursor-pointer transition-colors hover:bg-background-notes/30"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowMenu(false);
                  setIsContextMenu(false);
                  // Small delay to ensure menu is closed before action
                  setTimeout(() => {
                    onClick(note); // Open the note for editing
                  }, 10);
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
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowMenu(false);
                  setIsContextMenu(false);
                  // Small delay to ensure menu is closed before action
                  setTimeout(() => {
                    console.log('Duplicate note:', note.id);
                  }, 10);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Duplicate</span>
              </button>
              <button
                className={`flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none ${isPinned ? 'text-amber-500' : 'text-text-secondary'} text-left cursor-pointer transition-colors hover:bg-background-notes/30`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowMenu(false);
                  setIsContextMenu(false);
                  // Small delay to ensure menu is closed before action
                  setTimeout(() => {
                    // Toggle pin state
                    // Create a deep copy of the note to ensure we don't lose any properties
                    const updatedNote = {
                      ...note,
                      pinned: !isPinned,
                      // Ensure content is preserved exactly as it was
                      content: note.content
                    };
                    // Update the note in the database
                    updateNote(updatedNote).then(() => {
                      // Notify other windows that this note has been updated
                      window.noteWindow.noteUpdated(note.id);
                      // Reload the main window to reflect the changes
                      window.location.reload();
                    });
                  }, 10);
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={isPinned ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{isPinned ? 'Unpin' : 'Pin'}</span>
              </button>

              {/* Color option */}
              <button
                className="flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-text-secondary text-left cursor-pointer transition-colors hover:bg-background-notes/30"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowMenu(false);
                  setIsContextMenu(false);
                  // Small delay to ensure menu is closed before action
                  setTimeout(() => {
                    setShowColorPicker(true);
                  }, 10);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="4"></circle>
                </svg>
                <span>Change Color</span>
              </button>
              <button
                className="delete-action flex items-center gap-2 w-full px-3 py-2 bg-transparent border-none text-danger text-left cursor-pointer transition-colors hover:bg-background-notes/30"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowMenu(false);
                  setIsContextMenu(false);
                  // Small delay to ensure menu is closed before action
                  setTimeout(() => {
                    handleDeleteClick(e);
                  }, 10);
                }}
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
      <div className="note-content flex-1 px-3 py-2 text-xs overflow-hidden whitespace-pre-line">
        {getContentPreview(note.content) || <span className="empty-content italic opacity-60">No content</span>}
      </div>

      {/* Note Footer */}
      <div
        className="note-footer px-3 py-1.5 flex items-center justify-between text-xs text-text-tertiary"
        style={{ backgroundColor: colorStyle.footerBg || '' }}
      >
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

      {/* Color picker dialog */}
      {showColorPicker && (
        <div
          className="absolute inset-0 bg-background-titlebar/95 flex items-center justify-center z-10 rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 bg-[#192734] rounded-lg shadow-lg" style={{ maxWidth: '180px' }}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-medium text-gray-300 m-0">Choose Color</h3>
              <button
                className="text-text-tertiary hover:text-text bg-transparent border-none cursor-pointer"
                onClick={() => setShowColorPicker(false)}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18"></path>
                  <path d="M6 6L18 18"></path>
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  className={`w-6 h-6 rounded-full border ${
                    note.color === color.value ? 'border-blue-500 border-2' : 'border-gray-300/30'
                  } transition-all hover:scale-110`}
                  style={{
                    backgroundColor: color.value,
                    boxShadow: note.color === color.value ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                  title={color.name}
                  onClick={() => {
                    // Update note color
                    const updatedNote = {
                      ...note,
                      color: color.value,
                      // Ensure content is preserved exactly as it was
                      content: note.content
                    };
                    // Update the note in the database
                    updateNote(updatedNote).then(() => {
                      // Notify other windows that this note has been updated
                      window.noteWindow.noteUpdated(note.id);
                      // Close the color picker
                      setShowColorPicker(false);
                      // Reload the main window to reflect the changes
                      window.location.reload();
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default NoteCard;
