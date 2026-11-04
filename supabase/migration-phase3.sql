-- Phase 3 migration (Maddox Chain): distinguish singles from albums
alter table public.albums
  add column if not exists is_single boolean not null default false;

create index if not exists albums_is_single_idx on public.albums(is_single);
