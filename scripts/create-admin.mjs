/**
 * Create (or remove) an admin of the panel at /admin/.
 *
 * Signing in is not enough to administer anything: every policy checks
 * public.admins. This script is the only way in, and it needs the secret key,
 * so it can only be run by someone with the project's local .env.
 *
 *   node --env-file=.env scripts/create-admin.mjs someone@example.com 'their-password'
 *   node --env-file=.env scripts/create-admin.mjs --list
 *   node --env-file=.env scripts/create-admin.mjs --remove someone@example.com
 *
 * Give the password to its owner over a channel you trust, and tell them to
 * change it in the panel (Settings → Change password) once they are in.
 */
import { select, insert, remove, SUPABASE_URL } from './lib/supa.mjs';

const secret = process.env.SUPABASE_SECRET_KEY;
const headers = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  'Content-Type': 'application/json',
};

async function listUsers() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers });
  if (!res.ok) throw new Error(`Listing users failed (${res.status}): ${await res.text()}`);
  return (await res.json()).users ?? [];
}

const args = process.argv.slice(2);

if (args[0] === '--list') {
  const admins = await select('admins?select=user_id,email,added_at');
  if (admins.length === 0) console.log('No admins yet.');
  for (const a of admins) console.log(`${a.email ?? a.user_id}   added ${a.added_at.slice(0, 10)}`);
  process.exit(0);
}

if (args[0] === '--remove') {
  const email = args[1];
  if (!email) {
    console.error('Usage: --remove someone@example.com');
    process.exit(1);
  }
  const user = (await listUsers()).find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`No account found for ${email}.`);
    process.exit(1);
  }
  await remove('admins', `user_id=eq.${user.id}`);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(`Deleting the account failed (${res.status}): ${await res.text()}`);
  console.log(`Removed ${email}: no longer an admin, account deleted.`);
  process.exit(0);
}

const [email, password] = args;

if (!email || !password) {
  console.error(
    "Usage: node --env-file=.env scripts/create-admin.mjs <email> '<password>'\n" +
      '       --list                      show current admins\n' +
      '       --remove <email>            revoke access and delete the account'
  );
  process.exit(1);
}

if (password.length < 12) {
  console.error('Use a password of at least 12 characters. This unlocks every enquiry.');
  process.exit(1);
}

const existing = (await listUsers()).find((u) => u.email?.toLowerCase() === email.toLowerCase());

let userId = existing?.id;

if (existing) {
  console.log(`${email} already has an account; updating the password.`);
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(`Password update failed (${res.status}): ${await res.text()}`);
} else {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`Creating the account failed (${res.status}): ${await res.text()}`);
  userId = (await res.json()).id;
}

const already = await select(`admins?select=user_id&user_id=eq.${userId}`);
if (already.length === 0) await insert('admins', [{ user_id: userId, email }]);

console.log(`${email} can now sign in at /admin/.`);
