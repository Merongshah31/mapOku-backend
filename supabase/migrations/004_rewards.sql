-- =====================================================
-- MAPOKU REWARDS SYSTEM — Migration 004
-- Points balance, redemption catalog, and redemption history
-- =====================================================

-- =====================================================
-- PROFILES: reward-tracking columns
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points_balance      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reports_count       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confirmations_count INTEGER NOT NULL DEFAULT 0;

-- =====================================================
-- REWARD_ITEMS TABLE
-- Catalog of redeemable rewards, funded by transport partners
-- =====================================================

CREATE TABLE public.reward_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,               -- e.g. "RM5 ride credit"
  partner_label TEXT NOT NULL,               -- e.g. "Grab — simulated partner"
  cost_points  INTEGER NOT NULL CHECK (cost_points > 0),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER reward_items_updated_at
  BEFORE UPDATE ON public.reward_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed catalog (matches current partner simulation)
INSERT INTO public.reward_items (title, partner_label, cost_points, sort_order) VALUES
  ('RM5 ride credit', 'Grab — simulated partner', 500, 1),
  ('1 free LRT trip',  'RapidKL — simulated partner', 350, 2),
  ('RM3 reload',       'Touch ''n Go — simulated partner', 200, 3);

-- =====================================================
-- REDEMPTIONS TABLE
-- Records every points-for-reward exchange
-- =====================================================

CREATE TABLE public.redemptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_item_id UUID NOT NULL REFERENCES public.reward_items(id),
  points_spent   INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'completed', -- 'completed' (simulated partner, no fulfillment step yet)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX redemptions_user_id_idx ON public.redemptions (user_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active reward items are publicly readable"
  ON public.reward_items FOR SELECT USING (is_active = true);

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own redemptions"
  ON public.redemptions FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- award_points
-- Atomically credits a user's points balance. Used when a report is
-- created (+POINTS_PER_REPORT) and when it receives a confirming
-- upvote (+POINTS_PER_CONFIRMATION). Also bumps the matching counter
-- so the rewards page can show "from N reports · M confirmations".
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_points  INTEGER,
  p_reason  TEXT -- 'report' | 'confirmation'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET points_balance = points_balance + p_points,
      reports_count = reports_count + (CASE WHEN p_reason = 'report' THEN 1 ELSE 0 END),
      confirmations_count = confirmations_count + (CASE WHEN p_reason = 'confirmation' THEN 1 ELSE 0 END)
  WHERE id = p_user_id;
END;
$$;

-- redeem_reward
-- Atomically checks the user has enough points, deducts the cost,
-- and records the redemption — all in one transaction so a user can
-- never redeem past their balance under concurrent requests.
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_user_id UUID,
  p_reward_item_id UUID
)
RETURNS public.redemptions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cost INTEGER;
  v_balance INTEGER;
  v_redemption public.redemptions;
BEGIN
  SELECT cost_points INTO v_cost
  FROM public.reward_items
  WHERE id = p_reward_item_id AND is_active = true
  FOR UPDATE;

  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'REWARD_NOT_FOUND';
  END IF;

  SELECT points_balance INTO v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  IF v_balance < v_cost THEN
    RAISE EXCEPTION 'INSUFFICIENT_POINTS';
  END IF;

  UPDATE public.profiles
  SET points_balance = points_balance - v_cost
  WHERE id = p_user_id;

  INSERT INTO public.redemptions (user_id, reward_item_id, points_spent)
  VALUES (p_user_id, p_reward_item_id, v_cost)
  RETURNING * INTO v_redemption;

  RETURN v_redemption;
END;
$$;
