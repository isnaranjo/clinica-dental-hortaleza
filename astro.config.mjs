// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// El sitio es SSG (páginas estáticas) y las rutas /api/* se ejecutan on-demand
// en Cloudflare Pages Functions gracias al adapter.
export default defineConfig({
  site: 'https://clinicadentalhortaleza.es',
  output: 'static',
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
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
