-- Gate 0: re-run after agency workspace migration. All counts must be 0.
-- psql / Supabase SQL editor.

select 'null_workspace_clients' as check, count(*)::int as failures
from public.clients where workspace_id is null
union all
select 'null_workspace_projects', count(*)::int
from public.projects where workspace_id is null
union all
select 'client_owner_mismatch', count(*)::int
from public.clients c
join public.workspace_members wm on wm.workspace_id = c.workspace_id and wm.role = 'owner'
where wm.user_id is distinct from c.freelancer_id
union all
select 'project_owner_mismatch', count(*)::int
from public.projects p
join public.workspace_members wm on wm.workspace_id = p.workspace_id and wm.role = 'owner'
where wm.user_id is distinct from p.freelancer_id
union all
select 'multi_owner_workspaces', count(*)::int
from (
  select workspace_id
  from public.workspace_members
  where role = 'owner'
  group by workspace_id
  having count(*) > 1
) t
union all
select 'shared_workspace_across_freelancers', count(*)::int
from (
  select workspace_id
  from public.clients
  group by workspace_id
  having count(distinct freelancer_id) > 1
) t
union all
select 'freelancer_data_without_owned_workspace', count(*)::int
from (
  select distinct freelancer_id as uid from public.clients
  union
  select distinct freelancer_id from public.projects
) u
where not exists (
  select 1 from public.workspace_members wm
  where wm.user_id = u.uid and wm.role = 'owner'
);
