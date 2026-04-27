-- Snapshot avatars on feature requests / comments (same pattern as library comments).
-- Visible only to authenticated freelancers via existing RLS — no public anon access.

alter table public.feature_requests
  add column if not exists created_by_avatar_url text;

alter table public.feature_request_comments
  add column if not exists author_avatar_url text;

-- Extend creator snapshot trigger: name + avatar from profiles at insert time
create or replace function public.feature_requests_set_created_by_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n text;
  u text;
begin
  select
    coalesce(nullif(trim(full_name), ''), 'Member'),
    nullif(trim(avatar_url), '')
  into n, u
  from public.profiles
  where id = new.created_by;

  new.created_by_name := coalesce(n, 'Member');
  new.created_by_avatar_url := u;
  return new;
end;
$$;

-- Extend author snapshot trigger
create or replace function public.feature_request_comments_set_author_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n text;
  u text;
begin
  select
    coalesce(nullif(trim(full_name), ''), 'Member'),
    nullif(trim(avatar_url), '')
  into n, u
  from public.profiles
  where id = new.user_id;

  new.author_display_name := coalesce(n, 'Member');
  new.author_avatar_url := u;
  return new;
end;
$$;

-- Backfill from current profile rows (best-effort for existing data)
update public.feature_requests fr
set created_by_avatar_url = nullif(trim(p.avatar_url), '')
from public.profiles p
where fr.created_by = p.id
  and (fr.created_by_avatar_url is null or fr.created_by_avatar_url = '');

update public.feature_request_comments c
set author_avatar_url = nullif(trim(p.avatar_url), '')
from public.profiles p
where c.user_id = p.id
  and (c.author_avatar_url is null or c.author_avatar_url = '');
