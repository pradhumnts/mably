-- Last time a signed-in user had Mably open in a visible tab (heartbeat).
-- Chat emails skip recipients seen recently; read with the service role only.

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;

create or replace function public.touch_user_presence()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.user_presence (user_id, last_seen_at)
  select auth.uid(), now()
  where auth.uid() is not null
  on conflict (user_id) do update set last_seen_at = excluded.last_seen_at;
$$;

revoke all on function public.touch_user_presence() from public;
revoke all on function public.touch_user_presence() from anon;
grant execute on function public.touch_user_presence() to authenticated;
