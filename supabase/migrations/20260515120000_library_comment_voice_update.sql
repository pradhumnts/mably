-- Allow authors / project freelancers to clear voice fields after deleting a recording from storage.

grant update on public.project_library_file_comments to authenticated;

drop policy if exists "project_library_file_comments_update_own_or_freelancer"
  on public.project_library_file_comments;

create policy "project_library_file_comments_update_own_or_freelancer"
  on public.project_library_file_comments for update
  to authenticated
  using (
    author_id = public.request_user_id()
    or public.user_is_project_freelancer_owner(project_id)
  )
  with check (
    author_id = public.request_user_id()
    or public.user_is_project_freelancer_owner(project_id)
  );
