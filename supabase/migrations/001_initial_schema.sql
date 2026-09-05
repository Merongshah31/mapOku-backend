-- =====================================================
-- MAPOKU DATABASE SCHEMA — Migration 001
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

-- Enable PostGIS for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE obstacle_type AS ENUM (
  'broken_pavement',
  'steep_ramp',
  'missing_curb_cut',
  'construction',
  'flooded_path',
  'narrow_passage',
  'no_tactile_paving',
  'blocked_ramp',
  'uneven_surface',
  'other'
);

CREATE TYPE obstacle_status AS ENUM (
  'active',
  'archived',
  'under_review'
);

CREATE TYPE vote_type AS ENUM (
  'upvote',
  'downvote'
);

CREATE TYPE accessibility_need AS ENUM (
  'wheelchair',
  'visually_impaired',
  'elderly',
  'stroller',
  'hearing_impaired'
);

-- =====================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with public profile data
-- =====================================================

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT UNIQUE NOT NULL,
  avatar_url  TEXT,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- OBSTACLES TABLE
-- Core table — uses PostGIS GEOGRAPHY for spatial ops
-- =====================================================

CREATE TABLE public.obstacles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location      GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS point (lng, lat)
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  type          obstacle_type NOT NULL,
  description   TEXT,
  image_url     TEXT,
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status        obstacle_status NOT NULL DEFAULT 'active',
  upvotes       INTEGER NOT NULL DEFAULT 0,
  downvotes     INTEGER NOT NULL DEFAULT 0,
  -- Accessibility context: which needs does this obstacle affect?
  affects       accessibility_need[] DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for fast bounding box queries
CREATE INDEX obstacles_location_idx ON public.obstacles USING GIST (location);

-- Index for status filtering
CREATE INDEX obstacles_status_idx ON public.obstacles (status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER obstacles_updated_at
  BEFORE UPDATE ON public.obstacles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VOTES TABLE
-- Prevents duplicate votes per user per obstacle
-- =====================================================

CREATE TABLE public.votes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obstacle_id  UUID NOT NULL REFERENCES public.obstacles(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type    vote_type NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(obstacle_id, user_id)  -- One vote per user per obstacle
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Profiles: public read, own write
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Obstacles: public read of active, authenticated write
ALTER TABLE public.obstacles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active obstacles are publicly readable"
  ON public.obstacles FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can create obstacles"
  ON public.obstacles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own obstacles"
  ON public.obstacles FOR UPDATE USING (auth.uid() = user_id);

-- Votes: authenticated users only
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can vote"
  ON public.votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can see their own votes"
  ON public.votes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can change their own votes"
  ON public.votes FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- SUPABASE REALTIME
-- Enable realtime on obstacles table for live map updates
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.obstacles;
