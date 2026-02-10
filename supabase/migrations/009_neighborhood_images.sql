-- Neighborhood images metadata table
-- Stores Unsplash photos cached in Supabase Storage
create table if not exists neighborhood_images (
  id uuid primary key default gen_random_uuid(),
  city text not null check (city in ('abudhabi','dubai')),
  neighborhood_slug text not null,
  provider text not null default 'unsplash',
  provider_id text not null,
  storage_path text not null,
  public_url text not null,
  source_url text not null,
  photographer text,
  photographer_url text,
  license text not null default 'Unsplash License',
  attribution_text text,
  width int,
  height int,
  retrieved_at timestamptz not null default now(),
  is_active boolean not null default false,
  quality_score int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  unique(city, neighborhood_slug, provider, provider_id)
);

create index if not exists idx_neighborhood_images_active
on neighborhood_images(city, neighborhood_slug, is_active);

-- RLS: public read
alter table neighborhood_images enable row level security;

drop policy if exists "public read neighborhood_images" on neighborhood_images;
create policy "public read neighborhood_images"
on neighborhood_images for select using (true);
