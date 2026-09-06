-- =====================================================
-- MAPOKU TEMPORARY ANONYMOUS MODE
-- Apply after migrations 001-005 in Supabase SQL Editor.
-- =====================================================

-- New reports are anonymous. Historical reporter IDs remain intact.
ALTER TABLE public.obstacles
  DROP CONSTRAINT IF EXISTS obstacles_user_id_fkey;

-- Replace the Auth/profile-backed voter with a client-generated identifier.
ALTER TABLE public.votes
  ADD COLUMN IF NOT EXISTS anonymous_id TEXT;

UPDATE public.votes
SET anonymous_id = user_id::TEXT
WHERE anonymous_id IS NULL;

ALTER TABLE public.votes
  ALTER COLUMN anonymous_id SET NOT NULL,
  DROP CONSTRAINT IF EXISTS votes_user_id_fkey,
  ALTER COLUMN user_id DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS votes_obstacle_id_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS votes_obstacle_anonymous_id_key
  ON public.votes (obstacle_id, anonymous_id);

-- Keep RLS enabled: application writes remain server-side via the service key.
DROP POLICY IF EXISTS "Authenticated users can create obstacles" ON public.obstacles;
DROP POLICY IF EXISTS "Users can update their own obstacles" ON public.obstacles;
DROP POLICY IF EXISTS "Authenticated users can vote" ON public.votes;
DROP POLICY IF EXISTS "Users can see their own votes" ON public.votes;
DROP POLICY IF EXISTS "Users can change their own votes" ON public.votes;
