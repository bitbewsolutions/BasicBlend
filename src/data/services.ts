/**
 * Services — the union of services.pdf (17 flat items) and the catalogue's
 * 7 numbered groups. Every deliverable listed appears in at least one source.
 *
 * Copy describes what is offered. It makes no promise of outcomes: the supplied
 * terms state that rankings, lead volumes and revenue are not guaranteed.
 *
 * Each service renders its own page at /services/[slug].
 */

export interface Step {
  title: string;
  body: string;
}

export interface Service {
  slug: string;
  title: string;
  /** Short name for nav lists and chips. */
  short: string;
  /** One line: what it buys the client. */
  summary: string;
  /** Opening paragraph on the service page. */
  intro: string;
  /** What is included. */
  items: string[];
  /** Who it tends to suit — deliberately broad, every stage of business. */
  fits: string[];
  steps: Step[];
  /** Which proof block the service page shows, if any real work exists for it. */
  proof?: 'social' | 'identity' | 'films';
  metaDescription: string;
}

export const services: Service[] = [
  {
    slug: 'branding-design',
    title: 'Branding & design',
    short: 'Branding',
    summary: 'A logo, an identity and every piece of print and social that has to look like one brand.',
    intro:
      'People judge a business by how it looks long before they buy from it. We design logos and identity systems, then carry them into everything that has to look right: social templates, catalogues, brochures, business cards, posters, billboards and hoardings.',
    items: [
      'Logo and brand identity design',
      'Social media graphics and templates',
      'Catalogue and brochure design',
      'Business cards, posters and marketing collateral',
      'Billboard and hoarding design',
      'Motion graphics',
      'UI/UX design for digital platforms',
    ],
    fits: [
      'New businesses that need to look credible from day one',
      'Established businesses whose look has drifted over the years',
      'Anyone launching a product, an outlet or a new line',
    ],
    steps: [
      { title: 'Discovery', body: 'What you do, who you sell to, and who you are up against.' },
      { title: 'Direction', body: 'Design routes explored and reviewed together with you.' },
      { title: 'Refinement', body: 'One route, polished and tested on the places it will actually live.' },
      { title: 'Delivery', body: 'Final files, ready for print, web and social.' },
    ],
    proof: 'identity',
    metaDescription:
      'Logo design, brand identity, catalogues, brochures and hoarding design from BasicBlend, a branding studio in Chandigarh.',
  },
  {
    slug: 'websites-platforms',
    title: 'Websites, platforms & automation',
    short: 'Websites',
    summary: 'Websites, online stores and custom platforms, connected to AI agents and automation.',
    intro:
      'A website should do real work for the business, not just exist. We design and build business websites, e-commerce stores and custom web platforms, then connect them to AI agents, automations and the tools you already use. Enquiries, orders and data get handled without the busywork.',
    items: [
      'Business websites and landing pages',
      'E-commerce with payments, inventory and shipping',
      'Custom web applications and platforms',
      'Admin panels and business tools',
      'AI integrations and custom AI agents',
      'Workflow automation and API integrations',
    ],
    fits: [
      'Startups and SaaS teams that need a product site or a platform',
      'Brands and retailers ready to sell online',
      'Businesses buried in manual follow-ups, orders or data entry',
    ],
    steps: [
      { title: 'Scope', body: 'What the site or system has to achieve, and for whom.' },
      { title: 'Design', body: 'Structure and screens, agreed before a line of code.' },
      { title: 'Build', body: 'Developed, tested across devices and connected to your tools.' },
      { title: 'Launch', body: 'Live, monitored, and improved as real use comes in.' },
    ],
    metaDescription:
      'Website design and development, e-commerce, custom platforms, AI agents and workflow automation from BasicBlend in Chandigarh.',
  },
  {
    slug: 'social-media-management',
    title: 'Social media management',
    short: 'Social media',
    summary: 'A consistent presence: planned, designed, posted and answered every week.',
    intro:
      'Social media works when it is consistent. We plan the content, design and write the posts, schedule them across your platforms, reply to your audience and report on what is growing, across Instagram, Facebook, LinkedIn and X.',
    items: [
      'Content strategy and calendar planning',
      'Post and carousel design',
      'Captions in English, Hindi or Hinglish',
      'Scheduling and publishing',
      'Community management and replies',
      'Performance tracking and reporting',
    ],
    fits: [
      'Businesses posting irregularly, or not at all',
      'Brands that want one consistent look and voice',
      'Teams without the time to run accounts in-house',
    ],
    steps: [
      { title: 'Audit', body: 'Where your accounts stand and what your audience responds to.' },
      { title: 'Plan', body: 'Content pillars and a calendar you approve in advance.' },
      { title: 'Publish', body: 'Designed, written and posted on schedule.' },
      { title: 'Report', body: 'What grew, what did not, and what changes next.' },
    ],
    proof: 'social',
    metaDescription:
      'Social media management for Instagram, Facebook, LinkedIn and X: content planning, design, posting and reporting by BasicBlend, Chandigarh.',
  },
  {
    slug: 'paid-ads-lead-generation',
    title: 'Paid ads & lead generation',
    short: 'Ads & leads',
    summary: 'Meta and Google campaigns set up to bring in enquiries and sales.',
    intro:
      'Ads are only worth what they bring back. We plan, build and manage campaigns on Facebook, Instagram and Google, with the creative, targeting and tracking set up for leads and sales. Then we keep optimising on what the numbers show.',
    items: [
      'Facebook and Instagram (Meta) ad campaigns',
      'Google Ads and pay-per-click',
      'Lead generation campaigns',
      'Ad creative and copywriting',
      'Retargeting and audience segmentation',
      'A/B testing and conversion rate optimisation',
      'Performance tracking and reporting',
    ],
    fits: [
      'Businesses that need enquiries, not just likes',
      'Launches and offers that need reach quickly',
      'Anyone already spending on ads without clear reporting',
    ],
    steps: [
      { title: 'Goals', body: 'What a lead or a sale is worth, and what to measure.' },
      { title: 'Setup', body: 'Tracking, audiences and creative built before launch.' },
      { title: 'Launch', body: 'Campaigns go live with testing built in.' },
      { title: 'Optimise', body: 'Budget moves toward what works. You see the numbers.' },
    ],
    metaDescription:
      'Meta and Google Ads management, PPC and lead generation campaigns from BasicBlend, a performance marketing studio in Chandigarh.',
  },
  {
    slug: 'content-production',
    title: 'Content & production',
    short: 'Content & video',
    summary: 'Product shoots, reels, promotional films and UGC, all scripted, shot and edited by us.',
    intro:
      'Good content is made, not found. We script, shoot and edit product photography, reels, promotional videos and UGC-style content on location, at your factory, store or office. When you need more content faster, we use AI video too.',
    items: [
      'Product shoots',
      'Reels and short-form video',
      'Promotional and brand films',
      'UGC videos: reviews, testimonials and unboxing',
      'AI-generated video',
      'Scriptwriting, shooting and editing',
    ],
    fits: [
      'Brands whose products deserve better photos and video',
      'Businesses that need a steady flow of reels',
      'Launches that need a film to lead with',
    ],
    steps: [
      { title: 'Concept', body: 'The idea, the script and a shot list.' },
      { title: 'Shoot', body: 'On location or in a set-up that suits the product.' },
      { title: 'Edit', body: 'Cut for each platform, in each format you need.' },
      { title: 'Deliver', body: 'Ready to post, run as ads or use on your site.' },
    ],
    proof: 'films',
    metaDescription:
      'Product shoots, reels, promotional videos, UGC and AI video production from BasicBlend in Chandigarh.',
  },
  {
    slug: 'influencer-marketing',
    title: 'Influencer marketing',
    short: 'Influencers',
    summary: 'The right creators, a clear brief and a partnership managed end to end.',
    intro:
      'Creators already have the attention of the people you want to reach. We find relevant influencers, build the campaign and the brief, manage the partnership from first message to final post, and report on how it performed.',
    items: [
      'Finding and vetting relevant creators',
      'Campaign concepts and creator briefs',
      'Partnership and content management',
      'Performance analysis for each collaboration',
    ],
    fits: [
      'Consumer brands launching or relaunching a product',
      'Businesses entering a new city or a new audience',
      'Brands that want authentic content alongside their ads',
    ],
    steps: [
      { title: 'Shortlist', body: 'Creators whose audience matches yours.' },
      { title: 'Brief', body: 'A clear concept, deliverables and approvals.' },
      { title: 'Manage', body: 'Contracts, timelines and content handled for you.' },
      { title: 'Measure', body: 'What each collaboration delivered.' },
    ],
    metaDescription:
      'Influencer marketing campaigns from BasicBlend, Chandigarh: creator discovery, briefs, partnership management and reporting.',
  },
  {
    slug: 'google-business-profile',
    title: 'Google Business Profile',
    short: 'Google profile',
    summary: 'Show up properly when people nearby search for what you do.',
    intro:
      'When someone nearby searches for what you do, your Google Business Profile is often the first thing they see. We set it up or fix it, keep your details, photos and posts current, and manage it so your business looks open, active and trustworthy.',
    items: [
      'Profile setup and verification support',
      'Business details, categories and hours',
      'Photos and regular posts',
      'Ongoing profile management',
    ],
    fits: [
      'Shops, clinics, showrooms and local service businesses',
      'Businesses with an incomplete or unclaimed profile',
      'Anyone who relies on walk-ins or local calls',
    ],
    steps: [
      { title: 'Claim', body: 'Take ownership of the profile, or create it.' },
      { title: 'Complete', body: 'Every detail, category and photo filled in properly.' },
      { title: 'Maintain', body: 'Posts and updates kept current.' },
    ],
    metaDescription:
      'Google Business Profile setup and management for local businesses, from BasicBlend in Chandigarh.',
  },
];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);

/** Who BasicBlend works with — every stage, product or service. */
export const audiences = [
  {
    title: 'Just starting out',
    body: 'A name, a logo, a website and the first customers, set up properly from day one.',
  },
  {
    title: 'Growing businesses',
    body: 'Consistent content, ads that bring in enquiries, and a site that turns visits into leads.',
  },
  {
    title: 'Product & trade brands',
    body: 'Manufacturers, distributors and retailers who need product shoots, catalogues and campaigns.',
  },
  {
    title: 'Software & services',
    body: 'SaaS and service businesses that need product sites, platforms, performance ads and automation.',
  },
];

/** The four-step process, from the catalogue's "OUR PROCESS" page. */
export const process: Step[] = [
  {
    title: 'Consultation',
    body: 'We start with your business, not your channels: what you offer, who buys it, and where your customers come from today.',
  },
  {
    title: 'Strategy',
    body: 'A plan built for your market: which platforms, what content, what the work has to say, and how we will judge it.',
  },
  {
    title: 'Execution',
    body: 'We design, build, shoot, write and publish. The work goes live across the channels the plan calls for.',
  },
  {
    title: 'Optimisation',
    body: 'We read the numbers, cut what is not working and back what is. Then we tell you plainly what changed.',
  },
];

/** "Why BasicBlend" — from the catalogue's why-choose page, reworded. */
export const reasons = [
  {
    title: 'Strategy tailored to you',
    body: 'No packaged playbook. Every plan starts from your business, your audience and your stage.',
  },
  {
    title: 'The whole blend, one team',
    body: 'Branding, websites, content, social and ads under one roof, so nothing gets lost between vendors who never speak.',
  },
  {
    title: 'We make the content',
    body: 'Our team scripts, shoots and edits. The photos, the reels and the ads come from the same place.',
  },
  {
    title: 'Written for your audience',
    body: 'English, Hindi or Hinglish, whichever your customers actually respond to.',
  },
  {
    title: 'Data-driven, and transparent',
    body: 'Decisions come from the numbers, and you see the same numbers we do.',
  },
];
