export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { sendMail, isMailConfigured, getAdminEmail } from '@/libs/api/mail';
import { isRateLimited, CONTACT_IP } from '@/libs/api/rate-limit';
import {
    checkHoneypot,
    parseFormField,
    jsonError,
    jsonOk,
} from '@/libs/api/spam';

const contactSchema = z.object({
    name: z.string().trim().min(1, 'Name required.'),
    email: z.string().trim().pipe(z.email('Email invalid.')),
    message: z.string().trim().min(1, 'Message required.'),
});

export const POST: APIRoute = async ({ request, clientAddress }) => {
    if (!isMailConfigured())
        return jsonError('Email service not configured.', 500);
    if (isRateLimited('contact:ip', clientAddress, CONTACT_IP))
        return jsonError('Too many requests. Try later.', 429);

    const formData = await request.formData();
    if (checkHoneypot(formData)) return jsonOk();

    const raw = {
        name: parseFormField(formData, 'name'),
        email: parseFormField(formData, 'email'),
        message: parseFormField(formData, 'message'),
    };
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
        return jsonError(
            parsed.error.issues[0]?.message ?? 'Invalid input.',
            400,
        );
    }
    const payload = parsed.data;

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
    } catch {
        return jsonError('Failed to send email.', 500);
    }
};
