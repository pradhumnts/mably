-- INSERT policies used `auth.uid()` while triggers set `created_by` via `request_user_id()`
-- (coalesce(auth.uid(), jwt sub)). In some portal/JWT contexts that mismatch caused RLS to reject
-- client inserts: "new row violates row-level security policy".

drop policy if exists "project_library_links_insert_project_access" on public.project_library_links;
create policy "project_library_links_insert_project_access"
  on public.project_library_links for insert
  to authenticated
  with check (
    created_by = public.request_user_id()
    and public.user_can_access_project_for_library(project_id)
  );

drop policy if exists "project_library_files_insert_project_access" on public.project_library_files;
create policy "project_library_files_insert_project_access"
  on public.project_library_files for insert
  to authenticated
  with check (
    created_by = public.request_user_id()
    and public.user_can_access_project_for_library(project_id)
  );

drop policy if exists "project_activity_events_insert" on public.project_activity_events;
create policy "project_activity_events_insert"
  on public.project_activity_events for insert
  to authenticated
  with check (
    actor_id = public.request_user_id()
    and public.user_can_access_project_for_library(project_id)
  );

drop policy if exists "project_library_file_comments_insert" on public.project_library_file_comments;
create policy "project_library_file_comments_insert"
  on public.project_library_file_comments for insert
  to authenticated
  with check (
    author_id = public.request_user_id()
    and public.user_can_access_project_for_library(project_id)
  );

drop policy if exists "project_library_file_comments_delete_own_or_freelancer" on public.project_library_file_comments;
create policy "project_library_file_comments_delete_own_or_freelancer"
  on public.project_library_file_comments for delete
  to authenticated
  using (
    author_id = public.request_user_id()
    or public.user_is_project_freelancer_owner(project_id)
  );
