-- Rename default "Personal" workspaces to "{First}'s workspace" from owner profile.
-- Also update ensure_personal_workspace() so new workspaces never use bare "Personal".

update public.workspaces w
set name = trim(
  both from
  case
    when coalesce(nullif(trim(split_part(coalesce(pr.full_name, ''), ' ', 1)), ''), '') <> '' then
      case
        when right(trim(split_part(pr.full_name, ' ', 1)), 1) in ('s', 'S')
          then trim(split_part(pr.full_name, ' ', 1)) || ''' workspace'
        else trim(split_part(pr.full_name, ' ', 1)) || '''s workspace'
      end
    when coalesce(nullif(trim(split_part(coalesce(pr.email, ''), '@', 1)), ''), '') <> '' then
      case
        when right(trim(split_part(pr.email, '@', 1)), 1) in ('s', 'S')
          then trim(split_part(pr.email, '@', 1)) || ''' workspace'
        else trim(split_part(pr.email, '@', 1)) || '''s workspace'
      end
    else 'Workspace'
  end
)
from public.workspace_members wm
left join public.profiles pr on pr.id = wm.user_id
where wm.workspace_id = w.id
  and wm.role = 'owner'
  and lower(trim(w.name)) = 'personal';

create or replace function public.ensure_personal_workspace(u uuid default auth.uid())
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := coalesce(u, auth.uid());
  v_ws uuid;
  v_name text;
  v_first text;
  v_email_local text;
begin
  if v_uid is null then
    raise exception 'not_signed_in';
  end if;

  select wm.workspace_id into v_ws
  from public.workspace_members wm
  where wm.user_id = v_uid and wm.role = 'owner'
  limit 1;

  if v_ws is not null then
    return v_ws;
  end if;

  select
    nullif(trim(split_part(coalesce(full_name, ''), ' ', 1)), ''),
    nullif(trim(split_part(coalesce(email, ''), '@', 1)), '')
  into v_first, v_email_local
  from public.profiles
  where id = v_uid;

  if v_first is not null then
    v_name := case
      when right(v_first, 1) in ('s', 'S') then v_first || ''' workspace'
      else v_first || '''s workspace'
    end;
  elsif v_email_local is not null then
    v_name := case
      when right(v_email_local, 1) in ('s', 'S') then v_email_local || ''' workspace'
      else v_email_local || '''s workspace'
    end;
  else
    v_name := 'Workspace';
  end if;

  insert into public.workspaces (name, created_by)
  values (v_name, v_uid)
  returning id into v_ws;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_ws, v_uid, 'owner');

  return v_ws;
end;
$$;
