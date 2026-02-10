-- ============================================================================
-- Places: Neighborhood/District Guide for Abu Dhabi & Dubai
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,                -- 'abudhabi' | 'dubai'
  slug TEXT NOT NULL UNIQUE,         -- 'saadiyat-island', 'difc', ...
  name_en TEXT NOT NULL,
  name_ko TEXT,
  tagline_en TEXT,                   -- one-line definition
  tagline_ko TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}'::text[],  -- ['business','culture',...]
  best_for TEXT[] NOT NULL DEFAULT '{}'::text[],    -- ['investor_meetings',...]
  description_en TEXT,               -- 5-10 line detail
  description_ko TEXT,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,    -- [{label, value}]
  practical JSONB NOT NULL DEFAULT '{}'::jsonb,     -- {access, vibe, typical_meetings, tips}
  free_zone JSONB NOT NULL DEFAULT '{}'::jsonb,     -- {is_free_zone, name?, notes?}
  keywords TEXT[] NOT NULL DEFAULT '{}'::text[],    -- news matching keywords
  links JSONB NOT NULL DEFAULT '[]'::jsonb,         -- [{title, url, source_type}]
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,       -- [{url, title, trust_level, as_of}]
  icon TEXT,                         -- emoji or icon identifier
  as_of DATE,                        -- info effective date
  confidence NUMERIC NOT NULL DEFAULT 0.7,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS places_city_idx ON public.places(city);
CREATE INDEX IF NOT EXISTS places_categories_gin ON public.places USING gin(categories);
CREATE INDEX IF NOT EXISTS places_keywords_gin ON public.places USING gin(keywords);

-- RLS: public read, server-only write
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'places' AND policyname = 'places_read_public'
  ) THEN
    CREATE POLICY places_read_public ON public.places FOR SELECT USING (true);
  END IF;
END $$;

COMMENT ON TABLE public.places IS 'Neighborhood/district guide for Abu Dhabi and Dubai';
