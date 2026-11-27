// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Migrado a Cloudflare Workers: el binding ASSETS no está reservado en Workers.
export default defineConfig({
  site: 'https://clinicadentalhortaleza.com',
  output: 'server',
  adapter: cloudflare({}),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/legal/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
  });
