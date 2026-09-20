import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';

// Work images live in Supabase Storage. Allowing that host lets Astro download
// and optimise them at build time, so they ship as sized WebP exactly like the
// images imported from src/assets.
const { PUBLIC_SUPABASE_URL } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const supabaseHost = PUBLIC_SUPABASE_URL ? new URL(PUBLIC_SUPABASE_URL).hostname : undefined;

// SITE_URL is mirrored in src/data/site.ts — change both if the domain moves.
export default defineConfig({
  site: 'https://www.basicblend.in',
  integrations: [
    sitemap({
      // /thanks is a post-submit confirmation and /admin is the client's private
      // panel; neither has any business in search.
      filter: (page) => !page.includes('/thanks') && !page.includes('/admin'),
    }),
  ],
  // Every page is a directory (/services/), so canonical URLs, links and the
  // sitemap all agree on a trailing slash.
  trailingSlash: 'always',
  image: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
});
