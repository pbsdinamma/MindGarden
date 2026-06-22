-- ============================================================
-- Migration: 20260622_001_add_notes_columns
-- Purpose: Add is_deleted, deleted_at, pinned_at, content_text
--          to the notes table, and create a GIN full-text search
--          index. Also renames/aliases is_trashed behaviour to
--          is_deleted going forward.
-- Run once against your Supabase project.
-- ============================================================

-- 1. Add is_deleted (replaces is_trashed semantically)
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- 2. Add deleted_at for soft-delete timestamp
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. Add pinned_at timestamp (is_pinned already exists)
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

-- 4. Add content_text for plain-text FTS indexing
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS content_text TEXT;

-- 5. Migrate existing is_trashed data into is_deleted
UPDATE notes SET is_deleted = is_trashed WHERE is_trashed = true AND is_deleted = false;

-- 6. Create GIN full-text search index
CREATE INDEX IF NOT EXISTS notes_fts_idx
  ON notes
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_text, '')));

-- 7. Ensure RLS is enabled on notes (should already be, but guard)
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
