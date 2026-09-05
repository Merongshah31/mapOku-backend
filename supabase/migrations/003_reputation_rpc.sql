-- =====================================================
-- MAPOKU RPC FUNCTIONS — Migration 003
-- Reputation scoring helper
-- =====================================================

-- increment_reputation
-- Atomically adjusts a user's reputation score by delta.
-- Called by ReputationService after a vote is processed.
CREATE OR REPLACE FUNCTION public.increment_reputation(
  p_user_id UUID,
  p_delta   INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET reputation_score = GREATEST(0, reputation_score + p_delta)
  WHERE id = p_user_id;
END;
$$;
