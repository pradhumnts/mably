-- Project Actions: client commitments / deadlines (not a full task manager).
-- owner=freelancer → private; owner=client → shared with client.

create table if not exists public.project_actions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  notes text,
  owner text not null
    constraint project_actions_owner_check
      check (owner in ('freelancer', 'client')),
  visibility text not null
    constraint project_actions_visibility_check
      check (visibility in ('private', 'shared')),
  due_date date,
  status text not null default 'open'
    constraint project_actions_status_check
      check (status in ('open', 'done')),
  completed_at timestamptz,
  completed_by uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_actions_owner_visibility_check check (
    (owner = 'freelancer' and visibility = 'private')
    or (owner = 'client' and visibility = 'shared')
  ),
  constraint project_actions_title_nonempty check (char_length(trim(title)) > 0)
);

create index if not exists project_actions_project_status_idx
  on public.project_actions (project_id, status, due_date nulls last);

create index if not exists project_actions_project_created_idx
  on public.project_actions (project_id, created_at desc);

alter table public.project_actions enable row level security;

drop policy if exists "project_actions_select" on public.project_actions;
create policy "project_actions_select"
  on public.project_actions for select
  to authenticated
  using (
    public.user_is_project_freelancer_owner(project_id)
    or (
      public.user_can_access_project_for_library(project_id)
      and visibility = 'shared'
    )
  );

drop policy if exists "project_actions_insert_freelancer" on public.project_actions;
create policy "project_actions_insert_freelancer"
  on public.project_actions for insert
  to authenticated
  with check (
    public.user_is_project_freelancer_owner(project_id)
    and created_by = auth.uid()
  );

drop policy if exists "project_actions_update" on public.project_actions;
create policy "project_actions_update"
  on public.project_actions for update
  to authenticated
  using (
    public.user_is_project_freelancer_owner(project_id)
    or (
      public.user_can_access_project_for_library(project_id)
      and visibility = 'shared'
      and owner = 'client'
    )
  )
  with check (
    public.user_is_project_freelancer_owner(project_id)
    or (
      public.user_can_access_project_for_library(project_id)
      and visibility = 'shared'
      and owner = 'client'
    )
  );

drop policy if exists "project_actions_delete_freelancer" on public.project_actions;
create policy "project_actions_delete_freelancer"
  on public.project_actions for delete
  to authenticated
  using (public.user_is_project_freelancer_owner(project_id));

create or replace function public.project_actions_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists project_actions_set_updated_at on public.project_actions;
create trigger project_actions_set_updated_at
  before update on public.project_actions
  for each row
  execute function public.project_actions_set_updated_at();

grant select, insert, update, delete on public.project_actions to authenticated;
