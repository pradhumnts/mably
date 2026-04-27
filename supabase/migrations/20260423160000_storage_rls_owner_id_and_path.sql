-- Storage INSERT evaluates WITH CHECK while the row is being created. The Storage API
-- always sets `owner_id` from the JWT `sub` (see Supabase "Ownership" docs). Relying on
-- auth.uid() / JWT helpers inside SECURITY DEFINER during that check is unreliable.
-- Match uploads with: first path segment = project id, and that project's freelancer = owner_id.

drop policy if exists "project_library_storage_insert" on storage.objects;
create policy "project_library_storage_insert"
  on storage.objects for insert
  to public
  with check (
    bucket_id = 'project-library'
    and owner_id is not null
    and exists (
      select 1
      from public.projects p
      where p.freelancer_id::text = owner_id
        and split_part(ltrim(name, '/'), '/', 1) = p.id::text
    )
  );

-- Delete: caller must be the project freelancer (not only row owner_id — that is the uploader id on the row)
drop policy if exists "project_library_storage_delete" on storage.objects;
create policy "project_library_storage_delete"
  on storage.objects for delete
  to public
  using (
    bucket_id = 'project-library'
    and public.request_user_id() is not null
    and exists (
      select 1
      from public.projects p
      where p.freelancer_id = public.request_user_id()
        and split_part(ltrim(name, '/'), '/', 1) = p.id::text
    )
  );

-- Select: any portal user who can read the project; path must be under that project id
drop policy if exists "project_library_storage_select" on storage.objects;
create policy "project_library_storage_select"
  on storage.objects for select
  to public
  using (
    bucket_id = 'project-library'
    and exists (
      select 1
      from public.projects p
      where split_part(ltrim(name, '/'), '/', 1) = p.id::text
        and public.user_can_access_project_for_library(p.id)
    )
  );

-- Broader JWT resolution for SELECT / DELETE (storage + PostgREST contexts)
create or replace function public.request_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.uid(),
    nullif(trim(coalesce(auth.jwt() ->> 'sub', '')), '')::uuid,
    nullif(trim(coalesce(current_setting('request.jwt.claim.sub', true), '')), '')::uuid
  );
$$;

grant execute on function public.request_user_id() to public;
