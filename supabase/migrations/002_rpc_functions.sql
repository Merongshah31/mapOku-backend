-- =====================================================
-- MAPOKU RPC FUNCTIONS — Migration 002
-- Stored procedures callable via supabase.rpc()
-- =====================================================

-- =====================================================
-- get_obstacles_in_bbox
-- Fetches all active obstacles within a bounding box
-- Uses PostGIS ST_MakeEnvelope for efficient spatial query
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_obstacles_in_bbox(
  min_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION
)
RETURNS TABLE (
  id            UUID,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  type          obstacle_type,
  description   TEXT,
  image_url     TEXT,
  user_id       UUID,
  status        obstacle_status,
  upvotes       INTEGER,
  downvotes     INTEGER,
  affects       accessibility_need[],
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.latitude,
    o.longitude,
    o.type,
    o.description,
    o.image_url,
    o.user_id,
    o.status,
    o.upvotes,
    o.downvotes,
    o.affects,
    o.created_at,
    o.updated_at
  FROM public.obstacles o
  WHERE
    o.status = 'active'
    AND ST_Within(
      o.location::geometry,
      ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    );
END;
$$;

-- =====================================================
-- get_obstacles_near_route
-- Fetches obstacles within a buffer distance of a set of points
-- Used by RoutingService to find obstacles along a corridor
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_obstacles_near_points(
  lats DOUBLE PRECISION[],
  lngs DOUBLE PRECISION[],
  buffer_meters DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id        UUID,
  latitude  DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  type      obstacle_type,
  status    obstacle_status,
  affects   accessibility_need[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  route_geom GEOMETRY;
BEGIN
  -- Build a linestring from the provided lat/lng arrays
  SELECT ST_MakeLine(
    ARRAY(
      SELECT ST_SetSRID(ST_MakePoint(lngs[i], lats[i]), 4326)
      FROM generate_series(1, array_length(lats, 1)) AS i
    )
  ) INTO route_geom;

  RETURN QUERY
  SELECT
    o.id,
    o.latitude,
    o.longitude,
    o.type,
    o.status,
    o.affects
  FROM public.obstacles o
  WHERE
    o.status = 'active'
    AND ST_DWithin(
      o.location,
      route_geom::geography,
      buffer_meters
    );
END;
$$;

-- =====================================================
-- increment_obstacle_votes
-- Atomically updates vote counts after a vote is cast
-- Called by ReputationService after upsert into votes table
-- =====================================================

CREATE OR REPLACE FUNCTION public.recalculate_obstacle_votes(p_obstacle_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.obstacles
  SET
    upvotes   = (SELECT COUNT(*) FROM public.votes WHERE obstacle_id = p_obstacle_id AND vote_type = 'upvote'),
    downvotes = (SELECT COUNT(*) FROM public.votes WHERE obstacle_id = p_obstacle_id AND vote_type = 'downvote'),
    -- Auto-archive if downvotes exceed threshold
    status = CASE
      WHEN (SELECT COUNT(*) FROM public.votes WHERE obstacle_id = p_obstacle_id AND vote_type = 'downvote')
           >= current_setting('app.downvote_archive_threshold', true)::integer
      THEN 'archived'::obstacle_status
      ELSE status
    END
  WHERE id = p_obstacle_id;
END;
$$;

-- Set the default archive threshold (overridable via ALTER SYSTEM SET)
ALTER DATABASE postgres SET app.downvote_archive_threshold = '3';
