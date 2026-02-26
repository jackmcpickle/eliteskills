export const prerender = false;

import type { APIRoute } from 'astro';
import { SESSION_TOKEN_SECRET } from 'astro:env/server';
import { COOKIE_MAX_AGE_30D } from '@/constants/time';
import { verifyToken } from '@/libs/api/tokens';
import { createDb } from '@/libs/db/client';
import { getUserByEmail } from '@/libs/db/repo';

export const GET: APIRoute = async ({ url, locals }) => {
    const token = url.searchParams.get('token');
    if (!token || !SESSION_TOKEN_SECRET) {
        return new Response(null, {
            status: 302,
            headers: { Location: '/login?error=invalid' },
        });
    }

    const payload = await verifyToken(token, SESSION_TOKEN_SECRET, 'login');
    if (!payload?.data) {
        return new Response(null, {
            status: 302,
            headers: { Location: '/login?error=expired' },
        });
    }

    const d1 = locals.runtime.env.DB;
    const db = createDb(d1);
    const user = await getUserByEmail(db, payload.data);

    if (!user) {
        return new Response(null, {
            status: 302,
            headers: { Location: '/login?error=invalid' },
        });
    }

    return new Response(null, {
        status: 302,
        headers: {
            Location: '/account',
            'Set-Cookie': `account_key=${user.accountKey}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE_30D}`,
        },
    });
};
