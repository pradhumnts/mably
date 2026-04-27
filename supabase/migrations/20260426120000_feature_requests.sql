-- Feature requests (freelancer-facing feedback board) + votes + comments

alter table public.profiles
  add column if not exists is_staff boolean not null default false;

create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  contact_email text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'in_progress', 'done')),
  vote_count integer not null default 0,
  created_by uuid not null references public.profiles (id) on delete cascade,
  -- Snapshot at submit time so list views do not need cross-profile reads (RLS).
  created_by_name text not null default 'Member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feature_requests_status_idx on public.feature_requests (status);
create index if not exists feature_requests_created_at_idx on public.feature_requests (created_at desc);

create table if not exists public.feature_request_votes (
  feature_request_id uuid not null references public.feature_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (feature_request_id, user_id)
);

create index if not exists feature_request_votes_user_idx on public.feature_request_votes (user_id);

create table if not exists public.feature_request_comments (
  id uuid primary key default gen_random_uuid(),
  feature_request_id uuid not null references public.feature_requests (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  author_display_name text not null default 'Member',
  body text not null,
  created_at timestamptz not null default now(),
  constraint feature_request_comments_body_len check (char_length(body) <= 8000)
);

create index if not exists feature_request_comments_request_idx
  on public.feature_request_comments (feature_request_id, created_at desc);

-- updated_at on feature_requests
create or replace function public.set_feature_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists feature_requests_set_updated_at on public.feature_requests;
create trigger feature_requests_set_updated_at
  before update on public.feature_requests
  for each row execute function public.set_feature_requests_updated_at();

create or replace function public.feature_requests_set_created_by_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n text;
begin
  select coalesce(nullif(trim(full_name), ''), 'Member') into n
  from public.profiles
  where id = new.created_by;
  new.created_by_name := coalesce(n, 'Member');
  return new;
end;
$$;

drop trigger if exists feature_requests_set_creator_name on public.feature_requests;
create trigger feature_requests_set_creator_name
  before insert on public.feature_requests
  for each row execute function public.feature_requests_set_created_by_name();

create or replace function public.feature_request_comments_set_author_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  n text;
begin
  select coalesce(nullif(trim(full_name), ''), 'Member') into n
  from public.profiles
  where id = new.user_id;
  new.author_display_name := coalesce(n, 'Member');
  return new;
end;
$$;

drop trigger if exists feature_request_comments_set_author on public.feature_request_comments;
create trigger feature_request_comments_set_author
  before insert on public.feature_request_comments
  for each row execute function public.feature_request_comments_set_author_name();

-- Keep vote_count in sync with votes table
create or replace function public.feature_request_votes_bump_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.feature_requests
    set vote_count = vote_count + 1, updated_at = now()
    where id = new.feature_request_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.feature_requests
    set vote_count = greatest(0, vote_count - 1), updated_at = now()
    where id = old.feature_request_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists feature_request_votes_bump on public.feature_request_votes;
create trigger feature_request_votes_bump
  after insert or delete on public.feature_request_votes
  for each row execute function public.feature_request_votes_bump_count();

alter table public.feature_requests enable row level security;
alter table public.feature_request_votes enable row level security;
alter table public.feature_request_comments enable row level security;

drop policy if exists "feature_requests_select_freelancers" on public.feature_requests;
create policy "feature_requests_select_freelancers"
  on public.feature_requests for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'freelancer'
    )
  );

drop policy if exists "feature_requests_insert_own" on public.feature_requests;
create policy "feature_requests_insert_own"
  on public.feature_requests for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'freelancer'
    )
  );

drop policy if exists "feature_requests_staff_update" on public.feature_requests;
create policy "feature_requests_staff_update"
  on public.feature_requests for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_staff is true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_staff is true
    )
  );

drop policy if exists "feature_request_votes_select_freelancers" on public.feature_request_votes;
create policy "feature_request_votes_select_freelancers"
  on public.feature_request_votes for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'freelancer'
    )
  );

drop policy if exists "feature_request_votes_insert_own" on public.feature_request_votes;
create policy "feature_request_votes_insert_own"
  on public.feature_request_votes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'freelancer'
    )
  );

drop policy if exists "feature_request_comments_select" on public.feature_request_comments;
create policy "feature_request_comments_select"
  on public.feature_request_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'freelancer'
    )
  );

drop policy if exists "feature_request_comments_insert_own" on public.feature_request_comments;
create policy "feature_request_comments_insert_own"
  on public.feature_request_comments for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'freelancer'
    )
  );
