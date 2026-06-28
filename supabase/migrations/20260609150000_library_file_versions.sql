-- Version stack: many blobs per logical library file.

create table if not exists public.project_library_file_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.project_library_files (id) on delete cascade,
  version_number integer not null check (version_number > 0),
  storage_object_path text not null,
  original_filename text not null default '',
  mime_type text,
  size_bytes bigint,
  version_note text,
  created_by uuid references auth.users (id) on delete set null,
  created_by_display_name text not null default '',
  created_by_avatar_url text,
  created_at timestamptz not null default now(),
  constraint project_library_file_versions_file_version_unique unique (file_id, version_number),
  constraint project_library_file_versions_path_unique unique (storage_object_path)
);

create index if not exists project_library_file_versions_file_idx
  on public.project_library_file_versions (file_id, version_number desc);

alter table public.project_library_files
  add column if not exists version_count integer not null default 1,
  add column if not exists current_version_number integer not null default 1,
  add column if not exists updated_at timestamptz not null default now();

-- Backfill v1 rows from existing files.
insert into public.project_library_file_versions (
  file_id,
  version_number,
  storage_object_path,
  original_filename,
  mime_type,
  size_bytes,
  created_by,
  created_by_display_name,
  created_by_avatar_url,
  created_at
)
select
  f.id,
  1,
  f.storage_object_path,
  f.original_filename,
  f.mime_type,
  f.size_bytes,
  f.created_by,
  f.created_by_display_name,
  f.created_by_avatar_url,
  f.created_at
from public.project_library_files f
where not exists (
  select 1
  from public.project_library_file_versions v
  where v.file_id = f.id and v.version_number = 1
);

update public.project_library_files
set
  version_count = 1,
  current_version_number = 1,
  updated_at = coalesce(updated_at, created_at)
where version_count is null or current_version_number is null;

alter table public.project_library_file_comment_attachments
  add column if not exists version_id uuid references public.project_library_file_versions (id) on delete set null;

alter table public.project_library_file_versions enable row level security;

drop policy if exists "library_file_versions_select" on public.project_library_file_versions;
create policy "library_file_versions_select"
  on public.project_library_file_versions for select
  to authenticated
  using (
    exists (
      select 1
      from public.project_library_files f
      where f.id = file_id
        and public.user_can_access_project_for_library(f.project_id)
    )
  );

drop policy if exists "library_file_versions_insert" on public.project_library_file_versions;
create policy "library_file_versions_insert"
  on public.project_library_file_versions for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.project_library_files f
      where f.id = file_id
        and public.user_can_access_project_for_library(f.project_id)
    )
  );

grant select, insert on public.project_library_file_versions to authenticated;
