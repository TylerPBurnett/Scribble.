import { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '../../shared/types/Note';
import Tiptap from './Tiptap';
import { updateNote } from '../../shared/services/noteService';
import { getSettings, subscribeToSettingsChanges } from '../../shared/services/settingsService';
import './NoteEditor.css';

interface NoteEditorProps {
  note: Note;
  onSave?: (note: Note) => void;
}

const NoteEditor = ({ note, onSave }: NoteEditorProps) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isDirty, setIsDirty] = useState(false);
  const [isPinned, setIsPinned] = useState(note.pinned || false);
  const [noteColor, setNoteColor] = useState(note.color || '#fff9c4'); // Default yellow sticky note color
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Track if we're currently editing the title to prevent premature saves
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  // Store the temporary title value while editing
  const [tempTitle, setTempTitle] = useState(note.title);

  // Get settings for auto-save
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5000);

  // Use refs to store the latest values for use in debounced functions
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const noteDataRef = useRef(note);
  const isDirtyRef = useRef(isDirty);

  // Ref for the DOM element
  const editorDomRef = useRef<HTMLDivElement>(null);

  // Ref for the title input element
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Update refs when state changes
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    noteDataRef.current = note;
  }, [note]);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Load settings on component mount and subscribe to changes
  useEffect(() => {
    // Initial settings load
    const settings = getSettings();
    setAutoSaveEnabled(settings.autoSave);
    setAutoSaveInterval(settings.autoSaveInterval * 1000); // Convert to milliseconds

    // Subscribe to settings changes
    const unsubscribe = subscribeToSettingsChanges((newSettings) => {
      console.log('Settings changed in NoteEditor:', newSettings);
      setAutoSaveEnabled(newSettings.autoSave);
      setAutoSaveInterval(newSettings.autoSaveInterval * 1000);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Define a stable save function that uses refs to access the latest state
  const saveNote = useCallback(async () => {
    const currentNote = noteDataRef.current;
    const currentTitle = titleRef.current;
    const currentContent = contentRef.current;

    if (!currentNote) return;

    const updatedNote = {
      ...currentNote,
      title: currentTitle,
      content: currentContent,
    };

    try {
      console.log('NoteEditor - Saving note:', updatedNote.id);
      const savedNote = await updateNote(updatedNote);
      console.log('NoteEditor - Note saved:', savedNote);

      // Update the note reference with the saved note
      // This is crucial for subsequent renames to work correctly
      noteDataRef.current = savedNote;
      console.log('NoteEditor - Updated note reference:', noteDataRef.current);

      onSave?.(savedNote);

      // Notify other windows that this note has been updated
      // Use the saved note ID which might have changed if the title was changed
      window.noteWindow.noteUpdated(savedNote.id);

      // Reset dirty state after successful save
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [onSave]);

  // Create a debounced version of saveNote
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | null = null;

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          if (isDirtyRef.current) {
            saveNote();
          }
        }, autoSaveInterval);
      };
    })(),
    [saveNote, autoSaveInterval]
  );

  // We're no longer using debounce for title changes
  // Instead, we'll only update the title when the user clicks away from the input

  // Track if this is a new note that hasn't been saved yet
  const [isNewNote, setIsNewNote] = useState(note._isNew === true || (note.title === 'Untitled Note' && note.content === '<p></p>'));

  // Detect if this is the first title change for a new note
  useEffect(() => {
    if (isNewNote && title !== 'Untitled Note') {
      console.log('First title change for new note detected');
      // Once the title has been changed from the default, it's no longer a new note
      setIsNewNote(false);
    }
  }, [title, isNewNote]);

  // Trigger auto-save when content changes (but NEVER during title editing)
  useEffect(() => {
    // Only mark as dirty for content changes when not editing the title
    // For new notes, don't mark as dirty until the title has been changed
    if (!isTitleFocused && (!isNewNote || title !== 'Untitled Note')) {
      setIsDirty(true);
    }
  }, [content, isTitleFocused, isNewNote, title]);

  // Title changes should only mark as dirty after focus is lost
  useEffect(() => {
    // Only mark as dirty for title changes when not currently editing
    // and only if it's not a new note with default title
    if (!isTitleFocused && (!isNewNote || title !== 'Untitled Note')) {
      console.log('Title changed and not focused, marking as dirty');
      setIsDirty(true);
    }
  }, [title, isTitleFocused, isNewNote]);

  // Effect to adjust input width based on content
  useEffect(() => {
    if (titleInputRef.current) {
      const inputWidth = isTitleFocused
        ? Math.min(Math.max((tempTitle?.length || 1) * 12, 50), 300)
        : Math.min(Math.max((title?.length || 1) * 12, 50), 300);

      titleInputRef.current.style.width = `${inputWidth}px`;
    }
  }, [tempTitle, title, isTitleFocused]);

  // Trigger debounced save when isDirty changes
  useEffect(() => {
    // NEVER save while the title is being edited
    if (isDirty && autoSaveEnabled && !isTitleFocused) {
      console.log(`Triggering debounced save with interval: ${autoSaveInterval}ms`);
      debouncedSave();
    }
  }, [isDirty, autoSaveEnabled, debouncedSave, isTitleFocused]);

  // Last saved time formatting removed

  // Dragging functionality
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Allow dragging from the title bar, but not from input fields or buttons
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isSvg = target.tagName === 'svg' || target.tagName === 'path' || target.closest('svg');

    if (!isInput && !isButton && !isSvg) {
      setIsDragging(true);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
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
  const handleManualSave = () => {
    console.log('Manual save triggered');
    saveNote();
  };

  // Content update handler
  const handleContentUpdate = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  // Check window pin state on mount
  useEffect(() => {
    const checkPinState = async () => {
      try {
        const isWindowPinned = await window.windowControls.isPinned();
        setIsPinned(isWindowPinned);
      } catch (error) {
        console.error('Error checking window pin state:', error);
      }
    };

    checkPinState();
  }, []);

  // Add click outside handler for color picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showColorPicker) {
        // Check if the click was outside the color picker
        const target = e.target as HTMLElement;
        const isColorPickerClick = target.closest('.color-picker-container');
        const isSettingsButtonClick = target.closest('.settings-button');

        if (!isColorPickerClick && !isSettingsButtonClick) {
          setShowColorPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

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

  // Toggle pin state
  const togglePinState = async () => {
    try {
      const newPinState = !isPinned;
      const result = await window.windowControls.togglePin(newPinState);
      setIsPinned(result);

      // Update the note's pinned property
      // Create a deep copy of the note to ensure we don't lose any properties
      const updatedNote = {
        ...noteDataRef.current,
        pinned: result,
        // Ensure content is preserved exactly as it was
        content: contentRef.current
      };

      // Save the updated note
      const savedNote = await updateNote(updatedNote);
      noteDataRef.current = savedNote;
      onSave?.(savedNote);

      // Notify other windows that this note has been updated
      window.noteWindow.noteUpdated(savedNote.id);
    } catch (error) {
      console.error('Error toggling pin state:', error);
    }
  };

  // Change note color
  const changeNoteColor = async (color: string) => {
    try {
      setNoteColor(color);
      setShowColorPicker(false);

      // Update the note's color property
      const updatedNote = {
        ...noteDataRef.current,
        color: color,
        // Ensure content is preserved exactly as it was
        content: contentRef.current
      };

      // Save the updated note
      const savedNote = await updateNote(updatedNote);
      noteDataRef.current = savedNote;
      onSave?.(savedNote);

      // Notify other windows that this note has been updated
      window.noteWindow.noteUpdated(savedNote.id);
    } catch (error) {
      console.error('Error changing note color:', error);
    }
  };

  // Function to darken a color for the header
  const getDarkerShade = (color: string): string => {
    // For specific colors, return predefined darker shades
    if (color === '#ffffff') return '#f8f8f8';
    if (color === '#333333') return '#444444';
    if (color === '#fff9c4') return '#fff5b1';

    // For other colors, calculate a slightly darker shade
    try {
      // Parse the hex color
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      // Darken by 10%
      const darkenFactor = 0.9;
      const newR = Math.floor(r * darkenFactor);
      const newG = Math.floor(g * darkenFactor);
      const newB = Math.floor(b * darkenFactor);

      // Convert back to hex
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    } catch (error) {
      console.error('Error darkening color:', error);
      return color; // Return original color if there's an error
    }
  };

  // Determine text color based on background color
  const getTextColor = () => {
    // For dark backgrounds, use white text
    if (noteColor === '#333333') {
      return '#ffffff';
    }
    // For all other colors, use default (dark) text
    return '';
  };

  return (
    <div
      className="note-editor flex flex-col h-screen shadow-lg relative overflow-hidden"
      style={{
        backgroundColor: noteColor,
        color: getTextColor()
      }}
      ref={editorDomRef}
    >
      {/* Compact header with reduced height */}
      <div
        className="flex items-center justify-between py-2 px-3 border-b border-black/10 cursor-grab shadow-sm"
        onMouseDown={handleMouseDown}
        style={{
          WebkitAppRegion: 'drag',
          borderBottomColor: 'rgba(0,0,0,0.08)',
          backgroundColor: getDarkerShade(noteColor)
        }}
      >
        <div className="flex items-center justify-between w-full">
          {/* Title container that expands with content */}
          <div className="flex-1 min-w-0 mr-2">
            <input
              type="text"
              className="note-title-input text-lg font-semibold bg-transparent border-none outline-none focus:outline-none focus:ring-0 font-['Chirp',_'Segoe_UI',_sans-serif] cursor-text caret-black"
              style={{
                WebkitAppRegion: 'no-drag',
                boxShadow: 'none',
                width: isTitleFocused ?
                  `${Math.min(Math.max((tempTitle?.length || 1) * 12, 50), 300)}px` :
                  `${Math.min(Math.max((title?.length || 1) * 12, 50), 300)}px`
              }}
              ref={titleInputRef}
              value={isTitleFocused ? tempTitle : title}
              onChange={(e) => {
                // Only update the temporary title while editing
                // This won't trigger any saves
                const newTitle = e.target.value;
                console.log('Title input change (temp):', newTitle);
                setTempTitle(newTitle);

                // Dynamically adjust width as user types
                const inputWidth = Math.min(Math.max((newTitle.length || 1) * 12, 50), 300);
                e.target.style.width = `${inputWidth}px`;
              }}
              onFocus={() => {
                // When focusing, set the temporary title to the current title
                setTempTitle(title);
                setIsTitleFocused(true);
                console.log('Title focused, preventing saves');
              }}
              onBlur={() => {
                // When focus is lost, apply the title change if it's valid
                setIsTitleFocused(false);

                // Only apply the change if the title is not empty and not the default
                if (tempTitle && tempTitle.trim() !== '') {
                  if (tempTitle !== title) {
                    console.log('Applying title change on blur:', tempTitle);
                    setTitle(tempTitle);

                    // If this was a new note, mark it as no longer new
                    if (isNewNote && tempTitle !== 'Untitled Note') {
                      setIsNewNote(false);
                    }
                  } else {
                    console.log('Title unchanged, not marking as dirty');
                  }
                } else {
                  console.log('Not applying empty title on blur');
                  // Reset to the previous title if empty
                  setTempTitle(title);
                }
              }}
              placeholder="Untitled Note"
            />
          </div>

          <div className="flex items-center gap-2 relative" style={{ WebkitAppRegion: 'no-drag' }}>
            {!autoSaveEnabled && (
              <button
                onClick={handleManualSave}
                className="text-black/50 hover:text-blue-600 transition-colors p-1 cursor-pointer"
                title="Save now"
                style={{ WebkitAppRegion: 'no-drag' }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            {/* Settings button */}
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`settings-button transition-colors p-1 cursor-pointer ${
                  showColorPicker ? 'text-blue-600' : 'text-black/50 hover:text-blue-600'
                }`}
                title="Note settings"
                style={{ WebkitAppRegion: 'no-drag' }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </button>

              {/* Color picker dropdown */}
              {showColorPicker && (
                <div
                  className="color-picker-container fixed rounded-md shadow-lg p-2 z-50 w-36"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: '#192734', // Match noteslist gray
                    top: '50px', // Position below the header
                    left: '50%',
                    transform: 'translateX(-50%)', // Center horizontally
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div className="text-xs font-medium text-gray-400 mb-2 px-1">Note Color</div>
                  <div className="grid grid-cols-3 gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        className={`w-6 h-6 rounded-full border ${
                          noteColor === color.value ? 'border-blue-500 border-2' : 'border-gray-300/30'
                        } transition-all hover:scale-110`}
                        style={{
                          backgroundColor: color.value,
                          boxShadow: noteColor === color.value ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none'
                        }}
                        title={color.name}
                        onClick={() => changeNoteColor(color.value)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={togglePinState}
              className={`transition-colors p-1 cursor-pointer ${
                isPinned ? 'text-amber-600' : 'text-black/50 hover:text-amber-600'
              }`}
              title={isPinned ? "Unpin note" : "Pin note on top"}
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              <svg
                width="16"
                height="16"
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
            </button>

            <button
              onClick={handleClose}
              className="text-black/50 hover:text-red-600 transition-colors p-1 cursor-pointer"
              title="Close note"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-hidden flex flex-col"
        style={{
          backgroundColor: noteColor,
          color: getTextColor()
        }}
      >
        <Tiptap
          content={content}
          onUpdate={handleContentUpdate}
          placeholder="Start typing here..."
          autofocus={true}
          editorClass={noteColor === '#333333' ? 'dark-theme' : ''}
          backgroundColor={noteColor}
          toolbarColor={getDarkerShade(noteColor)}
        />
      </div>

      {/* Keep the shadow effect at the top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-b from-black/10 to-transparent z-10"></div>
    </div>
  );
};

export default NoteEditor;
