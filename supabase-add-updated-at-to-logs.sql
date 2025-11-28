-- Migration: add updated_at to logs, backfill, and create trigger
-- 1) Add column (if not exists)
ALTER TABLE public.logs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- 2) Backfill existing rows with created_at where updated_at is NULL
UPDATE public.logs
SET updated_at = created_at
WHERE updated_at IS NULL;

-- 3) Set default for new rows
ALTER TABLE public.logs
  ALTER COLUMN updated_at
  SET DEFAULT now();

-- 4) Create/replace trigger function that sets updated_at on update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5) Create trigger (replace if exists)
DROP TRIGGER IF EXISTS trigger_set_updated_at ON public.logs;
CREATE TRIGGER trigger_set_updated_at
BEFORE UPDATE ON public.logs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Note: Run this migration against your Supabase/Postgres database. Ensure you have backups.
