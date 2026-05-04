-- Growth plan allows large single files; app enforces per-plan caps in server actions.
-- Raise Supabase Storage object limit so Growth uploads are not capped at 50 MB by the bucket.

update storage.buckets
set file_size_limit = 2147483648
where id = 'project-library';
