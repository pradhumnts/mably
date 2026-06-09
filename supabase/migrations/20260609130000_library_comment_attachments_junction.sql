-- Multiple library files per discussion comment (junction table).

create table if not exists public.project_library_file_comment_attachments (
  comment_id uuid not null references public.project_library_file_comments (id) on delete cascade,
  file_id uuid not null references public.project_library_files (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (comment_id, file_id)
);

create index if not exists project_library_file_comment_attachments_comment_idx
  on public.project_library_file_comment_attachments (comment_id, sort_order);

-- Backfill single-file rows from attached_file_id.
insert into public.project_library_file_comment_attachments (comment_id, file_id, sort_order)
select c.id, c.attached_file_id, 0
from public.project_library_file_comments c
where c.attached_file_id is not null
on conflict (comment_id, file_id) do nothing;

alter table public.project_library_file_comment_attachments enable row level security;

drop policy if exists "library_comment_attachments_select" on public.project_library_file_comment_attachments;
create policy "library_comment_attachments_select"
  on public.project_library_file_comment_attachments for select
  to authenticated
  using (
    exists (
      select 1
      from public.project_library_file_comments c
      where c.id = comment_id
        and public.user_can_access_project_for_library(c.project_id)
    )
  );

drop policy if exists "library_comment_attachments_insert" on public.project_library_file_comment_attachments;
create policy "library_comment_attachments_insert"
  on public.project_library_file_comment_attachments for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.project_library_file_comments c
      where c.id = comment_id
        and c.author_id = auth.uid()
        and public.user_can_access_project_for_library(c.project_id)
    )
  );

grant select, insert on public.project_library_file_comment_attachments to authenticated;
