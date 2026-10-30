-- Agency workspaces (safety-first, additive).
-- Keeps freelancer_id; adds workspace_id + membership + project staff grants.
-- Invites are app-gated (TEAM_INVITES_ENABLED); this migration only prepares tenancy.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_created_by_idx on public.workspaces (created_by);

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_profiles_updated_at();

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members (user_id);

create index if not exists workspace_members_workspace_id_idx
  on public.workspace_members (workspace_id);

-- At most one owner per workspace (personal + agency).
create unique index if not exists workspace_members_one_owner_uidx
  on public.workspace_members (workspace_id)
  where role = 'owner';

-- One personal workspace ownership per user (silent solo migration).
create unique index if not exists workspace_members_one_owned_workspace_uidx
  on public.workspace_members (user_id)
  where role = 'owner';

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  invited_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  -- Optional project grants applied on accept (member channel list).
  project_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users (id) on delete set null
);

create index if not exists workspace_invites_workspace_id_idx
  on public.workspace_invites (workspace_id);

create index if not exists workspace_invites_email_idx
  on public.workspace_invites (lower(trim(email)));

create unique index if not exists workspace_invites_pending_email_uidx
  on public.workspace_invites (workspace_id, lower(trim(email)))
  where status = 'pending';

create table if not exists public.project_staff_access (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  granted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index if not exists project_staff_access_user_id_idx
  on public.project_staff_access (user_id);

create index if not exists project_staff_access_project_id_idx
  on public.project_staff_access (project_id);

-- ---------------------------------------------------------------------------
-- Ownership columns (additive; nullable until backfill)
-- ---------------------------------------------------------------------------

alter table public.clients
  add column if not exists workspace_id uuid references public.workspaces (id) on delete restrict;

alter table public.projects
  add column if not exists workspace_id uuid references public.workspaces (id) on delete restrict;

create index if not exists clients_workspace_id_idx on public.clients (workspace_id);
create index if not exists projects_workspace_id_idx on public.projects (workspace_id);

-- ---------------------------------------------------------------------------
-- Silent backfill: exactly one personal workspace per freelancer user
-- ---------------------------------------------------------------------------

-- Distinct users who need a personal owned workspace (profiles + data owners).
-- One INSERT only — previous split inserts could create two workspaces per user
-- before memberships existed, then fail unique index workspace_members_one_owned_workspace_uidx.
with need_ws as (
  select p.id as user_id,
         coalesce(nullif(trim(p.full_name), ''), split_part(coalesce(p.email, ''), '@', 1), 'Personal') as name
  from public.profiles p
  where p.role is distinct from 'client'
  union
  select u.freelancer_id,
         'Personal'
  from (
    select distinct freelancer_id from public.clients
    union
    select distinct freelancer_id from public.projects
  ) u
),
dedup as (
  select distinct on (user_id) user_id, name
  from need_ws
  order by user_id, name desc
)
insert into public.workspaces (id, name, created_by)
select gen_random_uuid(), d.name, d.user_id
from dedup d
where not exists (
  select 1 from public.workspace_members wm
  where wm.user_id = d.user_id and wm.role = 'owner'
)
and not exists (
  -- Partial re-run: workspace row already created for this user, membership pending
  select 1 from public.workspaces w where w.created_by = d.user_id
);

-- Owner membership: at most one owned workspace per user (pick oldest if extras exist)
insert into public.workspace_members (workspace_id, user_id, role)
select distinct on (w.created_by) w.id, w.created_by, 'owner'
from public.workspaces w
where not exists (
  select 1 from public.workspace_members wm
  where wm.user_id = w.created_by and wm.role = 'owner'
)
order by w.created_by, w.created_at asc
on conflict (workspace_id, user_id) do nothing;

-- Drop orphan personal workspaces created by a failed partial run (no members)
delete from public.workspaces w
where not exists (
  select 1 from public.workspace_members wm where wm.workspace_id = w.id
);

update public.clients c
set workspace_id = wm.workspace_id
from public.workspace_members wm
where c.workspace_id is null
  and wm.user_id = c.freelancer_id
  and wm.role = 'owner';

update public.projects p
set workspace_id = wm.workspace_id
from public.workspace_members wm
where p.workspace_id is null
  and wm.user_id = p.freelancer_id
  and wm.role = 'owner';

-- ---------------------------------------------------------------------------
-- Gate 0 — SQL invariants (abort migration on mismatch)
-- ---------------------------------------------------------------------------

do $$
declare
  v_null_clients int;
  v_null_projects int;
  v_client_owner_mismatch int;
  v_project_owner_mismatch int;
  v_multi_owner int;
  v_shared_ws_clients int;
  v_orphan_freelancer int;
begin
  select count(*) into v_null_clients from public.clients where workspace_id is null;
  select count(*) into v_null_projects from public.projects where workspace_id is null;

  if v_null_clients > 0 or v_null_projects > 0 then
    raise exception 'Gate0: NULL workspace_id clients=% projects=%', v_null_clients, v_null_projects;
  end if;

  select count(*) into v_client_owner_mismatch
  from public.clients c
  join public.workspace_members wm on wm.workspace_id = c.workspace_id and wm.role = 'owner'
  where wm.user_id is distinct from c.freelancer_id;

  select count(*) into v_project_owner_mismatch
  from public.projects p
  join public.workspace_members wm on wm.workspace_id = p.workspace_id and wm.role = 'owner'
  where wm.user_id is distinct from p.freelancer_id;

  if v_client_owner_mismatch > 0 or v_project_owner_mismatch > 0 then
    raise exception 'Gate0: workspace owner != freelancer_id clients=% projects=%',
      v_client_owner_mismatch, v_project_owner_mismatch;
  end if;

  select count(*) into v_multi_owner
  from (
    select workspace_id
    from public.workspace_members
    where role = 'owner'
    group by workspace_id
    having count(*) > 1
  ) t;

  if v_multi_owner > 0 then
    raise exception 'Gate0: workspaces with >1 owner: %', v_multi_owner;
  end if;

  -- Two different freelancers' rows must not share a workspace_id
  select count(*) into v_shared_ws_clients
  from (
    select workspace_id
    from public.clients
    group by workspace_id
    having count(distinct freelancer_id) > 1
  ) t;

  if v_shared_ws_clients > 0 then
    raise exception 'Gate0: clients workspace shared across freelancers: %', v_shared_ws_clients;
  end if;

  select count(*) into v_orphan_freelancer
  from (
    select distinct freelancer_id as uid from public.clients
    union
    select distinct freelancer_id from public.projects
  ) u
  where not exists (
    select 1 from public.workspace_members wm
    where wm.user_id = u.uid and wm.role = 'owner'
  );

  if v_orphan_freelancer > 0 then
    raise exception 'Gate0: freelancers with data but no owned workspace: %', v_orphan_freelancer;
  end if;

  raise notice 'Gate0: agency workspace invariants OK';
end $$;

alter table public.clients alter column workspace_id set not null;
alter table public.projects alter column workspace_id set not null;

-- ---------------------------------------------------------------------------
-- Helper functions (dual-path: legacy freelancer_id OR workspace staff)
-- ---------------------------------------------------------------------------

create or replace function public.user_workspace_role(p_workspace_id uuid, u uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = p_workspace_id
    and wm.user_id = coalesce(u, auth.uid())
  limit 1;
$$;

revoke all on function public.user_workspace_role(uuid, uuid) from public;
grant execute on function public.user_workspace_role(uuid, uuid) to authenticated;

create or replace function public.user_can_manage_workspace(p_workspace_id uuid, u uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = coalesce(u, auth.uid())
      and wm.role in ('owner', 'admin')
  );
$$;

revoke all on function public.user_can_manage_workspace(uuid, uuid) from public;
grant execute on function public.user_can_manage_workspace(uuid, uuid) to authenticated;

create or replace function public.user_can_access_project_as_staff(project_uuid uuid, u uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = project_uuid
      and (
        -- Legacy solo owner
        p.freelancer_id = coalesce(u, auth.uid())
        -- Workspace owner/admin
        or public.user_can_manage_workspace(p.workspace_id, coalesce(u, auth.uid()))
        -- Member with explicit project grant
        or exists (
          select 1
          from public.project_staff_access psa
          join public.workspace_members wm
            on wm.workspace_id = p.workspace_id
           and wm.user_id = coalesce(u, auth.uid())
          where psa.project_id = p.id
            and psa.user_id = coalesce(u, auth.uid())
            and wm.role in ('owner', 'admin', 'member')
        )
      )
  );
$$;

revoke all on function public.user_can_access_project_as_staff(uuid, uuid) from public;
grant execute on function public.user_can_access_project_as_staff(uuid, uuid) to authenticated;

-- Manage project settings / people / staff grants: owner/admin or legacy freelancer
create or replace function public.user_can_manage_project_as_staff(project_uuid uuid, u uuid default auth.uid())
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
        p.freelancer_id = coalesce(u, auth.uid())
        or public.user_can_manage_workspace(p.workspace_id, coalesce(u, auth.uid()))
      )
  );
$$;

revoke all on function public.user_can_manage_project_as_staff(uuid, uuid) from public;
grant execute on function public.user_can_manage_project_as_staff(uuid, uuid) to authenticated;

-- Extend library/portal access: keep client paths; add staff dual-path
create or replace function public.user_can_access_project_for_library(project_uuid uuid)
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
      public.user_can_access_project_as_staff(p.id, (select auth.uid()))
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = (select auth.uid())
      )
      or (
        p.invite_email is not null
        and trim(p.invite_email) <> ''
        and exists (
          select 1 from public.profiles pr
          where pr.id = (select auth.uid())
          and lower(trim(coalesce(pr.email, ''))) = lower(trim(p.invite_email))
        )
      )
      or public.user_email_has_project_invite(p.id, (select auth.uid()))
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
      public.user_can_access_project_as_staff(p.id, u)
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

-- Legacy helper used by stakeholder policies: dual-path manage
create or replace function public.user_owns_project_as(project_uuid uuid, u uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_can_manage_project_as_staff(project_uuid, u);
$$;

create or replace function public.user_is_project_freelancer_owner(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_can_manage_project_as_staff(project_uuid, (select auth.uid()));
$$;

-- ---------------------------------------------------------------------------
-- RLS: new tables
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.project_staff_access enable row level security;

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
  on public.workspaces for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = (select auth.uid())
    )
  );

drop policy if exists "workspaces_update_manage" on public.workspaces;
create policy "workspaces_update_manage"
  on public.workspaces for update
  to authenticated
  using (public.user_can_manage_workspace(id, (select auth.uid())))
  with check (public.user_can_manage_workspace(id, (select auth.uid())));

-- Inserts happen via security definer ensure helper / service; allow owner create of personal ws
drop policy if exists "workspaces_insert_self" on public.workspaces;
create policy "workspaces_insert_self"
  on public.workspaces for insert
  to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists "workspace_members_select_own_ws" on public.workspace_members;
create policy "workspace_members_select_own_ws"
  on public.workspace_members for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.user_can_manage_workspace(workspace_id, (select auth.uid()))
  );

drop policy if exists "workspace_members_insert_manage" on public.workspace_members;
create policy "workspace_members_insert_manage"
  on public.workspace_members for insert
  to authenticated
  with check (
    public.user_can_manage_workspace(workspace_id, (select auth.uid()))
    or (
      -- Allow accepting invite: insert self as member/admin when pending invite matches
      user_id = (select auth.uid())
      and exists (
        select 1 from public.workspace_invites wi
        join public.profiles pr on pr.id = (select auth.uid())
        where wi.workspace_id = workspace_members.workspace_id
          and wi.status = 'pending'
          and lower(trim(wi.email)) = lower(trim(coalesce(pr.email, '')))
          and wi.role = workspace_members.role
      )
    )
  );

drop policy if exists "workspace_members_update_manage" on public.workspace_members;
create policy "workspace_members_update_manage"
  on public.workspace_members for update
  to authenticated
  using (public.user_can_manage_workspace(workspace_id, (select auth.uid())))
  with check (public.user_can_manage_workspace(workspace_id, (select auth.uid())));

drop policy if exists "workspace_members_delete_manage" on public.workspace_members;
create policy "workspace_members_delete_manage"
  on public.workspace_members for delete
  to authenticated
  using (
    public.user_can_manage_workspace(workspace_id, (select auth.uid()))
    or user_id = (select auth.uid())
  );

drop policy if exists "workspace_invites_select" on public.workspace_invites;
create policy "workspace_invites_select"
  on public.workspace_invites for select
  to authenticated
  using (
    public.user_can_manage_workspace(workspace_id, (select auth.uid()))
    or exists (
      select 1 from public.profiles pr
      where pr.id = (select auth.uid())
        and lower(trim(coalesce(pr.email, ''))) = lower(trim(workspace_invites.email))
    )
  );

drop policy if exists "workspace_invites_insert" on public.workspace_invites;
create policy "workspace_invites_insert"
  on public.workspace_invites for insert
  to authenticated
  with check (
    invited_by = (select auth.uid())
    and public.user_can_manage_workspace(workspace_id, (select auth.uid()))
  );

drop policy if exists "workspace_invites_update" on public.workspace_invites;
create policy "workspace_invites_update"
  on public.workspace_invites for update
  to authenticated
  using (
    public.user_can_manage_workspace(workspace_id, (select auth.uid()))
    or exists (
      select 1 from public.profiles pr
      where pr.id = (select auth.uid())
        and lower(trim(coalesce(pr.email, ''))) = lower(trim(workspace_invites.email))
    )
  )
  with check (
    public.user_can_manage_workspace(workspace_id, (select auth.uid()))
    or exists (
      select 1 from public.profiles pr
      where pr.id = (select auth.uid())
        and lower(trim(coalesce(pr.email, ''))) = lower(trim(workspace_invites.email))
    )
  );

drop policy if exists "workspace_invites_delete" on public.workspace_invites;
create policy "workspace_invites_delete"
  on public.workspace_invites for delete
  to authenticated
  using (public.user_can_manage_workspace(workspace_id, (select auth.uid())));

drop policy if exists "project_staff_access_select" on public.project_staff_access;
create policy "project_staff_access_select"
  on public.project_staff_access for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.user_can_manage_project_as_staff(project_id, (select auth.uid()))
  );

drop policy if exists "project_staff_access_insert" on public.project_staff_access;
create policy "project_staff_access_insert"
  on public.project_staff_access for insert
  to authenticated
  with check (public.user_can_manage_project_as_staff(project_id, (select auth.uid())));

drop policy if exists "project_staff_access_delete" on public.project_staff_access;
create policy "project_staff_access_delete"
  on public.project_staff_access for delete
  to authenticated
  using (public.user_can_manage_project_as_staff(project_id, (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Dual-path SELECT/mutate on clients & projects (legacy OR staff)
-- ---------------------------------------------------------------------------

drop policy if exists "clients_select_own" on public.clients;
drop policy if exists "clients_select_access" on public.clients;
create policy "clients_select_access"
  on public.clients for select
  to authenticated
  using (
    freelancer_id = (select auth.uid())
    or public.user_can_manage_workspace(workspace_id, (select auth.uid()))
    or exists (
      select 1
      from public.projects p
      join public.project_staff_access psa on psa.project_id = p.id
      where p.client_id = clients.id
        and p.workspace_id = clients.workspace_id
        and psa.user_id = (select auth.uid())
        and exists (
          select 1 from public.workspace_members wm
          where wm.workspace_id = clients.workspace_id
            and wm.user_id = (select auth.uid())
        )
    )
  );

drop policy if exists "clients_insert_own" on public.clients;
drop policy if exists "clients_insert_access" on public.clients;
create policy "clients_insert_access"
  on public.clients for insert
  to authenticated
  with check (
    freelancer_id = (select auth.uid())
    and (
      workspace_id is null
      or public.user_can_manage_workspace(workspace_id, (select auth.uid()))
      or exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = clients.workspace_id
          and wm.user_id = (select auth.uid())
          and wm.role = 'owner'
      )
    )
  );

drop policy if exists "clients_update_own" on public.clients;
drop policy if exists "clients_update_access" on public.clients;
create policy "clients_update_access"
  on public.clients for update
  to authenticated
  using (
    freelancer_id = (select auth.uid())
    or public.user_can_manage_workspace(workspace_id, (select auth.uid()))
  )
  with check (
    freelancer_id = (select auth.uid())
    or public.user_can_manage_workspace(workspace_id, (select auth.uid()))
  );

drop policy if exists "clients_delete_own" on public.clients;
drop policy if exists "clients_delete_access" on public.clients;
create policy "clients_delete_access"
  on public.clients for delete
  to authenticated
  using (
    freelancer_id = (select auth.uid())
    or public.user_can_manage_workspace(workspace_id, (select auth.uid()))
  );

drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_select_access" on public.projects;
create policy "projects_select_access"
  on public.projects for select
  to authenticated
  using (
    public.user_can_access_project_as_staff(id, (select auth.uid()))
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

drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_insert_access" on public.projects;
create policy "projects_insert_access"
  on public.projects for insert
  to authenticated
  with check (
    freelancer_id = (select auth.uid())
    and exists (
      select 1 from public.clients c
      where c.id = client_id
        and (
          c.freelancer_id = (select auth.uid())
          or public.user_can_manage_workspace(c.workspace_id, (select auth.uid()))
        )
    )
    and (
      workspace_id is null
      or public.user_can_manage_workspace(workspace_id, (select auth.uid()))
      or exists (
        select 1 from public.workspace_members wm
        where wm.workspace_id = projects.workspace_id
          and wm.user_id = (select auth.uid())
          and wm.role = 'owner'
      )
    )
  );

drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_update_access" on public.projects;
create policy "projects_update_access"
  on public.projects for update
  to authenticated
  using (public.user_can_manage_project_as_staff(id, (select auth.uid())))
  with check (public.user_can_manage_project_as_staff(id, (select auth.uid())));

drop policy if exists "projects_delete_own" on public.projects;
drop policy if exists "projects_delete_access" on public.projects;
create policy "projects_delete_access"
  on public.projects for delete
  to authenticated
  using (public.user_can_manage_project_as_staff(id, (select auth.uid())));

-- ---------------------------------------------------------------------------
-- Ensure personal workspace for new freelancers (idempotent)
-- ---------------------------------------------------------------------------

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

  select coalesce(nullif(trim(full_name), ''), split_part(coalesce(email, ''), '@', 1), 'Personal')
    into v_name
  from public.profiles
  where id = v_uid;

  if v_name is null or v_name = '' then
    v_name := 'Personal';
  end if;

  insert into public.workspaces (name, created_by)
  values (v_name, v_uid)
  returning id into v_ws;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_ws, v_uid, 'owner');

  return v_ws;
end;
$$;

revoke all on function public.ensure_personal_workspace(uuid) from public;
grant execute on function public.ensure_personal_workspace(uuid) to authenticated;

create or replace function public.accept_workspace_invite(p_invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_inv public.workspace_invites%rowtype;
  v_pid uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_signed_in');
  end if;

  select * into v_inv from public.workspace_invites where id = p_invite_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'invite_not_found');
  end if;

  if v_inv.status is distinct from 'pending' then
    return jsonb_build_object('ok', false, 'error', 'invite_not_pending');
  end if;

  select lower(trim(coalesce(email, ''))) into v_email from public.profiles where id = v_uid;
  if v_email is null or v_email = '' or v_email is distinct from lower(trim(v_inv.email)) then
    return jsonb_build_object('ok', false, 'error', 'email_mismatch');
  end if;

  if exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = v_inv.workspace_id and wm.user_id = v_uid
  ) then
    update public.workspace_invites
    set status = 'accepted', accepted_at = now(), accepted_user_id = v_uid
    where id = v_inv.id;
    return jsonb_build_object('ok', true, 'workspace_id', v_inv.workspace_id, 'already', true);
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_inv.workspace_id, v_uid, v_inv.role);

  if v_inv.role = 'member' then
    foreach v_pid in array coalesce(v_inv.project_ids, '{}'::uuid[])
    loop
      if exists (
        select 1 from public.projects p
        where p.id = v_pid and p.workspace_id = v_inv.workspace_id
      ) then
        insert into public.project_staff_access (project_id, user_id, granted_by)
        values (v_pid, v_uid, v_inv.invited_by)
        on conflict (project_id, user_id) do nothing;
      end if;
    end loop;
  end if;

  update public.workspace_invites
  set status = 'accepted', accepted_at = now(), accepted_user_id = v_uid
  where id = v_inv.id;

  return jsonb_build_object(
    'ok', true,
    'workspace_id', v_inv.workspace_id,
    'role', v_inv.role
  );
end;
$$;

revoke all on function public.accept_workspace_invite(uuid) from public;
grant execute on function public.accept_workspace_invite(uuid) to authenticated;
