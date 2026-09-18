/**
 * Services — the union of services.pdf, the catalogue's numbered groups, and
 * the client's later additions (graphic design, reels and video editing, AI
 * video, product shoots, UGC). Every deliverable listed appears in at least
 * one of those sources.
 *
 * Copy describes what is offered. It makes no promise of outcomes: the supplied
 * terms state that rankings, lead volumes and revenue are not guaranteed.
 *
 * Search phrases from the client's keyword research are worked into titles,
 * intros and items only where they read naturally. `keywords` records which
 * searches each page is meant to answer; it also feeds the keywords meta tag.
 *
 * Each service renders its own page at /services/[slug].
 */

export interface Step {
  title: string;
  body: string;
}

/** Services are shown in these groups, in this order, everywhere they are listed. */
export const serviceGroups = [
  { id: 'brand', label: 'Brand & web' },
  { id: 'growth', label: 'Growth marketing' },
  { id: 'content', label: 'Content & video' },
] as const;

export type ServiceGroup = (typeof serviceGroups)[number]['id'];

export interface Service {
  slug: string;
  group: ServiceGroup;
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
  /** The <title> lead, phrased the way people search. "| BasicBlend" is appended. */
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
}

export const services: Service[] = [
  /* ---- Brand & web -------------------------------------------------- */
  {
    slug: 'branding-design',
    group: 'brand',
    title: 'Branding & logo design',
    short: 'Branding & logos',
    summary: 'A logo and a brand identity that make your business look established from day one.',
    intro:
      'People judge a business by how it looks long before they buy from it. We design company logos and complete brand identities: the mark, the colours, the type and the rules that hold them together. Then we carry that identity into your stationery, your signage and your digital branding, so every place a customer meets you looks like the same business.',
    items: [
      'Professional logo design for new and existing businesses',
      'Brand identity: colours, typography and usage rules',
      'Business cards, letterheads and stationery',
      'Digital branding for your social profiles and website',
      'Brand refreshes for businesses that have outgrown their look',
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
    seoTitle: 'Logo Design & Branding Agency in Chandigarh',
    metaDescription:
      'Professional logo design and brand identity for businesses: company logos, digital branding and stationery from BasicBlend, a branding agency in Chandigarh.',
    keywords: [
      'logo design Chandigarh',
      'company logo design',
      'business logo design',
      'professional logo design',
      'logo designer near me',
      'brand identity design',
      'digital branding',
    ],
  },
  {
    slug: 'graphic-design',
    group: 'brand',
    title: 'Graphic design',
    short: 'Graphic design',
    summary: 'Social posts, catalogues, brochures, posters and hoardings that all look like one brand.',
    intro:
      'Every piece a customer sees either builds your brand or chips away at it. We design the everyday material a business runs on: social media creatives, ad banners, catalogues, brochures, flyers, posters and hoardings. Written in English, Hindi or Hinglish, and all in one consistent look.',
    items: [
      'Social media posts, carousels and ad creatives',
      'Catalogue and brochure design',
      'Flyers, posters and marketing collateral',
      'Billboard and hoarding design',
      'Festival and seasonal creatives',
      'Motion graphics',
    ],
    fits: [
      'Businesses that need a steady supply of on-brand creatives',
      'Brands printing catalogues, brochures or hoardings',
      'Teams running ads that need fresh creative every week',
    ],
    steps: [
      { title: 'Brief', body: 'What the piece has to say, to whom, and where it will appear.' },
      { title: 'Design', body: 'Layouts built on your brand, not on a template.' },
      { title: 'Revise', body: 'Changes made together until it is right.' },
      { title: 'Deliver', body: 'Print-ready and web-ready files in every size you need.' },
    ],
    seoTitle: 'Graphic Design Services in Chandigarh',
    metaDescription:
      'Graphic design for social media, ads, catalogues, brochures, posters and hoardings from BasicBlend, a design and digital marketing agency in Chandigarh.',
    keywords: [
      'graphic design Chandigarh',
      'graphic design services',
      'social media creatives',
      'brochure design',
      'catalogue design',
      'hoarding design',
    ],
  },
  {
    slug: 'websites-platforms',
    group: 'brand',
    title: 'Websites, platforms & automation',
    short: 'Websites',
    summary: 'Business websites, online stores and custom platforms, connected to AI and automation.',
    intro:
      'A website should do real work for the business, not just exist. Whether you need a website for a small business, want to start selling through your own online store, or need custom website development for a platform, we design and build it properly. Then we connect it to AI agents, automations and the tools you already use, so enquiries, orders and data get handled without the busywork.',
    items: [
      'Business websites and landing pages',
      'Online stores with payments, inventory and shipping',
      'Custom website development and web applications',
      'AI-powered websites, AI integrations and custom AI agents',
      'Admin panels and business tools',
      'Workflow automation and API integrations',
    ],
    fits: [
      'Small businesses building their first proper website',
      'Brands and retailers ready to sell online',
      'Startups and SaaS teams that need a product site or a platform',
      'Businesses buried in manual follow-ups, orders or data entry',
    ],
    steps: [
      { title: 'Scope', body: 'What the site or system has to achieve, and for whom.' },
      { title: 'Design', body: 'Structure and screens, agreed before a line of code.' },
      { title: 'Build', body: 'Developed, tested across devices and connected to your tools.' },
      { title: 'Launch', body: 'Live, monitored, and improved as real use comes in.' },
    ],
    seoTitle: 'Website Design & Development Company in Chandigarh',
    metaDescription:
      'Build a website for your business: small business websites, online stores, custom website development and AI-powered platforms from BasicBlend, Chandigarh.',
    keywords: [
      'website design Chandigarh',
      'website development company Chandigarh',
      'small business website design services',
      'build a website for business',
      'custom website development',
      'build an online store',
      'ecommerce website development',
      'AI powered website',
    ],
  },

  /* ---- Growth marketing -------------------------------------------- */
  {
    slug: 'social-media-management',
    group: 'growth',
    title: 'Social media management',
    short: 'Social media',
    summary: 'A consistent presence: planned, designed, posted and answered every week.',
    intro:
      'Social media marketing works when it is consistent. We plan the content, design and write the posts, schedule them across your platforms, reply to your audience and report on what is growing, across Instagram, Facebook, LinkedIn and X.',
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
    seoTitle: 'Social Media Marketing & Management in Chandigarh',
    metaDescription:
      'Social media marketing and management for Instagram, Facebook, LinkedIn and X: content planning, design, posting and reporting by BasicBlend, Chandigarh.',
    keywords: [
      'social media marketing Chandigarh',
      'social media management',
      'social media agency',
      'Instagram marketing',
      'digital media marketing',
    ],
  },
  {
    slug: 'paid-ads-lead-generation',
    group: 'growth',
    title: 'Performance marketing & ads',
    short: 'Ads & leads',
    summary: 'Meta and Google ad campaigns built to bring in enquiries and sales, not just clicks.',
    intro:
      'Ads are only worth what they bring back. Our performance marketing starts from what a lead or a sale is worth to you. We plan, build and manage campaigns on Facebook, Instagram and Google, with the creative, targeting and tracking set up for leads and sales, then keep optimising on what the numbers show.',
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
    seoTitle: 'Performance Marketing Agency in Chandigarh: Meta & Google Ads',
    metaDescription:
      'Performance marketing from BasicBlend, Chandigarh: Meta and Google Ads management, PPC and lead generation campaigns with clear tracking and reporting.',
    keywords: [
      'performance marketing agency',
      'performance marketing Chandigarh',
      'digital ad agency',
      'Google Ads agency Chandigarh',
      'Meta ads agency',
      'lead generation',
      'PPC management',
    ],
  },
  {
    slug: 'influencer-marketing',
    group: 'growth',
    title: 'Influencer marketing',
    short: 'Influencers',
    summary: 'The right creators, a clear brief and a partnership managed end to end.',
    intro:
      'Creators already have the attention of the people you want to reach. We build the influencer strategy, find brand-relevant creators, write the brief and manage each influencer marketing campaign from first message to final post. Then we report on how every collaboration performed.',
    items: [
      'Influencer strategy and campaign planning',
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
    seoTitle: 'Influencer Marketing Agency in Chandigarh',
    metaDescription:
      'Influencer marketing for brands from BasicBlend, Chandigarh: influencer strategy, creator discovery, campaign briefs, partnership management and reporting.',
    keywords: [
      'influencer marketing agency',
      'influencer marketing campaign',
      'influencer marketing for brands',
      'influencer strategy',
      'brand influencer',
      'influencer advertising',
    ],
  },
  {
    slug: 'google-business-profile',
    group: 'growth',
    title: 'Google Business Profile',
    short: 'Google profile',
    summary: 'Show up properly when people nearby search for what you do.',
    intro:
      'When someone searches for what you do "near me", your Google Business Profile is often the first thing they see, before your website. We set it up or fix it, keep your details, photos and posts current, and manage it so your business looks open, active and trustworthy.',
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
    seoTitle: 'Google Business Profile Management in Chandigarh',
    metaDescription:
      'Google Business Profile setup and management so local customers find you in "near me" searches and on Google Maps. From BasicBlend, Chandigarh.',
    keywords: [
      'Google Business Profile management',
      'Google My Business Chandigarh',
      'local SEO Chandigarh',
      'Google Maps listing',
    ],
  },

  /* ---- Content & video --------------------------------------------- */
  {
    slug: 'reels-video-editing',
    group: 'content',
    title: 'Reels & video editing',
    short: 'Reels & video',
    summary: 'Reels, promotional films and edits: scripted, shot and cut for every platform.',
    intro:
      'Short-form video is where attention is. We script, shoot and edit reels, promotional videos and brand films on location, at your factory, store or office. Already shooting your own footage? We edit that too, into something people actually watch to the end.',
    items: [
      'Instagram reels and YouTube Shorts',
      'Promotional and brand films',
      'Video editing for footage you shoot yourself',
      'Scriptwriting and shot planning',
      'On-location shooting',
      'Cuts and formats for each platform',
    ],
    fits: [
      'Businesses that need a steady flow of reels',
      'Launches that need a film to lead with',
      'Teams with plenty of footage and no time to edit it',
    ],
    steps: [
      { title: 'Concept', body: 'The idea, the script and a shot list.' },
      { title: 'Shoot', body: 'On location or in a set-up that suits the product.' },
      { title: 'Edit', body: 'Cut for each platform, in each format you need.' },
      { title: 'Deliver', body: 'Ready to post, run as ads or use on your site.' },
    ],
    proof: 'films',
    seoTitle: 'Reels & Video Editing Services in Chandigarh',
    metaDescription:
      'Reels, promotional videos and professional video editing from BasicBlend, Chandigarh. Scripted, shot on location and cut for Instagram, YouTube and ads.',
    keywords: [
      'reels editing',
      'video editing services',
      'video production Chandigarh',
      'Instagram reels agency',
      'promotional video',
    ],
  },
  {
    slug: 'product-shoots',
    group: 'content',
    title: 'Product shoots',
    short: 'Product shoots',
    summary: 'Product photography and video that make what you sell look worth buying.',
    intro:
      'Customers cannot pick your product up online, so the pictures have to do the selling. We plan, style and shoot product photography and product video for catalogues, e-commerce listings, social media and ads, art-directed around how the product is actually used.',
    items: [
      'Product photography for e-commerce and catalogues',
      'Styled lifestyle and in-use shoots',
      'Product videos for ads and reels',
      'Styling and art direction',
      'On-location shoots at your factory, store or office',
      'Edited images delivered in every size you need',
    ],
    fits: [
      'Brands selling online or through marketplaces',
      'Manufacturers building or refreshing a catalogue',
      'Launches that need fresh visuals fast',
    ],
    steps: [
      { title: 'Plan', body: 'Products, angles, props and a shot list agreed upfront.' },
      { title: 'Style', body: 'Sets and styling that show the product in use.' },
      { title: 'Shoot', body: 'Photos and video captured in one session where possible.' },
      { title: 'Deliver', body: 'Retouched and sized for your store, catalogue and social.' },
    ],
    seoTitle: 'Product Photography & Product Shoots in Chandigarh',
    metaDescription:
      'Product shoots from BasicBlend, Chandigarh: product photography and product video for e-commerce, catalogues, social media and ads.',
    keywords: [
      'product shoot Chandigarh',
      'product photography',
      'ecommerce product photography',
      'product video shoot',
    ],
  },
  {
    slug: 'ugc-content-creation',
    group: 'content',
    title: 'UGC content creation',
    short: 'UGC content',
    summary: 'Reviews, unboxings and testimonials in the style people actually trust.',
    intro:
      'People trust people more than they trust ads. We create UGC-style videos, from reviews and unboxings to demos and testimonials, that look and feel like real customers talking. They work as organic posts, and as ads that do not feel like ads.',
    items: [
      'Product review and unboxing videos',
      'Testimonial-style videos',
      'Demo and how-to videos',
      'Hooks and scripts written for ads',
      'Creators matched to your product and audience',
      'Edited for reels, stories and ad placements',
    ],
    fits: [
      'Brands whose polished ads have stopped performing',
      'Products that sell better once people see them in use',
      'Businesses that need many ad variations to test',
    ],
    steps: [
      { title: 'Brief', body: 'The product, the audience and the angle to test.' },
      { title: 'Script', body: 'Hooks and talking points that sound natural.' },
      { title: 'Create', body: 'Filmed by creators who suit your audience.' },
      { title: 'Edit', body: 'Cut into versions for posts, stories and ads.' },
    ],
    seoTitle: 'UGC Content Creation for Brands in Chandigarh',
    metaDescription:
      'UGC content creation from BasicBlend, Chandigarh: review, unboxing, demo and testimonial-style videos for brands, made for social posts and ads.',
    keywords: [
      'UGC content creation',
      'UGC videos for brands',
      'UGC ads',
      'user generated content agency',
    ],
  },
  {
    slug: 'ai-video-creation',
    group: 'content',
    title: 'AI video creation',
    short: 'AI video',
    summary: 'AI-generated videos for ads and social, made quickly without looking cheap.',
    intro:
      'When you need more video than a shoot can deliver, AI fills the gap. We create AI-generated videos for ads, reels and product explainers, and use AI video editing to turn work around faster. You get the speed of an AI video maker with a creative team deciding what goes on screen.',
    items: [
      'AI-generated videos for ads and reels',
      'Product explainers and concept videos made with AI',
      'AI-assisted video editing',
      'Scripts and prompts written by our team',
      'AI visuals mixed with real footage where the product needs it',
    ],
    fits: [
      'Brands that need many ad variations quickly',
      'Businesses without the budget for a full shoot',
      'Ideas that would be hard or costly to film',
    ],
    steps: [
      { title: 'Concept', body: 'The idea and the script, written for the platform.' },
      { title: 'Generate', body: 'Scenes created and refined with AI tools.' },
      { title: 'Edit', body: 'Cut, captioned and checked by our editors.' },
      { title: 'Deliver', body: 'In every format your ads and posts need.' },
    ],
    seoTitle: 'AI Video Creation & AI Video Editing in Chandigarh',
    metaDescription:
      'AI video creation for brands from BasicBlend, Chandigarh: AI-generated ads, reels and product videos, and AI video editing, directed by a creative team.',
    keywords: [
      'AI video creation',
      'AI video maker',
      'AI video creator',
      'AI video editing',
      'AI generated video ads',
      'create AI video',
    ],
  },
];

export const serviceBySlug = (slug: string) => services.find((s) => s.slug === slug);

/** Services bucketed by group, in group order. Empty groups are dropped. */
export function groupServices(list: Service[] = services) {
  return serviceGroups
    .map((g) => ({ ...g, services: list.filter((s) => s.group === g.id) }))
    .filter((g) => g.services.length > 0);
}

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
