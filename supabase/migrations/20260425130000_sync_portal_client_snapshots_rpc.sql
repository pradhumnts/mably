-- When a portal client updates profiles (name / email / avatar), mirror into projects.*_snapshot
-- so freelancers and chat see current display without reading other users' profiles (RLS).

create or replace function public.sync_portal_client_identity_snapshots()
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full text;
  v_email text;
  v_avatar text;
begin
  if not exists (select 1 from public.profiles pr where pr.id = auth.uid()) then
    return;
  end if;

  select
    trim(coalesce(full_name, '')),
    trim(coalesce(email, '')),
    avatar_url
  into v_full, v_email, v_avatar
  from public.profiles
  where id = auth.uid();

  return query
  update public.projects p
  set
    client_name_snapshot = nullif(v_full, ''),
    client_email_snapshot = nullif(v_email, ''),
    client_avatar_snapshot = v_avatar
  where
    p.freelancer_id is distinct from auth.uid()
    and (
      exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id
          and pm.user_id = auth.uid()
          and pm.role = 'client'
      )
      or (
        p.invite_email is not null
        and trim(p.invite_email) <> ''
        and lower(trim(p.invite_email)) = lower(nullif(v_email, ''))
      )
    )
  returning p.id;
end;
$$;

revoke all on function public.sync_portal_client_identity_snapshots() from public;
grant execute on function public.sync_portal_client_identity_snapshots() to authenticated;
