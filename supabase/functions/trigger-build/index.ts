/**
 * The Publish button: rebuilds the website so new work goes live.
 *
 * This exists as a function rather than a fetch from the panel because the
 * Netlify build hook is a secret. Anyone holding that URL can trigger builds,
 * so it stays in the database, readable only by admins, and is used here.
 *
 * Supabase verifies the caller's JWT before this runs; we then check the
 * account is on the admin allowlist, because a valid token is not the same as
 * permission.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization) return json({ ok: false, error: 'Sign in again to publish.' }, 401);

  // Who is asking, and are they allowed?
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: authorization },
  });
  if (!who.ok) return json({ ok: false, error: 'Sign in again to publish.' }, 401);
  const user = (await who.json()) as { id: string };

  const allowed = await fetch(`${SUPABASE_URL}/rest/v1/admins?select=user_id&user_id=eq.${user.id}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  const rows = allowed.ok ? ((await allowed.json()) as unknown[]) : [];
  if (rows.length === 0) return json({ ok: false, error: 'This account cannot publish.' }, 403);

  // The hook lives in app_config so it can be changed without a deploy.
  const configRes = await fetch(
    `${SUPABASE_URL}/rest/v1/app_config?select=value&key=eq.netlify_build_hook`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const config = configRes.ok ? ((await configRes.json()) as { value: string | null }[]) : [];
  const hook = config[0]?.value?.trim();

  if (!hook) {
    return json({ ok: false, error: 'No build hook saved yet. Add it in Settings.' }, 400);
  }
  if (!/^https:\/\/api\.netlify\.com\/build_hooks\/[A-Za-z0-9]+$/.test(hook)) {
    return json({ ok: false, error: 'That build hook does not look like a Netlify hook URL.' }, 400);
  }

  const log = async (status: 'requested' | 'failed', detail?: string) => {
    await fetch(`${SUPABASE_URL}/rest/v1/publish_log`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ triggered_by: user.id, status, detail: detail?.slice(0, 300) }),
    });
  };

  const build = await fetch(hook, { method: 'POST', body: '{}' });

  if (!build.ok) {
    const detail = await build.text();
    await log('failed', detail);
    return json({ ok: false, error: `Netlify refused the build (${build.status}).` }, 502);
  }

  await log('requested');
  return json({ ok: true });
});
