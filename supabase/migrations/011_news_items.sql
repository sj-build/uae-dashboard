-- news_items: unified news storage with content-hash dedup
-- Core idea: save title+summary immediately (even without fulltext)
create table if not exists news_items (
  id bigserial primary key,
  provider text not null,            -- 'naver' | 'google' | 'manual'
  provider_id text,                  -- provider-specific unique ID if available
  url text not null,
  title text not null,
  summary text,                      -- Naver description or Google snippet
  fulltext text,                     -- optional; fetched separately
  fulltext_status text not null default 'none'
    check (fulltext_status in ('none','pending','done','failed')),
  published_at timestamptz,
  publisher text,
  language text default 'ko',
  category text,
  tags text[] default '{}',
  image_url text,
  content_hash text not null unique, -- SHA-256(provider|url|published_at|title) for dedup
  meta jsonb default '{}'::jsonb,    -- extra provider-specific data
  created_at timestamptz default now()
);

create index if not exists idx_news_items_provider on news_items(provider);
create index if not exists idx_news_items_published on news_items(published_at desc);
create index if not exists idx_news_items_hash on news_items(content_hash);
create index if not exists idx_news_items_fulltext_status on news_items(fulltext_status);

-- ingestion_runs: log each ingestion run for debugging
create table if not exists ingestion_runs (
  id bigserial primary key,
  provider text not null,
  status text not null default 'running'
    check (status in ('running','success','partial','failed')),
  queries text[] default '{}',
  fetched int default 0,
  saved int default 0,
  skipped int default 0,
  errors int default 0,
  duration_ms int,
  meta jsonb default '{}'::jsonb,    -- error messages, timing breakdown, etc.
  started_at timestamptz default now(),
  finished_at timestamptz
);

create index if not exists idx_ingestion_runs_provider on ingestion_runs(provider);
create index if not exists idx_ingestion_runs_started on ingestion_runs(started_at desc);

-- RLS: allow public read on news_items (no auth needed for reading news)
alter table news_items enable row level security;
create policy "news_items_public_read" on news_items
  for select using (true);

alter table ingestion_runs enable row level security;
create policy "ingestion_runs_public_read" on ingestion_runs
  for select using (true);
