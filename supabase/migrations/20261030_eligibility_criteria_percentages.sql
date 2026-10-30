-- ============================================================================
-- MIGRATION: 10TH & 12TH MINIMUM PERCENTAGE ELIGIBILITY CRITERIA
-- Project: PlacementPrep / Grad-to-Great-Jobs
-- Description:
-- Adds nullable numeric columns for 10th and 12th standard minimum percentages
-- to public.eligibility_criteria table with safe range constraints (0.00 to 100.00).
-- Preserves all existing records and values without disruption.
-- ============================================================================

-- 1. ADD NULLABLE NUMERIC COLUMNS (PRESERVES EXISTING DATA)
ALTER TABLE public.eligibility_criteria 
ADD COLUMN IF NOT EXISTS min_10th_percentage numeric(5,2);

ALTER TABLE public.eligibility_criteria 
ADD COLUMN IF NOT EXISTS min_12th_percentage numeric(5,2);

-- 2. ADD RANGE VALIDATION CONSTRAINTS (0.00% to 100.00%)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_eligibility_min_10th_percentage'
  ) THEN
    ALTER TABLE public.eligibility_criteria
      ADD CONSTRAINT chk_eligibility_min_10th_percentage
      CHECK (min_10th_percentage IS NULL OR (min_10th_percentage >= 0 AND min_10th_percentage <= 100));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_eligibility_min_12th_percentage'
  ) THEN
    ALTER TABLE public.eligibility_criteria
      ADD CONSTRAINT chk_eligibility_min_12th_percentage
      CHECK (min_12th_percentage IS NULL OR (min_12th_percentage >= 0 AND min_12th_percentage <= 100));
  END IF;
END $$;

-- 3. DOCUMENTATION COMMENTS
COMMENT ON COLUMN public.eligibility_criteria.min_10th_percentage IS 'Minimum required percentage in 10th Standard / SSC (0.00 to 100.00, accepts decimals)';
COMMENT ON COLUMN public.eligibility_criteria.min_12th_percentage IS 'Minimum required percentage in 12th Standard / HSC / Diploma (0.00 to 100.00, accepts decimals)';
