-- Phase 6 migration: VIP Vault
alter table public.tracks
  add column if not exists is_vault boolean not null default false;

create index if not exists tracks_vault_idx on public.tracks(is_vault);