-- Allow any portal member with library access to add links (same rule as library file inserts).

drop policy if exists "project_library_links_insert_freelancer" on public.project_library_links;
drop policy if exists "project_library_links_insert_project_access" on public.project_library_links;

create policy "project_library_links_insert_project_access"
  on public.project_library_links for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.user_can_access_project_for_library(project_id)
  );
