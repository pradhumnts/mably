-- Gate 1: for each freelancer, project ids by freelancer_id must equal ids by their owned workspace_id.
-- Returns only mismatches (must be empty).

with owned as (
  select wm.user_id, wm.workspace_id
  from public.workspace_members wm
  where wm.role = 'owner'
),
legacy as (
  select p.freelancer_id as user_id, array_agg(p.id order by p.id) as ids
  from public.projects p
  group by p.freelancer_id
),
by_ws as (
  select o.user_id, array_agg(p.id order by p.id) as ids
  from owned o
  join public.projects p on p.workspace_id = o.workspace_id
  group by o.user_id
)
select
  coalesce(l.user_id, w.user_id) as user_id,
  l.ids as legacy_project_ids,
  w.ids as workspace_project_ids
from legacy l
full outer join by_ws w on w.user_id = l.user_id
where l.ids is distinct from w.ids;
