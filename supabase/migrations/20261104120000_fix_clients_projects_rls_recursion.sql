-- Fix project create:
-- 1. Infinite recursion: projects INSERT policy reads clients, and clients SELECT
--    policy read projects under RLS. Staff-grant lookup must be SECURITY DEFINER
--    so it does not re-enter projects policies.
-- 2. INSERT ... RETURNING: projects SELECT policy only checked access through a
--    function that queries projects by id, which cannot see the row being
--    inserted. Owner/admin checks must evaluate the new row's columns directly.

create or replace function public.user_has_staff_project_on_client(
  client_uuid uuid,
  client_workspace_id uuid,
  u uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    join public.project_staff_access psa on psa.project_id = p.id
    where p.client_id = client_uuid
      and p.workspace_id = client_workspace_id
      and psa.user_id = coalesce(u, auth.uid())
      and exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = client_workspace_id
          and wm.user_id = coalesce(u, auth.uid())
      )
  );
$$;

revoke all on function public.user_has_staff_project_on_client(uuid, uuid, uuid) from public;
grant execute on function public.user_has_staff_project_on_client(uuid, uuid, uuid) to authenticated;

drop policy if exists "clients_select_access" on public.clients;
create policy "clients_select_access"
  on public.clients for select
  to authenticated
  using (
    freelancer_id = (select auth.uid())
    or public.user_can_manage_workspace(workspace_id, (select auth.uid()))
    or public.user_has_staff_project_on_client(id, workspace_id, (select auth.uid()))
  );

drop policy if exists "projects_select_access" on public.projects;
create policy "projects_select_access"
  on public.projects for select
  to authenticated
  using (
    freelancer_id = (select auth.uid())
    or public.user_can_manage_workspace(workspace_id, (select auth.uid()))
    or public.user_can_access_project_as_staff(id, (select auth.uid()))
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = (select auth.uid())
    )
    or (
      invite_email is not null
      and trim(invite_email) <> ''
      and exists (
        select 1 from public.profiles pr
        where pr.id = (select auth.uid())
        and lower(trim(coalesce(pr.email, ''))) = lower(trim(projects.invite_email))
      )
    )
    or public.user_email_has_project_invite(id, (select auth.uid()))
  );

drop policy if exists "project_members_insert_owner" on public.project_members;
create policy "project_members_insert_owner"
  on public.project_members for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.user_owns_project_as(project_id, (select auth.uid()))
  );
