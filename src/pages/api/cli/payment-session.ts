export const prerender = false;

import type { APIRoute } from 'astro';
import { SESSION_TOKEN_SECRET } from 'astro:env/server';
import { isRateLimited, PAYMENT_SESSION_IP } from '@/libs/api/rate-limit';
import { jsonError, jsonOk } from '@/libs/api/spam';
import { createToken } from '@/libs/api/tokens';

/** Session token TTL: 1 hour */
const SESSION_TTL_SECONDS = 3600;

export const POST: APIRoute = async ({ clientAddress }) => {
    if (!SESSION_TOKEN_SECRET) {
        return jsonError('Payment session not configured.', 500);
    }

    if (isRateLimited('cli-ps:ip', clientAddress, PAYMENT_SESSION_IP)) {
        return jsonError('Too many requests. Try later.', 429);
    }

    const { token, expiresAt } = await createToken(
        SESSION_TOKEN_SECRET,
        'create_payment_link',
        SESSION_TTL_SECONDS,
    );

    return jsonOk({ ok: true, sessionToken: token, expiresAt });
};
