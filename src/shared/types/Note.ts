export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
  _isNew?: boolean; // Flag to indicate a new note that hasn't been saved yet
}
