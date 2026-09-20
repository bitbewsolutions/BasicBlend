# Admin panel

The client's own panel at **`/admin/`**: read the enquiries visitors send, and manage the work
shown on the site (projects, reels, logos) without a developer.

Built 20 Sep 2026. This replaces `admin-panel-plan.md`.

---

## 1. How it fits together

```
Visitor fills the form ─► Supabase `enquiries` ─┬─► /admin/ inbox (live, no refresh)
                                                └─► trigger ─► notify-enquiry ─► Resend ─► email
                                                                                   with a link
                                                                                   to that enquiry

Client edits work in /admin/ ─► Supabase tables + Storage
                                      │
                       "Publish site" ─► trigger-build ─► Netlify build hook
                                                                 │
                    Static site rebuilds, reading Supabase at BUILD time ◄┘
```

**The public site never talks to Supabase.** Work is read during the build and baked into HTML,
images are downloaded and re-encoded as WebP by Astro, and reel videos are copied into the build by
`scripts/sync-media.mjs` so they stream from Netlify. A Supabase outage cannot slow the site, break
it, or spend its bandwidth. The cost of that choice: **new work appears only after a publish**,
which takes about a minute.

The one exception is the contact form, which posts an enquiry directly to Supabase. If that fails
it falls back to Netlify Forms, so an enquiry is never lost.

## 2. Security

The panel is not "a page with a password". A static page cannot check a password, and the key the
browser holds is public by design, so anything protected only by page-level JavaScript is readable
by anyone who opens developer tools.

Instead, access is enforced by Postgres, row by row:

| Who | Can |
|---|---|
| Anyone (the public key) | Insert an enquiry. Read **published** projects, reels and logos — the same things the website shows |
| Anyone | **Cannot** read a single enquiry, draft, note or setting. Verified by test |
| A signed-in account **not** in `public.admins` | Nothing more than the public. Verified by test: reads return empty, writes change nothing |
| A signed-in admin | Everything |

`public.admins` is the real lock. Being signed in is not enough, so even if someone creates an
account in the Supabase project, they get nothing. Sign-up should still be switched off (§3).

Other decisions worth knowing:

- Enquiry text is written by strangers, so the panel builds every node with `textContent` and never
  `innerHTML`. Tested with an enquiry containing `<script>` and an `onerror` image: both display as
  plain text.
- A visitor cannot file an enquiry that arrives pre-marked "contacted" or carrying private notes.
- The Netlify build hook is a secret (anyone with it can trigger builds), so it lives in
  `app_config`, readable only by admins, and is used inside an Edge Function. `trigger-build`
  refuses any URL that is not a Netlify build hook.
- The panel loads no Google Analytics or Meta Pixel.

## 3. Setting it up

Most of this is done. What remains needs accounts or dashboards.

### Already done

- Schema, row-level security, storage bucket and triggers (`supabase/migrations/`, applied).
- Existing work migrated: 3 projects, 30 images, 3 reels, 3 logos.
- Edge Functions `notify-enquiry` and `trigger-build` deployed.
- The notification trigger is wired and verified end to end (it returns HTTP 200; it will send mail
  as soon as Resend is configured).

### Still to do

**a. Create the admin account** — there is none yet.

```bash
npm run admin:create -- someone@basicblend.in 'a-long-password'
npm run admin:create -- --list          # who has access
npm run admin:create -- --remove someone@basicblend.in
```

Send the password over something private, and have them change it in Settings → Your account.

**b. Netlify environment variables.** Site configuration → Environment variables. Without these the
build fails with a clear message rather than shipping a site with no work on it.

| Key | Value |
|---|---|
| `PUBLIC_SUPABASE_URL` | `https://buwzgqrqamhvswdlgszj.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | the publishable key (`sb_publishable_…`), Supabase → Project Settings → API keys |

**c. The build hook.** Netlify → Site configuration → Build & deploy → Build hooks → add one called
"Admin publish". Copy the URL into the panel: Settings → Netlify build hook URL → Save. Until this
is set, Publish says so instead of failing silently.

**d. Resend, for the notification email.**

1. Create the account and add the domain `basicblend.in`, then add the DNS records Resend gives you
   (they prove you own the domain; without this, mail from your own address is rejected or junked).
2. Create an API key.
3. Set the secrets:
   ```bash
   npx supabase secrets set RESEND_API_KEY=re_xxx \
     NOTIFY_FROM="BasicBlend <enquiries@basicblend.in>" \
     --project-ref buwzgqrqamhvswdlgszj
   ```
4. In the panel: Settings → "Send new enquiries to" → the address that should receive them → Save.

Until step 3 is done, enquiries are still saved and still appear in the inbox; only the email is
skipped (it is logged as skipped, not failed).

**e. Turn off public sign-up.** Supabase dashboard → Authentication → Sign In / Providers → disable
"Allow new users to sign up". The allowlist already makes a stray account powerless; this stops the
accounts being created at all.

## 4. Using it

- **Enquiries.** Filter by New / Contacted / Closed / Spam, search across name, phone and message.
  Opening one shows the message in full with WhatsApp, call and email buttons. Status and private
  notes save where they are. New enquiries appear while the panel is open.
- **Projects.** Text saves on Save; images save the moment they finish uploading (the editor says
  so). A project needs a cover image before it can be published. Ordering is set with the arrows.
- **Reels.** Upload an MP4 and the poster frame is captured automatically; replace it if another
  frame sells it better. A reel can be attached to a project so it also shows on that case page.
- **Logos.** Edited in place in the list.
- **Publish.** The bar shows "Unpublished changes" whenever content has changed since the last
  publish. Pressing Publish rebuilds the site; Settings keeps a log of recent publishes.

Every image asks for a description. That is not bureaucracy: it is what a screen reader announces,
and Google reads it too.

## 5. Where the code is

```
src/pages/admin/index.astro     page shell and sign-in form (noindex, robots-disallowed)
src/scripts/admin/              client.ts · ui.ts · media.ts · enquiries.ts · projects.ts ·
                                reels.ts · identities.ts · settings.ts · main.ts
src/styles/admin.css            the panel's own design tokens and components
src/lib/content.ts              build-time reader: Supabase → the public pages
src/components/Pic.astro        renders local and Supabase images through one pipeline
scripts/                        seed-content · create-admin · setup-notifications · sync-media
supabase/migrations/            schema, policies, storage, notification trigger
supabase/functions/             notify-enquiry (Resend) · trigger-build (Netlify)
```

## 6. If something goes wrong

| Symptom | Cause and fix |
|---|---|
| Build fails: "PUBLIC_SUPABASE_URL … must be set" | The Netlify variables in §3b are missing |
| Publish says "No build hook saved yet" | §3c |
| Enquiries arrive but no email | `RESEND_API_KEY` not set, the domain is not verified in Resend, or no recipient in Settings. Check delivery attempts with the `notification_health()` function |
| "That account is not an admin of this site" | The account exists but is not in `public.admins`; add it with `npm run admin:create` |
| A published project does not appear on the site | It has no cover image, or nobody pressed Publish |

## 7. Scope, deliberately

The panel manages **work content and enquiries**, not page copy. Service pages, the home page and
the about page stay in code, where the SEO work is reviewed before it goes live. The structure is
ready for more: a new content type is a table, a policy, and one module in `src/scripts/admin/`.
