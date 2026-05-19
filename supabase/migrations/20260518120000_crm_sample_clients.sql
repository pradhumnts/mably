-- Sample CRM clients: seeded once per freelancer when their client list is empty.

alter table public.clients
  add column if not exists is_sample boolean not null default false;

comment on column public.clients.is_sample is
  'True for auto-seeded demo contacts shown on first CRM visit; user may delete them.';

alter table public.profiles
  add column if not exists crm_sample_clients_seeded boolean not null default false;

comment on column public.profiles.crm_sample_clients_seeded is
  'When true, sample clients were already offered; do not seed again if the list becomes empty.';

create index if not exists clients_freelancer_sample_idx
  on public.clients (freelancer_id)
  where is_sample = true;
