-- RLS performance: same access rules, cheaper evaluation.
--
-- 1. user_can_access_project_for_library runs as SECURITY DEFINER so each call no longer
--    re-applies RLS on projects / project_members / profiles internally. The predicate is
--    unchanged and identical to projects_select_access (the only projects SELECT policy
--    it previously ran under), so results are the same for every caller.
-- 2. Every policy in schema public has auth.uid() / request_user_id() wrapped as
--    (select ...), so Postgres evaluates it once per statement instead of once per row.
--    Policies are rewritten from their live definitions, so nothing else changes.
-- 3. Foreign-key columns without a leading index get one (project_id, user_id, ...),
--    which is what most policies and portal queries filter on.

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
      p.freelancer_id = (select auth.uid())
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

do $$
declare
  r record;
  new_qual text;
  new_check text;
  stmt text;
  altered int := 0;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    new_qual := r.qual;
    new_check := r.with_check;

    -- (?<!SELECT ) keeps already-wrapped calls as-is, so re-running is a no-op.
    new_qual := regexp_replace(new_qual, '(?<!SELECT )\mauth\.uid\(\)', '( SELECT auth.uid() AS uid)', 'g');
    new_check := regexp_replace(new_check, '(?<!SELECT )\mauth\.uid\(\)', '( SELECT auth.uid() AS uid)', 'g');
    new_qual := regexp_replace(new_qual, '(?<!SELECT )(?<!\.)\m(public\.)?request_user_id\(\)', '( SELECT public.request_user_id() AS request_user_id)', 'g');
    new_check := regexp_replace(new_check, '(?<!SELECT )(?<!\.)\m(public\.)?request_user_id\(\)', '( SELECT public.request_user_id() AS request_user_id)', 'g');

    if new_qual is not distinct from r.qual and new_check is not distinct from r.with_check then
      continue;
    end if;

    stmt := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if new_qual is not null then
      stmt := stmt || format(' using (%s)', new_qual);
    end if;
    if new_check is not null then
      stmt := stmt || format(' with check (%s)', new_check);
    end if;

    execute stmt;
    altered := altered + 1;
  end loop;

  raise notice 'rls_performance: rewrote % policies', altered;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') ~ '(?<!SELECT )\mauth\.uid\(\)'
        or coalesce(with_check, '') ~ '(?<!SELECT )\mauth\.uid\(\)'
      )
  ) then
    raise exception 'rls_performance: some public policies still call auth.uid() per row';
  end if;
end $$;

do $$
declare
  r record;
  created int := 0;
begin
  for r in
    select cl.relname as table_name, a.attname as column_name
    from pg_constraint c
    join pg_class cl on cl.oid = c.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f'
      and n.nspname = 'public'
      and array_length(c.conkey, 1) = 1
      and not exists (
        select 1 from pg_index i
        where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1]
      )
  loop
    execute format(
      'create index if not exists %I on public.%I (%I)',
      left(r.table_name || '_' || r.column_name || '_fk_idx', 63),
      r.table_name,
      r.column_name
    );
    created := created + 1;
  end loop;

  raise notice 'rls_performance: created % foreign-key indexes', created;
end $$;
