-- ============================================================
-- Migration: 20260622_002_create_tags_tables
-- Purpose: Create proper relational tags + note_tags tables
--          with Row Level Security policies.
-- ============================================================

-- 1. Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 50),
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- 2. Enable RLS on tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 3. RLS policy: users manage only their own tags
CREATE POLICY "Users manage own tags"
  ON tags FOR ALL
  USING (auth.uid() = user_id);

-- 4. Create note_tags join table
CREATE TABLE IF NOT EXISTS note_tags (
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- 5. Enable RLS on note_tags
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;

-- 6. RLS policy: users manage note_tags for notes they own
CREATE POLICY "Users manage own note_tags"
  ON note_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_id
        AND notes.user_id = auth.uid()
    )
  );
