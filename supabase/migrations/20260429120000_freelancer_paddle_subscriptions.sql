-- Paddle subscription mirror for freelancers (Merchant of Record checkout + webhooks).
-- Updated only by server webhook using service role — never trust client.

create table if not exists public.freelancer_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  paddle_customer_id text,
  paddle_subscription_id text unique,
  status text not null default 'none',
  price_id text,
  plan_key text check (plan_key is null or plan_key in ('starter', 'growth')),
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists freelancer_subscriptions_subscription_id_idx
  on public.freelancer_subscriptions (paddle_subscription_id);

create index if not exists freelancer_subscriptions_customer_id_idx
  on public.freelancer_subscriptions (paddle_customer_id);

alter table public.freelancer_subscriptions enable row level security;

drop policy if exists "freelancer_subscriptions_select_own" on public.freelancer_subscriptions;
create policy "freelancer_subscriptions_select_own"
  on public.freelancer_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);

-- Inserts/updates come from webhooks with service role only.

create table if not exists public.paddle_webhook_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

alter table public.paddle_webhook_events enable row level security;
-- No user policies — service role only.
