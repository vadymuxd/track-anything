-- Migration: allow decimal values for Metric logs
-- Fixes: Postgres error 22P02 "invalid input syntax for type integer" when inserting values like 72.5
--
-- This changes public.logs.value to a float (double precision) so the app can store metric values with decimals.
-- NOTE: If you require exact decimal precision (e.g., currency), consider using NUMERIC instead.

ALTER TABLE public.logs
  ALTER COLUMN value TYPE double precision
  USING value::double precision;
