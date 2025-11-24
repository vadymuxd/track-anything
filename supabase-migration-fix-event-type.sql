-- Fix event_type column to be text instead of boolean
-- This migration converts event_type from boolean to extensible text values
-- New types: 'Count' (simple counting), 'Scale' (numeric range)
-- Future types can be: 'Yes-No', 'Rating', 'Duration', etc.

-- First, add a new temporary column
ALTER TABLE events ADD COLUMN event_type_new text;

-- Convert boolean values to new text types
-- true (was for simple counting) -> 'Count'
-- false (was for scale) -> 'Scale'
UPDATE events 
SET event_type_new = CASE 
  WHEN event_type::text = 'true' THEN 'Count'
  WHEN event_type::text = 'false' THEN 'Scale'
  -- Handle if someone already has text values
  WHEN event_type::text = 'boolean' THEN 'Count'
  WHEN event_type::text = 'scale' THEN 'Scale'
  ELSE 'Count'
END;

-- Drop the old boolean column
ALTER TABLE events DROP COLUMN event_type;

-- Rename the new column to event_type
ALTER TABLE events RENAME COLUMN event_type_new TO event_type;

-- Set NOT NULL constraint (no check constraint for max flexibility)
ALTER TABLE events ALTER COLUMN event_type SET NOT NULL;
