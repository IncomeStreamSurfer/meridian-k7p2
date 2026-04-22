import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  site: process.env.PUBLIC_SITE_URL || 'https://meridian-k7p2.vercel.app',
  security: { checkOrigin: false },
  integrations: [sitemap({
    filter: (page) =>
      !page.includes('/thanks') &&
      !page.includes('/api/') &&
      !page.includes('/admin'),
  })],
  vite: { plugins: [tailwindcss()] },
});
