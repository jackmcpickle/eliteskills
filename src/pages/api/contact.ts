import type { APIRoute } from 'astro';
import { sendMail, isMailConfigured, getAdminEmail } from '@/libs/api/mail';
import { checkHoneypot, checkRateLimit, parseFormField, jsonError, jsonOk } from '@/libs/api/spam';

interface ContactPayload {
	name: string;
	email: string;
	message: string;
}

const parsePayload = (formData: FormData): ContactPayload => ({
	name: parseFormField(formData, 'name'),
	email: parseFormField(formData, 'email'),
	message: parseFormField(formData, 'message'),
});

const validatePayload = (payload: ContactPayload): string | null => {
	if (!payload.name) return 'Name required.';
	if (!payload.email) return 'Email required.';
	if (!payload.message) return 'Message required.';

	const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
	if (!emailValid) return 'Email invalid.';

	return null;
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
			subject: `Contact: ${payload.name} (${payload.email})`,
			text: [
				'New contact form message',
				'',
				`Name: ${payload.name}`,
				`Email: ${payload.email}`,
				'',
				'Body',
				payload.message,
			].join('\n'),
		});

		await sendMail({
			to: [payload.email],
			subject: 'We received your message',
			text: [
				`Hi ${payload.name},`,
				'',
				'Got your message. We will reply soon.',
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
