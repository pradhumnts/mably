-- Google OAuth stores avatar as `picture`; also accept `avatar_url` / `avatar`.

create or replace function public.profile_avatar_from_auth_meta(meta jsonb)
returns text
language sql
immutable
as $$
  select nullif(trim(coalesce(
    nullif(meta->>'avatar_url', ''),
    nullif(meta->>'picture', ''),
    nullif(meta->>'avatar', '')
  )), '');
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    public.profile_avatar_from_auth_meta(new.raw_user_meta_data),
    'freelancer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Backfill profiles missing avatar_url from auth metadata.
update public.profiles p
set avatar_url = public.profile_avatar_from_auth_meta(u.raw_user_meta_data)
from auth.users u
where p.id = u.id
  and (p.avatar_url is null or trim(p.avatar_url) = '')
  and public.profile_avatar_from_auth_meta(u.raw_user_meta_data) is not null;
