-- Ensure rewards RPCs + starter catalog (applied remotely via MCP)
-- See also 004_rewards.sql

CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_points  INTEGER,
  p_reason  TEXT
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
