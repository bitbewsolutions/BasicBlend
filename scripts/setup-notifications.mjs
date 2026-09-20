/**
 * Connects the enquiry trigger to the notify-enquiry function.
 *
 * Generates a shared secret, stores it where the trigger reads it, and sets the
 * same value as a function secret so the function can reject anything else.
 * Safe to re-run: it rotates the secret.
 *
 *   node --env-file=.env scripts/setup-notifications.mjs
 *
 * Afterwards, set the Resend values (once you have the account):
 *   npx supabase secrets set RESEND_API_KEY=… NOTIFY_FROM="BasicBlend <enquiries@basicblend.in>"
 * and put the recipient address in the panel: Settings → Send new enquiries to.
 */
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { select, insert, remove, SUPABASE_URL } from './lib/supa.mjs';

const secret = randomBytes(24).toString('base64url');
const functionsUrl = `${SUPABASE_URL}/functions/v1`;
const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];

async function put(key, value) {
  await remove('app_config', `key=eq.${key}`);
  await insert('app_config', [{ key, value }]);
}

await put('functions_url', functionsUrl);
await put('webhook_secret', secret);

const adminUrl = process.env.ADMIN_URL ?? 'https://www.basicblend.in/admin/';
const existing = await select('app_config?select=key&key=eq.admin_url');
if (existing.length === 0) await insert('app_config', [{ key: 'admin_url', value: adminUrl }]);

console.log('Stored functions_url and a fresh webhook_secret in app_config.');

try {
  execFileSync(
    'npx',
    ['supabase', 'secrets', 'set', `WEBHOOK_SECRET=${secret}`, '--project-ref', projectRef],
    { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' }
  );
  console.log('Set WEBHOOK_SECRET on the Edge Function.');
} catch (error) {
  console.error(
    'Could not set the function secret automatically. Run this yourself:\n' +
      `  npx supabase secrets set WEBHOOK_SECRET=${secret} --project-ref ${projectRef}`
  );
  process.exitCode = 1;
}

console.log('\nNew enquiries will now call notify-enquiry. Email sends once RESEND_API_KEY is set.');
