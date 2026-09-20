/**
 * Build-time content loader.
 *
 * Work content (projects, reels, identities) lives in Supabase so the client can
 * manage it from /admin/. It is read HERE, at build time, with the publishable
 * key, and baked into static HTML — visitors never talk to Supabase, and a
 * Supabase outage cannot take the site down or slow it.
 *
 * Because of that, new work appears only after a rebuild. The Publish button in
 * the admin panel triggers one.
 *
 * Images come back as remote URLs and still go through Astro's image pipeline
 * (see `Pic.astro`), so they ship as sized WebP like the local ones always did.
 * Videos are copied into the build by `scripts/sync-media.mjs` and served from
 * Netlify, which keeps playback fast and Supabase's egress out of the picture.
 */
import type { Film, CaseStudy, Identity, SiteImage } from '../data/work';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

/** Where `sync-media.mjs` puts videos it has copied into the build. */
export const REMOTE_MEDIA_DIR = '/media/remote/';

interface ProjectRow {
  id: string;
  slug: string;
  client: string;
  sub_brand: string | null;
  sector: string;
  teaser: string;
  overview: string;
  scope: string[];
  spec: { label: string; value: string }[];
  services: string[];
  feature_caption: string | null;
  sort: number;
}

interface MediaRow {
  project_id: string;
  role: 'cover' | 'gallery' | 'feature';
  path: string;
  alt: string;
  width: number;
  height: number;
  sort: number;
}

interface ReelRow {
  id: string;
  label: string;
  client: string;
  note: string;
  alt: string;
  video_path: string;
  poster_path: string;
  poster_width: number | null;
  poster_height: number | null;
  project_id: string | null;
  show_in_films: boolean;
  sort: number;
}

interface IdentityRow {
  client: string;
  sector: string;
  image_path: string;
  alt: string;
  width: number | null;
  height: number | null;
  sort: number;
}

/**
 * A missing key is a configuration mistake, not a reason to quietly ship a site
 * with no work on it. Netlify needs both PUBLIC_ variables; see the README.
 */
function requireConfig(): { url: string; key: string } {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      'PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set to build the site. ' +
        'Copy .env.example to .env locally, and set both in Netlify → Environment variables.'
    );
  }
  return { url: SUPABASE_URL, key: SUPABASE_KEY };
}

async function query<T>(path: string): Promise<T[]> {
  const { url, key } = requireConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    // Failing the build is deliberate: a green deploy that silently dropped the
    // client's projects would be far worse than no deploy at all.
    throw new Error(`Supabase read failed (${res.status}) for ${path}: ${await res.text()}`);
  }
  return (await res.json()) as T[];
}

/** Public URL of a file in the `work` bucket. */
export function mediaUrl(path: string): string {
  const { url } = requireConfig();
  return `${url}/storage/v1/object/public/work/${path}`;
}

/**
 * Videos are served from our own build, not from Supabase.
 * `scripts/sync-media.mjs` writes each one under its storage basename — keep the
 * two in step if this ever changes.
 */
export function videoUrl(path: string): string {
  return REMOTE_MEDIA_DIR + path.split('/').pop();
}

function image(row: { path: string; width: number; height: number }): SiteImage {
  return { src: mediaUrl(row.path), width: row.width, height: row.height };
}

/** One fetch per build, however many pages ask for it. */
let cache: Promise<{ caseStudies: CaseStudy[]; films: Film[]; identities: Identity[] }> | null = null;

async function load() {
  const [projects, media, reels, identityRows] = await Promise.all([
    query<ProjectRow>('projects?select=*&published=is.true&order=sort.asc,created_at.asc'),
    query<MediaRow>('project_media?select=*&order=sort.asc'),
    query<ReelRow>('reels?select=*&published=is.true&order=sort.asc,created_at.asc'),
    query<IdentityRow>('identities?select=*&published=is.true&order=sort.asc,created_at.asc'),
  ]);

  const filmFor = (row: ReelRow): Film => ({
    id: row.id,
    src: videoUrl(row.video_path),
    poster: {
      src: mediaUrl(row.poster_path),
      width: row.poster_width ?? 352,
      height: row.poster_height ?? 624,
    },
    label: row.label,
    client: row.client,
    note: row.note,
    alt: row.alt,
  });

  const caseStudies: CaseStudy[] = projects.map((p) => {
    const mine = media.filter((m) => m.project_id === p.id);
    const cover = mine.find((m) => m.role === 'cover');
    const feature = mine.find((m) => m.role === 'feature');
    const projectFilms = reels.filter((r) => r.project_id === p.id).map(filmFor);

    if (!cover) {
      throw new Error(`Project "${p.slug}" is published but has no cover image.`);
    }

    return {
      slug: p.slug,
      client: p.client,
      subBrand: p.sub_brand ?? undefined,
      sector: p.sector,
      teaser: p.teaser,
      overview: p.overview,
      scope: p.scope,
      spec: p.spec,
      services: p.services,
      cover: image(cover),
      coverAlt: cover.alt,
      gallery: mine
        .filter((m) => m.role === 'gallery')
        .sort((a, b) => a.sort - b.sort)
        .map((m) => ({ image: image(m), alt: m.alt })),
      feature: feature
        ? { image: image(feature), alt: feature.alt, caption: p.feature_caption ?? '' }
        : undefined,
      films: projectFilms.length > 0 ? projectFilms : undefined,
    };
  });

  return {
    caseStudies,
    films: reels.filter((r) => r.show_in_films).map(filmFor),
    identities: identityRows.map((i) => ({
      client: i.client,
      sector: i.sector,
      image: { src: mediaUrl(i.image_path), width: i.width ?? 1000, height: i.height ?? 1000 },
      alt: i.alt,
    })),
  };
}

function content() {
  cache ??= load();
  return cache;
}

export const getCaseStudies = async () => (await content()).caseStudies;
export const getFilms = async () => (await content()).films;
export const getIdentities = async () => (await content()).identities;

export async function getCaseStudy(slug: string) {
  return (await getCaseStudies()).find((c) => c.slug === slug);
}

/** Creatives from every case, interleaved, for the home page filmstrip. */
export async function getFilmstrip() {
  const lists = (await getCaseStudies()).map((c) =>
    c.gallery.map((g) => ({ image: g.image, alt: g.alt, client: c.client }))
  );
  const longest = Math.max(0, ...lists.map((l) => l.length));
  const out: { image: SiteImage; alt: string; client: string }[] = [];
  for (let i = 0; i < longest; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}
