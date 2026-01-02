-- Add show_all_submissions to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS show_all_submissions boolean DEFAULT false;

