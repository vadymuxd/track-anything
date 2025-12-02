-- Migration: Create notes table
-- This table stores user notes (milestones) associated with specific events

-- 1) Create the notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL DEFAULT now()
);

-- 2) Create index on event_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_notes_event_id ON public.notes(event_id);

-- 3) Create index on created_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at);

-- 4) Create index on start_date for chronological queries
CREATE INDEX IF NOT EXISTS idx_notes_start_date ON public.notes(start_date);

-- 4) Create index on start_date for chronological queries
CREATE INDEX IF NOT EXISTS idx_notes_start_date ON public.notes(start_date);

-- 5) Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS trigger_set_updated_at_notes ON public.notes;
CREATE TRIGGER trigger_set_updated_at_notes
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 6) Enable Row Level Security (RLS)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 7) Create RLS policies (adjust based on your auth setup)
-- For now, allowing all users (including anon) to manage notes
-- Modify these policies based on your specific auth requirements

-- Policy: Allow all users to view all notes
CREATE POLICY "Users can view notes" ON public.notes
  FOR SELECT
  USING (true);

-- Policy: Allow all users to insert notes
CREATE POLICY "Users can insert notes" ON public.notes
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow all users to update notes
CREATE POLICY "Users can update notes" ON public.notes
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow all users to delete notes
CREATE POLICY "Users can delete notes" ON public.notes
  FOR DELETE
  USING (true);

-- Note: Run this migration against your Supabase/Postgres database. Ensure you have backups.
