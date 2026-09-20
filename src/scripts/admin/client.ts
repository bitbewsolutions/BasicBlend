/**
 * The admin panel's Supabase connection.
 *
 * This key is the publishable one, the same key the public site is built with,
 * and it is safe in the browser: on its own it can read published work and file
 * an enquiry, nothing else. Everything in this panel works only because the
 * signed-in user is listed in public.admins, which row-level security checks on
 * every single query. The key is not the lock.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Own key so a signed-in admin session never collides with anything else
    // stored for this origin.
    storageKey: 'basicblend-admin',
  },
});

export const STORAGE_BUCKET = 'work';

/** Public URL of a file in the work bucket. */
export function publicUrl(path: string): string {
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Postgres and storage errors arrive in several shapes. Turn any of them into
 * one line a person can act on, and keep the raw error in the console.
 */
export function readableError(error: unknown): string {
  const e = error as { message?: string; code?: string; error?: string } | null;
  const message = e?.message ?? e?.error ?? 'Something went wrong.';
  console.error(error);

  if (e?.code === '23505') return 'That slug is already used by another project.';
  if (e?.code === '23514') return 'One of the fields is too long or empty.';
  if (e?.code === '42501' || /row-level security/i.test(message))
    return 'This account is not allowed to make that change.';
  if (/Failed to fetch|NetworkError/i.test(message))
    return 'No connection. Check your internet and try again.';
  if (/Invalid login credentials/i.test(message)) return 'That email and password do not match.';
  if (/Payload too large|exceeded the maximum/i.test(message))
    return 'That file is too large. The limit is 50 MB.';
  return message;
}
