-- Allow authors / freelancers to update or delete chat messages (voice removal).

grant update on public.project_messages to authenticated;

drop policy if exists "project_messages_update_own_or_freelancer" on public.project_messages;
create policy "project_messages_update_own_or_freelancer"
  on public.project_messages for update
  to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1
      from public.project_conversations c
      join public.projects p on p.id = c.project_id
      where c.id = conversation_id
        and p.freelancer_id = auth.uid()
    )
  )
  with check (
    author_id = auth.uid()
    or exists (
      select 1
      from public.project_conversations c
      join public.projects p on p.id = c.project_id
      where c.id = conversation_id
        and p.freelancer_id = auth.uid()
    )
  );

drop policy if exists "project_messages_delete_own_or_freelancer" on public.project_messages;
create policy "project_messages_delete_own_or_freelancer"
  on public.project_messages for delete
  to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1
      from public.project_conversations c
      join public.projects p on p.id = c.project_id
      where c.id = conversation_id
        and p.freelancer_id = auth.uid()
    )
  );
