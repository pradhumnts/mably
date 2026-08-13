-- Fix infinite recursion: projects SELECT ↔ project_members/project_invites policies
-- that queried projects under RLS. Ownership checks must be SECURITY DEFINER.

create or replace function public.user_owns_project_as(project_uuid uuid, u uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_uuid and p.freelancer_id = u
  );
$$;

revoke all on function public.user_owns_project_as(uuid, uuid) from public;
grant execute on function public.user_owns_project_as(uuid, uuid) to authenticated;

drop policy if exists "project_invites_select_freelancer" on public.project_invites;
create policy "project_invites_select_freelancer"
  on public.project_invites for select
  to authenticated
  using (
    public.user_owns_project_as(project_invites.project_id, auth.uid())
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid()
        and lower(trim(coalesce(pr.email, ''))) = lower(trim(project_invites.email))
    )
  );

drop policy if exists "project_invites_insert_freelancer" on public.project_invites;
create policy "project_invites_insert_freelancer"
  on public.project_invites for insert
  to authenticated
  with check (
    invited_by = auth.uid()
    and public.user_owns_project_as(project_id, auth.uid())
  );

drop policy if exists "project_invites_update_freelancer" on public.project_invites;
create policy "project_invites_update_freelancer"
  on public.project_invites for update
  to authenticated
  using (public.user_owns_project_as(project_invites.project_id, auth.uid()))
  with check (public.user_owns_project_as(project_invites.project_id, auth.uid()));

drop policy if exists "project_invites_delete_freelancer" on public.project_invites;
create policy "project_invites_delete_freelancer"
  on public.project_invites for delete
  to authenticated
  using (public.user_owns_project_as(project_invites.project_id, auth.uid()));

drop policy if exists "project_members_select_own" on public.project_members;
drop policy if exists "project_members_select_access" on public.project_members;
create policy "project_members_select_access"
  on public.project_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.user_owns_project_as(project_id, auth.uid())
  );

drop policy if exists "project_members_delete_client_by_freelancer" on public.project_members;
create policy "project_members_delete_client_by_freelancer"
  on public.project_members for delete
  to authenticated
  using (
    role = 'client'
    and public.user_owns_project_as(project_id, auth.uid())
  );
