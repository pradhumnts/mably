-- Per-file comment thread + approval workflow for library files (needs_approval only).

alter table public.project_library_files
  add column if not exists approval_status text;

-- Valid values when set: pending | approved | revision_requested
alter table public.project_library_files
  drop constraint if exists project_library_files_approval_status_check;

alter table public.project_library_files
  add constraint project_library_files_approval_status_check
  check (
    approval_status is null
    or approval_status in ('pending', 'approved', 'revision_requested')
  );

-- needs_approval false => no workflow column; true => status required
update public.project_library_files
set approval_status = 'pending'
where needs_approval is true and approval_status is null;

update public.project_library_files
set approval_status = null
where needs_approval is not true;

alter table public.project_library_files
  drop constraint if exists project_library_files_approval_when_needed_check;

alter table public.project_library_files
  add constraint project_library_files_approval_when_needed_check
  check (
    (coalesce(needs_approval, false) = false and approval_status is null)
    or (needs_approval is true and approval_status is not null)
  );

create table if not exists public.project_library_file_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  file_id uuid not null references public.project_library_files (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete set null,
  author_display_name text not null default '',
  author_avatar_url text,
  body text not null,
  created_at timestamptz not null default now(),
  constraint project_library_file_comments_body_nonempty check (length(trim(body)) > 0)
);

create index if not exists project_library_file_comments_file_id_created_idx
  on public.project_library_file_comments (file_id, created_at);

alter table public.project_library_file_comments enable row level security;

drop policy if exists "project_library_file_comments_select" on public.project_library_file_comments;
create policy "project_library_file_comments_select"
  on public.project_library_file_comments for select
  to authenticated
  using (public.user_can_access_project_for_library(project_id));

drop policy if exists "project_library_file_comments_insert" on public.project_library_file_comments;
create policy "project_library_file_comments_insert"
  on public.project_library_file_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and public.user_can_access_project_for_library(project_id)
  );

drop policy if exists "project_library_file_comments_delete_own_or_freelancer" on public.project_library_file_comments;
create policy "project_library_file_comments_delete_own_or_freelancer"
  on public.project_library_file_comments for delete
  to authenticated
  using (
    author_id = auth.uid()
    or public.user_is_project_freelancer_owner(project_id)
  );

grant select, insert, delete on public.project_library_file_comments to authenticated;

-- Centralized approval transitions (clients: approved / revision_requested; freelancer: pending)
create or replace function public.set_library_file_approval_status(p_file_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_needs boolean;
  v_freelancer uuid;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  if p_status is null or trim(p_status) = '' then
    raise exception 'Invalid status';
  end if;

  select f.project_id, f.needs_approval, p.freelancer_id
  into v_project_id, v_needs, v_freelancer
  from public.project_library_files f
  join public.projects p on p.id = f.project_id
  where f.id = p_file_id;

  if v_project_id is null then
    raise exception 'File not found';
  end if;

  if not public.user_can_access_project_for_library(v_project_id) then
    raise exception 'Access denied';
  end if;

  if not coalesce(v_needs, false) then
    raise exception 'This file does not use approval';
  end if;

  if p_status not in ('pending', 'approved', 'revision_requested') then
    raise exception 'Invalid status';
  end if;

  if v_freelancer = v_actor then
    if p_status <> 'pending' then
      raise exception 'Only clients can approve or request revision';
    end if;
  else
    if p_status not in ('approved', 'revision_requested') then
      raise exception 'Only the freelancer can reset status to pending';
    end if;
  end if;

  update public.project_library_files
  set approval_status = p_status
  where id = p_file_id and project_id = v_project_id;
end;
$$;

revoke all on function public.set_library_file_approval_status(uuid, text) from public;
grant execute on function public.set_library_file_approval_status(uuid, text) to authenticated;
