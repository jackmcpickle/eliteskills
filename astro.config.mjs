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
            filter: (page) => !page.includes('/api/'),
        }),
    ],

    vite: {
        plugins: [tailwindcss()],
    },

    adapter: cloudflare({
        imageService: 'compile',
    }),
});
