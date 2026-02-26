import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
// @ts-check
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    site: 'https://eliteskills.ai',

    integrations: [
        sitemap({
            filter: (page) =>
                !page.includes('/checkout/') &&
                !page.includes('/api/') &&
                !page.includes('/pay') &&
                !page.includes('/account/') &&
                !page.includes('/download/'),
        }),
    ],

    vite: {
        plugins: [tailwindcss()],
    },

    env: {
        schema: {
            RESEND_API_KEY: envField.string({
                context: 'server',
                access: 'secret',
                optional: true,
            }),
            RESEND_FROM_EMAIL: envField.string({
                context: 'server',
                access: 'secret',
                optional: true,
            }),
            RESEND_TO_EMAIL: envField.string({
                context: 'server',
                access: 'secret',
                optional: true,
            }),
            STRIPE_SECRET_KEY: envField.string({
                context: 'server',
                access: 'secret',
                optional: true,
            }),
            STRIPE_WEBHOOK_SECRET: envField.string({
                context: 'server',
                access: 'secret',
                optional: true,
            }),
            SESSION_TOKEN_SECRET: envField.string({
                context: 'server',
                access: 'secret',
                optional: true,
            }),
            PAY_TOKEN_SECRET: envField.string({
                context: 'server',
                access: 'secret',
                optional: true,
            }),
        },
    },

    adapter: cloudflare({
        imageService: 'compile',
    }),
});
