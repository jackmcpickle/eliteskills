import type { APIRoute } from 'astro';
import { sendMail, isMailConfigured, getAdminEmail } from '@/libs/api/mail';
import { checkHoneypot, checkRateLimit, parseFormField, jsonError, jsonOk } from '@/libs/api/spam';

interface CheckoutPayload {
	productId: string;
	productName: string;
	price: string;
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

const parsePayload = (formData: FormData): CheckoutPayload => ({
	productId: parseFormField(formData, 'productId'),
	productName: parseFormField(formData, 'productName'),
	price: parseFormField(formData, 'price'),
	name: parseFormField(formData, 'name'),
	email: parseFormField(formData, 'email'),
	purchaseKind: parseFormField(formData, 'purchaseKind') || 'personal',
	companyName: parseFormField(formData, 'companyName'),
	addressLine1: parseFormField(formData, 'addressLine1'),
	addressLine2: parseFormField(formData, 'addressLine2'),
	city: parseFormField(formData, 'city'),
	postalCode: parseFormField(formData, 'postalCode'),
	country: parseFormField(formData, 'country'),
});

const validatePayload = (payload: CheckoutPayload): string | null => {
	if (!payload.productId || !payload.productName || !payload.price) return 'Invalid product.';
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
};

const buildAdminText = (payload: CheckoutPayload): string => {
	const receiptDetails =
		payload.purchaseKind === 'company'
			? [
					`Company: ${payload.companyName}`,
					`Address 1: ${payload.addressLine1}`,
					`Address 2: ${payload.addressLine2 || '-'}`,
					`City: ${payload.city}`,
					`Postal: ${payload.postalCode}`,
					`Country: ${payload.country}`,
				].join('\n')
			: 'No receipt requested.';

	return [
		'New Elite Skills checkout request',
		'',
		`Product: ${payload.productName} (${payload.productId})`,
		`Price: $${payload.price}`,
		`Buyer: ${payload.name}`,
		`Email: ${payload.email}`,
		`Purchase Type: ${payload.purchaseKind}`,
		'',
		'Receipt details',
		receiptDetails,
	].join('\n');
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
	if (!isMailConfigured()) return jsonError('Email service not configured.', 500);
	if (checkRateLimit(clientAddress)) return jsonError('Too many requests. Try later.', 429);

	const formData = await request.formData();
	if (checkHoneypot(formData)) return jsonOk();

	const payload = parsePayload(formData);
	const error = validatePayload(payload);
	if (error) return jsonError(error, 400);

	try {
		await sendMail({
			to: [getAdminEmail()],
			subject: `Checkout request: ${payload.productName} (${payload.email})`,
			text: buildAdminText(payload),
		});

		await sendMail({
			to: [payload.email],
			subject: `We received your ${payload.productName} checkout`,
			text: [
				`Hi ${payload.name},`,
				'',
				`Got your checkout request for ${payload.productName} ($${payload.price}).`,
				'We will follow up with payment and delivery details shortly.',
				'',
				'Thanks,',
				'Elite Skills',
			].join('\n'),
		});

		return jsonOk();
	} catch (_error) {
		return jsonError('Failed to send email.', 500);
	}
};

export const GET: APIRoute = async () => jsonOk({ ok: true, message: 'Use POST.' });
