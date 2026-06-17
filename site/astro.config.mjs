import { defineConfig } from 'astro/config';

// GitHub Pages project site → served from https://nonlooped.github.io/roblox-suite/
export default defineConfig({
  site: 'https://nonlooped.github.io',
  base: '/roblox-suite/',
  build: {
    format: 'directory',
  },
});