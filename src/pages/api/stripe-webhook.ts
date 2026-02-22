import type { APIRoute } from 'astro';
import { STRIPE_WEBHOOK_SECRET } from 'astro:env/server';
import { createDb } from '@/libs/db/client';
import { upsertUserByEmail, createPurchase } from '@/libs/db/repo';
import { sendMail, isMailConfigured, getAdminEmail } from '@/libs/api/mail';
import { isRateLimited, WEBHOOK_IP } from '@/libs/api/rate-limit';
import { jsonError, jsonOk } from '@/libs/api/spam';
import { constructWebhookEvent } from '@/libs/api/stripe';

const SITE_URL = 'https://eliteskills.ai';

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
    currency: string | null;
    payment_status: string;
    metadata: Record<string, string>;
}

async function handleCheckoutCompleted(
    session: CheckoutSessionData,
    d1: D1Database,
): Promise<void> {
    const db = createDb(d1);
    const customerName = session.metadata?.customerName ?? 'Unknown';
    const productId = session.metadata?.productId ?? 'unknown';
    const source = session.metadata?.source ?? 'unknown';
    const email = session.customer_email ?? 'no-email';
    const amountPaid = session.amount_total
        ? `$${(session.amount_total / 100).toFixed(2)}`
        : 'unknown';

    // Persist user + purchase
    const user = await upsertUserByEmail(db, email, customerName);
    await createPurchase(db, {
        userId: user.id,
        stripeSessionId: session.id,
        stripeCustomerEmail: email,
        productId,
        amountTotal: session.amount_total,
        currency: session.currency ?? 'usd',
        paymentStatus: session.payment_status,
        metadata: session.metadata,
    });

    const accountUrl = `${SITE_URL}/account/${user.accountKey}`;

    if (!isMailConfigured()) return;

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
                `Account: ${accountUrl}`,
                '',
                `Purchase type: ${session.metadata?.purchaseKind ?? 'personal'}`,
                session.metadata?.companyName
                    ? `Company: ${session.metadata.companyName}`
                    : '',
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
                '',
                'Access your account and download your skills here:',
                accountUrl,
                '',
                'Thanks,',
                'Elite Skills',
            ].join('\n'),
        });
    } catch {
        // Non-fatal: payment is already captured by Stripe
    }
}

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
    if (!STRIPE_WEBHOOK_SECRET)
        return jsonError('Webhook not configured.', 500);

    if (isRateLimited('wh:ip', clientAddress, WEBHOOK_IP)) {
        return jsonError('Too many requests.', 429);
    }

    const signature = request.headers.get('stripe-signature');
    if (!signature) return jsonError('Missing signature.', 400);

    const body = await request.text();

    let event;
    try {
        event = await constructWebhookEvent(
            body,
            signature,
            STRIPE_WEBHOOK_SECRET,
        );
    } catch {
        return jsonError('Invalid signature.', 400);
    }

    if (!markProcessed(event.id)) {
        return jsonOk({ ok: true, message: 'Already processed.' });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as CheckoutSessionData;
        const d1 = locals.runtime.env.DB;
        await handleCheckoutCompleted(session, d1);
    }

    return jsonOk({ ok: true, received: true });
};
