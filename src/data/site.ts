/**
 * Business facts. Every value below is taken verbatim from the supplied
 * business-details and preferred-contact documents.
 *
 * NOTE: the GST number supplied in business_details.pdf is deliberately absent —
 * that source states it is "not to be shown anywhere".
 */

/** Single source of truth for the domain. Mirrored in astro.config.mjs. */
export const SITE_URL = 'https://basicblend.netlify.app';

export const site = {
  name: 'BasicBlend',
  legalName: 'Basic Blend',
  tagline: 'Your brand, our blend.',
  /** ~155 chars, used as the default meta description. */
  description:
    'BasicBlend is a Chandigarh studio for branding, websites, platforms, social media, content and ads, working with new businesses, growing companies and established brands.',

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
