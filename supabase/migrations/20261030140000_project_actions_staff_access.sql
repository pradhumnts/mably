-- Allow workspace staff (owner/admin/member-with-grant) to manage project_actions,
-- not only the legacy projects.freelancer_id owner.

drop policy if exists "project_actions_select" on public.project_actions;
create policy "project_actions_select"
  on public.project_actions for select
  to authenticated
  using (
    public.user_can_access_project_as_staff(project_id, (select auth.uid()))
    or (
      public.user_can_access_project_for_library(project_id)
      and visibility = 'shared'
    )
  );

drop policy if exists "project_actions_insert_freelancer" on public.project_actions;
create policy "project_actions_insert_freelancer"
  on public.project_actions for insert
  to authenticated
  with check (
    public.user_can_access_project_as_staff(project_id, (select auth.uid()))
    and created_by = (select auth.uid())
  );

drop policy if exists "project_actions_update" on public.project_actions;
create policy "project_actions_update"
  on public.project_actions for update
  to authenticated
  using (
    public.user_can_access_project_as_staff(project_id, (select auth.uid()))
    or (
      public.user_can_access_project_for_library(project_id)
      and visibility = 'shared'
      and owner = 'client'
    )
  )
  with check (
    public.user_can_access_project_as_staff(project_id, (select auth.uid()))
    or (
      public.user_can_access_project_for_library(project_id)
      and visibility = 'shared'
      and owner = 'client'
    )
  );

drop policy if exists "project_actions_delete_freelancer" on public.project_actions;
create policy "project_actions_delete_freelancer"
  on public.project_actions for delete
  to authenticated
  using (public.user_can_access_project_as_staff(project_id, (select auth.uid())));
