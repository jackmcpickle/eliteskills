import type { APIRoute } from 'astro';
import { PAY_TOKEN_SECRET } from 'astro:env/server';
import { checkHoneypot, parseFormField, jsonError, jsonOk } from '@/libs/api/spam';
import { isRateLimited, CREATE_CHECKOUT_IP, CREATE_CHECKOUT_EMAIL } from '@/libs/api/rate-limit';
import { createToken } from '@/libs/api/tokens';
import { isStripeConfigured, getProduct, createCheckoutSession } from '@/libs/api/stripe';

const SITE_URL = 'https://eliteskills.ai';

/** Pay token TTL: 1 hour */
const PAY_TOKEN_TTL_SECONDS = 3600;

interface CheckoutPayload {
	productId: string;
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
		productId: parseFormField(formData, 'productId'),
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
	if (!getProduct(payload.productId)) return 'Invalid product.';
	if (!payload.name) return 'Name required.';
	if (!payload.email) return 'Email required.';

	const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
	if (!emailValid) return 'Email invalid.';

	if (payload.purchaseKind === 'company') {
		if (!payload.companyName) return 'Company name required for receipt.';
		if (!payload.addressLine1 || !payload.city || !payload.postalCode || !payload.country) {
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

export const POST: APIRoute = async ({ request, clientAddress }) => {
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

	if (isRateLimited('cc:email', payload.email.toLowerCase(), CREATE_CHECKOUT_EMAIL)) {
		return jsonError('Too many requests for this email. Try later.', 429);
	}

	const product = getProduct(payload.productId);
	if (!product) return jsonError('Invalid product.', 400);

	const { token: tempToken } = await createToken(PAY_TOKEN_SECRET, 'pay', PAY_TOKEN_TTL_SECONDS);
	const tempPayUrl = `${SITE_URL}/pay?token=${encodeURIComponent(tempToken)}`;

	const stripeSession = await createCheckoutSession({
		productId: payload.productId,
		product,
		customerEmail: payload.email,
		customerName: payload.name,
		payUrl: tempPayUrl,
		metadata: buildMetadata(payload),
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
