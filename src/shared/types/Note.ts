export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
  color?: string; // Color of the note (CSS color value)
  _isNew?: boolean; // Flag to indicate a new note that hasn't been saved yet
}
