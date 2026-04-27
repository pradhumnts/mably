-- Let any user with portal library access upload files (e.g. client sharing assets), not only the freelancer.

drop policy if exists "project_library_files_insert_freelancer" on public.project_library_files;
drop policy if exists "project_library_files_insert_project_access" on public.project_library_files;

create policy "project_library_files_insert_project_access"
  on public.project_library_files for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.user_can_access_project_for_library(project_id)
  );

-- Storage: allow insert when the uploader can access the project in the path (not only freelancer_id = uploader).
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
      where split_part(ltrim(p_name, '/'), '/', 1) = p.id::text
        and public.user_can_access_project_as_user(p.id, p_owner_id)
    );
$$;
