-- Phase 3 (Phase 5 file) migration: Likes and Playlists

create table public.liked_tracks (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);
create index liked_tracks_user_idx on public.liked_tracks(user_id);

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index playlists_user_idx on public.playlists(user_id);

create table public.playlist_tracks (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  position int not null,
  added_at timestamptz not null default now(),
  primary key (playlist_id, track_id)
);
create index playlist_tracks_playlist_idx
  on public.playlist_tracks(playlist_id, position);

alter table public.liked_tracks enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_tracks enable row level security;

create policy "own likes read" on public.liked_tracks
  for select using (auth.uid() = user_id);
create policy "own likes insert" on public.liked_tracks
  for insert with check (auth.uid() = user_id);
create policy "own likes delete" on public.liked_tracks
  for delete using (auth.uid() = user_id);

create policy "own playlists read" on public.playlists
  for select using (auth.uid() = user_id);
create policy "own playlists insert" on public.playlists
  for insert with check (auth.uid() = user_id);
create policy "own playlists update" on public.playlists
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "own playlists delete" on public.playlists
  for delete using (auth.uid() = user_id);

create policy "own playlist_tracks read" on public.playlist_tracks
  for select using (
    playlist_id in (select id from public.playlists where user_id = auth.uid())
  );
create policy "own playlist_tracks insert" on public.playlist_tracks
  for insert with check (
    playlist_id in (select id from public.playlists where user_id = auth.uid())
  );
create policy "own playlist_tracks update" on public.playlist_tracks
  for update using (
    playlist_id in (select id from public.playlists where user_id = auth.uid())
  )
  with check (
    playlist_id in (select id from public.playlists where user_id = auth.uid())
  );
create policy "own playlist_tracks delete" on public.playlist_tracks
  for delete using (
    playlist_id in (select id from public.playlists where user_id = auth.uid())
  );

create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger playlists_updated_at
  before update on public.playlists
  for each row execute function public.set_updated_at();