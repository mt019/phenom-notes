import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://phenomcanvas.com',
  base: '/notes',
  output: 'static',
  trailingSlash: 'never',
  integrations: [sitemap()],
});
