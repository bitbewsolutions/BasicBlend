# BasicBlend — Website Architecture

Companion to `brand-and-content-analysis.md`. Read that first for the business reasoning; this
document covers structure, design system and implementation rules.

**Revision 2 (14 Sep 2026).** The site moved from one long page to a multi-page site at the client's
request, the palette moved to the client's stated brand colours (black, purple, orange), the
positioning was widened to businesses of every kind and stage, and all volume figures were removed.
What changed and why is recorded in §9.

**Revision 4 (20 Sep 2026).** The work content moved out of the repo into Supabase, managed by the
client at `/admin/`, and read at build time. The site is still fully static. See
`admin-panel.md`; §9b records what changed.

**Revision 3 (18 Sep 2026).** Five services added (graphic design, reels & video editing, product
shoots, UGC, AI video), services grouped, footer restructured, SEO and ad tracking added. See §9a.

---

## 1. Sitemap

```
/                                      Home — a summary with exits to every section
/services/                             All services, grouped, who they suit, the process
/services/branding-design/             ┐  Brand & web
/services/graphic-design/              │
/services/websites-platforms/          │
/services/social-media-management/     │  Growth marketing
/services/paid-ads-lead-generation/    │    One page per service, generated from
/services/influencer-marketing/        │    src/data/services.ts
/services/google-business-profile/     │
/services/reels-video-editing/         │  Content & video
/services/product-shoots/              │
/services/ugc-content-creation/        │
/services/ai-video-creation/           ┘
/work/                                 Case studies, films, identities
/work/maa-sharda/                      ┐
/work/navata/                          │  One page per case, generated from src/data/work.ts
/work/maa-banbhori/                    ┘
/about/                                Mission, vision, who we work with, why us, process, studio
/contact/                              Form, direct channels, what happens next
/terms/  /privacy/                     Legal (supplied copy)
/thanks/                               Form confirmation — noindex, excluded from sitemap
/404                                   Not found — noindex
```

23 pages. Every URL ends in a slash (`trailingSlash: 'always'`), and canonical tags, internal links
and the sitemap all agree on it.

**Why separate service pages.** Each is a real landing page for a search someone actually makes
("website development Chandigarh", "Meta ads agency Chandigarh") and gives the ads team a
specific page to send traffic to. Each page is generated from one data entry, so adding a service
is a data change, not a design job.

**Why separate case pages.** The supplied work is image-rich: a campaign grid, individual
creatives, and in two cases films or presentation layouts. A dedicated page lets that work be
seen at a useful size instead of crammed into a homepage section.

---

## 2. What each page is for

### Home — deliberately a summary

The first build put everything on the home page (13,100px). It is now ~9,000px, because each
section gives just enough to decide and then hands off:

| Section | Job | Hands off to |
|---|---|---|
| Hero | Tagline, what we do, both CTAs, four service shortcuts | `/contact/`, `/work/`, service pages |
| The Blend *(showpiece)* | Raw footage → delivered campaign, scroll-scrubbed | — |
| Who we work with | Four audiences: starting out, growing, product & trade, software & services | — |
| Services | Full-row links in three groups | each service page, `/services/` |
| Selected work | Three image-led case cards | each case page, `/work/` |
| Filmstrip | Real creatives in motion | — |
| Process | Four steps | `/about/` |
| CTA band | Close | `/contact/`, WhatsApp |

**Moved off the home page:** the full service detail (→ service pages), case studies at length
(→ case pages), production films and identity work (→ `/work/`), "Why BasicBlend" (→ `/about/`),
the enquiry form (→ `/contact/`).

### Service page template
Hero (title, intro, CTA with the service preselected in the form) → what's included + "a good fit
for" → **proof, only where real work exists** → how it runs → other services → CTA band.

| Service | Proof shown |
|---|---|
| Branding & logo design | The three identity deliverables |
| Graphic design · Social media management | Related case studies (all three) |
| Performance marketing & ads · Product shoots | Related case study (one, shown at card size) |
| Reels & video editing | The three production films |
| Websites · Influencer marketing · Google Business Profile · UGC · AI video | None — no such work was supplied, so none is implied |

### Work
`/work/` lists the three cases as alternating image-and-text plates, then films, then identities.
Each case page: hero with its spec plate → the full campaign grid → what we did (and links to the
services used) → a horizontal strip of individual creatives → campaign layout or films where they
exist → next case → CTA.

### About
Mission and vision (from the catalogue, rewritten) → who we work with → why BasicBlend → process →
the studio address. No team, headcount or founding year: none were supplied.

### Contact
Form beside direct channels (WhatsApp, phone, email, social, address) → what happens next.
Arriving from a service page (`/contact/?service=slug`) preselects that service.

### Sections deliberately absent everywhere
Testimonials, statistics bands, team, "trusted by" logo walls, FAQ, blog. Each would have required
invented content.

---

## 3. Design system

### Palette — black, purple, orange

| Token | Value | Role |
|---|---|---|
| `--stock` | `#000000` | Primary ground (from the logo) |
| `--plum` | `#1E1623` | Dark purple sections (catalogue cover ground) |
| `--purple` | `#A26AC4` | Purple blocks: CTA band, hero slab, surfaces (catalogue) |
| `--orange` | `#EB7A2E` | Actions and energy: buttons, bolt, links, focus, progress (catalogue "B" mark `#D3721E`, lifted for screen) |
| `--cream` | `#F1EBE0` | Primary ink (from the logo) |
| `--paper` | `#F1EBE0` | Light sections |
| `--orange-ink` / `--purple-ink` | `#9A4A0E` / `#6B3F8F` | The accents when used as text on paper |

**Roles are strict:**

- **Orange is for action.** If it is orange, it does something.
- **Purple is a surface, never small text on dark.** Light violet type on black is a stock
  generated-site look (the anti-pattern detector flags it). Purple shows up as the CTA band, the
  plum sections, the slab behind the hero's second line — the same treatment as page 2 of the
  client's catalogue — rules and hover washes.
- **On `--purple`, only near-black ink passes contrast** (5.0:1; cream is 3.3:1). Buttons on
  purple are black.

Checked pairings: orange on black 7.4:1 · black on orange 7.4:1 · orange-ink on paper 5.3:1 ·
purple-ink on paper 6.5:1 · ink on purple 5.0:1 · cream on plum 14.8:1 · cream-faint on plum 4.8:1.

### Typography
**Tanker** (display, caps) · **Supreme** (body) · **Martian Mono** (labels). Self-hosted `woff2`,
~99 KB total. Tanker was chosen by rendering candidates against the logo and catalogue headings.

### Signatures
1. **The plate frame** — 1px rule with a chamfered corner, from the logo's frame.
2. **Spec labels** — mono micro-caps. **Labels only, ~24 characters.** Anything sentence-length
   uses `.meta`. Spec-plate *values* are set in the body face so they stay readable.
3. **The bolt** — orange; list marker, link mark, divider, progress bar.

### Rules the anti-pattern review enforced
No kicker/eyebrow above headings · no decorative numbering (only the process steps, which are
genuinely ordinal) · no light-violet text on dark · no gradient text · no glow shadows · no nested
cards · client creatives shown untreated.

---

## 4. Conversion

**Primary action: start a project** → `/contact/`. In the nav on every page, in every hero, and in
the purple CTA band that closes every page. **WhatsApp** sits beside it everywhere as a first-class
alternative (the client's contact document names it as a preferred channel); its prefilled message
says which page the visitor came from.

**Secondary:** "See our work" from the home hero; service shortcuts; case → service links, so a
visitor impressed by a case can go straight to the matching service.

---

## 5. Content rules

- Facts come from the supplied documents; all prose is rewritten for the web.
- **No volume figures.** The catalogue is a curated selection; the real totals are far higher, so
  post counts, film counts and client counts would undersell the business. Spec rows describe the
  *kind* of work ("Social campaigns"), never how much.
- **Inclusive positioning.** BasicBlend works with startups, growing and established businesses,
  product and service companies, SaaS. The portfolio happens to be product-heavy; the copy does
  not narrow the audience to match it.
- No invented proof: no testimonials, results, awards, team or years in business.
- Case copy describes the work, never a named client's past shortcomings.
- Plain punctuation. Em-dashes were cut back hard in review.
- All copy lives in `src/data/*.ts` or the page file — never inside shared components.

---

## 6. Motion

Register: Persuade. Structural, not decorative.

| Where | Motion |
|---|---|
| All pages | Headings stamp in; content reveals once on entry; rules draw; orange scroll-progress line; 220ms cross-fade between pages (CSS `@view-transition`, zero JS) |
| Home | **Showpiece**: pinned 200vh section, scroll scrubs raw → delivered; filmstrip marquee |
| Service rows | Plum wash slides up behind the row on hover; arrow travels |
| Case cards | Image eases in scale on hover; client name turns orange |
| Case images | Top-down wipe on entry |

**Reliability rules — both learned from real bugs:**

1. **Never clip the observed element itself.** The first build put `clip-path: inset(0 0 100% 0)`
   on the case figures. A fully clipped element has no visible area, so `IntersectionObserver` never
   fired and the images never appeared — while the reduced-motion screenshots used for review
   showed them fine. The wipe now clips the *child*; the parent is observed.
2. **Hidden start states only apply under `html.js`**, set by an inline script in `<head>`. If JS
   fails, content is simply visible. The observer uses `threshold: 0` (a tall element can never
   reach a ratio like 0.08).

`prefers-reduced-motion` disables all of it: reveals resolve instantly, the marquee stops, the
showpiece un-pins, videos do not autoplay, page cross-fades are off.

---

## 7. Responsive

Content-driven breakpoints: 560 / 760 / 860 / 1024 / 1100 / 1180px. Verified at 320, 390, 768, 834,
1024, 1366, 1440, 1920 and 2560px plus phone landscape — no horizontal overflow on any page at any
width, and the home page's primary CTA above the fold at all of them.

- Nav: inline links from 1024px; the menu toggle survives until then (an earlier build left
  760–1024px with no navigation at all). The menu panel is a sibling of the header because the
  header's `backdrop-filter` would otherwise become its containing block.
- Home hero headline uses `--t-mega` in one column and `--t-mega-wide` beside the film.
- Showpiece: pinned on desktop; stacked with a drag slider on mobile, no dimming.
- Films, creative strips and the filmstrip scroll horizontally, contained.
- Phone landscape: the hero drops the film and shortcuts; the nav stays sticky but shorter.

---

## 8. Accessibility, SEO, performance

**Accessibility.** One `h1` per page and no skipped heading levels on any of the 23 pages; every
image has alt text; every input is labelled; focus-trapped mobile menu with Esc and focus return;
visible orange focus ring; breadcrumbs with `aria-current`; video sound is opt-in with a real
toggle.

**SEO.** Unique title and description per page; trailing-slash canonicals; Open Graph image;
`LocalBusiness` JSON-LD site-wide, `Service` JSON-LD on service pages, `BreadcrumbList` on every
inner page; sitemap excluding `/thanks/`; `noindex` on `/thanks/` and 404.

**Performance** (home, local preview, 1440×900): 9 requests / 112 KB before `load`, `load` at 84ms,
no video on the critical path (hero film starts on idle after `load`), zero separate JS bundles,
CLS 0. Images are WebP at explicit sizes; videos attach their source only near the viewport.

---

## 9. Revision 2 — what changed and why

| Change | Reason |
|---|---|
| One page → 19 pages | Client requirement. Home became a summary with exits |
| Palette → black / purple / orange | The client's stated brand colours, sampled from the catalogue |
| Lilac labels → cream; purple as surface only | Light violet text on black is a generated-site tell |
| Hero headline → the tagline, with a purple slab | The client's own words and catalogue treatment |
| "Marketing for people who make things" → businesses of every kind | Client clarification: startups, SaaS and service businesses too. The catalogue itself says "startup or established brand" — the first build over-read the portfolio |
| All volume figures removed | The catalogue is a curated best-of; real totals are much higher |
| Case images fixed | The wipe reveal clipped the observed element (see §6) |
| Behind-the-scenes film trimmed | Its first 1.35s was a black title card |
| Invented claims removed | "We usually reply the same working day", "product shoots for every SKU", and descriptions of named clients' prior problems |

---

## 9a. Revision 3 — what changed and why

| Change | Reason |
|---|---|
| Content & production split into Reels & video editing, Product shoots, UGC content creation, AI video creation; Graphic design split out of Branding | Client's service list. Each is now its own landing page for its own searches. `/services/content-production/` 301s to reels (`public/_redirects`) |
| Services carry a `group`; lists, footer and the form's dropdown are grouped | Eleven flat rows were a wall |
| Footer: each block starts on a strong rule under a display-face heading; services moved to their own grouped band | Client found the sections hard to tell apart |
| Home hero film hidden below 1024px | In one column it fell below the service links as a lone reel; The Blend directly below already leads with footage |
| "Basic Blend" (with a space) in titles, lead copy, `alternateName`, and a `WebSite` schema on the home page | Google treats "basicblend" and "basic blend" as different queries |
| Keyword research worked into titles (`seoTitle`), intros and items; `keywords` per service | Client's Google Keyword Planner list. Phrases used only where they read naturally |
| GA4 + Meta Pixel (production builds only), `contact` / `Contact` on WhatsApp/phone/email taps, `generate_lead` / `Lead` on `/thanks/` | Client-supplied tags; conversion events let Google and Meta ads optimise for enquiries. Privacy policy §6 updated to disclose both |
| `/sitemap.xml` → `/sitemap-index.xml` | Tools that only look at the conventional path |

---

## 9b. Revision 4 — the admin panel

| Change | Reason |
|---|---|
| Projects, reels and identities moved from `src/data/work.ts` to Supabase; `src/lib/content.ts` reads them at build time | The client asked to manage his own work. Reading at build time keeps every page static, indexable and independent of Supabase at runtime |
| New `/admin/` page (own layout, noindex, robots-disallowed, no analytics) | The client's workspace is not a marketing surface, and his customers' enquiries are not marketing data |
| Real authentication (Supabase Auth + a `public.admins` allowlist enforced by row-level security) rather than a shared page password | A static page cannot check a password; the data would have been readable by anyone with developer tools. Signing in is not sufficient either — the allowlist is the lock |
| `Pic.astro` renders both local `ImageMetadata` and remote Supabase images | Remote work images still go through Astro's pipeline and ship as sized WebP from our own domain |
| Reel videos copied into the build by `scripts/sync-media.mjs` | Keeps playback on Netlify's CDN instead of spending Supabase egress on every autoplay |
| Contact form posts to Supabase, falling back to Netlify Forms | The client needs an inbox; the fallback means a failure never costs an enquiry |
| Enquiry insert → Postgres trigger → `notify-enquiry` → Resend email with a deep link into the panel | He wanted to hear about enquiries without watching a dashboard |
| Publish button → `trigger-build` → Netlify build hook | New work needs a rebuild; the hook is a secret, so it is used server-side and never sent to the browser |

---

## 10. Code organisation

```
src/data/        site.ts (facts, tracking IDs, keywords) · services.ts (11 services in 3 groups, audiences, process, reasons) · work.ts (cases, films, identities)
src/layouts/     Base.astro (head, SEO, JSON-LD, reveal script) · Legal.astro
src/components/  Nav · Footer · PageHero · Breadcrumbs · SectionHead · CtaBand · ServiceIndex ·
                 AudienceGrid · ProcessSteps · CaseCard · CasePlate · SpecPlate · CreativeStrip ·
                 Filmstrip · FilmRow · IdentityGrid · ContactForm · DirectChannels · Bolt
src/components/sections/   Hero · Blend (home only)
src/pages/       index · about · contact · terms · privacy · thanks · 404
                 services/index · services/[slug] · work/index · work/[slug]
src/assets/work/ <case>/cover.jpg · <case>/gallery/*.jpg · identity/*.jpg
```

**Adding a service:** add an entry to `services` in `src/data/services.ts`. The page, nav lists,
footer, form options and sitemap all follow.
**Adding a case:** create `src/assets/work/<slug>/cover.jpg` and `gallery/`, then add an entry to
`caseStudies` in `src/data/work.ts`.

**Astro gotcha.** Scoped styles do not reach a child component's root element unless that
component spreads its rest props. `Bolt` spreads them and takes a `size` prop for this reason.
Prefer props over parent-scoped rules when styling a child component.
