-- Phase 5 migration: Stripe subscriptions (idempotent)
do $$ begin
  create type sub_status as enum ('free', 'active', 'past_due', 'canceled');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists subscription_status sub_status not null default 'free',
  add column if not exists updated_at timestamptz not null default now();

update public.profiles
  set subscription_status = 'free', updated_at = now()
  where subscription_status is null;

create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index if not exists profiles_stripe_customer_idx
  on public.profiles(stripe_customer_id);