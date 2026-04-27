-- Client display on projects (portal can read without clients-table RLS for invitees)
alter table public.projects
  add column if not exists client_name_snapshot text,
  add column if not exists client_email_snapshot text,
  add column if not exists client_avatar_snapshot text;

-- Freelancer contact shown in client portal (clients cannot read profiles RLS for others)
alter table public.projects
  add column if not exists freelancer_display_name text,
  add column if not exists freelancer_avatar_url text,
  add column if not exists freelancer_calendar_link text;

-- Who may access a project in the portal (owner = freelancer)
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'client')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index if not exists project_members_project_id_idx on public.project_members (project_id);
create index if not exists project_members_user_id_idx on public.project_members (user_id);

alter table public.project_members enable row level security;

drop policy if exists "project_members_select_own" on public.project_members;
create policy "project_members_select_own"
  on public.project_members for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "project_members_insert_owner" on public.project_members;
create policy "project_members_insert_owner"
  on public.project_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.freelancer_id = auth.uid()
    )
  );

-- Wider project read: freelancer, member, or invited client (matches profiles.email)
drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_select_access" on public.projects;
create policy "projects_select_access"
  on public.projects for select
  to authenticated
  using (
    freelancer_id = auth.uid()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid()
    )
    or (
      invite_email is not null
      and trim(invite_email) <> ''
      and exists (
        select 1 from public.profiles pr
        where pr.id = auth.uid()
        and lower(trim(coalesce(pr.email, ''))) = lower(trim(projects.invite_email))
      )
    )
  );

-- Backfill owners for existing projects
insert into public.project_members (project_id, user_id, role)
select p.id, p.freelancer_id, 'owner'
from public.projects p
where not exists (
  select 1 from public.project_members m
  where m.project_id = p.id and m.user_id = p.freelancer_id
)
on conflict (project_id, user_id) do nothing;

-- Public logos for project branding (writes limited to own folder)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-logos',
  'project-logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Project logos public read" on storage.objects;
create policy "Project logos public read"
  on storage.objects for select
  to public
  using (bucket_id = 'project-logos');

drop policy if exists "Project logos insert own prefix" on storage.objects;
create policy "Project logos insert own prefix"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Project logos update own prefix" on storage.objects;
create policy "Project logos update own prefix"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'project-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Project logos delete own prefix" on storage.objects;
create policy "Project logos delete own prefix"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
