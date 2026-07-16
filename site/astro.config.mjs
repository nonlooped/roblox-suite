import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const catalog = JSON.parse(readFileSync(new URL('../catalog.json', import.meta.url), 'utf8'));
const changedBySlug = new Map(
  catalog.skills.map((skill) => [skill.slug, skill.last_changed_at]),
);
const newestChange = [...changedBySlug.values()].sort().at(-1);

export default defineConfig({
  site: 'https://nonlooped.github.io',
  base: '/roblox-suite/',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        const url = new URL(item.url);
        const match = url.pathname.match(/\/skills\/([^/]+)\/?$/);
        const changed = match ? changedBySlug.get(match[1]) : newestChange;
        return {
          ...item,
          lastmod: changed ? new Date(`${changed}T00:00:00Z`) : undefined,
        };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
