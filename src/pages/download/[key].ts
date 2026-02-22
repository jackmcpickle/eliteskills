export const prerender = false;

import type { APIRoute } from 'astro';
import { createDb } from '@/libs/db/client';
import { getInstallKeyByKey, incrementDownloadCount } from '@/libs/db/repo';

export const GET: APIRoute = async ({ params, locals }) => {
    const { key } = params;
    if (!key) {
        return new Response('Not found.', { status: 404 });
    }

    const d1 = locals.runtime.env.DB;
    const db = createDb(d1);

    const installKey = await getInstallKeyByKey(db, key);
    if (!installKey) {
        return new Response('Invalid or unknown download key.', { status: 404 });
    }

    if (
        installKey.maxDownloads !== null &&
        installKey.downloadCount >= installKey.maxDownloads
    ) {
        return new Response('Download limit reached.', { status: 410 });
    }

    // Fetch zip from static assets
    const assets = locals.runtime.env.ASSETS;
    const zipResponse = await assets.fetch(
        new Request('https://placeholder/skills-bundle.zip'),
    );

    if (!zipResponse.ok) {
        return new Response('Skills bundle not found.', { status: 500 });
    }

    await incrementDownloadCount(db, installKey.id, installKey.downloadCount);

    const zipBody = await zipResponse.arrayBuffer();

    return new Response(zipBody, {
        status: 200,
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition':
                'attachment; filename="elite-skills.zip"',
            'Content-Length': zipBody.byteLength.toString(),
            'Cache-Control': 'no-store',
        },
    });
};
