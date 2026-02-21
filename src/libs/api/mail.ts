import Mailgun from 'mailgun.js';

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

const getMailConfig = (): MailConfig | null => {
	const apiKey = import.meta.env.MAILGUN_API_KEY;
	const domain = import.meta.env.MAILGUN_DOMAIN;
	const from = import.meta.env.MAILGUN_FROM_EMAIL;

	if (!apiKey || !domain || !from) return null;
	return { apiKey, domain, from };
};

export const isMailConfigured = (): boolean => getMailConfig() !== null;

export const sendMail = async (options: SendMailOptions): Promise<void> => {
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
};

export const getAdminEmail = (): string => {
	return import.meta.env.MAILGUN_TO_EMAIL ?? '';
};
