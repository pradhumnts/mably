-- Portal / app notification toggles (per user, stored on profile)
alter table public.profiles
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;
