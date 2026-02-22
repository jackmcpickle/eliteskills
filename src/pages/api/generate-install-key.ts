import type { APIRoute } from 'astro';
import { createDb } from '@/libs/db/client';
import {
    getUserByAccountKey,
    getPurchasesByUserId,
    createInstallKey,
} from '@/libs/db/repo';
import { jsonError } from '@/libs/api/spam';

export const POST: APIRoute = async ({ request, locals }) => {
    const d1 = locals.runtime.env.DB;
    const db = createDb(d1);

    const formData = await request.formData();
    const purchaseId = (formData.get('purchaseId') as string)?.trim();
    const accountKey = (formData.get('accountKey') as string)?.trim();

    if (!purchaseId || !accountKey) {
        return jsonError('Missing fields.', 400);
    }

    const user = await getUserByAccountKey(db, accountKey);
    if (!user) return jsonError('Invalid account.', 403);

    const purchases = await getPurchasesByUserId(db, user.id);
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase) return jsonError('Purchase not found.', 404);

    await createInstallKey(db, purchaseId);

    return new Response(null, {
        status: 302,
        headers: {
            Location: `/account/${accountKey}`,
        },
    });
};
