import {
    RESEND_API_KEY,
    RESEND_FROM_EMAIL,
    RESEND_TO_EMAIL,
} from 'astro:env/server';
import { Resend } from 'resend';

interface SendMailOptions {
    to: string[];
    subject: string;
    text: string;
}

function isConfigured(): boolean {
    return Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL);
}

export function isMailConfigured(): boolean {
    return isConfigured();
}

export async function sendMail(options: SendMailOptions): Promise<void> {
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
        throw new Error('Resend not configured.');
    }

    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        text: options.text,
    });
}

export function getAdminEmail(): string {
    return RESEND_TO_EMAIL ?? '';
}
