# BasicBlend — website

Marketing site for **Basic Blend**, a marketing and growth studio in Chandigarh.
Built with [Astro](https://astro.build) as a static site, for deployment to Netlify.

## Run it

```bash
npm install
cp .env.example .env   # then fill in the Supabase values (see docs/admin-panel.md)
npm run dev      # http://localhost:4321
npm run build    # static output into dist/
npm run preview  # serve the built site
```

Requires Node 22 (pinned in `netlify.toml`).

**The build needs Supabase credentials.** Work content (projects, reels, logos) lives in Supabase
and is read at build time; without `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` the build
stops with a clear error rather than publishing a site with no work on it. `.env` is git-ignored.

```bash
npm run build          # sync reel videos, then build
npm run admin:create -- me@basicblend.in 'a-long-password'   # grant admin access
npm run seed -- --force                                       # re-import work from code (rare)
```

## Deploying

Live at **https://www.basicblend.in** on Netlify. Netlify picks up `netlify.toml`
(`npm run build` → publish `dist`); every push to the connected branch deploys.

**Domain.** `www.basicblend.in` is the primary domain. The bare `basicblend.in` 301s to it (Netlify
domain settings), and `basicblend.netlify.app` 301s to it too (`public/_redirects`), so search engines
only ever see one copy. If the domain ever changes, update it in **three** places: `SITE_URL` in
`src/data/site.ts`, `site` in `astro.config.mjs`, and the `Sitemap:` line in `public/robots.txt`. That
value drives canonical URLs, Open Graph tags, the sitemap and the legal pages.

**Sitemap.** `https://www.basicblend.in/sitemap-index.xml` (also served at `/sitemap.xml`), generated
on every build. A browser shows it as a bare XML tree with a "no style information" notice; that
is normal. Submit the index URL to Google Search Console and give it to Google Ads if asked.

**Still to do in dashboards (not code):**

1. **Google Search Console**: add `https://www.basicblend.in`, verify it (paste the HTML-tag token
   into `tracking.googleSiteVerification` in `src/data/site.ts`, or verify by DNS), then submit the
   sitemap.
2. **Netlify Forms** must be enabled so the contact form receives submissions. The form is
   `name="enquiry"`, posts to `/thanks/`, and uses a `bot-field` honeypot. Netlify detects it from
   the built HTML automatically. If forms are ever unavailable the section still converts:
   WhatsApp, phone and email sit beside the form.

## Where things live

```
docs/          Read these first — the business reasoning and the design system
src/data/      Page copy, services, business facts. Edit copy here, never in markup
src/lib/       content.ts — reads the work (projects/reels/logos) from Supabase at build time
src/scripts/   admin/ — the client's admin panel app
scripts/       one-off and build scripts (seeding, admin users, media sync)
supabase/      migrations (schema + row-level security) and Edge Functions
src/styles/    tokens.css (every colour/space/type value) · global.css (base + primitives)
src/components/          shared UI; sections/ holds the home-only Hero and Blend
src/layouts/   Base.astro (head, meta, JSON-LD) · Legal.astro
src/pages/     index · about · contact · terms · privacy · thanks · 404
               services/index + services/[slug] (11 pages) · work/index + work/[slug] (3 pages)
src/assets/    images processed at build time into WebP (work/<case>/cover.jpg + gallery/)
public/        self-hosted fonts, videos + posters, favicon, OG image, _headers, _redirects, brand/
```

- **`docs/brand-and-content-analysis.md`** — what the business is, who it sells to, what the
  source material actually proved, every conflict found and how it was resolved, and the open
  questions for the client.
- **`docs/website-architecture.md`** — creative direction, sitemap, section purposes, CTA strategy,
  motion plan, responsive rules, and the conventions to keep.
- **`docs/admin-panel.md`** — the client's admin panel: how it works, how it is secured, what is
  still to set up, and how to use it.

## Things to know before editing

- **Copy changes go in `src/data/*.ts`.** Markup reads from there.
- **No magic numbers.** Colour, spacing, type and easing all come from `src/styles/tokens.css`.
- **`.spec` is for short labels only** (~24 chars). Anything sentence-length uses `.meta` —
  letterspaced uppercase is hard to read at length. See the architecture doc.
- **Styling a child component from a parent's scoped `<style>` silently fails** unless that
  component spreads its rest props. `Bolt` takes a `size` prop for exactly this reason. The
  architecture doc explains it.
- **Add a service** by adding an entry to `src/data/services.ts` (with its `group`); its page, the
  grouped lists, the footer and the form options all follow.
- **Work content is not in the repo any more.** Projects, reels and logos are managed by the client
  at `/admin/` and read from Supabase at build time. See **`docs/admin-panel.md`** — it covers the
  security model, the remaining setup steps (Netlify variables, build hook, Resend) and how to run
  the panel. New work goes live only when someone presses Publish, which rebuilds the site.
- **Footer credit.** `BuiltByBitbew.astro` is the last line of the footer. Its WhatsApp link is
  marked `data-no-track` so taps on it are never reported as the client's leads.
- **Analytics.** Google Analytics 4 and the Meta Pixel load from `Base.astro`, in production builds
  only; IDs live in `tracking` in `src/data/site.ts`. Enquiries (`/thanks/`) and WhatsApp/phone/email
  taps are sent as conversion events. **Add a case** by adding images under
  `src/assets/work/<slug>/` and an entry to `src/data/work.ts`.
- **No volume figures.** The catalogue is a curated selection, so post, film and client counts would
  undersell the business. No testimonials, team or performance figures were supplied, so none appear.

## Source material

The original client files (catalogue PDF, logo, business and contact details, legal copy, and three
production videos) are kept in the repository root. Derived, web-optimised versions live in
`src/assets/` and `public/media/`. The GST number in `business_20details.pdf.pdf` is deliberately
**not** published anywhere — that file states it must not be shown.
