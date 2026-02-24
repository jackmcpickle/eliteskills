export const prerender = false;

import type { APIRoute } from 'astro';
import { SESSION_TOKEN_SECRET, PAY_TOKEN_SECRET } from 'astro:env/server';
import { z } from 'zod';
import { sendMail, isMailConfigured, getAdminEmail } from '@/libs/api/mail';
import {
    isRateLimited,
    PAYMENT_LINK_IP,
    PAYMENT_LINK_JTI,
    PAYMENT_LINK_EMAIL,
} from '@/libs/api/rate-limit';
import { parseBearer, jsonError, jsonOk } from '@/libs/api/spam';
import { isStripeConfigured, createCheckoutSession } from '@/libs/api/stripe';
import { verifyToken, createToken } from '@/libs/api/tokens';
import { createDb } from '@/libs/db/client';
import { getProductById, getProductPrice } from '@/libs/db/repo';
import type { Continent } from '@/libs/geo';
import { resolveContinent, resolveCountryCode } from '@/libs/geo';
import { formatMoney } from '@/utils/format-money';

const SITE_URL = 'https://eliteskills.ai';

/** Pay token TTL: 1 hour */
const PAY_TOKEN_TTL_SECONDS = 3600;

const CONTINENT_CODES = ['NA', 'SA', 'EU', 'AF', 'AS', 'OC', 'AN'] as const;

const paymentLinkSchema = z
    .object({
        productId: z
            .number({
                message:
                    'productId must be a number (see /llms.txt for valid IDs)',
            })
            .int()
            .positive(),
        name: z.string().trim().min(1, 'Name required.'),
        email: z.string().trim().pipe(z.email('Email invalid.')),
        region: z.enum(CONTINENT_CODES).optional(),
        purchaseKind: z.enum(['personal', 'company']).default('personal'),
        companyName: z.string().trim().optional(),
        addressLine1: z.string().trim().optional(),
        addressLine2: z.string().trim().optional(),
        city: z.string().trim().optional(),
        postalCode: z.string().trim().optional(),
        country: z.string().trim().optional(),
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
            message:
                'Company name, addressLine1, city, postalCode, and country are required when purchaseKind is "company".',
            path: ['companyName'],
        },
    );

type PaymentLinkBody = z.infer<typeof paymentLinkSchema>;

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

    let raw: unknown;
    try {
        raw = await request.json();
    } catch {
        return jsonError('Invalid JSON body.', 400);
    }

    const parsed = paymentLinkSchema.safeParse(raw);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ');
        return jsonError(issues, 400);
    }
    const body = parsed.data;

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
    const continent: Continent =
        body.region ??
        resolveContinent(cf, request.headers.get('cf-ipcontinent'));
    const countryCode = body.region
        ? ''
        : resolveCountryCode(cf, request.headers.get('cf-ipcountry'));

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
        cancelUrl: tempPayUrl,
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
