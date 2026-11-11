-- Track when a chat message body was last edited (null = never edited).

alter table public.project_messages
  add column if not exists edited_at timestamptz;

comment on column public.project_messages.edited_at is
  'Set when the message body is edited by its author. Null means never edited.';
