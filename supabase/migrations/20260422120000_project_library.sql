-- Library: links (DB) + files (metadata + private storage bucket project-library)

create or replace function public.user_can_access_project_for_library(project_uuid uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_uuid
    and (
      p.freelancer_id = auth.uid()
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = auth.uid()
      )
      or (
        p.invite_email is not null
        and trim(p.invite_email) <> ''
        and exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid()
          and lower(trim(coalesce(pr.email, ''))) = lower(trim(p.invite_email))
        )
      )
    )
  );
$$;

create or replace function public.user_is_project_freelancer_owner(project_uuid uuid)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_uuid and p.freelancer_id = auth.uid()
  );
$$;

-- Links
create table if not exists public.project_library_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  needs_approval boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_by_display_name text not null default '',
  created_by_avatar_url text,
  created_at timestamptz not null default now()
);

create index if not exists project_library_links_project_id_idx
  on public.project_library_links (project_id);
create index if not exists project_library_links_created_at_idx
  on public.project_library_links (project_id, created_at desc);

alter table public.project_library_links enable row level security;

drop policy if exists "project_library_links_select" on public.project_library_links;
create policy "project_library_links_select"
  on public.project_library_links for select
  to authenticated
  using (public.user_can_access_project_for_library(project_id));

drop policy if exists "project_library_links_insert_freelancer" on public.project_library_links;
create policy "project_library_links_insert_freelancer"
  on public.project_library_links for insert
  to authenticated
  with check (
    public.user_is_project_freelancer_owner(project_id)
    and created_by = auth.uid()
  );

drop policy if exists "project_library_links_delete_freelancer" on public.project_library_links;
create policy "project_library_links_delete_freelancer"
  on public.project_library_links for delete
  to authenticated
  using (public.user_is_project_freelancer_owner(project_id));

-- Files (metadata; bytes live in storage.objects under bucket project-library)
create table if not exists public.project_library_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  storage_object_path text not null,
  display_name text not null,
  original_filename text not null default '',
  mime_type text,
  size_bytes bigint,
  description text,
  needs_approval boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_by_display_name text not null default '',
  created_by_avatar_url text,
  created_at timestamptz not null default now(),
  constraint project_library_files_path_unique unique (storage_object_path)
);

create index if not exists project_library_files_project_id_idx
  on public.project_library_files (project_id);
create index if not exists project_library_files_created_at_idx
  on public.project_library_files (project_id, created_at desc);

alter table public.project_library_files enable row level security;

drop policy if exists "project_library_files_select" on public.project_library_files;
create policy "project_library_files_select"
  on public.project_library_files for select
  to authenticated
  using (public.user_can_access_project_for_library(project_id));

drop policy if exists "project_library_files_insert_freelancer" on public.project_library_files;
create policy "project_library_files_insert_freelancer"
  on public.project_library_files for insert
  to authenticated
  with check (
    public.user_is_project_freelancer_owner(project_id)
    and created_by = auth.uid()
  );

drop policy if exists "project_library_files_delete_freelancer" on public.project_library_files;
create policy "project_library_files_delete_freelancer"
  on public.project_library_files for delete
  to authenticated
  using (public.user_is_project_freelancer_owner(project_id));

-- Private bucket: path layout {project_id}/{uuid}_{filename}
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-library',
  'project-library',
  false,
  52428800,
  null
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project_library_storage_select" on storage.objects;
create policy "project_library_storage_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-library'
    and exists (
      select 1 from public.projects p
      where p.id::text = split_part(name, '/', 1)
      and public.user_can_access_project_for_library(p.id)
    )
  );

drop policy if exists "project_library_storage_insert" on storage.objects;
create policy "project_library_storage_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-library'
    and exists (
      select 1 from public.projects p
      where p.id::text = split_part(name, '/', 1)
      and public.user_is_project_freelancer_owner(p.id)
    )
  );

drop policy if exists "project_library_storage_delete" on storage.objects;
create policy "project_library_storage_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-library'
    and exists (
      select 1 from public.projects p
      where p.id::text = split_part(name, '/', 1)
      and public.user_is_project_freelancer_owner(p.id)
    )
  );

grant select, insert, delete on public.project_library_links to authenticated;
grant select, insert, delete on public.project_library_files to authenticated;
