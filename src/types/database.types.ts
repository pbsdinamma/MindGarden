export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  color: string;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  is_trashed: boolean;
  created_at: string;
  updated_at: string;
}

export type NoteInput = Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
