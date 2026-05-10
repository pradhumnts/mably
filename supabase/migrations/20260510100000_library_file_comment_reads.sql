-- Track per-user read state for each library file discussion thread.

create table if not exists public.project_library_file_comment_reads (
  file_id uuid not null references public.project_library_files (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (file_id, user_id)
);

create index if not exists project_library_file_comment_reads_user_id_idx
  on public.project_library_file_comment_reads (user_id);

alter table public.project_library_file_comment_reads enable row level security;

drop policy if exists "project_library_file_comment_reads_select_own"
  on public.project_library_file_comment_reads;
create policy "project_library_file_comment_reads_select_own"
  on public.project_library_file_comment_reads for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "project_library_file_comment_reads_insert_own"
  on public.project_library_file_comment_reads;
create policy "project_library_file_comment_reads_insert_own"
  on public.project_library_file_comment_reads for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.project_library_files f
      where f.id = file_id
        and public.user_can_access_project_for_library(f.project_id)
    )
  );

drop policy if exists "project_library_file_comment_reads_update_own"
  on public.project_library_file_comment_reads;
create policy "project_library_file_comment_reads_update_own"
  on public.project_library_file_comment_reads for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.project_library_files f
      where f.id = file_id
        and public.user_can_access_project_for_library(f.project_id)
    )
  );

grant select, insert, update on public.project_library_file_comment_reads to authenticated;
