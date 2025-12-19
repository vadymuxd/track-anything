-- Migration: Add Authentication and User Management
-- Stage 1: Auth Backend
-- This migration adds user authentication support to the track-anything app
-- Date: 2025-12-19

-- =============================================================================
-- PART 1: Enable Supabase Auth (already enabled by default in Supabase)
-- =============================================================================
-- Supabase Auth is automatically enabled, and auth.users table is already available
-- We'll reference auth.users for user information

-- =============================================================================
-- PART 2: Create a public.users table (optional profile table)
-- =============================================================================
-- This table stores additional user profile information beyond auth.users
-- The id references auth.users(id) for each authenticated user

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  full_name text,
  avatar_url text,
  
  CONSTRAINT users_email_key UNIQUE (email)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS trigger_set_updated_at_users ON public.users;
CREATE TRIGGER trigger_set_updated_at_users
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security (RLS) on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- RLS Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- PART 3: Add user_id column to existing tables
-- =============================================================================

-- 3.1: Add user_id to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);

-- 3.2: Add user_id to logs table
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);

-- 3.3: Add user_id to notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

-- =============================================================================
-- PART 4: Update RLS Policies for existing tables
-- =============================================================================

-- 4.1: Update RLS policies for EVENTS table
-- Drop old policies
DROP POLICY IF EXISTS "Users can view events" ON public.events;
DROP POLICY IF EXISTS "Users can insert events" ON public.events;
DROP POLICY IF EXISTS "Users can update events" ON public.events;
DROP POLICY IF EXISTS "Users can delete events" ON public.events;

-- Create new user-specific policies
CREATE POLICY "Users can view own events" ON public.events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events" ON public.events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON public.events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON public.events
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4.2: Update RLS policies for LOGS table
-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view logs" ON public.logs;
DROP POLICY IF EXISTS "Users can insert logs" ON public.logs;
DROP POLICY IF EXISTS "Users can update logs" ON public.logs;
DROP POLICY IF EXISTS "Users can delete logs" ON public.logs;

-- Enable RLS if not already enabled
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Create new user-specific policies
CREATE POLICY "Users can view own logs" ON public.logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON public.logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON public.logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4.3: Update RLS policies for NOTES table
-- Drop old policies
DROP POLICY IF EXISTS "Users can view notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete notes" ON public.notes;

-- Create new user-specific policies
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- PART 5: Create function to handle new user signup
-- =============================================================================

-- This function automatically creates a user profile when a new user signs up
-- It's triggered by Supabase Auth on new user registration

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call handle_new_user on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- NOTES:
-- =============================================================================
-- 1. Run this migration against your Supabase database
-- 2. Existing data will have NULL user_id values (we'll backfill in Stage 3)
-- 3. New records MUST have a user_id
-- 4. RLS policies ensure users can only see their own data
-- 5. The public.users table stores additional profile info beyond auth.users
-- 6. The trigger automatically creates a profile when users sign up
-- =============================================================================
