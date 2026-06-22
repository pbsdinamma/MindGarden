-- ============================================================
-- COPY THIS ENTIRE FILE AND PASTE INTO:
-- https://supabase.com/dashboard/project/wlyhohwjzmrmelzipjau/sql/new
-- Then click RUN
-- ============================================================

-- ── Migration 001: Add missing columns to notes ──────────────

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS content_text TEXT;

-- Migrate existing trashed notes into is_deleted
UPDATE notes SET is_deleted = true WHERE is_trashed = true AND is_deleted = false;

-- Full-text search index
CREATE INDEX IF NOT EXISTS notes_fts_idx
  ON notes
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content_text, '')));

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ── Migration 002: Create relational tags tables ─────────────

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 50),
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'Users manage own tags'
  ) THEN
    CREATE POLICY "Users manage own tags"
      ON tags FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- note_id is BIGINT to match notes.id (bigint primary key, not UUID)
CREATE TABLE IF NOT EXISTS note_tags (
  note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id  UUID   NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'note_tags' AND policyname = 'Users manage own note_tags'
  ) THEN
    CREATE POLICY "Users manage own note_tags"
      ON note_tags FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM notes
          WHERE notes.id = note_id
            AND notes.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── Verify: should show all columns including is_deleted, content_text, pinned_at ──
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notes'
ORDER BY column_name;
