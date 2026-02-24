export const prerender = false;

import type { APIRoute } from 'astro';
import { SESSION_TOKEN_SECRET } from 'astro:env/server';
import { buildLoginEmail } from '@/libs/api/email-templates';
import { isMailConfigured, sendMail } from '@/libs/api/mail';
import {
    isRateLimited,
    LOGIN_LINK_IP,
    LOGIN_LINK_EMAIL,
} from '@/libs/api/rate-limit';
import {
    checkHoneypot,
    parseFormField,
    jsonError,
    jsonOk,
} from '@/libs/api/spam';
import { createToken } from '@/libs/api/tokens';
import { createDb } from '@/libs/db/client';
import { getUserByEmail } from '@/libs/db/repo';

const SITE_URL = 'https://eliteskills.ai';

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
    if (!isMailConfigured() || !SESSION_TOKEN_SECRET) {
        return jsonError('Service not configured.', 500);
    }

    if (isRateLimited('login-ip', clientAddress, LOGIN_LINK_IP)) {
        return jsonError('Too many requests. Try later.', 429);
    }

    const formData = await request.formData();
    if (checkHoneypot(formData)) return jsonOk();

    const email = parseFormField(formData, 'email').toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonError('Valid email required.', 400);
    }

    if (isRateLimited('login-email', email, LOGIN_LINK_EMAIL)) {
        return jsonError('Too many requests for this email. Try later.', 429);
    }

    const d1 = locals.runtime.env.DB;
    const db = createDb(d1);
    const user = await getUserByEmail(db, email);

    // Always return success to avoid email enumeration
    if (!user) return jsonOk({ sent: true });

    const { token } = await createToken(
        SESSION_TOKEN_SECRET,
        'login',
        900,
        email,
    );
    const loginUrl = `${SITE_URL}/api/verify-login?token=${encodeURIComponent(token)}`;
    const { text, html } = buildLoginEmail(loginUrl);

    await sendMail({
        to: [email],
        subject: 'Your Elite Skills login link',
        text,
        html,
    });

    return jsonOk({ sent: true });
};
