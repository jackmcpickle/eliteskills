/**
 * Sync DB products/prices → Stripe Products + Prices.
 *
 * Uses wrangler d1 execute as sqlite-proxy backend so no D1 HTTP API needed.
 *
 * Usage:
 *   pnpm stripe:sync            # local D1
 *   pnpm stripe:sync --remote   # remote D1
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import Stripe from 'stripe';
import * as schema from '../src/libs/db/schema.js';

// ── Config ─────────────────────────────────────────────────────────

const ROOT = join(import.meta.dirname ?? '.', '..');

function readDbName(): string {
    const raw = readFileSync(join(ROOT, 'wrangler.jsonc'), 'utf-8');
    // Strip // comments for JSON.parse
    const stripped = raw.replace(/\/\/.*$/gm, '');
    const config = JSON.parse(stripped) as {
        d1_databases: Array<{ database_name: string }>;
    };
    return config.d1_databases[0].database_name;
}

const isRemote = process.argv.includes('--remote');
const dbName = readDbName();
const remoteFlag = isRemote ? '--remote' : '';

console.log(`Using D1 database: ${dbName} (${isRemote ? 'remote' : 'local'})`);

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    console.error('Set STRIPE_SECRET_KEY env var');
    process.exit(1);
}
const stripe = new Stripe(stripeKey);

// ── D1 via wrangler sqlite-proxy ───────────────────────────────────

interface WranglerD1Result {
    success: boolean;
    results: Record<string, unknown>[];
}

function wranglerQuery(sql: string): Record<string, unknown>[] {
    const escaped = sql.replace(/'/g, "'\\''");
    const cmd = `pnpm wrangler d1 execute ${dbName} ${remoteFlag} --json --command='${escaped}'`;
    const stdout = execSync(cmd, {
        cwd: ROOT,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    const parsed = JSON.parse(stdout) as WranglerD1Result[];
    return parsed[0]?.results ?? [];
}

const db = drizzle<typeof schema>(
    async (sql, params, method) => {
        // Build SQL with params interpolated (sqlite-proxy requirement)
        let query = sql;
        if (params.length > 0) {
            for (const param of params) {
                const value =
                    param === null
                        ? 'NULL'
                        : typeof param === 'number'
                          ? String(param)
                          : `'${String(param).replace(/'/g, "''")}'`;
                query = query.replace('?', value);
            }
        }

        const rows = wranglerQuery(query);

        if (method === 'get') {
            return { rows: rows[0] ? [rows[0]] : [] };
        }
        return { rows };
    },
    { schema },
);

// ── Sync logic ─────────────────────────────────────────────────────

async function syncProducts(): Promise<void> {
    const products = await db
        .select()
        .from(schema.products)
        .all();

    console.log(`Found ${products.length} products in DB\n`);

    for (const product of products) {
        console.log(`── ${product.name} (${product.code}) ──`);

        // Find or create Stripe Product
        const existingProducts = await stripe.products.search({
            query: `metadata["db_product_id"]:"${product.id}"`,
        });

        let stripeProduct: Stripe.Product;
        if (existingProducts.data.length > 0) {
            stripeProduct = existingProducts.data[0];
            console.log(`  Stripe Product exists: ${stripeProduct.id}`);
        } else {
            stripeProduct = await stripe.products.create({
                name: product.name,
                metadata: {
                    db_product_id: String(product.id),
                    db_product_code: product.code,
                },
            });
            console.log(`  Created Stripe Product: ${stripeProduct.id}`);
        }

        // Get all prices for this product
        const prices = await db
            .select()
            .from(schema.productPrices)
            .where(eq(schema.productPrices.productId, product.id))
            .all();

        for (const priceRow of prices) {
            if (priceRow.stripePriceId) {
                // Verify it still exists on Stripe
                try {
                    const existing = await stripe.prices.retrieve(
                        priceRow.stripePriceId,
                    );
                    if (existing.active) {
                        console.log(
                            `  ${priceRow.continent}: $${priceRow.price} → ${priceRow.stripePriceId} (exists)`,
                        );
                        continue;
                    }
                } catch {
                    // Price doesn't exist, create it
                }
            }

            // Create Stripe Price
            const stripePrice = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: Math.round(priceRow.price * 100),
                currency: 'usd',
                metadata: {
                    continent: priceRow.continent,
                    db_product_id: String(product.id),
                },
            });

            // Update DB with stripe_price_id
            const updateSql = `UPDATE product_prices SET stripe_price_id = '${stripePrice.id}' WHERE id = ${priceRow.id}`;
            wranglerQuery(updateSql);

            console.log(
                `  ${priceRow.continent}: $${priceRow.price} → ${stripePrice.id} (created)`,
            );
        }

        console.log('');
    }

    console.log('Sync complete.');
}

syncProducts().catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
});
