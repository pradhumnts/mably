-- Voice notes on library file comments (storage in project-library under {project_id}/voice-notes/)

alter table public.project_library_file_comments
  drop constraint if exists project_library_file_comments_body_nonempty;

alter table public.project_library_file_comments
  alter column body drop not null;

alter table public.project_library_file_comments
  add column if not exists voice_note_storage_path text,
  add column if not exists voice_note_duration_ms integer,
  add column if not exists voice_note_mime_type text,
  add column if not exists voice_note_size_bytes bigint,
  add column if not exists voice_note_waveform jsonb,
  add column if not exists voice_note_transcript text;

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
  );

alter table public.project_library_file_comments
  drop constraint if exists project_library_file_comments_voice_duration_ok;

alter table public.project_library_file_comments
  add constraint project_library_file_comments_voice_duration_ok
  check (
    voice_note_storage_path is null
    or (
      voice_note_duration_ms is not null
      and voice_note_duration_ms > 0
      and voice_note_duration_ms <= 180000
    )
  );

create index if not exists project_library_file_comments_voice_path_idx
  on public.project_library_file_comments (voice_note_storage_path)
  where voice_note_storage_path is not null;

-- Per-user "fully listened" for voice (separate from comment read receipts)
create table if not exists public.project_library_file_comment_voice_listens (
  comment_id uuid not null references public.project_library_file_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists project_library_file_comment_voice_listens_user_idx
  on public.project_library_file_comment_voice_listens (user_id);

alter table public.project_library_file_comment_voice_listens enable row level security;

drop policy if exists "library_voice_listens_select_own" on public.project_library_file_comment_voice_listens;
create policy "library_voice_listens_select_own"
  on public.project_library_file_comment_voice_listens for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "library_voice_listens_insert_own" on public.project_library_file_comment_voice_listens;
create policy "library_voice_listens_insert_own"
  on public.project_library_file_comment_voice_listens for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.project_library_file_comments c
      where c.id = comment_id
        and public.user_can_access_project_for_library(c.project_id)
    )
  );

grant select, insert on public.project_library_file_comment_voice_listens to authenticated;
