-- Storage API runs INSERT on storage.objects as role `supabase_storage_admin`, not `authenticated`.
-- Policies "TO authenticated" never apply → RLS denies every insert (42501).
-- Fix: policies TO public + resolve caller via JWT sub when auth.uid() is null.
-- Grant EXECUTE on helpers to PUBLIC so storage can evaluate policies (revoked in prior migration).

-- ---------------------------------------------------------------------------
-- Who is calling? PostgREST uses `authenticated`; Storage API uses storage admin + JWT.
-- ---------------------------------------------------------------------------
create or replace function public.request_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.uid(),
    nullif(trim(coalesce(auth.jwt() ->> 'sub', '')), '')::uuid
  );
$$;

grant execute on function public.request_user_id() to public;

-- ---------------------------------------------------------------------------
-- Library helpers (same logic; use request_user_id())
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
      p.freelancer_id = public.request_user_id()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = public.request_user_id()
      )
      or (
        p.invite_email is not null
        and trim(p.invite_email) <> ''
        and exists (
          select 1 from public.profiles pr
          where pr.id = public.request_user_id()
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
    where p.id = project_uuid and p.freelancer_id = public.request_user_id()
  );
$$;

grant execute on function public.user_can_access_project_for_library(uuid) to public;
grant execute on function public.user_is_project_freelancer_owner(uuid) to public;

-- ---------------------------------------------------------------------------
-- created_by: use same identity resolution as Storage
-- ---------------------------------------------------------------------------
create or replace function public.project_library_set_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.created_by := public.request_user_id();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- storage.objects: must be TO public (storage service role is not "authenticated")
-- ---------------------------------------------------------------------------
drop policy if exists "project_library_storage_select" on storage.objects;
create policy "project_library_storage_select"
  on storage.objects for select
  to public
  using (
    bucket_id = 'project-library'
    and public.request_user_id() is not null
    and exists (
      select 1 from public.projects p
      where public.user_can_access_project_for_library(p.id)
      and ltrim(name, '/') like p.id::text || '/%'
    )
  );

drop policy if exists "project_library_storage_insert" on storage.objects;
create policy "project_library_storage_insert"
  on storage.objects for insert
  to public
  with check (
    bucket_id = 'project-library'
    and public.request_user_id() is not null
    and exists (
      select 1 from public.projects p
      where public.user_is_project_freelancer_owner(p.id)
      and ltrim(name, '/') like p.id::text || '/%'
    )
  );

drop policy if exists "project_library_storage_delete" on storage.objects;
create policy "project_library_storage_delete"
  on storage.objects for delete
  to public
  using (
    bucket_id = 'project-library'
    and public.request_user_id() is not null
    and exists (
      select 1 from public.projects p
      where public.user_is_project_freelancer_owner(p.id)
      and ltrim(name, '/') like p.id::text || '/%'
    )
  );
