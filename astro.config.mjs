// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
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
      })
    }
  },

  adapter: cloudflare()
});
