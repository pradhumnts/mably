-- Multi-client / stakeholder V1: pending invites + membership accept.
-- Extra portal clients are free (no seat billing). Full client access for all members.

create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  email text not null,
  invited_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users (id) on delete set null
);

create index if not exists project_invites_project_id_idx
  on public.project_invites (project_id);

create index if not exists project_invites_email_idx
  on public.project_invites (lower(trim(email)));

-- One pending invite per email per project
create unique index if not exists project_invites_project_pending_email_uidx
  on public.project_invites (project_id, lower(trim(email)))
  where status = 'pending';

alter table public.project_invites enable row level security;

-- Bypass projects RLS when other policies need to know "is this my project?"
-- (avoids projects ↔ project_members / project_invites infinite recursion)
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

-- Freelancer can see all members on their projects; members still see own row
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

-- Shared email-match helper for pending stakeholder invites
create or replace function public.user_email_has_project_invite(project_uuid uuid, u uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_invites pi
    inner join public.profiles pr on pr.id = u
    where pi.project_id = project_uuid
      and pi.status = 'pending'
      and lower(trim(pi.email)) = lower(trim(coalesce(pr.email, '')))
      and trim(coalesce(pr.email, '')) <> ''
  );
$$;

revoke all on function public.user_email_has_project_invite(uuid, uuid) from public;
grant execute on function public.user_email_has_project_invite(uuid, uuid) to authenticated;

-- Library / portal access: members + primary invite_email + pending stakeholder invites
create or replace function public.user_can_access_project_for_library(project_uuid uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_uuid
    and (
      p.freelancer_id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = auth.uid()
      )
      or (
        p.invite_email is not null
        and trim(p.invite_email) <> ''
        and exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid()
          and lower(trim(coalesce(pr.email, ''))) = lower(trim(p.invite_email))
        )
      )
      or public.user_email_has_project_invite(p.id, auth.uid())
    )
  );
$$;

create or replace function public.user_can_access_project_as_user(project_uuid uuid, u uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_uuid
    and (
      p.freelancer_id = u
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = u
      )
      or (
        p.invite_email is not null
        and trim(p.invite_email) <> ''
        and exists (
          select 1 from public.profiles pr
          where pr.id = u
          and lower(trim(coalesce(pr.email, ''))) = lower(trim(p.invite_email))
        )
      )
      or public.user_email_has_project_invite(p.id, u)
    )
  );
$$;

grant execute on function public.user_can_access_project_as_user(uuid, uuid) to public;

-- Projects select: same access rules
drop policy if exists "projects_select_access" on public.projects;
create policy "projects_select_access"
  on public.projects for select
  to authenticated
  using (
    freelancer_id = auth.uid()
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.user_id = auth.uid()
    )
    or (
      invite_email is not null
      and trim(invite_email) <> ''
      and exists (
        select 1 from public.profiles pr
        where pr.id = auth.uid()
        and lower(trim(coalesce(pr.email, ''))) = lower(trim(projects.invite_email))
      )
    )
    or public.user_email_has_project_invite(projects.id, auth.uid())
  );

-- Accept portal access: upsert client membership when email matches primary or pending invite
create or replace function public.accept_project_portal_access(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_project public.projects%rowtype;
  v_matched boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_signed_in');
  end if;

  select * into v_project from public.projects where id = p_project_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'project_not_found');
  end if;

  if v_project.freelancer_id = v_uid then
    return jsonb_build_object('ok', true, 'role', 'owner', 'already', true);
  end if;

  select lower(trim(coalesce(email, ''))) into v_email
  from public.profiles where id = v_uid;

  if v_email is null or v_email = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_email');
  end if;

  if v_project.invite_email is not null
     and lower(trim(v_project.invite_email)) = v_email then
    v_matched := true;
  end if;

  if exists (
    select 1 from public.project_invites pi
    where pi.project_id = p_project_id
      and pi.status = 'pending'
      and lower(trim(pi.email)) = v_email
  ) then
    v_matched := true;
  end if;

  if not v_matched then
    -- Already a member is fine
    if exists (
      select 1 from public.project_members pm
      where pm.project_id = p_project_id and pm.user_id = v_uid
    ) then
      return jsonb_build_object('ok', true, 'role', 'client', 'already', true);
    end if;
    return jsonb_build_object('ok', false, 'error', 'not_invited');
  end if;

  insert into public.project_members (project_id, user_id, role)
  values (p_project_id, v_uid, 'client')
  on conflict (project_id, user_id) do nothing;

  update public.project_invites
  set
    status = 'accepted',
    accepted_at = now(),
    accepted_user_id = v_uid
  where project_id = p_project_id
    and status = 'pending'
    and lower(trim(email)) = v_email;

  return jsonb_build_object('ok', true, 'role', 'client', 'joined', true);
end;
$$;

revoke all on function public.accept_project_portal_access(uuid) from public;
grant execute on function public.accept_project_portal_access(uuid) to authenticated;

-- Notification recipients: include pending stakeholder invite emails (dedupe via app if needed)
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
    and public.user_can_access_project_for_library(p_project_id)

  union all

  select
    null::uuid,
    nullif(trim(pi.email), ''),
    split_part(lower(trim(pi.email)), '@', 1),
    null::text,
    'Client'::text,
    '{}'::jsonb
  from public.project_invites pi
  where pi.project_id = p_project_id
    and pi.status = 'pending'
    and auth.uid() is not null
    and public.user_can_access_project_for_library(p_project_id);
$$;

revoke all on function public.get_portal_notification_recipients(uuid) from public;
grant execute on function public.get_portal_notification_recipients(uuid) to authenticated;
