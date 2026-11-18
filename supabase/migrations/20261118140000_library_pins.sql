-- Shared project pins for library files and links (null = unpinned).

alter table public.project_library_files
  add column if not exists pinned_at timestamptz;

alter table public.project_library_links
  add column if not exists pinned_at timestamptz;

create index if not exists project_library_files_pinned_at_idx
  on public.project_library_files (project_id, pinned_at desc nulls last);

create index if not exists project_library_links_pinned_at_idx
  on public.project_library_links (project_id, pinned_at desc nulls last);
