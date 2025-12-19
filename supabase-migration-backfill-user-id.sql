-- Migration: Backfill user_id for existing data
-- Stage 3: Backfill and link user account
-- This migration assigns a specific user_id to all existing records
-- Date: 2025-12-19

-- =============================================================================
-- INSTRUCTIONS:
-- =============================================================================
-- 1. First, create your account in the app and confirm your email
-- 2. Find your user ID by running: SELECT id, email FROM auth.users;
-- 3. Replace 'YOUR_USER_ID_HERE' below with your actual user ID
-- 4. Run this migration to assign all existing data to your account
-- =============================================================================

-- Replace this with your actual user ID from auth.users
-- User ID: d6d3fcc4-eed1-42c6-aad3-5ef8d15810c2
DO $$
DECLARE
  target_user_id uuid := 'd6d3fcc4-eed1-42c6-aad3-5ef8d15810c2';
BEGIN
  -- Verify the user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User ID % does not exist in auth.users', target_user_id;
  END IF;

  -- Update events table
  UPDATE public.events
  SET user_id = target_user_id
  WHERE user_id IS NULL;
  
  RAISE NOTICE 'Updated % events', (SELECT count(*) FROM public.events WHERE user_id = target_user_id);

  -- Update logs table
  UPDATE public.logs
  SET user_id = target_user_id
  WHERE user_id IS NULL;
  
  RAISE NOTICE 'Updated % logs', (SELECT count(*) FROM public.logs WHERE user_id = target_user_id);

  -- Update notes table
  UPDATE public.notes
  SET user_id = target_user_id
  WHERE user_id IS NULL;
  
  RAISE NOTICE 'Updated % notes', (SELECT count(*) FROM public.notes WHERE user_id = target_user_id);

END $$;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these queries to verify the backfill was successful:

-- Check events
-- SELECT user_id, count(*) FROM public.events GROUP BY user_id;

-- Check logs
-- SELECT user_id, count(*) FROM public.logs GROUP BY user_id;

-- Check notes
-- SELECT user_id, count(*) FROM public.notes GROUP BY user_id;

-- =============================================================================
-- OPTIONAL: Make user_id NOT NULL after backfill
-- =============================================================================
-- Uncomment these lines after verifying all data has been backfilled
-- This ensures all future records MUST have a user_id

-- ALTER TABLE public.events ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.logs ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.notes ALTER COLUMN user_id SET NOT NULL;
