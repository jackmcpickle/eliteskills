export const prerender = false;

import type { APIRoute } from 'astro';
import { jsonError } from '@/libs/api/spam';
import { createDb } from '@/libs/db/client';
import { getUserByAccountKey, updateUserName } from '@/libs/db/repo';

export const POST: APIRoute = async ({ request, locals }) => {
    const d1 = locals.runtime.env.DB;
    const db = createDb(d1);

    const formData = await request.formData();
    const accountKey = (formData.get('accountKey') as string)?.trim();
    const name = (formData.get('name') as string)?.trim();

    if (!accountKey || !name) return jsonError('Missing fields.', 400);
    if (name.length > 100) return jsonError('Name too long.', 400);

    const user = await getUserByAccountKey(db, accountKey);
    if (!user) return jsonError('Invalid account.', 403);

    await updateUserName(db, accountKey, name);

    return new Response(null, {
        status: 302,
        headers: { Location: `/account/${accountKey}` },
    });
};
