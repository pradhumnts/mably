-- Realtime: other portal members see new library file comments without refresh.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'project_library_file_comments'
  ) then
    alter publication supabase_realtime add table public.project_library_file_comments;
  end if;
end $$;
