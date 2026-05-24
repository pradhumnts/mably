-- Per-user read/dismissed state for freelancer notification center items (stable notification_id text).

create table if not exists public.freelancer_notification_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_id text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

create index if not exists freelancer_notification_reads_user_id_read_at_idx
  on public.freelancer_notification_reads (user_id, read_at desc);

alter table public.freelancer_notification_reads enable row level security;

drop policy if exists "freelancer_notification_reads_select_own"
  on public.freelancer_notification_reads;
create policy "freelancer_notification_reads_select_own"
  on public.freelancer_notification_reads for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "freelancer_notification_reads_insert_own"
  on public.freelancer_notification_reads;
create policy "freelancer_notification_reads_insert_own"
  on public.freelancer_notification_reads for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "freelancer_notification_reads_update_own"
  on public.freelancer_notification_reads;
create policy "freelancer_notification_reads_update_own"
  on public.freelancer_notification_reads for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.freelancer_notification_reads to authenticated;
