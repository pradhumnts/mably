-- Voice notes in project chat (storage: project-library / {project_id}/voice-notes/chat/)

alter table public.project_messages
  drop constraint if exists project_messages_body_len_check;

alter table public.project_messages
  alter column body drop not null;

alter table public.project_messages
  add column if not exists voice_note_storage_path text,
  add column if not exists voice_note_duration_ms integer,
  add column if not exists voice_note_mime_type text,
  add column if not exists voice_note_size_bytes bigint,
  add column if not exists voice_note_waveform jsonb,
  add column if not exists voice_note_transcript text;

alter table public.project_messages
  drop constraint if exists project_messages_body_or_voice;

alter table public.project_messages
  add constraint project_messages_body_or_voice
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

alter table public.project_messages
  add constraint project_messages_body_len_check
  check (body is null or char_length(body) <= 5000);

alter table public.project_messages
  drop constraint if exists project_messages_voice_duration_ok;

alter table public.project_messages
  add constraint project_messages_voice_duration_ok
  check (
    voice_note_storage_path is null
    or (
      voice_note_duration_ms is not null
      and voice_note_duration_ms > 0
      and voice_note_duration_ms <= 180000
    )
  );

create index if not exists project_messages_voice_path_idx
  on public.project_messages (voice_note_storage_path)
  where voice_note_storage_path is not null;

create table if not exists public.project_message_voice_listens (
  message_id uuid not null references public.project_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create index if not exists project_message_voice_listens_user_idx
  on public.project_message_voice_listens (user_id);

alter table public.project_message_voice_listens enable row level security;

drop policy if exists "project_message_voice_listens_select_own" on public.project_message_voice_listens;
create policy "project_message_voice_listens_select_own"
  on public.project_message_voice_listens for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "project_message_voice_listens_insert_own" on public.project_message_voice_listens;
create policy "project_message_voice_listens_insert_own"
  on public.project_message_voice_listens for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.project_messages m
      join public.project_conversations c on c.id = m.conversation_id
      where m.id = message_id
        and public.user_can_access_project_for_library(c.project_id)
    )
  );

grant select, insert on public.project_message_voice_listens to authenticated;
