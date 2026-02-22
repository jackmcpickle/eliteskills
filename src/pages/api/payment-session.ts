import type { APIRoute } from 'astro';
import { AGENT_API_KEY, SESSION_TOKEN_SECRET } from 'astro:env/server';
import { parseBearer, timingSafeEqual, jsonError, jsonOk } from '@/libs/api/spam';
import { isRateLimited, PAYMENT_SESSION_IP, PAYMENT_SESSION_KEY } from '@/libs/api/rate-limit';
import { createToken } from '@/libs/api/tokens';

/** Session token TTL: 1 hour */
const SESSION_TTL_SECONDS = 3600;

export const POST: APIRoute = async ({ request, clientAddress }) => {
	if (!AGENT_API_KEY || !SESSION_TOKEN_SECRET) {
		return jsonError('Agent API not configured.', 500);
	}

	/* ── Rate limit ──────────────────────────────────────── */
	if (isRateLimited('ps:ip', clientAddress, PAYMENT_SESSION_IP)) {
		return jsonError('Too many requests. Try later.', 429);
	}

	/* ── Auth ────────────────────────────────────────────── */
	const bearer = parseBearer(request);
	if (!bearer || !(await timingSafeEqual(bearer, AGENT_API_KEY))) {
		return jsonError('Unauthorized.', 401);
	}

	if (isRateLimited('ps:key', AGENT_API_KEY, PAYMENT_SESSION_KEY)) {
		return jsonError('Too many requests. Try later.', 429);
	}

	/* ── Create session token ────────────────────────────── */
	const { token, expiresAt } = await createToken(
		SESSION_TOKEN_SECRET,
		'create_payment_link',
		SESSION_TTL_SECONDS,
	);

	return jsonOk({ ok: true, sessionToken: token, expiresAt });
};
