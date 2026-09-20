/**
 * Server-side Supabase helpers for the scripts in this folder.
 *
 * These use SUPABASE_SECRET_KEY, which bypasses row-level security. It must
 * never reach the browser or Netlify's build environment — only a developer's
 * local .env. Run scripts with:  node --env-file=.env scripts/<name>.mjs
 */
const url = process.env.PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error(
    'Missing PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.\n' +
      'Run with:  node --env-file=.env scripts/<name>.mjs'
  );
  process.exit(1);
}

export const SUPABASE_URL = url;

const authHeaders = { apikey: secret, Authorization: `Bearer ${secret}` };

async function handle(res, what) {
  if (!res.ok) throw new Error(`${what} failed (${res.status}): ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** GET rows. `path` is everything after /rest/v1/, e.g. `projects?select=*`. */
export async function select(path) {
  return handle(await fetch(`${url}/rest/v1/${path}`, { headers: authHeaders }), `select ${path}`);
}

/** INSERT rows and get them back. */
export async function insert(table, rows) {
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(rows),
  });
  return handle(res, `insert into ${table}`);
}

/** DELETE rows matching a PostgREST filter, e.g. `id=gte.0`. */
export async function remove(table, filter) {
  const res = await fetch(`${url}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  return handle(res, `delete from ${table}`);
}

/** Upload a file to the `work` bucket, replacing anything already at that path. */
export async function upload(path, body, contentType) {
  const res = await fetch(`${url}/storage/v1/object/work/${path}`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': contentType, 'x-upsert': 'true' },
    body,
  });
  return handle(res, `upload ${path}`);
}

/** Every object currently in the `work` bucket, as full paths. */
export async function listObjects(prefix = '') {
  const res = await fetch(`${url}/storage/v1/object/list/work`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix, limit: 1000, sortBy: { column: 'name', order: 'asc' } }),
  });
  const rows = await handle(res, 'list storage');
  const out = [];
  for (const row of rows ?? []) {
    // A row with no id is a folder; recurse into it.
    const full = prefix ? `${prefix}/${row.name}` : row.name;
    if (row.id === null) out.push(...(await listObjects(full)));
    else out.push(full);
  }
  return out;
}

export async function removeObjects(paths) {
  if (paths.length === 0) return;
  const res = await fetch(`${url}/storage/v1/object/work`, {
    method: 'DELETE',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: paths }),
  });
  return handle(res, 'delete storage objects');
}
