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
      filter: (page) => !page.includes('/checkout/') && !page.includes('/api/') && !page.includes('/pay'),
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
      STRIPE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      STRIPE_WEBHOOK_SECRET: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      STRIPE_PRICE_ONCE: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      STRIPE_PRICE_LIFETIME: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      AGENT_API_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      SESSION_TOKEN_SECRET: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
      PAY_TOKEN_SECRET: envField.string({
        context: 'server',
        access: 'secret',
        optional: true
      }),
    }
  },

  adapter: cloudflare()
});
