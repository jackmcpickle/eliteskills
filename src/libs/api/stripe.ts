import {
    STRIPE_SECRET_KEY,
    STRIPE_PRICE_ONCE,
    STRIPE_PRICE_LIFETIME,
} from 'astro:env/server';
import type { Stripe as StripeTypes } from 'stripe';
import StripeClient from 'stripe';

const SITE_URL = 'https://eliteskills.ai';

export interface ProductInfo {
    name: string;
    price: number;
    priceId: string;
}

const PRODUCTS: Record<string, ProductInfo> = {
    once: {
        name: 'Elite AI Skills - One-Time Purchase',
        price: 29,
        priceId: STRIPE_PRICE_ONCE ?? '',
    },
    lifetime: {
        name: 'Elite AI Skills - Lifetime Access',
        price: 99,
        priceId: STRIPE_PRICE_LIFETIME ?? '',
    },
};

export function getProduct(productId: string): ProductInfo | null {
    return PRODUCTS[productId] ?? null;
}

export function isStripeConfigured(): boolean {
    return Boolean(
        STRIPE_SECRET_KEY && STRIPE_PRICE_ONCE && STRIPE_PRICE_LIFETIME,
    );
}

function getStripeClient(): StripeClient {
    if (!STRIPE_SECRET_KEY) throw new Error('Stripe not configured.');
    return new StripeClient(STRIPE_SECRET_KEY);
}

export interface CreateSessionOptions {
    productId: string;
    product: ProductInfo;
    customerEmail: string;
    customerName: string;
    payUrl: string;
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
        line_items: [{ price: opts.product.priceId, quantity: 1 }],
        success_url: `${SITE_URL}/checkout/success?product=${encodeURIComponent(opts.productId)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: opts.payUrl,
        metadata: {
            productId: opts.productId,
            customerName: opts.customerName,
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
export async function constructWebhookEvent(
    body: string,
    signature: string,
    webhookSecret: string,
): Promise<StripeTypes.Event> {
    const stripe = getStripeClient();
    return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
