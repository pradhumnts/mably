-- Seat quantity mirrored from Polar seat-based subscriptions (owner = 1).

alter table public.freelancer_subscriptions
  add column if not exists seats integer not null default 1;

alter table public.freelancer_subscriptions
  add column if not exists seats_synced_at timestamptz;

comment on column public.freelancer_subscriptions.seats is
  'Billed seat quantity from Polar (occupied workspace members). Owner is seat 1.';

comment on column public.freelancer_subscriptions.seats_synced_at is
  'When seats were last written from Polar webhook/reconcile or app seat sync.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'freelancer_subscriptions_seats_positive'
      and conrelid = 'public.freelancer_subscriptions'::regclass
  ) then
    alter table public.freelancer_subscriptions
      add constraint freelancer_subscriptions_seats_positive
      check (seats >= 1);
  end if;
end $$;
