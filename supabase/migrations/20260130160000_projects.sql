-- Projects owned by freelancer, linked to clients
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  name text not null,
  description text,
  start_date date,
  end_date date,
  pricing_type text not null default 'one_time'
    check (pricing_type in ('one_time', 'milestone')),
  total_fee numeric(12, 2),
  milestones jsonb not null default '[]'::jsonb,
  brand_color text,
  logo_url text,
  welcome_message text,
  kickoff_questions jsonb not null default '[]'::jsonb,
  invite_email text,
  invite_message text,
  status text not null default 'active'
    check (status in ('draft', 'active', 'on_hold', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_milestones_is_array check (jsonb_typeof(milestones) = 'array'),
  constraint projects_kickoff_questions_is_array check (jsonb_typeof(kickoff_questions) = 'array')
);

create index if not exists projects_freelancer_id_idx on public.projects (freelancer_id);
create index if not exists projects_client_id_idx on public.projects (client_id);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_profiles_updated_at();

alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
  on public.projects for select
  to authenticated
  using (freelancer_id = auth.uid());

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
  on public.projects for insert
  to authenticated
  with check (
    freelancer_id = auth.uid()
    and exists (
      select 1 from public.clients c
      where c.id = client_id and c.freelancer_id = auth.uid()
    )
  );

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
  on public.projects for update
  to authenticated
  using (freelancer_id = auth.uid())
  with check (freelancer_id = auth.uid());

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
  on public.projects for delete
  to authenticated
  using (freelancer_id = auth.uid());
