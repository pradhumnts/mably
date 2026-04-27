-- CRM-style clients owned by the signed-in freelancer (auth user id)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  location text,
  avatar_url text,
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_links_is_array check (jsonb_typeof(links) = 'array')
);

create index if not exists clients_freelancer_id_idx on public.clients (freelancer_id);

create unique index if not exists clients_freelancer_email_lower_uidx
  on public.clients (freelancer_id, lower(email));

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_profiles_updated_at();

alter table public.clients enable row level security;

drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own"
  on public.clients for select
  to authenticated
  using (freelancer_id = auth.uid());

drop policy if exists "clients_insert_own" on public.clients;
create policy "clients_insert_own"
  on public.clients for insert
  to authenticated
  with check (freelancer_id = auth.uid());

drop policy if exists "clients_update_own" on public.clients;
create policy "clients_update_own"
  on public.clients for update
  to authenticated
  using (freelancer_id = auth.uid())
  with check (freelancer_id = auth.uid());

drop policy if exists "clients_delete_own" on public.clients;
create policy "clients_delete_own"
  on public.clients for delete
  to authenticated
  using (freelancer_id = auth.uid());
