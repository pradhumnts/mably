-- Allow project members to edit library links (title / url / description).

drop policy if exists "project_library_links_update_access" on public.project_library_links;
create policy "project_library_links_update_access"
  on public.project_library_links for update
  to authenticated
  using (public.user_can_access_project_for_library(project_id))
  with check (public.user_can_access_project_for_library(project_id));

grant update on public.project_library_links to authenticated;
