/**
 * Emails the studio when a new enquiry arrives, with a button that opens it in
 * the admin panel.
 *
 * Called by a Postgres webhook on INSERT into public.enquiries (set up in
 * Supabase Studio → Database → Webhooks). A webhook rather than a call from the
 * browser, so the email is sent even if the visitor closes the tab the instant
 * they submit.
 *
 * Secrets (supabase secrets set …):
 *   RESEND_API_KEY   from resend.com
 *   NOTIFY_FROM      e.g. "BasicBlend site <enquiries@basicblend.in>" — the
 *                    domain must be verified in Resend
 *   NOTIFY_TO        fallback recipient; app_config.notify_email wins if set
 *   WEBHOOK_SECRET   shared with the webhook's x-webhook-secret header
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const NOTIFY_FROM = Deno.env.get('NOTIFY_FROM') ?? 'BasicBlend <onboarding@resend.dev>';
const NOTIFY_TO = Deno.env.get('NOTIFY_TO');
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Enquiry {
  id: string;
  name: string;
  business: string | null;
  phone: string;
  email: string | null;
  need: string | null;
  message: string;
  source_path: string | null;
  created_at: string;
}

/** Escape anything that came from a stranger before it goes into HTML email. */
function esc(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function config(): Promise<Record<string, string>> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/app_config?select=key,value`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) return {};
  const rows = (await res.json()) as { key: string; value: string | null }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? '']));
}

function emailHtml(row: Enquiry, adminUrl: string): string {
  const waNumber = row.phone.replace(/\D/g, '').replace(/^0+/, '');
  const wa = `https://wa.me/${waNumber.length === 10 ? '91' + waNumber : waNumber}`;
  const line = (label: string, value: string) =>
    `<tr><td style="padding:4px 16px 4px 0;color:#8d857c;font-size:13px">${label}</td>
         <td style="padding:4px 0;color:#f1ebe0;font-size:14px">${value}</td></tr>`;

  return `<!doctype html>
<html><body style="margin:0;background:#08070b;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#08070b;padding:24px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:560px;background:#110e16;border:1px solid rgba(241,235,224,.13);border-radius:6px;padding:24px">
        <tr><td style="color:#eb7a2e;font-size:12px;letter-spacing:.12em;text-transform:uppercase;padding-bottom:8px">
          New enquiry
        </td></tr>
        <tr><td style="color:#f1ebe0;font-size:22px;font-weight:700;padding-bottom:2px">${esc(row.name)}</td></tr>
        ${row.business ? `<tr><td style="color:#b9b0a5;font-size:15px;padding-bottom:16px">${esc(row.business)}</td></tr>` : '<tr><td style="height:16px"></td></tr>'}
        <tr><td>
          <div style="background:#08070b;border:1px solid rgba(241,235,224,.13);border-radius:4px;padding:16px;color:#f1ebe0;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(row.message)}</div>
        </td></tr>
        <tr><td style="padding-top:16px">
          <table role="presentation" cellpadding="0" cellspacing="0">
            ${line('Phone', `<a href="tel:${esc(row.phone)}" style="color:#f1ebe0">${esc(row.phone)}</a>`)}
            ${row.email ? line('Email', `<a href="mailto:${esc(row.email)}" style="color:#f1ebe0">${esc(row.email)}</a>`) : ''}
            ${row.need ? line('Wants', esc(row.need)) : ''}
            ${row.source_path ? line('From page', esc(row.source_path)) : ''}
          </table>
        </td></tr>
        <tr><td style="padding-top:24px">
          <a href="${esc(adminUrl)}#/enquiries/${esc(row.id)}"
             style="display:inline-block;background:#eb7a2e;color:#14100c;font-weight:700;font-size:15px;
                    text-decoration:none;padding:12px 20px;border-radius:4px">Open in admin panel</a>
          <a href="${wa}" style="display:inline-block;color:#b9b0a5;font-size:14px;text-decoration:none;padding:12px 16px">
            Reply on WhatsApp
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  // The webhook is the only caller. Without the shared secret this endpoint
  // would let anyone on the internet send mail from the studio's domain.
  if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }

  let row: Enquiry;
  try {
    const body = await req.json();
    row = (body.record ?? body) as Enquiry;
    if (!row?.name || !row?.message) throw new Error('no enquiry in payload');
  } catch (error) {
    return new Response(`Bad payload: ${error}`, { status: 400 });
  }

  const settings = await config();
  const to = settings.notify_email || NOTIFY_TO;
  const adminUrl = settings.admin_url || 'https://www.basicblend.in/admin/';

  if (!RESEND_API_KEY || !to) {
    // Not configured yet. The enquiry is safe in the database either way, so
    // this is a warning in the logs, not a failure the visitor could notice.
    console.warn('Skipping notification: RESEND_API_KEY or a recipient is missing.');
    return new Response(JSON.stringify({ ok: true, sent: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: to.split(',').map((address) => address.trim()),
      subject: `New enquiry: ${row.name}${row.business ? ` (${row.business})` : ''}`,
      html: emailHtml(row, adminUrl),
      // Replying to the email reaches the customer directly where possible.
      reply_to: row.email || undefined,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('Resend rejected the email:', detail);
    return new Response(JSON.stringify({ ok: false, error: detail }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, sent: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
