-- New enquiries should appear in the open admin panel without a refresh.
-- Realtime still enforces row-level security, so only admins receive them.
alter publication supabase_realtime add table public.enquiries;
