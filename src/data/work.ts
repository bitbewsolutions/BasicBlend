/**
 * Selected work. Every client and deliverable here is verifiable from the
 * supplied catalogue and video files.
 *
 * No volume figures appear anywhere (post counts, film counts, client counts):
 * the catalogue shows a curated selection, and the real totals are far higher.
 * Spec rows describe the KIND of work, never how much of it.
 *
 * Each case renders its own page at /work/[slug].
 */
import type { ImageMetadata } from 'astro';

import maashardaCover from '../assets/work/maa-sharda/cover.jpg';
import maashardaCampaign from '../assets/work/maa-sharda/campaign.jpg';
import navataCover from '../assets/work/navata/cover.jpg';
import banbhoriCover from '../assets/work/maa-banbhori/cover.jpg';

import dmtraders from '../assets/work/identity/dmtraders-logo.jpg';
import rsmarketing from '../assets/work/identity/rsmarketing-logo.jpg';
import elitebuild from '../assets/work/identity/elitebuild-logo.jpg';

type ImageModules = Record<string, { default: ImageMetadata }>;

const galleryModules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/work/*/gallery/*.jpg',
  { eager: true }
) as ImageModules;

/** Individual creatives for a case, in grid reading order. */
function galleryFor(slug: string): ImageMetadata[] {
  return Object.entries(galleryModules)
    .filter(([path]) => path.includes(`/work/${slug}/gallery/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, mod]) => mod.default);
}

export interface Film {
  src: string;
  poster: string;
  label: string;
  client: string;
  note: string;
  alt: string;
}

export const films: Record<string, Film> = {
  bts: {
    src: '/media/bts-production.mp4',
    poster: '/media/bts-production.jpg',
    label: 'Behind the scenes',
    client: 'On set with BasicBlend',
    note: 'Scripting, a factory floor and a kitchen ad shoot.',
    alt: 'Behind-the-scenes film of a BasicBlend shoot: scripting, a laser cutter on a factory floor, and an ad shoot in a kitchen.',
  },
  blender: {
    src: '/media/navata-bullet-blender.mp4',
    poster: '/media/navata-bullet-blender.jpg',
    label: 'Product film',
    client: 'Navata Appliances',
    note: 'The Bullet Blender, shot and cut by our team.',
    alt: 'Product film for the Navata Bullet Blender showing fruit and vegetable drinks being blended and poured.',
  },
  line: {
    src: '/media/navata-product-films.mp4',
    poster: '/media/navata-product-films.jpg',
    label: 'Product film',
    client: 'Navata Appliances',
    note: 'From the manufacturing line to the finished product.',
    alt: 'Product film for Navata Appliances intercutting the manufacturing line with finished appliances.',
  },
};

export interface CaseStudy {
  slug: string;
  client: string;
  subBrand?: string;
  sector: string;
  /** One-line teaser for cards. */
  teaser: string;
  /** What the work was — descriptive, about the work, not the client's past. */
  overview: string;
  scope: string[];
  /** Spec-plate rows: the kind of work, never a count. */
  spec: { label: string; value: string }[];
  cover: ImageMetadata;
  coverAlt: string;
  gallery: ImageMetadata[];
  /** Optional extra layout shown on the case page. */
  feature?: { image: ImageMetadata; alt: string; caption: string };
  films?: Film[];
  services: string[]; // service slugs
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'maa-sharda',
    client: 'Maa Sharda Industries',
    subBrand: 'Orwo Flame',
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
    cover: maashardaCover,
    coverAlt:
      'Grid of social media posts designed for Maa Sharda Industries and its Orwo Flame chimney range, mixing product features, Hinglish headlines and a World Water Day post.',
    gallery: galleryFor('maa-sharda'),
    feature: {
      image: maashardaCampaign,
      alt: 'Campaign layout for Maa Sharda Industries titled "From hype to happening", pairing a hero chimney creative with supporting posts.',
      caption: 'Campaign presentation: "From hype to happening"',
    },
    services: ['social-media-management', 'graphic-design'],
  },
  {
    slug: 'navata',
    client: 'Navata Appliances',
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
    cover: navataCover,
    coverAlt:
      'Grid of social media posts designed for Navata Appliances, featuring mixer grinders, hand blenders, sandwich makers and pressure cookers with bilingual headlines.',
    gallery: galleryFor('navata'),
    films: [films.blender, films.line],
    services: ['social-media-management', 'graphic-design', 'product-shoots', 'reels-video-editing'],
  },
  {
    slug: 'maa-banbhori',
    client: 'Maa Banbhori Plastic Works',
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
    cover: banbhoriCover,
    coverAlt:
      'Grid of social media posts designed for Maa Banbhori Plastic Works, covering garbage bags, printed packaging pouches and business-to-business call-to-action posts.',
    gallery: galleryFor('maa-banbhori'),
    services: ['social-media-management', 'graphic-design', 'paid-ads-lead-generation'],
  },
];

export const caseBySlug = (slug: string) => caseStudies.find((c) => c.slug === slug);

/** Identity work — logos delivered for trade and retail businesses. */
export const identities = [
  {
    client: 'DM Traders',
    sector: "Women's garments, wholesale",
    image: dmtraders,
    alt: 'Logo designed for DM Traders, a womenswear wholesaler: a monogram with an illustrated figure in a flowing gown, framed by a botanical arc.',
  },
  {
    client: 'RS Marketing',
    sector: 'Hardware and modular kitchens',
    image: rsmarketing,
    alt: 'Logo designed for RS Marketing, a hardware and modular kitchen distributor: a gold linework monogram with a floral motif.',
  },
  {
    client: 'Elite Build Studio',
    sector: 'Hardware, sanitary and paints',
    image: elitebuild,
    alt: 'Logo designed for Elite Build Studio, a hardware, sanitary and paints business: a gold crest with a roofline, hammer, brush and tap.',
  },
];

/** The home showpiece: our own footage against a delivered campaign. */
export const showpiece = {
  delivered: maashardaCampaign,
  deliveredAlt:
    'Campaign layout designed for Maa Sharda Industries titled "From hype to happening".',
};

/** Filmstrip on the home page: creatives interleaved across the three cases. */
export const filmstrip = (() => {
  const lists = caseStudies.map((c) => c.gallery.map((image) => ({ image, client: c.client })));
  const longest = Math.max(...lists.map((l) => l.length));
  const out: { image: ImageMetadata; client: string }[] = [];
  for (let i = 0; i < longest; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
})();
