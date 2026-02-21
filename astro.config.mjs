// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://eliteskills.dev',

  integrations: [
    sitemap({
      filter: (page) => !page.includes('/checkout/') && !page.includes('/api/'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()]
  },

  env: {
    schema: {
      MAILGUN_API_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      MAILGUN_DOMAIN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      MAILGUN_FROM_EMAIL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      MAILGUN_TO_EMAIL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      STRIPE_PUBLISHABLE_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      STRIPE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
    }
  },

  adapter: cloudflare()
});
