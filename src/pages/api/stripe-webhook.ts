import type { APIRoute } from 'astro';
import { STRIPE_WEBHOOK_SECRET } from 'astro:env/server';
import { jsonError, jsonOk } from '@/libs/api/spam';
import { isRateLimited, WEBHOOK_IP } from '@/libs/api/rate-limit';
import { constructWebhookEvent } from '@/libs/api/stripe';
import { sendMail, isMailConfigured, getAdminEmail } from '@/libs/api/mail';

/** Simple in-memory set for idempotency (single isolate only). */
const processedEvents = new Set<string>();
const MAX_PROCESSED = 500;

function markProcessed(eventId: string): boolean {
	if (processedEvents.has(eventId)) return false;
	if (processedEvents.size >= MAX_PROCESSED) {
		const first = processedEvents.values().next().value;
		if (first) processedEvents.delete(first);
	}
	processedEvents.add(eventId);
	return true;
}

interface CheckoutSessionData {
	id: string;
	customer_email: string | null;
	amount_total: number | null;
	metadata: Record<string, string>;
}

async function handleCheckoutCompleted(session: CheckoutSessionData): Promise<void> {
	if (!isMailConfigured()) return;

	const customerName = session.metadata?.customerName ?? 'Unknown';
	const productId = session.metadata?.productId ?? 'unknown';
	const source = session.metadata?.source ?? 'unknown';
	const email = session.customer_email ?? 'no-email';
	const amountPaid = session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : 'unknown';

	try {
		await sendMail({
			to: [getAdminEmail()],
			subject: `Payment received: ${productId} (${email})`,
			text: [
				'Payment completed',
				'',
				`Session: ${session.id}`,
				`Product: ${productId}`,
				`Amount: ${amountPaid}`,
				`Customer: ${customerName}`,
				`Email: ${email}`,
				`Source: ${source}`,
				'',
				`Purchase type: ${session.metadata?.purchaseKind ?? 'personal'}`,
				session.metadata?.companyName ? `Company: ${session.metadata.companyName}` : '',
			]
				.filter(Boolean)
				.join('\n'),
		});

		await sendMail({
			to: [email],
			subject: 'Payment confirmed — Elite Skills',
			text: [
				`Hi ${customerName},`,
				'',
				`Your payment of ${amountPaid} has been received.`,
				'We will send your skills download shortly.',
				'',
				'Thanks,',
				'Elite Skills',
			].join('\n'),
		});
	} catch {
		// Non-fatal: payment is already captured by Stripe
	}
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
	if (!STRIPE_WEBHOOK_SECRET) return jsonError('Webhook not configured.', 500);

	if (isRateLimited('wh:ip', clientAddress, WEBHOOK_IP)) {
		return jsonError('Too many requests.', 429);
	}

	const signature = request.headers.get('stripe-signature');
	if (!signature) return jsonError('Missing signature.', 400);

	const body = await request.text();

	let event;
	try {
		event = await constructWebhookEvent(body, signature, STRIPE_WEBHOOK_SECRET);
	} catch {
		return jsonError('Invalid signature.', 400);
	}

	if (!markProcessed(event.id)) {
		return jsonOk({ ok: true, message: 'Already processed.' });
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object as CheckoutSessionData;
		await handleCheckoutCompleted(session);
	}

	return jsonOk({ ok: true, received: true });
};
