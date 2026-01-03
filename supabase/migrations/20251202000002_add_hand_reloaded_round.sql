-- Add hand_reloaded_round to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS hand_reloaded_round integer DEFAULT -1;

