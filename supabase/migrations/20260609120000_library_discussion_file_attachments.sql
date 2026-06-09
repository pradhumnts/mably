-- File attachments on library file comments (always stored as library rows).

alter table public.project_library_files
  add column if not exists upload_origin text not null default 'library',
  add column if not exists origin_discussion_file_id uuid references public.project_library_files (id) on delete set null;

alter table public.project_library_files
  drop constraint if exists project_library_files_upload_origin_check;

alter table public.project_library_files
  add constraint project_library_files_upload_origin_check
  check (upload_origin in ('library', 'discussion'));

alter table public.project_library_files
  drop constraint if exists project_library_files_discussion_origin_file_check;

alter table public.project_library_files
  add constraint project_library_files_discussion_origin_file_check
  check (
    (upload_origin = 'library' and origin_discussion_file_id is null)
    or (upload_origin = 'discussion' and origin_discussion_file_id is not null)
  );

create index if not exists project_library_files_origin_discussion_idx
  on public.project_library_files (origin_discussion_file_id)
  where origin_discussion_file_id is not null;

alter table public.project_library_file_comments
  add column if not exists attached_file_id uuid references public.project_library_files (id) on delete set null;

create index if not exists project_library_file_comments_attached_file_idx
  on public.project_library_file_comments (attached_file_id)
  where attached_file_id is not null;

alter table public.project_library_file_comments
  drop constraint if exists project_library_file_comments_body_or_voice;

alter table public.project_library_file_comments
  add constraint project_library_file_comments_body_or_voice
  check (
    (
      body is not null
      and length(trim(body)) > 0
    )
    or (
      voice_note_storage_path is not null
      and length(trim(voice_note_storage_path)) > 0
    )
    or attached_file_id is not null
  );
