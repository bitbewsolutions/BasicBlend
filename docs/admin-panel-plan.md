# Admin panel — plan

Status: **not built.** Waiting on the client's Supabase project. This records the agreed direction
so the site keeps moving toward it.

## What the client asked for

1. See the enquiries visitors send through the contact form.
2. Keep the site current without a developer: add new projects, images and reels.
   Not a page builder. Site copy stays in code.

## Shape

```
Visitor ── form ──► Supabase `enquiries` table ──► /admin/ inbox
                     (+ Netlify Forms, kept for email alerts)

Client ── /admin/ ──► Supabase tables + Storage ──► "Publish" ──► Netlify build hook
                                                                    │
Public site (still static) ◄── build reads published rows ◄────────┘
```

**The public site stays static.** New work goes live through a rebuild (about a minute), not by
fetching from Supabase in the browser. That keeps the speed, the SEO (every project is real HTML
in the sitemap) and the image optimisation. Supabase only matters at build time and inside `/admin/`.

## Pieces

| Piece | How |
|---|---|
| Auth | Supabase Auth, email + password, client account only. No public sign-up |
| `/admin/` | One Astro page with a client-side app using `@supabase/supabase-js`. `noindex`, `Disallow: /admin/` in robots.txt, excluded from the sitemap |
| Enquiries | Form also inserts into `enquiries`. Row-level security: anonymous **insert only**; only the signed-in admin can read or update. Keep the honeypot. Inbox shows new / contacted / closed |
| Projects | `projects` table mirroring `CaseStudy` in `src/data/work.ts` (client, sector, teaser, overview, scope, spec rows, service slugs, `published`, `sort`) |
| Images & reels | Storage bucket `work` (public read, admin write). `project_media` rows: project, kind (`image`/`video`), path, alt text (required), poster for videos, order |
| Publish | Admin button calls a Supabase Edge Function that checks the session, then hits the Netlify build hook. The hook URL never reaches the browser |
| Build | A loader in `src/data/` fetches published rows with a read-only key and maps them to the existing `CaseStudy` / `Film` shapes. Local cases in `work.ts` stay and are merged in |

## What is already in place

- All content lives in `src/data/*.ts`, and components take plain objects (`CaseCard`, `CasePlate`,
  `FilmRow`, `IdentityGrid`), so a Supabase loader only has to return the same shapes.
- Case and service pages are generated from arrays, so a new project gets its own page, sitemap
  entry and links automatically.

## Changes needed when we build it

- `CaseStudy.cover` / `gallery` are `ImageMetadata` (local imports). Widen them to accept remote
  URLs with width/height, and allow the Supabase storage host in `image.remotePatterns` in
  `astro.config.mjs`, so remote images are still converted to WebP at build time.
- `galleryFor()` globs local folders. Remote projects bring their gallery from `project_media`.
- Films are hard-coded in `films`. Reels become rows too, with the current three seeded.
- The form keeps working even if Supabase is down: Netlify Forms stays as the fallback path.

## Schema sketch

```sql
create table enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null, business text, phone text not null, email text,
  need text, message text not null, page text,
  status text not null default 'new' check (status in ('new','contacted','closed'))
);
alter table enquiries enable row level security;
create policy "anyone can submit" on enquiries for insert to anon with check (true);
create policy "admin reads"       on enquiries for all    to authenticated using (true);

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, client text not null, sub_brand text, sector text not null,
  teaser text not null, overview text not null,
  scope text[] not null default '{}', spec jsonb not null default '[]',
  services text[] not null default '{}',
  published boolean not null default false, sort int not null default 0,
  created_at timestamptz default now()
);

create table project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade,
  kind text not null check (kind in ('cover','image','video')),
  path text not null, poster_path text, alt text not null,
  width int, height int, sort int not null default 0
);
```

## Before starting, confirm with the client

- One admin login, or several?
- Should a new enquiry send an email or WhatsApp alert? Netlify Forms can email today.
- Who writes the alt text and case copy for new projects? The admin form will require alt text.
