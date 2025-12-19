-- Migration: add log_date to logs (date-only, Notes-like "Date")
--
-- Rationale:
-- - Keep created_at as an immutable audit timestamp (when the row was inserted).
-- - Use log_date as the user-selected "happened on" date for backfilled/past logs.
--
-- 1) Add column (if not exists)
ALTER TABLE public.logs
  ADD COLUMN IF NOT EXISTS log_date date;

-- 2) Backfill existing rows
UPDATE public.logs
SET log_date = created_at::date
WHERE log_date IS NULL;

-- 3) Enforce default + not-null for new rows
ALTER TABLE public.logs
  ALTER COLUMN log_date SET DEFAULT current_date;

ALTER TABLE public.logs
  ALTER COLUMN log_date SET NOT NULL;

-- 4) Index for range queries / chart aggregation
CREATE INDEX IF NOT EXISTS idx_logs_log_date ON public.logs(log_date);
