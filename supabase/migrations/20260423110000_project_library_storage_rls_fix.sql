-- Fix library Storage RLS: object `name` may not match split_part(..., '/', 1) reliably.
-- Use prefix match: {project_id}/... after ltrim slashes.
-- Also: library helper functions use SECURITY DEFINER so reads on `projects` are not blocked
-- by subtle RLS/planner interactions; triggers set created_by so INSERT policies stay simple.

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER: stable access checks for policies)
-- ---------------------------------------------------------------------------
create or replace function public.user_can_access_project_for_library(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_uuid
    and (
      p.freelancer_id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = auth.uid()
      )
      or (
        p.invite_email is not null
        and trim(p.invite_email) <> ''
        and exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid()
          and lower(trim(coalesce(pr.email, ''))) = lower(trim(p.invite_email))
        )
      )
    )
  );
$$;

create or replace function public.user_is_project_freelancer_owner(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_uuid and p.freelancer_id = auth.uid()
  );
$$;

revoke all on function public.user_can_access_project_for_library(uuid) from public;
revoke all on function public.user_is_project_freelancer_owner(uuid) from public;
grant execute on function public.user_can_access_project_for_library(uuid) to authenticated;
grant execute on function public.user_is_project_freelancer_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- created_by from session (do not rely on client / WITH CHECK on created_by)
-- ---------------------------------------------------------------------------
create or replace function public.project_library_set_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.created_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists project_library_links_set_created_by on public.project_library_links;
create trigger project_library_links_set_created_by
  before insert on public.project_library_links
  for each row execute function public.project_library_set_created_by();

drop trigger if exists project_library_files_set_created_by on public.project_library_files;
create trigger project_library_files_set_created_by
  before insert on public.project_library_files
  for each row execute function public.project_library_set_created_by();

-- ---------------------------------------------------------------------------
-- Table INSERT policies (owner only; created_by enforced by trigger)
-- ---------------------------------------------------------------------------
drop policy if exists "project_library_links_insert_freelancer" on public.project_library_links;
create policy "project_library_links_insert_freelancer"
  on public.project_library_links for insert
  to authenticated
  with check (public.user_is_project_freelancer_owner(project_id));

drop policy if exists "project_library_files_insert_freelancer" on public.project_library_files;
create policy "project_library_files_insert_freelancer"
  on public.project_library_files for insert
  to authenticated
  with check (public.user_is_project_freelancer_owner(project_id));

-- ---------------------------------------------------------------------------
-- Storage: prefix on object key = project id folder
-- ---------------------------------------------------------------------------
drop policy if exists "project_library_storage_select" on storage.objects;
create policy "project_library_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-library'
    and exists (
      select 1 from public.projects p
      where public.user_can_access_project_for_library(p.id)
      and ltrim(name, '/') like p.id::text || '/%'
    )
  );

drop policy if exists "project_library_storage_insert" on storage.objects;
create policy "project_library_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-library'
    and exists (
      select 1 from public.projects p
      where public.user_is_project_freelancer_owner(p.id)
      and ltrim(name, '/') like p.id::text || '/%'
    )
  );

drop policy if exists "project_library_storage_delete" on storage.objects;
create policy "project_library_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-library'
    and exists (
      select 1 from public.projects p
      where public.user_is_project_freelancer_owner(p.id)
      and ltrim(name, '/') like p.id::text || '/%'
    )
  );
