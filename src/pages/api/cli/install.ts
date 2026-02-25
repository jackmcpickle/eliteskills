export const prerender = false;

import type { APIRoute } from 'astro';
import { jsonError, parseJsonBody } from '@/libs/api/spam';
import { createDb } from '@/libs/db/client';
import {
    getInstallKeyByKey,
    incrementDownloadCount,
    getPurchaseById,
    getProductById,
} from '@/libs/db/repo';
import { resolveDownloadZip } from '@/libs/download';

interface InstallBody {
    token: string;
    skill: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
    const body = await parseJsonBody<InstallBody>(request);
    if (!body?.token || !body?.skill) {
        return jsonError('Missing token or skill.', 400);
    }

    const { token, skill } = body;
    const d1 = locals.runtime.env.DB;
    const db = createDb(d1);

    const installKey = await getInstallKeyByKey(db, token);
    if (!installKey) {
        return jsonError('Invalid install token.', 404);
    }

    if (
        installKey.maxDownloads !== null &&
        installKey.downloadCount >= installKey.maxDownloads
    ) {
        return jsonError('Download limit reached.', 410);
    }

    const purchase = await getPurchaseById(db, installKey.purchaseId);
    if (!purchase) {
        return jsonError('Purchase not found.', 404);
    }

    const product = await getProductById(db, purchase.productId);
    if (!product) {
        return jsonError('Product not found.', 404);
    }

    // Single skill product: verify requested skill matches
    if (product.skillSlug !== null && product.skillSlug !== skill) {
        return jsonError("Token doesn't grant access to this skill.", 403);
    }

    // Resolve zip — for bundles (skillSlug=null), serve per-skill zip using skill param
    const { zipFile, fileName } = resolveDownloadZip(skill);

    const assets = locals.runtime.env.ASSETS;
    const zipResponse = await assets.fetch(
        new Request(`https://placeholder/${zipFile}`),
    );

    if (!zipResponse.ok) {
        return jsonError('Skill zip not found.', 500);
    }

    await incrementDownloadCount(db, installKey.id);

    const zipBody = await zipResponse.arrayBuffer();

    return new Response(zipBody, {
        status: 200,
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': zipBody.byteLength.toString(),
            'Cache-Control': 'no-store',
        },
    });
};
