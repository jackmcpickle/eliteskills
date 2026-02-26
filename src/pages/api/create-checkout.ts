export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { buildCheckoutMetadata } from '@/libs/api/checkout-utils';
import {
    isRateLimited,
    CREATE_CHECKOUT_IP,
    CREATE_CHECKOUT_EMAIL,
} from '@/libs/api/rate-limit';
import {
    checkHoneypot,
    parseFormField,
    jsonError,
    jsonOk,
} from '@/libs/api/spam';
import { isStripeConfigured, createCheckoutSession } from '@/libs/api/stripe';
import { createDb } from '@/libs/db/client';
import { getProductById, getProductPrice } from '@/libs/db/repo';
import { resolveContinent, resolveCountryCode } from '@/libs/geo';

const SITE_URL = 'https://eliteskills.ai';

const checkoutSchema = z
    .object({
        productId: z.coerce.number().int().positive('Invalid product.'),
        name: z.string().trim().min(1, 'Name required.'),
        email: z.string().trim().pipe(z.email('Email invalid.')),
        purchaseKind: z.enum(['personal', 'company']).default('personal'),
        companyName: z.string().trim().default(''),
        addressLine1: z.string().trim().default(''),
        addressLine2: z.string().trim().default(''),
        city: z.string().trim().default(''),
        postalCode: z.string().trim().default(''),
        country: z.string().trim().default(''),
    })
    .refine(
        (d) =>
            d.purchaseKind !== 'company' ||
            (!!d.companyName &&
                !!d.addressLine1 &&
                !!d.city &&
                !!d.postalCode &&
                !!d.country),
        {
            message: 'Complete company address required for receipt.',
            path: ['companyName'],
        },
    );

function parsePayload(formData: FormData): Record<string, string> {
    const fields = [
        'productId',
        'name',
        'email',
        'purchaseKind',
        'companyName',
        'addressLine1',
        'addressLine2',
        'city',
        'postalCode',
        'country',
    ];
    const result: Record<string, string> = {};
    for (const field of fields) {
        result[field] = parseFormField(formData, field);
    }
    return result;
}

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
    if (!isStripeConfigured()) {
        return jsonError('Payment service not configured.', 500);
    }

    if (isRateLimited('cc:ip', clientAddress, CREATE_CHECKOUT_IP)) {
        return jsonError('Too many requests. Try later.', 429);
    }

    const formData = await request.formData();
    if (checkHoneypot(formData)) return jsonOk();

    const raw = parsePayload(formData);
    const parsed = checkoutSchema.safeParse(raw);
    if (!parsed.success) {
        return jsonError(
            parsed.error.issues[0]?.message ?? 'Invalid input.',
            400,
        );
    }
    const payload = parsed.data;

    if (
        isRateLimited(
            'cc:email',
            payload.email.toLowerCase(),
            CREATE_CHECKOUT_EMAIL,
        )
    ) {
        return jsonError('Too many requests for this email. Try later.', 429);
    }

    const d1 = locals.runtime.env.DB;
    const db = createDb(d1);

    const product = await getProductById(db, payload.productId);
    if (!product) return jsonError('Invalid product.', 400);

    const cf = locals.runtime.cf as
        | { continent?: string; country?: string }
        | undefined;
    const continent = resolveContinent(
        cf,
        request.headers.get('cf-ipcontinent'),
    );
    const countryCode = resolveCountryCode(
        cf,
        request.headers.get('cf-ipcountry'),
    );

    const priceRow = await getProductPrice(
        db,
        product.id,
        continent,
        countryCode,
    );
    if (!priceRow?.stripePriceId) {
        return jsonError('Product not available in your region.', 400);
    }

    let stripeSession;
    try {
        stripeSession = await createCheckoutSession({
            productId: product.id,
            productName: product.name,
            stripePriceId: priceRow.stripePriceId,
            customerEmail: payload.email,
            customerName: payload.name,
            cancelUrl: `${SITE_URL}/checkout/${product.id}`,
            continent,
            metadata: {
                ...buildCheckoutMetadata({ ...payload, source: 'website' }),
                countryCode,
                priceCurrency: priceRow.currency,
            },
        });
    } catch (err) {
        console.error('Stripe checkout error:', err);
        return jsonError('Unable to create checkout. Please try again.', 502);
    }

    return jsonOk({ ok: true, paymentUrl: stripeSession.url });
};
