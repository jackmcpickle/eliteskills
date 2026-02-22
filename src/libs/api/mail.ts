import Mailgun from 'mailgun.js';
import {
	MAILGUN_API_KEY,
	MAILGUN_DOMAIN,
	MAILGUN_FROM_EMAIL,
	MAILGUN_TO_EMAIL,
} from 'astro:env/server';

interface SendMailOptions {
	to: string[];
	subject: string;
	text: string;
}

interface MailConfig {
	apiKey: string;
	domain: string;
	from: string;
}

function getMailConfig(): MailConfig | null {
	if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_FROM_EMAIL) return null;
	return { apiKey: MAILGUN_API_KEY, domain: MAILGUN_DOMAIN, from: MAILGUN_FROM_EMAIL };
}

export function isMailConfigured(): boolean {
	return getMailConfig() !== null;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
	const config = getMailConfig();
	if (!config) throw new Error('Mailgun not configured.');

	const mailgun = new Mailgun(globalThis.FormData);
	const mg = mailgun.client({ username: 'api', key: config.apiKey });

	await mg.messages.create(config.domain, {
		from: config.from,
		to: options.to,
		subject: options.subject,
		text: options.text,
	});
}

export function getAdminEmail(): string {
	return MAILGUN_TO_EMAIL ?? '';
}
