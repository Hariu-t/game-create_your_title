-- Add current_viewing_index to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_viewing_index integer DEFAULT 0;

