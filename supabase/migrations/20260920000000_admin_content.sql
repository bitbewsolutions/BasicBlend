-- BasicBlend — enquiries + site content, and the admin panel that manages them.
--
-- Security model, in short:
--   · anonymous visitors may INSERT an enquiry and SELECT published content. Nothing else.
--   · everything else requires being in public.admins — not merely being signed in.
--     Sign-up is disabled, but the allowlist means a stray account is still powerless.
--
-- The public site reads published rows at BUILD time with the publishable key, so
-- what visitors get is static HTML; Supabase is never in their critical path.

create extension if not exists moddatetime with schema extensions;

-- ---------------------------------------------------------------------------
-- Who may administer
-- ---------------------------------------------------------------------------

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  added_at timestamptz not null default now()
);

-- No policies: unreachable from the anon and authenticated roles by design.
-- Rows are added by scripts/create-admin.mjs with the secret key.
alter table public.admins enable row level security;

-- SECURITY DEFINER so a policy can consult the allowlist without the caller
-- needing to read it. Empty search_path: a definer function must never resolve
-- an object name through the caller's path.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Enquiries — the contact form's destination
-- ---------------------------------------------------------------------------

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  business text check (char_length(business) <= 160),
  phone text not null check (char_length(phone) between 4 and 32),
  email text check (char_length(email) <= 200),
  -- Service slug from the form's dropdown, 'several', or empty.
  need text check (char_length(need) <= 80),
  message text not null check (char_length(message) between 1 and 4000),
  -- Which page the enquiry came from, for context in the inbox.
  source_path text check (char_length(source_path) <= 300),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed', 'spam')),
  -- Private working notes, admin only. Never shown on the site.
  notes text check (char_length(notes) <= 4000)
);

create index if not exists enquiries_created_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);

alter table public.enquiries enable row level security;

-- A visitor may file an enquiry and nothing more: no reading, and no arriving
-- pre-marked as 'contacted' or carrying notes.
drop policy if exists "visitors submit enquiries" on public.enquiries;
create policy "visitors submit enquiries" on public.enquiries
  for insert to anon, authenticated
  with check (status = 'new' and notes is null);

drop policy if exists "admins manage enquiries" on public.enquiries;
create policy "admins manage enquiries" on public.enquiries
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace trigger enquiries_updated_at
  before update on public.enquiries
  for each row execute function extensions.moddatetime (updated_at);

-- ---------------------------------------------------------------------------
-- Projects (case studies) and their media
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  client text not null check (char_length(client) between 1 and 120),
  sub_brand text check (char_length(sub_brand) <= 120),
  sector text not null check (char_length(sector) between 1 and 120),
  teaser text not null check (char_length(teaser) between 1 and 300),
  overview text not null check (char_length(overview) between 1 and 4000),
  scope text[] not null default '{}',
  -- [{ "label": "Sector", "value": "Home appliances" }, …]
  spec jsonb not null default '[]'::jsonb,
  -- Service slugs from src/data/services.ts.
  services text[] not null default '{}',
  feature_caption text check (char_length(feature_caption) <= 200),
  published boolean not null default false,
  sort integer not null default 0
);

create index if not exists projects_sort_idx on public.projects (sort, created_at);

create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  project_id uuid not null references public.projects (id) on delete cascade,
  -- cover: the card and hero image · gallery: the creatives strip · feature: the
  -- optional campaign layout shown once, with feature_caption.
  role text not null check (role in ('cover', 'gallery', 'feature')),
  path text not null,
  alt text not null check (char_length(alt) between 1 and 500),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  sort integer not null default 0
);

create index if not exists project_media_project_idx on public.project_media (project_id, role, sort);

-- ---------------------------------------------------------------------------
-- Reels / films
-- ---------------------------------------------------------------------------

create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  label text not null check (char_length(label) between 1 and 60),
  client text not null check (char_length(client) between 1 and 120),
  note text not null check (char_length(note) between 1 and 200),
  alt text not null check (char_length(alt) between 1 and 500),
  video_path text not null,
  poster_path text not null,
  poster_width integer check (poster_width > 0),
  poster_height integer check (poster_height > 0),
  -- Optional: also show this film on that project's case page.
  project_id uuid references public.projects (id) on delete set null,
  -- Show in the films row on /work/ and the reels service page.
  show_in_films boolean not null default true,
  published boolean not null default true,
  sort integer not null default 0
);

create index if not exists reels_sort_idx on public.reels (sort, created_at);

-- ---------------------------------------------------------------------------
-- Identities (logos delivered)
-- ---------------------------------------------------------------------------

create table if not exists public.identities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client text not null check (char_length(client) between 1 and 120),
  sector text not null check (char_length(sector) between 1 and 160),
  image_path text not null,
  alt text not null check (char_length(alt) between 1 and 500),
  width integer check (width > 0),
  height integer check (height > 0),
  published boolean not null default true,
  sort integer not null default 0
);

create index if not exists identities_sort_idx on public.identities (sort, created_at);

-- ---------------------------------------------------------------------------
-- Admin settings and the publish log
-- ---------------------------------------------------------------------------

-- Small key/value store so things like the Netlify build hook can be set from
-- the panel instead of a redeploy. Admin only: the build hook is a secret.
create table if not exists public.app_config (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create table if not exists public.publish_log (
  id bigint generated always as identity primary key,
  triggered_at timestamptz not null default now(),
  triggered_by uuid references auth.users (id) on delete set null,
  status text not null default 'requested' check (status in ('requested', 'failed')),
  detail text
);

-- ---------------------------------------------------------------------------
-- Content policies: the world reads what is published, admins do everything
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.reels enable row level security;
alter table public.identities enable row level security;
alter table public.app_config enable row level security;
alter table public.publish_log enable row level security;

drop policy if exists "published projects are public" on public.projects;
create policy "published projects are public" on public.projects
  for select to anon, authenticated using (published);

drop policy if exists "admins manage projects" on public.projects;
create policy "admins manage projects" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Media follows its project: drafts stay private.
drop policy if exists "media of published projects is public" on public.project_media;
create policy "media of published projects is public" on public.project_media
  for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.published));

drop policy if exists "admins manage project media" on public.project_media;
create policy "admins manage project media" on public.project_media
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "published reels are public" on public.reels;
create policy "published reels are public" on public.reels
  for select to anon, authenticated using (published);

drop policy if exists "admins manage reels" on public.reels;
create policy "admins manage reels" on public.reels
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "published identities are public" on public.identities;
create policy "published identities are public" on public.identities
  for select to anon, authenticated using (published);

drop policy if exists "admins manage identities" on public.identities;
create policy "admins manage identities" on public.identities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage config" on public.app_config;
create policy "admins manage config" on public.app_config
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins read publish log" on public.publish_log;
create policy "admins read publish log" on public.publish_log
  for select to authenticated using (public.is_admin());

create or replace trigger projects_updated_at before update on public.projects
  for each row execute function extensions.moddatetime (updated_at);
create or replace trigger reels_updated_at before update on public.reels
  for each row execute function extensions.moddatetime (updated_at);
create or replace trigger identities_updated_at before update on public.identities
  for each row execute function extensions.moddatetime (updated_at);
create or replace trigger app_config_updated_at before update on public.app_config
  for each row execute function extensions.moddatetime (updated_at);

-- ---------------------------------------------------------------------------
-- When did the content last change? Drives the "unpublished changes" banner.
-- ---------------------------------------------------------------------------

create or replace function public.content_updated_at()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select max(t) from (
    select max(updated_at) as t from public.projects
    union all select max(created_at) from public.project_media
    union all select max(updated_at) from public.reels
    union all select max(updated_at) from public.identities
  ) s;
$$;

grant execute on function public.content_updated_at() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: one public bucket for work media
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('work', 'work', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "work media is public" on storage.objects;
create policy "work media is public" on storage.objects
  for select to anon, authenticated using (bucket_id = 'work');

drop policy if exists "admins upload work media" on storage.objects;
create policy "admins upload work media" on storage.objects
  for insert to authenticated with check (bucket_id = 'work' and public.is_admin());

drop policy if exists "admins replace work media" on storage.objects;
create policy "admins replace work media" on storage.objects
  for update to authenticated using (bucket_id = 'work' and public.is_admin());

drop policy if exists "admins delete work media" on storage.objects;
create policy "admins delete work media" on storage.objects
  for delete to authenticated using (bucket_id = 'work' and public.is_admin());
