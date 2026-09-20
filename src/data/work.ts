/**
 * Shapes for the work content, plus the one image the home page composes with.
 *
 * The work itself (projects, films, identities) now lives in Supabase and is
 * managed from /admin/. It is read at build time by `src/lib/content.ts`;
 * nothing about it is hard-coded here any more.
 *
 * Content rules that still apply to whatever is entered in the admin panel:
 *  · No volume figures — the portfolio is a curated selection and real totals
 *    are far higher, so post/film/client counts would undersell the business.
 *  · Spec rows describe the KIND of work, never how much of it.
 *  · Every image needs real alt text; the admin panel requires it.
 */
import type { ImageMetadata } from 'astro';

import maashardaCampaign from '../assets/work/maa-sharda/campaign.jpg';

/**
 * An image either imported from src/assets (optimised by Astro from disk) or
 * stored in Supabase (optimised by Astro from its URL at build time).
 * `Pic.astro` renders both.
 */
export type SiteImage = ImageMetadata | { src: string; width: number; height: number };

export interface Film {
  /** Supabase row id, for keying. Absent for films composed into the design. */
  id?: string;
  src: string;
  /** Poster frame, optimised into the build like any other image. */
  poster: SiteImage;
  label: string;
  client: string;
  note: string;
  alt: string;
}

export interface GalleryItem {
  image: SiteImage;
  alt: string;
}

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
  cover: SiteImage;
  coverAlt: string;
  gallery: GalleryItem[];
  /** Optional extra layout shown on the case page. */
  feature?: { image: SiteImage; alt: string; caption: string };
  films?: Film[];
  services: string[]; // service slugs
}

export interface Identity {
  client: string;
  sector: string;
  image: SiteImage;
  alt: string;
}

/**
 * The home showpiece: our own footage wiped against a delivered campaign.
 * This one stays in the repo because it is a composed design element of the
 * home page, not a catalogue entry — the section is built around this exact
 * frame and its 4:5 crop.
 */
export const showpiece = {
  delivered: maashardaCampaign,
  deliveredAlt:
    'Campaign layout designed for Maa Sharda Industries titled "From hype to happening".',
};
