import { AppSettings } from '../../shared/services/settingsService';
import { useAppHotkeys } from '../../shared/hooks/useAppHotkeys';
import { Note } from '../../shared/types/Note';

interface NoteHotkeysProps {
  settings: AppSettings;
  note: Note;
  onSave: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onChangeColor: () => void;
  editor?: any; // Tiptap editor instance
}

/**
 * Component that registers note-specific hotkeys
 */
export function NoteHotkeys({
  settings,
  onSave,
  onTogglePin,
  onDelete,
  onChangeColor,
  editor,
}: NoteHotkeysProps) {
  // Register note-specific hotkeys
  useAppHotkeys(
    settings,
    {
      saveNote: onSave,
      pinNote: onTogglePin,
      deleteNote: onDelete,
      changeColor: onChangeColor,
      // Text formatting hotkeys (only if editor is provided)
      ...(editor ? {
        toggleBold: () => editor.chain().focus().toggleBold().run(),
        toggleItalic: () => editor.chain().focus().toggleItalic().run(),
        toggleUnderline: () => editor.commands.toggleUnderline(),
        toggleHighlight: () => editor.chain().focus().toggleHighlight().run(),
        toggleHeading1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        toggleHeading2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        toggleBulletList: () => editor.chain().focus().toggleBulletList().run(),
        toggleOrderedList: () => editor.chain().focus().toggleOrderedList().run(),
        toggleTaskList: () => editor.chain().focus().toggleTaskList().run(),
      } : {})
    },
    {
      // Enable hotkeys in the editor
      enableOnFormTags: true,
      enableOnContentEditable: true,
    }
  );

  // This component doesn't render anything
  return null;
}
