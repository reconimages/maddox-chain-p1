-- Phase 9 migration: Admin comp access (free VIP grants)
alter table public.profiles
  add column if not exists comped_until timestamptz,
  add column if not exists comped_at timestamptz,
  add column if not exists comped_by_note text;

create index if not exists profiles_comped_until_idx
  on public.profiles(comped_until)
  where comped_until is not null;