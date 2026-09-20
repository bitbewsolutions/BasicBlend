/**
 * One-time migration: move the work that shipped in the code into Supabase, so
 * the client can manage it from /admin/.
 *
 * Uploads every image and film from src/assets and public/media into the `work`
 * bucket, then writes the matching projects, media, reels and identities rows.
 * The copy below is the copy that was already live — this moves it, it does not
 * rewrite it.
 *
 *   node --env-file=.env scripts/seed-content.mjs            # refuses if content exists
 *   node --env-file=.env scripts/seed-content.mjs --force    # wipes content first
 *
 * --force deletes every project, reel, identity and stored file. It never
 * touches enquiries.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { select, insert, remove, upload, listObjects, removeObjects } from './lib/supa.mjs';

const force = process.argv.includes('--force');
const ASSETS = 'src/assets/work';
const MEDIA = 'public/media';

/** The three case studies, exactly as they read in src/data/work.ts today. */
const projects = [
  {
    slug: 'maa-sharda',
    client: 'Maa Sharda Industries',
    sub_brand: 'Orwo Flame',
    sector: 'Kitchen chimneys',
    teaser: 'Social campaigns for a chimney maker and its Orwo Flame range.',
    overview:
      'Social content for a kitchen chimney manufacturer and its Orwo Flame range: product features made easy to understand, everyday kitchen moments, and seasonal posts. Everything is written in English and Hinglish, with both brands kept distinct.',
    scope: [
      'Campaign creative across two brands',
      'Product-feature posts built on clear claims',
      'Hinglish headline writing',
      'Seasonal and day-based content',
      'Campaign presentation layouts',
    ],
    spec: [
      { label: 'Sector', value: 'Home appliances' },
      { label: 'Brands', value: 'Maa Sharda / Orwo Flame' },
      { label: 'Work', value: 'Social campaigns' },
      { label: 'Languages', value: 'English / Hinglish' },
    ],
    services: ['social-media-management', 'graphic-design'],
    coverAlt:
      'Grid of social media posts designed for Maa Sharda Industries and its Orwo Flame chimney range, mixing product features, Hinglish headlines and a World Water Day post.',
    feature: {
      file: 'campaign.jpg',
      alt: 'Campaign layout for Maa Sharda Industries titled "From hype to happening", pairing a hero chimney creative with supporting posts.',
      caption: 'Campaign presentation: "From hype to happening"',
    },
  },
  {
    slug: 'navata',
    client: 'Navata Appliances',
    sub_brand: null,
    sector: 'Kitchen appliances',
    teaser: 'Food-led social content and product films for an appliance range.',
    overview:
      'Social content and product films for a range of kitchen appliances: mixer grinders, blenders, sandwich makers and cookers. The work is art-directed around food so the products look appetising rather than merely listed, with copy in English, Hinglish and Hindi.',
    scope: [
      'Campaign creative across the product range',
      'Product films',
      'Food-led art direction and styling',
      'Copy in English, Hinglish and Hindi',
      'Product photography',
    ],
    spec: [
      { label: 'Sector', value: 'Home appliances' },
      { label: 'Work', value: 'Social + product films' },
      { label: 'Languages', value: 'EN / Hinglish / HI' },
      { label: 'Style', value: 'Food-led' },
    ],
    services: [
      'social-media-management',
      'graphic-design',
      'product-shoots',
      'reels-video-editing',
    ],
    coverAlt:
      'Grid of social media posts designed for Navata Appliances, featuring mixer grinders, hand blenders, sandwich makers and pressure cookers with bilingual headlines.',
    feature: null,
  },
  {
    slug: 'maa-banbhori',
    client: 'Maa Banbhori Plastic Works',
    sub_brand: null,
    sector: 'Packaging',
    teaser: 'Business-to-business social content for a packaging manufacturer.',
    overview:
      'Social content for a manufacturer of packaging pouches and printed packaging, speaking to other businesses: category posts from garbage bags to multicolour pouches, direct-response posts with a clear call to action, and relatable formats for reach.',
    scope: [
      'Campaign creative for a business audience',
      'Category-led product posts',
      'Direct-response posts with a call to action',
      'Relatable formats for reach',
    ],
    spec: [
      { label: 'Sector', value: 'Packaging / B2B' },
      { label: 'Work', value: 'Social campaigns' },
      { label: 'Audience', value: 'Businesses' },
      { label: 'Style', value: 'Direct response' },
    ],
    services: ['social-media-management', 'graphic-design', 'paid-ads-lead-generation'],
    coverAlt:
      'Grid of social media posts designed for Maa Banbhori Plastic Works, covering garbage bags, printed packaging pouches and business-to-business call-to-action posts.',
    feature: null,
  },
];

const reels = [
  {
    key: 'bts-production',
    label: 'Behind the scenes',
    client: 'On set with BasicBlend',
    note: 'Scripting, a factory floor and a kitchen ad shoot.',
    alt: 'Behind-the-scenes film of a BasicBlend shoot: scripting, a laser cutter on a factory floor, and an ad shoot in a kitchen.',
    project: null,
  },
  {
    key: 'navata-bullet-blender',
    label: 'Product film',
    client: 'Navata Appliances',
    note: 'The Bullet Blender, shot and cut by our team.',
    alt: 'Product film for the Navata Bullet Blender showing fruit and vegetable drinks being blended and poured.',
    project: 'navata',
  },
  {
    key: 'navata-product-films',
    label: 'Product film',
    client: 'Navata Appliances',
    note: 'From the manufacturing line to the finished product.',
    alt: 'Product film for Navata Appliances intercutting the manufacturing line with finished appliances.',
    project: 'navata',
  },
];

const identities = [
  {
    file: 'dmtraders-logo.jpg',
    client: 'DM Traders',
    sector: "Women's garments, wholesale",
    alt: 'Logo designed for DM Traders, a womenswear wholesaler: a monogram with an illustrated figure in a flowing gown, framed by a botanical arc.',
  },
  {
    file: 'rsmarketing-logo.jpg',
    client: 'RS Marketing',
    sector: 'Hardware and modular kitchens',
    alt: 'Logo designed for RS Marketing, a hardware and modular kitchen distributor: a gold linework monogram with a floral motif.',
  },
  {
    file: 'elitebuild-logo.jpg',
    client: 'Elite Build Studio',
    sector: 'Hardware, sanitary and paints',
    alt: 'Logo designed for Elite Build Studio, a hardware, sanitary and paints business: a gold crest with a roofline, hammer, brush and tap.',
  },
];

async function putImage(localPath, storagePath) {
  const buf = await readFile(localPath);
  const { width, height } = await sharp(buf).metadata();
  await upload(storagePath, buf, 'image/jpeg');
  process.stdout.write('.');
  return { path: storagePath, width, height };
}

async function main() {
  const existing = await select('projects?select=id');
  const existingReels = await select('reels?select=id');
  const existingIdentities = await select('identities?select=id');
  const count = existing.length + existingReels.length + existingIdentities.length;

  if (count > 0 && !force) {
    console.error(
      `Supabase already holds ${existing.length} project(s), ${existingReels.length} reel(s) and ` +
        `${existingIdentities.length} identity/identities.\n` +
        'Re-run with --force to replace them (enquiries are never touched).'
    );
    process.exit(1);
  }

  if (force && count > 0) {
    console.log('Clearing existing content…');
    await remove('project_media', 'id=not.is.null');
    await remove('projects', 'id=not.is.null');
    await remove('reels', 'id=not.is.null');
    await remove('identities', 'id=not.is.null');
    await removeObjects(await listObjects());
  }

  process.stdout.write('Uploading and inserting projects');
  for (const [index, p] of projects.entries()) {
    const dir = path.join(ASSETS, p.slug);
    const cover = await putImage(path.join(dir, 'cover.jpg'), `projects/${p.slug}/cover.jpg`);

    const galleryFiles = (await readdir(path.join(dir, 'gallery'))).filter((f) => f.endsWith('.jpg')).sort();
    const gallery = [];
    for (const file of galleryFiles) {
      gallery.push(await putImage(path.join(dir, 'gallery', file), `projects/${p.slug}/gallery/${file}`));
    }

    const feature = p.feature
      ? await putImage(path.join(dir, p.feature.file), `projects/${p.slug}/${p.feature.file}`)
      : null;

    const [row] = await insert('projects', [
      {
        slug: p.slug,
        client: p.client,
        sub_brand: p.sub_brand,
        sector: p.sector,
        teaser: p.teaser,
        overview: p.overview,
        scope: p.scope,
        spec: p.spec,
        services: p.services,
        feature_caption: p.feature?.caption ?? null,
        published: true,
        sort: index,
      },
    ]);

    await insert('project_media', [
      { project_id: row.id, role: 'cover', ...cover, alt: p.coverAlt, sort: 0 },
      ...gallery.map((g, i) => ({
        project_id: row.id,
        role: 'gallery',
        ...g,
        // The site generated this alt on the fly; it is now editable per image.
        alt: `Social media creative ${i + 1} designed for ${p.client}.`,
        sort: i,
      })),
      ...(feature ? [{ project_id: row.id, role: 'feature', ...feature, alt: p.feature.alt, sort: 0 }] : []),
    ]);
  }

  const slugToId = Object.fromEntries(
    (await select('projects?select=id,slug')).map((r) => [r.slug, r.id])
  );

  process.stdout.write('\nUploading and inserting reels');
  for (const [index, r] of reels.entries()) {
    const video = await readFile(path.join(MEDIA, `${r.key}.mp4`));
    await upload(`reels/${r.key}.mp4`, video, 'video/mp4');
    const poster = await putImage(path.join(MEDIA, `${r.key}.jpg`), `reels/${r.key}.jpg`);
    await insert('reels', [
      {
        label: r.label,
        client: r.client,
        note: r.note,
        alt: r.alt,
        video_path: `reels/${r.key}.mp4`,
        poster_path: poster.path,
        poster_width: poster.width,
        poster_height: poster.height,
        project_id: r.project ? slugToId[r.project] : null,
        show_in_films: true,
        published: true,
        sort: index,
      },
    ]);
  }

  process.stdout.write('\nUploading and inserting identities');
  for (const [index, id] of identities.entries()) {
    const img = await putImage(path.join(ASSETS, 'identity', id.file), `identities/${id.file}`);
    await insert('identities', [
      {
        client: id.client,
        sector: id.sector,
        image_path: img.path,
        alt: id.alt,
        width: img.width,
        height: img.height,
        published: true,
        sort: index,
      },
    ]);
  }

  const media = await select('project_media?select=id');
  console.log(
    `\nDone: ${projects.length} projects, ${media.length} images, ${reels.length} reels, ` +
      `${identities.length} identities.`
  );
}

main().catch((err) => {
  console.error('\n' + err.message);
  process.exit(1);
});
