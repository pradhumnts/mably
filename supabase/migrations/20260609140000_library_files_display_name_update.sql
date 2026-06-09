-- Allow project members to rename library files (display_name only enforced in app).

drop policy if exists "project_library_files_update_display_name" on public.project_library_files;
create policy "project_library_files_update_display_name"
  on public.project_library_files for update
  to authenticated
  using (public.user_can_access_project_for_library(project_id))
  with check (public.user_can_access_project_for_library(project_id));

grant update on public.project_library_files to authenticated;
