// ============================================================
// database.types.ts
// Extended type definitions for MindGarden — includes all new
// columns added by migrations 001 and 002.
// ============================================================

export interface Note {
  id: number;          // bigint in DB, serialized as number by Supabase JS
  user_id: string;
  title: string;
  content: string;
  content_text?: string | null;   // Plain-text version for FTS; kept in sync by app layer
  color: string;
  tags: string[];                  // Legacy text[] array kept for backward compat
  is_pinned: boolean;
  pinned_at?: string | null;
  is_archived: boolean;
  /** @deprecated use is_deleted */
  is_trashed: boolean;
  is_deleted: boolean;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type NoteInput = Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export type NoteUpdateInput = Partial<
  Pick<Note, 'title' | 'content' | 'content_text' | 'color' | 'tags' | 'is_pinned' | 'pinned_at' | 'is_deleted' | 'deleted_at' | 'is_archived' | 'is_trashed'>
>;

// ── Relational Tags ───────────────────────────────────────────

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export type TagInput = Pick<Tag, 'name' | 'color'>;
export type TagUpdateInput = Partial<Pick<Tag, 'name' | 'color'>>;

export interface NoteTag {
  note_id: number;   // bigint FK to notes.id
  tag_id: string;
}

// ── API Response Shapes ───────────────────────────────────────

export interface ApiError {
  error: string;
  status?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  updated_at: string;
}

export type SortOption = 'updated' | 'created' | 'alpha';
