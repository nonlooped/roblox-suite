// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://roblox-suite.vercel.app",
  base: "/",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
  devToolbar: {
    enabled: false,
  },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith("/404/"),
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
