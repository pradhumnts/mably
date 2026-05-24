-- Materialized freelancer notification inbox (hybrid with derived feed backfill).

create table if not exists public.freelancer_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  dedupe_key text not null,
  type text not null,
  project_id uuid references public.projects (id) on delete cascade,
  title text not null,
  body text,
  href text not null,
  priority smallint not null default 99,
  actor_name text,
  actor_avatar_url text,
  project_name text,
  project_logo_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint freelancer_notifications_user_dedupe_unique unique (user_id, dedupe_key)
);

create index if not exists freelancer_notifications_user_unread_idx
  on public.freelancer_notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists freelancer_notifications_user_created_idx
  on public.freelancer_notifications (user_id, created_at desc);

alter table public.freelancer_notifications enable row level security;

drop policy if exists "freelancer_notifications_select_own" on public.freelancer_notifications;
create policy "freelancer_notifications_select_own"
  on public.freelancer_notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "freelancer_notifications_update_own" on public.freelancer_notifications;
create policy "freelancer_notifications_update_own"
  on public.freelancer_notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, update on public.freelancer_notifications to authenticated;

-- Inserts/upserts from server use service role (dual-write).
