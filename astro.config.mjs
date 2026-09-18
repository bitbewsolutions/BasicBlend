import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL is mirrored in src/data/site.ts — change both if the domain moves.
export default defineConfig({
  site: 'https://www.basicblend.in',
  integrations: [
    sitemap({
      // /thanks is a post-submit confirmation; it has no search value.
      filter: (page) => !page.includes('/thanks'),
    }),
  ],
  // Every page is a directory (/services/), so canonical URLs, links and the
  // sitemap all agree on a trailing slash.
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
});
