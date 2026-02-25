export const prerender = false;

import type { APIRoute } from 'astro';
import { createDb } from '@/libs/db/client';
import { listProducts, getProductPrice } from '@/libs/db/repo';
import {
    resolveContinent,
    resolveCountryCode,
    resolveLocale,
} from '@/libs/geo';

export const GET: APIRoute = async ({ request, locals }) => {
    const d1 = locals.runtime.env.DB;
    const db = createDb(d1);

    const cf = locals.runtime.cf as
        | { continent?: string; country?: string }
        | undefined;
    const continent = resolveContinent(
        cf,
        request.headers.get('cf-ipcontinent'),
    );
    const countryCode = resolveCountryCode(
        cf,
        request.headers.get('cf-ipcountry'),
    );
    const locale = resolveLocale(countryCode);

    const dbProducts = await listProducts(db);
    const priceRows = await Promise.all(
        dbProducts.map(async (p) =>
            getProductPrice(db, p.id, continent, countryCode),
        ),
    );

    const prices: Record<number, { price: number; currency: string }> = {};
    for (let i = 0; i < dbProducts.length; i += 1) {
        const p = dbProducts[i];
        if (!p) continue;
        const row = priceRows[i];
        prices[p.id] = {
            price: row?.price ?? 0,
            currency: row?.currency ?? 'usd',
        };
    }

    return new Response(JSON.stringify({ locale, continent, prices }), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, max-age=3600',
        },
    });
};
