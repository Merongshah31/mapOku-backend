-- =====================================================
-- MAPOKU REALTIME OBSTACLE PROJECTION — Migration 004
-- Public-safe latest state for frontend map synchronization.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.obstacle_realtime_events (
  obstacle_id  UUID PRIMARY KEY,
  event_type   TEXT NOT NULL CHECK (event_type IN ('insert', 'update', 'delete')),
  status       TEXT,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  type         TEXT,
  affects      TEXT[] NOT NULL DEFAULT '{}',
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS obstacle_realtime_events_occurred_at_idx
  ON public.obstacle_realtime_events (occurred_at);

ALTER TABLE public.obstacle_realtime_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read obstacle realtime events"
  ON public.obstacle_realtime_events;
CREATE POLICY "Public can read obstacle realtime events"
  ON public.obstacle_realtime_events FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.publish_obstacle_realtime_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.obstacle_realtime_events (
      obstacle_id, event_type, status, latitude, longitude, type, affects, occurred_at
    ) VALUES (
      OLD.id, 'delete', NULL, OLD.latitude, OLD.longitude, OLD.type::TEXT,
      COALESCE(OLD.affects::TEXT[], '{}'), NOW()
    )
    ON CONFLICT (obstacle_id) DO UPDATE SET
      event_type = EXCLUDED.event_type,
      status = EXCLUDED.status,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      type = EXCLUDED.type,
      affects = EXCLUDED.affects,
      occurred_at = EXCLUDED.occurred_at;
    RETURN OLD;
  END IF;

  INSERT INTO public.obstacle_realtime_events (
    obstacle_id, event_type, status, latitude, longitude, type, affects, occurred_at
  ) VALUES (
    NEW.id,
    CASE WHEN TG_OP = 'INSERT' THEN 'insert' ELSE 'update' END,
    NEW.status::TEXT,
    NEW.latitude,
    NEW.longitude,
    NEW.type::TEXT,
    COALESCE(NEW.affects::TEXT[], '{}'),
    NEW.updated_at
  )
  ON CONFLICT (obstacle_id) DO UPDATE SET
    event_type = EXCLUDED.event_type,
    status = EXCLUDED.status,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    type = EXCLUDED.type,
    affects = EXCLUDED.affects,
    occurred_at = EXCLUDED.occurred_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS obstacles_realtime_event ON public.obstacles;
CREATE TRIGGER obstacles_realtime_event
  AFTER INSERT OR UPDATE OR DELETE ON public.obstacles
  FOR EACH ROW EXECUTE FUNCTION public.publish_obstacle_realtime_event();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'obstacle_realtime_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.obstacle_realtime_events;
  END IF;
END
$$;
