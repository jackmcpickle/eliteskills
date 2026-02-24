export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
    return new Response(null, {
        status: 302,
        headers: {
            Location: '/',
            'Set-Cookie': 'account_key=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
        },
    });
};
