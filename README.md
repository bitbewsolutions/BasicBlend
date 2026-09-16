# BasicBlend — website

Marketing site for **Basic Blend**, a marketing and growth studio in Chandigarh.
Built with [Astro](https://astro.build) as a static site, for deployment to Netlify.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output into dist/
npm run preview  # serve the built site
```

Requires Node 22 (pinned in `netlify.toml`).

## Deploying

Netlify picks up `netlify.toml` (`npm run build` → publish `dist`). Nothing else to configure.

**Two things to do on the real domain:**

1. Set the domain in **two** places — `SITE_URL` in `src/data/site.ts` and `site` in
   `astro.config.mjs`. That value drives canonical URLs, Open Graph tags, the sitemap and the
   legal pages. Also update the `Sitemap:` line in `public/robots.txt`.
2. Enable **Netlify Forms** so the contact form receives submissions. The form is
   `name="enquiry"`, posts to `/thanks/`, and uses a `bot-field` honeypot. Netlify detects it from
   the built HTML automatically. If forms are ever unavailable the section still converts —
   WhatsApp, phone and email sit beside the form.

## Where things live

```
docs/          Read these first — the business reasoning and the design system
src/data/      ALL copy and facts. Edit content here, never in markup
src/styles/    tokens.css (every colour/space/type value) · global.css (base + primitives)
src/components/          shared UI; sections/ holds the home-only Hero and Blend
src/layouts/   Base.astro (head, meta, JSON-LD) · Legal.astro
src/pages/     index · about · contact · terms · privacy · thanks · 404
               services/index + services/[slug] (7 pages) · work/index + work/[slug] (3 pages)
src/assets/    images processed at build time into WebP (work/<case>/cover.jpg + gallery/)
public/        self-hosted fonts, videos + posters, favicon, OG image, _headers
```

- **`docs/brand-and-content-analysis.md`** — what the business is, who it sells to, what the
  source material actually proved, every conflict found and how it was resolved, and the open
  questions for the client.
- **`docs/website-architecture.md`** — creative direction, sitemap, section purposes, CTA strategy,
  motion plan, responsive rules, and the conventions to keep.

## Things to know before editing

- **Copy changes go in `src/data/*.ts`.** Markup reads from there.
- **No magic numbers.** Colour, spacing, type and easing all come from `src/styles/tokens.css`.
- **`.spec` is for short labels only** (~24 chars). Anything sentence-length uses `.meta` —
  letterspaced uppercase is hard to read at length. See the architecture doc.
- **Styling a child component from a parent's scoped `<style>` silently fails** unless that
  component spreads its rest props. `Bolt` takes a `size` prop for exactly this reason. The
  architecture doc explains it.
- **Add a service** by adding an entry to `src/data/services.ts`; its page, the nav lists, the
  footer and the form options all follow. **Add a case** by adding images under
  `src/assets/work/<slug>/` and an entry to `src/data/work.ts`.
- **No volume figures.** The catalogue is a curated selection, so post, film and client counts would
  undersell the business. No testimonials, team or performance figures were supplied, so none appear.

## Source material

The original client files (catalogue PDF, logo, business and contact details, legal copy, and three
production videos) are kept in the repository root. Derived, web-optimised versions live in
`src/assets/` and `public/media/`. The GST number in `business_20details.pdf.pdf` is deliberately
**not** published anywhere — that file states it must not be shown.
