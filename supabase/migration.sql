-- Phase 1 migration (Maddox Chain)
-- Paste into Supabase SQL editor and run.

drop table if exists public.tracks cascade;
drop table if exists public.albums cascade;

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  release_year int not null,
  cover_path text,
  created_at timestamptz not null default now()
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  title text not null,
  track_number int not null,
  duration_seconds int not null default 0,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index tracks_album_idx on public.tracks(album_id, track_number);

alter table public.albums enable row level security;
alter table public.tracks enable row level security;

create policy "albums public read" on public.albums for select using (true);
create policy "tracks public read" on public.tracks for select using (true);

-- Storage: allow the (anonymous) server client to generate signed URLs.
-- Buckets remain PRIVATE (public=false); raw URLs still require a signed token.
create policy "audio read" on storage.objects for select using (bucket_id = 'audio');
create policy "covers read" on storage.objects for select using (bucket_id = 'covers');
