-- Project chat: one default conversation per project, scalable membership, persisted messages + Realtime.

create table if not exists public.project_conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null default 'project_default',
  created_at timestamptz not null default now(),
  constraint project_conversations_project_unique unique (project_id),
  constraint project_conversations_kind_check
    check (kind in ('project_default'))
);

create index if not exists project_conversations_project_id_idx
  on public.project_conversations (project_id);

create table if not exists public.project_conversation_members (
  conversation_id uuid not null references public.project_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'client'
    constraint project_conversation_members_role_check
      check (role in ('freelancer', 'client', 'stakeholder', 'agency')),
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists project_conversation_members_user_id_idx
  on public.project_conversation_members (user_id);

create table if not exists public.project_conversation_reads (
  conversation_id uuid not null references public.project_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.project_conversations (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_display_name text not null default '',
  author_avatar_url text,
  body text not null,
  created_at timestamptz not null default now(),
  constraint project_messages_body_len_check
    check (char_length(trim(body)) >= 1 and char_length(body) <= 5000)
);

create index if not exists project_messages_conversation_created_idx
  on public.project_messages (conversation_id, created_at desc);

alter table public.project_messages replica identity full;

-- RLS
alter table public.project_conversations enable row level security;
alter table public.project_conversation_members enable row level security;
alter table public.project_conversation_reads enable row level security;
alter table public.project_messages enable row level security;

drop policy if exists "project_conversations_select" on public.project_conversations;
create policy "project_conversations_select"
  on public.project_conversations for select
  to authenticated
  using (public.user_can_access_project_for_library(project_id));

drop policy if exists "project_conversations_insert_freelancer" on public.project_conversations;
create policy "project_conversations_insert_freelancer"
  on public.project_conversations for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.freelancer_id = auth.uid()
    )
  );

drop policy if exists "project_conversation_members_select" on public.project_conversation_members;
create policy "project_conversation_members_select"
  on public.project_conversation_members for select
  to authenticated
  using (
    exists (
      select 1 from public.project_conversations c
      where c.id = conversation_id
      and public.user_can_access_project_for_library(c.project_id)
    )
  );

drop policy if exists "project_conversation_members_insert_self" on public.project_conversation_members;
create policy "project_conversation_members_insert_self"
  on public.project_conversation_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.project_conversations c
      where c.id = conversation_id
      and public.user_can_access_project_for_library(c.project_id)
    )
    and (
      (
        role in ('freelancer', 'agency')
        and exists (
          select 1 from public.project_conversations c
          join public.projects p on p.id = c.project_id
          where c.id = conversation_id and p.freelancer_id = auth.uid()
        )
      )
      or (
        role in ('client', 'stakeholder')
        and exists (
          select 1 from public.project_conversations c
          join public.projects p on p.id = c.project_id
          where c.id = conversation_id and p.freelancer_id is distinct from auth.uid()
        )
      )
    )
  );

drop policy if exists "project_conversation_members_update_self" on public.project_conversation_members;
create policy "project_conversation_members_update_self"
  on public.project_conversation_members for update
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.project_conversations c
      where c.id = conversation_id
      and public.user_can_access_project_for_library(c.project_id)
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.project_conversations c
      where c.id = conversation_id
      and public.user_can_access_project_for_library(c.project_id)
    )
    and (
      (
        role in ('freelancer', 'agency')
        and exists (
          select 1 from public.project_conversations c
          join public.projects p on p.id = c.project_id
          where c.id = conversation_id and p.freelancer_id = auth.uid()
        )
      )
      or (
        role in ('client', 'stakeholder')
        and exists (
          select 1 from public.project_conversations c
          join public.projects p on p.id = c.project_id
          where c.id = conversation_id and p.freelancer_id is distinct from auth.uid()
        )
      )
    )
  );

drop policy if exists "project_conversation_reads_select_own" on public.project_conversation_reads;
create policy "project_conversation_reads_select_own"
  on public.project_conversation_reads for select
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.project_conversations c
      where c.id = conversation_id
      and public.user_can_access_project_for_library(c.project_id)
    )
  );

drop policy if exists "project_conversation_reads_write_own" on public.project_conversation_reads;
create policy "project_conversation_reads_write_own"
  on public.project_conversation_reads for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.project_conversations c
      where c.id = conversation_id
      and public.user_can_access_project_for_library(c.project_id)
    )
  );

drop policy if exists "project_conversation_reads_update_own" on public.project_conversation_reads;
create policy "project_conversation_reads_update_own"
  on public.project_conversation_reads for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.project_conversations c
      where c.id = conversation_id
      and public.user_can_access_project_for_library(c.project_id)
    )
  );

drop policy if exists "project_messages_select" on public.project_messages;
create policy "project_messages_select"
  on public.project_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.project_conversations c
      where c.id = conversation_id
      and public.user_can_access_project_for_library(c.project_id)
    )
  );

drop policy if exists "project_messages_insert" on public.project_messages;
create policy "project_messages_insert"
  on public.project_messages for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.project_conversations c
      where c.id = conversation_id
      and public.user_can_access_project_for_library(c.project_id)
    )
  );

-- Triggers: new project → default conversation + freelancer member
create or replace function public.create_project_default_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  insert into public.project_conversations (project_id)
  values (new.id)
  returning id into cid;

  insert into public.project_conversation_members (conversation_id, user_id, role)
  values (cid, new.freelancer_id, 'freelancer')
  on conflict (conversation_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists projects_create_default_conversation on public.projects;
create trigger projects_create_default_conversation
  after insert on public.projects
  for each row
  execute function public.create_project_default_conversation();

-- When a portal member is added, join them to the project chat
create or replace function public.sync_project_member_to_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  r text;
begin
  select c.id into cid
  from public.project_conversations c
  where c.project_id = new.project_id
  limit 1;

  if cid is null then
    return new;
  end if;

  r := case when new.role = 'owner' then 'freelancer' else 'client' end;

  insert into public.project_conversation_members (conversation_id, user_id, role)
  values (cid, new.user_id, r)
  on conflict (conversation_id, user_id) do update set role = excluded.role;

  return new;
end;
$$;

drop trigger if exists project_members_sync_conversation on public.project_members;
create trigger project_members_sync_conversation
  after insert on public.project_members
  for each row
  execute function public.sync_project_member_to_conversation();

-- Backfill conversations + members for existing data
insert into public.project_conversations (project_id)
select p.id from public.projects p
where not exists (
  select 1 from public.project_conversations c where c.project_id = p.id
);

insert into public.project_conversation_members (conversation_id, user_id, role)
select c.id, p.freelancer_id, 'freelancer'
from public.projects p
join public.project_conversations c on c.project_id = p.id
where not exists (
  select 1 from public.project_conversation_members m
  where m.conversation_id = c.id and m.user_id = p.freelancer_id
)
on conflict (conversation_id, user_id) do nothing;

insert into public.project_conversation_members (conversation_id, user_id, role)
select c.id, pm.user_id,
  case when pm.role = 'owner' then 'freelancer' else 'client' end
from public.project_members pm
join public.project_conversations c on c.project_id = pm.project_id
on conflict (conversation_id, user_id) do update set role = excluded.role;

-- Realtime (Postgres changes)
alter publication supabase_realtime add table public.project_messages;

grant select, insert, update, delete on public.project_conversations to authenticated;
grant select, insert, update, delete on public.project_conversation_members to authenticated;
grant select, insert, update, delete on public.project_conversation_reads to authenticated;
grant select, insert, update, delete on public.project_messages to authenticated;
