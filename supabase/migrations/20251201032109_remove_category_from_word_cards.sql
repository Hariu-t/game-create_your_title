-- Remove category column from word_cards table
-- This migration removes the category column that is no longer needed

ALTER TABLE word_cards DROP COLUMN IF EXISTS category;

