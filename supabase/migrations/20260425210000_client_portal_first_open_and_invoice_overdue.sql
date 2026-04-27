-- First portal visit per (project, signed-in client) for freelancer "client opened portal" emails.
create table if not exists public.project_client_portal_first_opens (
  project_id uuid not null references public.projects (id) on delete cascade,
  client_user_id uuid not null references auth.users (id) on delete cascade,
  opened_at timestamptz not null default now(),
  primary key (project_id, client_user_id)
);

alter table public.project_client_portal_first_opens enable row level security;

create or replace function public.register_client_portal_first_open(p_project_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_freelancer uuid;
  v_n bigint;
begin
  if auth.uid() is null then
    return false;
  end if;

  select pr.freelancer_id into v_freelancer
  from public.projects pr
  where pr.id = p_project_id;

  if v_freelancer is null then
    return false;
  end if;

  if auth.uid() = v_freelancer then
    return false;
  end if;

  if not public.user_can_access_project_for_library(p_project_id) then
    return false;
  end if;

  insert into public.project_client_portal_first_opens (project_id, client_user_id)
  values (p_project_id, auth.uid())
  on conflict (project_id, client_user_id) do nothing;

  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;

revoke all on function public.register_client_portal_first_open(uuid) from public;
grant execute on function public.register_client_portal_first_open(uuid) to authenticated;

-- One-time freelancer overdue email per invoice row (cron sets this after send).
alter table public.project_invoices
  add column if not exists freelancer_overdue_notified_at timestamptz null;
