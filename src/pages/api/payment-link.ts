export const prerender = false;

import type { APIRoute } from 'astro';
import { SESSION_TOKEN_SECRET, PAY_TOKEN_SECRET } from 'astro:env/server';
import { sendMail, isMailConfigured, getAdminEmail } from '@/libs/api/mail';
import {
    isRateLimited,
    PAYMENT_LINK_IP,
    PAYMENT_LINK_JTI,
    PAYMENT_LINK_EMAIL,
} from '@/libs/api/rate-limit';
import { parseBearer, parseJsonBody, jsonError, jsonOk } from '@/libs/api/spam';
import { isStripeConfigured, createCheckoutSession } from '@/libs/api/stripe';
import { verifyToken, createToken } from '@/libs/api/tokens';
import { createDb } from '@/libs/db/client';
import { getProductById, getProductPrice } from '@/libs/db/repo';
import { resolveContinent, resolveCountryCode } from '@/libs/geo';
import { formatMoney } from '@/utils/format-money';

const SITE_URL = 'https://eliteskills.ai';

/** Pay token TTL: 1 hour */
const PAY_TOKEN_TTL_SECONDS = 3600;

interface PaymentLinkBody {
    productId: number;
    name: string;
    email: string;
    purchaseKind?: string;
    companyName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
}

function validateBody(body: PaymentLinkBody): string | null {
    if (!body.productId) return 'Invalid product.';
    if (!body.name?.trim()) return 'Name required.';
    if (!body.email?.trim()) return 'Email required.';

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email);
    if (!emailValid) return 'Email invalid.';

    if (body.purchaseKind === 'company') {
        if (!body.companyName?.trim())
            return 'Company name required for receipt.';
        if (
            !body.addressLine1?.trim() ||
            !body.city?.trim() ||
            !body.postalCode?.trim() ||
            !body.country?.trim()
        ) {
            return 'Complete company address required for receipt.';
        }
    }

    return null;
}

function buildMetadata(body: PaymentLinkBody): Record<string, string> {
    const base: Record<string, string> = {
        customerName: body.name.trim(),
        source: 'agent',
    };

    if (body.purchaseKind === 'company') {
        return {
            ...base,
            purchaseKind: 'company',
            companyName: body.companyName?.trim() ?? '',
            addressLine1: body.addressLine1?.trim() ?? '',
            addressLine2: body.addressLine2?.trim() ?? '',
            city: body.city?.trim() ?? '',
            postalCode: body.postalCode?.trim() ?? '',
            country: body.country?.trim() ?? '',
        };
    }

    return { ...base, purchaseKind: 'personal' };
}

async function sendPaymentEmails(
    body: PaymentLinkBody,
    productName: string,
    productPrice: number,
    priceCurrency: string,
    productId: number,
    stripeSessionId: string,
    paymentUrl: string,
): Promise<void> {
    if (!isMailConfigured()) return;

    const formattedPrice = formatMoney(productPrice, priceCurrency);

    try {
        await sendMail({
            to: [body.email.trim()],
            subject: `Your ${productName} payment link`,
            text: [
                `Hi ${body.name.trim()},`,
                '',
                `Here is your payment link for ${productName} (${formattedPrice}):`,
                '',
                paymentUrl,
                '',
                'This link expires in 1 hour.',
                '',
                'Thanks,',
                'Elite Skills',
            ].join('\n'),
        });

        await sendMail({
            to: [getAdminEmail()],
            subject: `Payment link created: ${productName} (${body.email})`,
            text: [
                'Payment link created via agent API',
                '',
                `Product: ${productName} (${productId})`,
                `Price: ${formattedPrice}`,
                `Buyer: ${body.name.trim()}`,
                `Email: ${body.email.trim()}`,
                `Purchase type: ${body.purchaseKind ?? 'personal'}`,
                `Source: agent`,
                `Stripe session: ${stripeSessionId}`,
                '',
                `Payment URL: ${paymentUrl}`,
            ].join('\n'),
        });
    } catch {
        // Email failure is non-fatal — the URL is still returned
    }
}

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
    if (!SESSION_TOKEN_SECRET || !PAY_TOKEN_SECRET || !isStripeConfigured()) {
        return jsonError('Payment service not configured.', 500);
    }

    if (isRateLimited('pl:ip', clientAddress, PAYMENT_LINK_IP)) {
        return jsonError('Too many requests. Try later.', 429);
    }

    const bearer = parseBearer(request);
    if (!bearer) return jsonError('Unauthorized.', 401);

    const tokenPayload = await verifyToken(
        bearer,
        SESSION_TOKEN_SECRET,
        'create_payment_link',
    );
    if (!tokenPayload)
        return jsonError('Invalid or expired session token.', 401);

    if (isRateLimited('pl:jti', tokenPayload.jti, PAYMENT_LINK_JTI)) {
        return jsonError('Too many requests on this session. Try later.', 429);
    }

    const body = await parseJsonBody<PaymentLinkBody>(request);
    if (!body) return jsonError('Invalid JSON body.', 400);

    const error = validateBody(body);
    if (error) return jsonError(error, 400);

    if (
        isRateLimited('pl:email', body.email.toLowerCase(), PAYMENT_LINK_EMAIL)
    ) {
        return jsonError('Too many requests for this email. Try later.', 429);
    }

    const d1 = locals.runtime.env.DB;
    const db = createDb(d1);

    const product = await getProductById(db, body.productId);
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

    const { token: tempPayToken } = await createToken(
        PAY_TOKEN_SECRET,
        'pay',
        PAY_TOKEN_TTL_SECONDS,
    );
    const tempPayUrl = `${SITE_URL}/pay?token=${encodeURIComponent(tempPayToken)}`;

    const stripeSession = await createCheckoutSession({
        productId: product.id,
        productName: product.name,
        stripePriceId: priceRow.stripePriceId,
        customerEmail: body.email.trim(),
        customerName: body.name.trim(),
        payUrl: tempPayUrl,
        continent,
        metadata: {
            ...buildMetadata(body),
            countryCode,
            priceCurrency: priceRow.currency,
        },
    });

    const { token: finalPayToken } = await createToken(
        PAY_TOKEN_SECRET,
        'pay',
        PAY_TOKEN_TTL_SECONDS,
        stripeSession.id,
    );

    const paymentUrl = `${SITE_URL}/pay?token=${encodeURIComponent(finalPayToken)}`;

    await sendPaymentEmails(
        body,
        product.name,
        priceRow.price,
        priceRow.currency,
        product.id,
        stripeSession.id,
        paymentUrl,
    );

    return jsonOk({ ok: true, paymentUrl });
};
