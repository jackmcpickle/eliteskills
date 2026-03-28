export const prerender = false;

import type { APIRoute } from 'astro';
import { z } from 'zod';

const contactSchema = z.object({
    name: z.string().trim().min(1, 'Name required.'),
    email: z.string().trim().pipe(z.email('Email invalid.')),
    message: z.string().trim().min(1, 'Message required.'),
});

function jsonError(message: string, status = 400): Response {
    return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function jsonOk(): Response {
    return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
    });
}

export const POST: APIRoute = async ({ request }) => {
    const formData = await request.formData();

    // Basic honeypot check
    if (formData.get('website')) return jsonOk();

    const nameVal = formData.get('name');
    const emailVal = formData.get('email');
    const messageVal = formData.get('message');

    const raw = {
        name: typeof nameVal === 'string' ? nameVal : '',
        email: typeof emailVal === 'string' ? emailVal : '',
        message: typeof messageVal === 'string' ? messageVal : '',
    };

    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
        return jsonError(
            parsed.error.issues[0]?.message ?? 'Invalid input.',
            400,
        );
    }

    // eslint-disable-next-line no-console -- contact form logging
    console.warn('Contact form submission:', parsed.data);

    return jsonOk();
};
