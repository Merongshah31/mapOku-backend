-- =====================================================
-- MAPOKU AI IMAGE VALIDATION — Migration 005
-- Stores audit metadata while obstacle visibility remains controlled by status.
-- =====================================================

ALTER TABLE public.obstacles
  ADD COLUMN IF NOT EXISTS ai_validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (ai_validation_status IN ('pending', 'approved', 'rejected', 'error')),
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(4, 3),
  ADD COLUMN IF NOT EXISTS ai_reason TEXT,
  ADD COLUMN IF NOT EXISTS ai_detected_type TEXT,
  ADD COLUMN IF NOT EXISTS ai_validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_model TEXT;

CREATE INDEX IF NOT EXISTS obstacles_ai_validation_status_idx
  ON public.obstacles (ai_validation_status);
