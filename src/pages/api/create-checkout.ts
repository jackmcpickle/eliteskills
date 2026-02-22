import type { APIRoute } from 'astro';
import { PAY_TOKEN_SECRET } from 'astro:env/server';
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
import { createToken } from '@/libs/api/tokens';
import { createDb } from '@/libs/db/client';
import { getProductById, getProductPrice } from '@/libs/db/repo';
import { resolveContinent, resolveCountryCode } from '@/libs/geo';

const SITE_URL = 'https://eliteskills.ai';

/** Pay token TTL: 1 hour */
const PAY_TOKEN_TTL_SECONDS = 3600;

interface CheckoutPayload {
    productId: number;
    name: string;
    email: string;
    purchaseKind: string;
    companyName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postalCode: string;
    country: string;
}

function parsePayload(formData: FormData): CheckoutPayload {
    return {
        productId: Number(parseFormField(formData, 'productId')) || 0,
        name: parseFormField(formData, 'name'),
        email: parseFormField(formData, 'email'),
        purchaseKind: parseFormField(formData, 'purchaseKind') || 'personal',
        companyName: parseFormField(formData, 'companyName'),
        addressLine1: parseFormField(formData, 'addressLine1'),
        addressLine2: parseFormField(formData, 'addressLine2'),
        city: parseFormField(formData, 'city'),
        postalCode: parseFormField(formData, 'postalCode'),
        country: parseFormField(formData, 'country'),
    };
}

function validatePayload(payload: CheckoutPayload): string | null {
    if (!payload.productId) return 'Invalid product.';
    if (!payload.name) return 'Name required.';
    if (!payload.email) return 'Email required.';

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
    if (!emailValid) return 'Email invalid.';

    if (payload.purchaseKind === 'company') {
        if (!payload.companyName) return 'Company name required for receipt.';
        if (
            !payload.addressLine1 ||
            !payload.city ||
            !payload.postalCode ||
            !payload.country
        ) {
            return 'Complete company address required for receipt.';
        }
    }

    return null;
}

function buildMetadata(payload: CheckoutPayload): Record<string, string> {
    const base: Record<string, string> = {
        customerName: payload.name,
        source: 'website',
    };

    if (payload.purchaseKind === 'company') {
        return {
            ...base,
            purchaseKind: 'company',
            companyName: payload.companyName,
            addressLine1: payload.addressLine1,
            addressLine2: payload.addressLine2,
            city: payload.city,
            postalCode: payload.postalCode,
            country: payload.country,
        };
    }

    return { ...base, purchaseKind: 'personal' };
}

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
    if (!PAY_TOKEN_SECRET || !isStripeConfigured()) {
        return jsonError('Payment service not configured.', 500);
    }

    if (isRateLimited('cc:ip', clientAddress, CREATE_CHECKOUT_IP)) {
        return jsonError('Too many requests. Try later.', 429);
    }

    const formData = await request.formData();
    if (checkHoneypot(formData)) return jsonOk();

    const payload = parsePayload(formData);
    const error = validatePayload(payload);
    if (error) return jsonError(error, 400);

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

    const { token: tempToken } = await createToken(
        PAY_TOKEN_SECRET,
        'pay',
        PAY_TOKEN_TTL_SECONDS,
    );
    const tempPayUrl = `${SITE_URL}/pay?token=${encodeURIComponent(tempToken)}`;

    const stripeSession = await createCheckoutSession({
        productId: product.id,
        productName: product.name,
        stripePriceId: priceRow.stripePriceId,
        customerEmail: payload.email,
        customerName: payload.name,
        payUrl: tempPayUrl,
        continent,
        metadata: {
            ...buildMetadata(payload),
            countryCode,
            priceCurrency: priceRow.currency,
        },
    });

    const { token: payToken } = await createToken(
        PAY_TOKEN_SECRET,
        'pay',
        PAY_TOKEN_TTL_SECONDS,
        stripeSession.id,
    );

    const paymentUrl = `${SITE_URL}/pay?token=${encodeURIComponent(payToken)}`;

    return jsonOk({ ok: true, paymentUrl });
};
