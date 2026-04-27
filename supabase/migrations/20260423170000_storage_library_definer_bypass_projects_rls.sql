-- Storage policies must NOT inline-query `public.projects` under the storage DB role:
-- that role often cannot SELECT projects through RLS, so EXISTS(...) is always false.
-- Use SECURITY DEFINER helpers (owned by postgres) to read projects for path + owner checks.

-- Who may read an object path (portal access, same rules as library)
create or replace function public.user_can_access_project_as_user(project_uuid uuid, u uuid)
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
      p.freelancer_id = u
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = u
      )
      or (
        p.invite_email is not null
        and trim(p.invite_email) <> ''
        and exists (
          select 1 from public.profiles pr
          where pr.id = u
          and lower(trim(coalesce(pr.email, ''))) = lower(trim(p.invite_email))
        )
      )
    )
  );
$$;

grant execute on function public.user_can_access_project_as_user(uuid, uuid) to public;

create or replace function public.storage_library_may_insert_object(p_bucket_id text, p_name text, p_owner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_bucket_id = 'project-library'
    and p_owner_id is not null
    and exists (
      select 1
      from public.projects p
      where p.freelancer_id = p_owner_id
        and split_part(ltrim(p_name, '/'), '/', 1) = p.id::text
    );
$$;

grant execute on function public.storage_library_may_insert_object(text, text, uuid) to public;

create or replace function public.storage_library_may_delete_object(p_bucket_id text, p_name text, p_actor uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_bucket_id = 'project-library'
    and p_actor is not null
    and exists (
      select 1
      from public.projects p
      where p.freelancer_id = p_actor
        and split_part(ltrim(p_name, '/'), '/', 1) = p.id::text
    );
$$;

grant execute on function public.storage_library_may_delete_object(text, text, uuid) to public;

create or replace function public.storage_library_may_select_object(p_bucket_id text, p_name text, p_reader uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_bucket_id = 'project-library'
    and p_reader is not null
    and exists (
      select 1
      from public.projects p
      where split_part(ltrim(p_name, '/'), '/', 1) = p.id::text
        and public.user_can_access_project_as_user(p.id, p_reader)
    );
$$;

grant execute on function public.storage_library_may_select_object(text, text, uuid) to public;

-- Policies call helpers only (no direct projects scan in policy body)
drop policy if exists "project_library_storage_insert" on storage.objects;
create policy "project_library_storage_insert"
  on storage.objects for insert
  to public
  with check (
    owner_id is not null
    and public.storage_library_may_insert_object(bucket_id, name, owner_id::uuid)
  );

drop policy if exists "project_library_storage_delete" on storage.objects;
create policy "project_library_storage_delete"
  on storage.objects for delete
  to public
  using (
    public.request_user_id() is not null
    and public.storage_library_may_delete_object(bucket_id, name, public.request_user_id())
  );

drop policy if exists "project_library_storage_select" on storage.objects;
create policy "project_library_storage_select"
  on storage.objects for select
  to public
  using (
    public.request_user_id() is not null
    and public.storage_library_may_select_object(bucket_id, name, public.request_user_id())
  );
