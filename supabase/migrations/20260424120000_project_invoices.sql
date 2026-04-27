-- Link-only invoices per project (external payment URL + simple metadata).

create table if not exists public.project_invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  amount numeric(14, 2) not null,
  invoice_date date not null default (current_date),
  due_date date not null,
  invoice_link text not null,
  notes text,
  status text not null default 'unpaid'
    constraint project_invoices_status_check
      check (status in ('unpaid', 'paid', 'canceled')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_invoices_project_id_idx
  on public.project_invoices (project_id);
create index if not exists project_invoices_created_at_idx
  on public.project_invoices (project_id, created_at desc);

alter table public.project_invoices enable row level security;

drop policy if exists "project_invoices_select" on public.project_invoices;
create policy "project_invoices_select"
  on public.project_invoices for select
  to authenticated
  using (public.user_can_access_project_for_library(project_id));

drop policy if exists "project_invoices_insert_freelancer" on public.project_invoices;
create policy "project_invoices_insert_freelancer"
  on public.project_invoices for insert
  to authenticated
  with check (
    public.user_is_project_freelancer_owner(project_id)
    and created_by = auth.uid()
  );

drop policy if exists "project_invoices_update_freelancer" on public.project_invoices;
create policy "project_invoices_update_freelancer"
  on public.project_invoices for update
  to authenticated
  using (public.user_is_project_freelancer_owner(project_id))
  with check (public.user_is_project_freelancer_owner(project_id));

drop policy if exists "project_invoices_delete_freelancer" on public.project_invoices;
create policy "project_invoices_delete_freelancer"
  on public.project_invoices for delete
  to authenticated
  using (public.user_is_project_freelancer_owner(project_id));

create or replace function public.project_invoices_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists project_invoices_set_updated_at on public.project_invoices;
create trigger project_invoices_set_updated_at
  before update on public.project_invoices
  for each row
  execute function public.project_invoices_set_updated_at();

grant select, insert, update, delete on public.project_invoices to authenticated;
