import { AppSettings } from './settingsService';

// Define the types of actions that can have hotkeys
export type HotkeyAction = 
  // Global actions
  | 'newNote'
  | 'openSettings'
  | 'search'
  | 'toggleDarkMode'
  // Note actions
  | 'saveNote'
  | 'pinNote'
  | 'deleteNote'
  | 'changeColor'
  // Text formatting
  | 'toggleBold'
  | 'toggleItalic'
  | 'toggleUnderline'
  | 'toggleHighlight'
  | 'toggleHeading1'
  | 'toggleHeading2'
  | 'toggleBulletList'
  | 'toggleOrderedList'
  | 'toggleTaskList'
  | 'toggleToolbar';

// Define the default hotkeys
export const DEFAULT_HOTKEYS: Record<HotkeyAction, string> = {
  // Global actions
  newNote: 'ctrl+n',
  openSettings: 'ctrl+,',
  search: 'ctrl+f',
  toggleDarkMode: 'ctrl+shift+d',
  // Note actions
  saveNote: 'ctrl+s',
  pinNote: 'ctrl+p',
  deleteNote: 'ctrl+delete',
  changeColor: 'ctrl+shift+c',
  // Text formatting
  toggleBold: 'ctrl+b',
  toggleItalic: 'ctrl+i',
  toggleUnderline: 'ctrl+u',
  toggleHighlight: 'ctrl+h',
  toggleHeading1: 'ctrl+1',
  toggleHeading2: 'ctrl+2',
  toggleBulletList: 'ctrl+shift+8',
  toggleOrderedList: 'ctrl+shift+9',
  toggleTaskList: 'ctrl+shift+t',
  toggleToolbar: 'alt+t',
};

// Group hotkeys by category for UI display
export const HOTKEY_CATEGORIES = {
  global: {
    title: 'Global',
    actions: ['newNote', 'openSettings', 'search', 'toggleDarkMode'] as HotkeyAction[],
  },
  note: {
    title: 'Note Actions',
    actions: ['saveNote', 'pinNote', 'deleteNote', 'changeColor'] as HotkeyAction[],
  },
  formatting: {
    title: 'Text Formatting',
    actions: [
      'toggleBold', 
      'toggleItalic', 
      'toggleUnderline', 
      'toggleHighlight',
      'toggleHeading1',
      'toggleHeading2',
      'toggleBulletList',
      'toggleOrderedList',
      'toggleTaskList',
      'toggleToolbar'
    ] as HotkeyAction[],
  },
};

// Human-readable labels for actions
export const HOTKEY_LABELS: Record<HotkeyAction, string> = {
  newNote: 'Create new note',
  openSettings: 'Open settings',
  search: 'Search notes',
  toggleDarkMode: 'Toggle dark mode',
  saveNote: 'Save note',
  pinNote: 'Pin/unpin note',
  deleteNote: 'Delete note',
  changeColor: 'Change note color',
  toggleBold: 'Bold text',
  toggleItalic: 'Italic text',
  toggleUnderline: 'Underline text',
  toggleHighlight: 'Highlight text',
  toggleHeading1: 'Heading 1',
  toggleHeading2: 'Heading 2',
  toggleBulletList: 'Bullet list',
  toggleOrderedList: 'Ordered list',
  toggleTaskList: 'Task list',
  toggleToolbar: 'Toggle editor toolbar',
};

// Get hotkeys from settings
export const getHotkeys = (settings: AppSettings): Record<HotkeyAction, string> => {
  if (!settings.hotkeys) {
    return DEFAULT_HOTKEYS;
  }
  return { ...DEFAULT_HOTKEYS, ...settings.hotkeys };
};

// Format a hotkey string for display
export const formatHotkeyForDisplay = (hotkey: string): string => {
  return hotkey
    .split('+')
    .map(key => {
      if (key === 'ctrl') return '⌃';
      if (key === 'alt') return '⌥';
      if (key === 'shift') return '⇧';
      if (key === 'meta') return '⌘';
      return key.charAt(0).toUpperCase() + key.slice(1);
    })
    .join(' + ');
};
