-- One-round-trip chat summaries for the freelancer inbox, dashboard and notifications:
-- per project conversation, the latest message, the viewer's unread count, and the latest
-- unread message. Replaces 2–3 queries per project.
--
-- SECURITY INVOKER: rows are filtered by the caller's existing RLS on
-- project_conversations / project_messages / project_conversation_reads, and the viewer
-- is always auth.uid(), so callers cannot ask about other users.

create or replace function public.project_chat_summaries(p_project_ids uuid[])
returns table (
  project_id uuid,
  conversation_id uuid,
  unread_count bigint,
  last_message_id uuid,
  last_message_body text,
  last_message_author_id uuid,
  last_message_author_name text,
  last_message_created_at timestamptz,
  last_message_has_voice boolean,
  latest_unread_id uuid,
  latest_unread_created_at timestamptz,
  latest_unread_author_name text,
  latest_unread_author_avatar text
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.project_id,
    c.id,
    coalesce(unread.n, 0),
    last_msg.id,
    last_msg.body,
    last_msg.author_id,
    last_msg.author_display_name,
    last_msg.created_at,
    last_msg.voice_note_storage_path is not null,
    latest_unread.id,
    latest_unread.created_at,
    latest_unread.author_display_name,
    latest_unread.author_avatar_url
  from public.project_conversations c
  left join public.project_conversation_reads r
    on r.conversation_id = c.id and r.user_id = (select auth.uid())
  left join lateral (
    select m.id, m.body, m.author_id, m.author_display_name, m.created_at, m.voice_note_storage_path
    from public.project_messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) last_msg on true
  left join lateral (
    select count(*) as n
    from public.project_messages m
    where m.conversation_id = c.id
      and m.author_id <> (select auth.uid())
      and m.created_at > coalesce(r.last_read_at, '1970-01-01T00:00:00Z'::timestamptz)
  ) unread on true
  left join lateral (
    select m.id, m.created_at, m.author_display_name, m.author_avatar_url
    from public.project_messages m
    where m.conversation_id = c.id
      and m.author_id <> (select auth.uid())
      and m.created_at > coalesce(r.last_read_at, '1970-01-01T00:00:00Z'::timestamptz)
    order by m.created_at desc
    limit 1
  ) latest_unread on true
  where c.project_id = any (p_project_ids);
$$;

revoke all on function public.project_chat_summaries(uuid[]) from public, anon;
grant execute on function public.project_chat_summaries(uuid[]) to authenticated;
