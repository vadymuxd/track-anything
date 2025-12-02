-- Migration: Add start_date column to existing notes table
-- This adds a new start_date field to track when the note event occurred

-- 1) Add the start_date column (allow NULL temporarily)
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS start_date timestamptz;

-- 2) Backfill existing rows with created_at where start_date is NULL
UPDATE public.notes
SET start_date = created_at
WHERE start_date IS NULL;

-- 3) Set NOT NULL constraint and default for new rows
ALTER TABLE public.notes
  ALTER COLUMN start_date SET NOT NULL;

ALTER TABLE public.notes
  ALTER COLUMN start_date SET DEFAULT now();

-- 4) Create index on start_date for chronological queries
CREATE INDEX IF NOT EXISTS idx_notes_start_date ON public.notes(start_date);

-- Note: Run this migration against your Supabase/Postgres database if the notes table already exists.
