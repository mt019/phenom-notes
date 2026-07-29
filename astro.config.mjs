import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://notes.phenomcanvas.com',
  output: 'static',
  trailingSlash: 'never',
  integrations: [sitemap()],
});
