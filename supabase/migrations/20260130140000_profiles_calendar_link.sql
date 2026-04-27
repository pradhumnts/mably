-- Public booking / calendar URL (Calendly, Cal.com, etc.) — one per user, any role
alter table public.profiles
  add column if not exists calendar_link text;

comment on column public.profiles.calendar_link is
  'Optional URL shown for scheduling (freelancer ↔ client both may set one).';
