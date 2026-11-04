-- Phase 4 migration (Maddox Chain): admin events + admin settings

create table public.admin_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  album_id uuid references public.albums(id) on delete set null,
  track_id uuid references public.tracks(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index admin_events_created_idx on public.admin_events(created_at desc);

create table public.admin_settings (
  id int primary key default 1,
  password_hash text not null,
  updated_at timestamptz not null default now(),
  constraint admin_settings_single_row check (id = 1)
);
insert into public.admin_settings (id, password_hash)
  values (1, '')
  on conflict (id) do nothing;

alter table public.admin_events enable row level security;
alter table public.admin_settings enable row level security;

-- No policies = deny all for non-service-role. Correct for these tables.