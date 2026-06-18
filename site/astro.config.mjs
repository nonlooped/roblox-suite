import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// GitHub Pages project site → served from https://nonlooped.github.io/roblox-suite/
export default defineConfig({
  site: 'https://nonlooped.github.io',
  base: '/roblox-suite/',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      // Filter out the 404 — it shouldn't be indexed as a real page.
      filter: (page) => !page.includes('/404'),
      // Lastmod per-page from build time; changefreq + priority per route type.
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});