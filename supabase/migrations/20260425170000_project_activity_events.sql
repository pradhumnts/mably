-- Append-only project activity feed (typed events + JSON payload for forward-compatible fields).

create table if not exists public.project_activity_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  event_type text not null,
  actor_id uuid not null references auth.users (id) on delete cascade,
  actor_display_name text not null default '',
  actor_avatar_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_activity_events_project_created_idx
  on public.project_activity_events (project_id, created_at desc);

create index if not exists project_activity_events_project_type_idx
  on public.project_activity_events (project_id, event_type);

alter table public.project_activity_events enable row level security;

drop policy if exists "project_activity_events_select" on public.project_activity_events;
create policy "project_activity_events_select"
  on public.project_activity_events for select
  to authenticated
  using (public.user_can_access_project_for_library(project_id));

drop policy if exists "project_activity_events_insert" on public.project_activity_events;
create policy "project_activity_events_insert"
  on public.project_activity_events for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and public.user_can_access_project_for_library(project_id)
  );

grant select, insert on public.project_activity_events to authenticated;
