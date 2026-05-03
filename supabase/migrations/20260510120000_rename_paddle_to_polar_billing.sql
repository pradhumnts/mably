-- Rename Paddle-specific billing storage to Polar (safe if already applied).

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'freelancer_subscriptions'
      and column_name = 'paddle_customer_id'
  ) then
    alter table public.freelancer_subscriptions
      rename column paddle_customer_id to polar_customer_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'freelancer_subscriptions'
      and column_name = 'paddle_subscription_id'
  ) then
    alter table public.freelancer_subscriptions
      rename column paddle_subscription_id to polar_subscription_id;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'paddle_webhook_events'
  ) then
    alter table public.paddle_webhook_events rename to polar_webhook_events;
  end if;
end $$;
