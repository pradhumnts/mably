-- Freelancer workspace default brand color (prefills new projects; null = Mably orange).
alter table public.profiles
  add column if not exists default_brand_color text;

comment on column public.profiles.default_brand_color is
  'Hex brand color default for new client portals; null means Mably primary (#f97316).';
