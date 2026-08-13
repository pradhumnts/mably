-- Primary client snapshots must not be overwritten by additional stakeholders.
-- Previously any project_members client role could sync their profile into
-- projects.client_*_snapshot, which made later uploads / UI look like the wrong person.

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
    and p.invite_email is not null
    and trim(p.invite_email) <> ''
    and lower(trim(p.invite_email)) = lower(nullif(v_email, ''))
  returning p.id;
end;
$$;
