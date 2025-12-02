-- Add color field to events table for storing event colors
ALTER TABLE events ADD COLUMN color VARCHAR(7);

-- Set initial color values from local storage or default to black
UPDATE events SET color = '#000000';

-- Make color NOT NULL now that we have values
ALTER TABLE events ALTER COLUMN color SET NOT NULL;

-- Add a default for new events
ALTER TABLE events ALTER COLUMN color SET DEFAULT '#000000';
