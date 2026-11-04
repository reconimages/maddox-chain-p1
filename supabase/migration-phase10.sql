-- Phase B migration: Play tracking
create table public.play_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  track_id uuid not null references public.tracks(id) on delete cascade,
  is_vault boolean not null default false,
  was_paid boolean not null default false,
  played_at timestamptz not null default now()
);

create index play_events_track_time_idx
  on public.play_events(track_id, played_at desc);
create index play_events_user_idx
  on public.play_events(user_id) where user_id is not null;
create index play_events_played_at_idx
  on public.play_events(played_at desc);

alter table public.play_events enable row level security;

-- No policies. Only service role can read/write.