export const prerender = false;

import type { APIRoute } from 'astro';
import { createDb } from '@/libs/db/client';
import {
    getInstallKeyByKey,
    incrementDownloadCount,
    getPurchaseById,
    getProductById,
} from '@/libs/db/repo';
import { resolveDownloadZip } from '@/libs/download';

export const GET: APIRoute = async ({ params, locals }) => {
    const { key } = params;
    if (!key) {
        return new Response('Not found.', { status: 404 });
    }

    const d1 = locals.runtime.env.DB;
    const db = createDb(d1);

    const installKey = await getInstallKeyByKey(db, key);
    if (!installKey) {
        return new Response('Invalid or unknown download key.', {
            status: 404,
        });
    }

    if (
        installKey.maxDownloads !== null &&
        installKey.downloadCount >= installKey.maxDownloads
    ) {
        return new Response('Download limit reached.', { status: 410 });
    }

    // Resolve product to determine zip file
    const purchase = await getPurchaseById(db, installKey.purchaseId);
    if (!purchase) {
        return new Response('Purchase not found.', { status: 404 });
    }

    const product = await getProductById(db, purchase.productId);
    if (!product) {
        return new Response('Product not found.', { status: 404 });
    }

    const { zipFile, fileName } = resolveDownloadZip(product.skillSlug);

    const assets = locals.runtime.env.ASSETS;
    const zipResponse = await assets.fetch(
        new Request(`https://placeholder/${zipFile}`),
    );

    if (!zipResponse.ok) {
        return new Response('Skills bundle not found.', { status: 500 });
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
