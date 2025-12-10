-- Migration: Add UPDATE policy to logs table
-- This allows public users to update logs

CREATE POLICY "Public update logs"
ON public.logs
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Note: Run this migration against your Supabase database.
-- This policy allows anyone to update any log entry.
-- If you need more restrictive access control (e.g., user-based),
-- modify the USING and WITH CHECK clauses accordingly.
