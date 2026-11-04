-- Phase 5 migration: Stripe subscriptions

create type sub_status as enum ('free', 'active', 'past_due', 'canceled');

alter table public.profiles
  add column stripe_customer_id text unique,
  add column stripe_subscription_id text unique,
  add column subscription_status sub_status not null default 'free',
  add column updated_at timestamptz not null default now();

update public.profiles
  set subscription_status = 'free', updated_at = now()
  where subscription_status is null;

create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index profiles_stripe_customer_idx
  on public.profiles(stripe_customer_id);