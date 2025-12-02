-- Add position field to events table for ordering
ALTER TABLE events ADD COLUMN position INTEGER;

-- Set initial position values based on created_at (oldest first)
WITH ordered_events AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num
  FROM events
)
UPDATE events
SET position = ordered_events.row_num
FROM ordered_events
WHERE events.id = ordered_events.id;

-- Make position NOT NULL now that we have values
ALTER TABLE events ALTER COLUMN position SET NOT NULL;

-- Add a default for new events (use max + 1)
ALTER TABLE events ALTER COLUMN position SET DEFAULT 999999;
