-- Resolve who should receive portal notification emails without the service role key.
-- Caller must pass library access for the project.

create or replace function public.get_portal_notification_recipients(p_project_id uuid)
returns table (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  role_line text,
  notification_preferences jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as user_id,
    nullif(trim(p.email), '') as email,
    coalesce(
      nullif(trim(p.full_name), ''),
      split_part(nullif(trim(p.email), ''), '@', 1),
      'Freelancer'
    ) as full_name,
    p.avatar_url,
    'Freelancer'::text as role_line,
    coalesce(p.notification_preferences, '{}'::jsonb) as notification_preferences
  from public.projects pr
  inner join public.profiles p on p.id = pr.freelancer_id
  where pr.id = p_project_id
    and auth.uid() is not null
    and public.user_can_access_project_for_library(p_project_id)

  union all

  select
    p.id,
    nullif(trim(p.email), ''),
    coalesce(
      nullif(trim(p.full_name), ''),
      split_part(nullif(trim(p.email), ''), '@', 1),
      'Client'
    ),
    p.avatar_url,
    'Client'::text,
    coalesce(p.notification_preferences, '{}'::jsonb)
  from public.project_members pm
  inner join public.profiles p on p.id = pm.user_id
  where pm.project_id = p_project_id
    and pm.role = 'client'
    and auth.uid() is not null
    and public.user_can_access_project_for_library(p_project_id)

  union all

  select
    null::uuid,
    nullif(trim(pr.invite_email), ''),
    coalesce(
      nullif(trim(pr.client_name_snapshot), ''),
      split_part(lower(trim(pr.invite_email)), '@', 1),
      'Client'
    ),
    pr.client_avatar_snapshot,
    'Client'::text,
    '{}'::jsonb
  from public.projects pr
  where pr.id = p_project_id
    and pr.invite_email is not null
    and trim(pr.invite_email) <> ''
    and auth.uid() is not null
    and public.user_can_access_project_for_library(p_project_id);
$$;

revoke all on function public.get_portal_notification_recipients(uuid) from public;
grant execute on function public.get_portal_notification_recipients(uuid) to authenticated;
