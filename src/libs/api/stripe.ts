import { STRIPE_SECRET_KEY } from 'astro:env/server';
import type { Stripe as StripeTypes } from 'stripe';
import StripeClient from 'stripe';

const SITE_URL = 'https://eliteskills.ai';

export function isStripeConfigured(): boolean {
    return Boolean(STRIPE_SECRET_KEY);
}

function getStripeClient(): StripeClient {
    if (!STRIPE_SECRET_KEY) throw new Error('Stripe not configured.');
    return new StripeClient(STRIPE_SECRET_KEY);
}

export interface CreateSessionOptions {
    productId: number;
    productName: string;
    stripePriceId: string;
    customerEmail: string;
    customerName: string;
    cancelUrl: string;
    continent: string;
    metadata?: Record<string, string>;
}

/** Create a hosted Stripe Checkout Session (one-time payment). */
export async function createCheckoutSession(
    opts: CreateSessionOptions,
): Promise<StripeTypes.Checkout.Session> {
    const stripe = getStripeClient();

    return stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: opts.customerEmail,
        line_items: [{ price: opts.stripePriceId, quantity: 1 }],
        success_url: `${SITE_URL}/checkout/success?product=${opts.productId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: opts.cancelUrl,
        metadata: {
            productId: String(opts.productId),
            customerName: opts.customerName,
            continent: opts.continent,
            ...opts.metadata,
        },
    });
}

/** Retrieve a Stripe Checkout Session by id. */
export async function getCheckoutSession(
    sessionId: string,
): Promise<StripeTypes.Checkout.Session> {
    const stripe = getStripeClient();
    return stripe.checkout.sessions.retrieve(sessionId);
}

/** Construct and verify a Stripe webhook event. */
export function constructWebhookEvent(
    body: string,
    signature: string,
    webhookSecret: string,
): StripeTypes.Event {
    const stripe = getStripeClient();
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

/** Retrieve a Stripe Price by id (for sync script validation). */
export async function getStripePrice(
    priceId: string,
): Promise<StripeTypes.Price> {
    const stripe = getStripeClient();
    return stripe.prices.retrieve(priceId);
}

/** Create a Stripe Product. */
export async function createStripeProduct(
    name: string,
    metadata: Record<string, string>,
): Promise<StripeTypes.Product> {
    const stripe = getStripeClient();
    return stripe.products.create({ name, metadata });
}

/** Create a Stripe Price for a product. */
export async function createStripePrice(
    stripeProductId: string,
    unitAmount: number,
    currency: string,
): Promise<StripeTypes.Price> {
    const stripe = getStripeClient();
    return stripe.prices.create({
        product: stripeProductId,
        unit_amount: unitAmount,
        currency,
    });
}
