/**
 * Copies published reel videos out of Supabase Storage and into public/media/remote/
 * before each build, so visitors stream them from Netlify's CDN.
 *
 * Why not link straight to Supabase: the films autoplay on the work pages, and
 * every play would spend the project's storage egress and add a third-party
 * round trip to the page. Downloading them once per build costs nothing at
 * runtime. Images do not need this — Astro already bakes those into the build.
 *
 * The local filename is the storage object's basename; `videoUrl()` in
 * src/lib/content.ts builds the same path. Keep the two in step.
 *
 * Runs as part of `npm run build`, and skips work it has already done.
 */
import { mkdir, readdir, writeFile, stat, rm } from 'node:fs/promises';
import path from 'node:path';

const OUT = 'public/media/remote';

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    '[sync-media] PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are required.\n' +
      '             Locally: copy .env.example to .env. On Netlify: set both as environment variables.'
  );
  process.exit(1);
}

const res = await fetch(`${url}/rest/v1/reels?select=video_path&published=is.true`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});

if (!res.ok) {
  console.error(`[sync-media] could not list reels (${res.status}): ${await res.text()}`);
  process.exit(1);
}

const reels = await res.json();
await mkdir(OUT, { recursive: true });

const wanted = new Set();
let fetched = 0;

for (const reel of reels) {
  const name = reel.video_path.split('/').pop();
  wanted.add(name);
  const dest = path.join(OUT, name);

  // Storage objects are content-addressed by name, so an existing file is the
  // same file. Re-downloading 20 MB of video on every build helps no one.
  const existing = await stat(dest).catch(() => null);
  if (existing?.size > 0) continue;

  const file = await fetch(`${url}/storage/v1/object/public/work/${reel.video_path}`);
  if (!file.ok) {
    console.error(`[sync-media] could not download ${reel.video_path} (${file.status})`);
    process.exit(1);
  }
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));
  fetched++;
}

// Drop videos belonging to reels that have since been deleted or unpublished.
let removed = 0;
for (const name of await readdir(OUT).catch(() => [])) {
  if (!wanted.has(name)) {
    await rm(path.join(OUT, name));
    removed++;
  }
}

console.log(
  `[sync-media] ${reels.length} published reel(s): ${fetched} downloaded, ` +
    `${reels.length - fetched} already local, ${removed} stale file(s) removed.`
);
