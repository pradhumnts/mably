-- Allow workspace teammates to read basic profile fields (avatar/name) for switcher UI.
-- Does not widen write access.

create or replace function public.user_shares_workspace_with(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members me
    join public.workspace_members them
      on them.workspace_id = me.workspace_id
    where me.user_id = (select auth.uid())
      and them.user_id = target
  );
$$;

revoke all on function public.user_shares_workspace_with(uuid) from public;
grant execute on function public.user_shares_workspace_with(uuid) to authenticated;

drop policy if exists "profiles_select_workspace_peers" on public.profiles;
create policy "profiles_select_workspace_peers"
  on public.profiles for select
  to authenticated
  using (public.user_shares_workspace_with(id));
