/**
 * Business facts. Every value below is taken verbatim from the supplied
 * business-details and preferred-contact documents.
 *
 * NOTE: the GST number supplied in business_details.pdf is deliberately absent —
 * that source states it is "not to be shown anywhere".
 */

/**
 * Single source of truth for the domain. Mirrored in astro.config.mjs.
 * www is the primary on Netlify: basicblend.in 301s to it.
 */
export const SITE_URL = 'https://www.basicblend.in';

export const site = {
  name: 'BasicBlend',
  legalName: 'Basic Blend',
  /**
   * Every spelling people search for. Google treats "basicblend" and
   * "basic blend" as different queries, so both forms appear in titles, copy
   * and structured data.
   */
  alternateNames: ['Basic Blend', 'BasicBlend Digital Marketing Agency'],
  tagline: 'Your brand, our blend.',
  /** ~155 chars, used as the default meta description. */
  description:
    'Basic Blend (BasicBlend) is a digital marketing agency in Chandigarh for branding, logo design, websites, social media, performance ads, reels and video production.',

  phone: '8427327988',
  phoneIntl: '+918427327988',
  phoneDisplay: '84273 27988',
  email: 'basicblend007@gmail.com',

  address: {
    booth: 'Booth No. 165',
    market: 'Bhagat Singh Market (Old Fruit Market)',
    sector: 'Sector 22-D',
    city: 'Chandigarh',
    postcode: '160022',
    country: 'India',
    countryCode: 'IN',
  },

  /** Chandigarh Sector 22-D. Approximate, for LocalBusiness structured data. */
  geo: { lat: 30.7372, lng: 76.7825 },

  /** Local area for structured data. The studio also works with clients across India. */
  areaServed: ['Chandigarh', 'Mohali', 'Panchkula', 'Zirakpur'],

  links: {
    instagram: 'https://www.instagram.com/basicblend007',
    facebook: 'https://www.facebook.com/profile.php?id=61574846077556',
    maps: 'https://maps.app.goo.gl/AQX9dW2Yw893jFQZ8',
  },

  handles: {
    /** The contact sheet and the email agree on the trailing double-zero. */
    instagram: '@basicblend007',
    facebook: 'Basic Blend',
  },
} as const;

/**
 * Default keywords meta for pages without their own. Google ignores this tag;
 * Bing and some directories still read it. Rankings come from titles, headings
 * and copy, which carry the same phrases.
 */
export const siteKeywords = [
  'Basic Blend',
  'BasicBlend',
  'digital marketing agency Chandigarh',
  'digital marketing company',
  'marketing agency',
  'online marketing',
  'performance marketing',
  'digital branding',
  'social media marketing',
  'website development',
  'logo design',
  'influencer marketing',
  'video production',
];

/**
 * Tracking IDs supplied by the client. Tags load only in production builds, so
 * local development never pollutes the reports.
 */
export const tracking = {
  /** Google Analytics 4 measurement ID (gtag.js). */
  ga4: 'G-SG5X0FNJT9',
  /** Meta (Facebook/Instagram) Pixel ID. */
  metaPixel: '2232289700950550',
  /**
   * Google Search Console "HTML tag" verification token — the value of the
   * content="" attribute only. Leave empty if verified another way.
   */
  googleSiteVerification: '',
} as const;

/** WhatsApp deep link with a prefilled opener. */
export function whatsappLink(
  message = "Hi BasicBlend, I'd like to talk about a project for my business."
): string {
  return `https://wa.me/${site.phoneIntl.replace('+', '')}?text=${encodeURIComponent(message)}`;
}

export const addressLines = [
  site.address.booth,
  site.address.market,
  `${site.address.sector}, ${site.address.city} ${site.address.postcode}`,
] as const;

/** Primary navigation. A link is active on its own page and any page beneath it. */
export const nav = [
  { label: 'Services', href: '/services/' },
  { label: 'Work', href: '/work/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
] as const;
