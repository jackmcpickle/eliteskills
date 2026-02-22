/**
 * Sync DB products/prices -> Stripe Products + Prices.
 *
 * Usage:
 *   pnpm stripe:sync                 # local D1
 *   pnpm stripe:sync -- --remote     # remote D1
 *   pnpm stripe:sync -- --dry-run    # no Stripe/DB writes
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import Stripe from 'stripe';

config();

const ROOT = join(import.meta.dirname ?? '.', '..');
const isRemote = process.argv.includes('--remote');
const isDryRun = process.argv.includes('--dry-run');

/** Zero-decimal currencies where unit_amount = face value (no *100). */
const ZERO_DECIMAL = new Set([
    'bif',
    'clp',
    'djf',
    'gnf',
    'jpy',
    'kmf',
    'krw',
    'mga',
    'pyg',
    'rwf',
    'ugx',
    'vnd',
    'vuv',
    'xaf',
    'xof',
    'xpf',
]);

function isZeroDecimal(currency: string): boolean {
    return ZERO_DECIMAL.has(currency.toLowerCase());
}

interface WranglerD1Result {
    success: boolean;
    results: Record<string, unknown>[];
}

interface ProductRow {
    id: number;
    code: string;
    name: string;
}

interface ProductPriceRow {
    id: number;
    product_id: number;
    continent: string;
    country_code: string;
    price: number;
    currency: string;
    stripe_price_id: string | null;
}

function readDbName(): string {
    const raw = readFileSync(join(ROOT, 'wrangler.jsonc'), 'utf-8');
    const stripped = raw.replace(/\/\/.*$/gm, '');
    const parsed = JSON.parse(stripped) as {
        d1_databases: Array<{ database_name: string }>;
    };
    return parsed.d1_databases[0].database_name;
}

function runD1Query(sql: string): Record<string, unknown>[] {
    const dbName = readDbName();
    const args = ['wrangler', 'd1', 'execute', dbName];
    if (isRemote) args.push('--remote');
    args.push('--json', '--command', sql);

    const result = spawnSync('pnpm', args, {
        cwd: ROOT,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (result.status !== 0) {
        throw new Error(
            result.stdout || result.stderr || 'wrangler d1 execute failed',
        );
    }

    const parsed = JSON.parse(result.stdout) as
        | WranglerD1Result[]
        | WranglerD1Result;
    if (Array.isArray(parsed)) return parsed[0]?.results ?? [];
    return parsed.results ?? [];
}

function esc(value: string): string {
    return value.replace(/'/g, "''");
}

/** Format price label for log output. */
function priceLabel(row: ProductPriceRow): string {
    const region = row.country_code
        ? `${row.continent}/${row.country_code}`
        : row.continent;
    return `${region} [${row.currency.toUpperCase()}] ${row.price}`;
}

async function main(): Promise<void> {
    const dbName = readDbName();
    console.log(
        `Using D1 database: ${dbName} (${isRemote ? 'remote' : 'local'})`,
    );
    if (isDryRun)
        console.log('Dry run enabled: no Stripe writes, no DB updates');

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('Set STRIPE_SECRET_KEY env var');
    const stripe = new Stripe(stripeKey);

    const products = runD1Query(
        'select id, code, name from products order by id',
    ) as ProductRow[];

    console.log(`Found ${products.length} products in DB\n`);

    for (const product of products) {
        console.log(`── ${product.name} (${product.code}) ──`);

        const existingProducts = await stripe.products.search({
            query: `metadata["db_product_id"]:"${product.id}"`,
        });

        let stripeProductId = '';
        if (existingProducts.data.length > 0) {
            stripeProductId = existingProducts.data[0].id;
            console.log(`  Stripe Product exists: ${stripeProductId}`);
        } else if (isDryRun) {
            stripeProductId = 'dry-run-product';
            console.log('  Dry run: would create Stripe Product');
        } else {
            const created = await stripe.products.create({
                name: product.name,
                metadata: {
                    db_product_id: String(product.id),
                    db_product_code: product.code,
                },
            });
            stripeProductId = created.id;
            console.log(`  Created Stripe Product: ${stripeProductId}`);
        }

        const prices = runD1Query(
            `select id, product_id, continent, country_code, price, currency, stripe_price_id from product_prices where product_id = ${product.id} order by id`,
        ) as ProductPriceRow[];

        for (const priceRow of prices) {
            if (priceRow.stripe_price_id) {
                try {
                    const existing = await stripe.prices.retrieve(
                        priceRow.stripe_price_id,
                    );
                    // Currency is immutable on Stripe Prices — recreate if mismatch
                    if (
                        existing.active &&
                        existing.currency === priceRow.currency.toLowerCase()
                    ) {
                        console.log(
                            `  ${priceLabel(priceRow)} -> ${priceRow.stripe_price_id} (exists)`,
                        );
                        continue;
                    }
                } catch {
                    // Missing/invalid old price id: create a new one below.
                }
            }

            if (isDryRun) {
                console.log(
                    `  ${priceLabel(priceRow)} -> Dry run: would create Stripe Price`,
                );
                continue;
            }

            const unitAmount = isZeroDecimal(priceRow.currency)
                ? Math.round(priceRow.price)
                : Math.round(priceRow.price * 100);

            const createdPrice = await stripe.prices.create({
                product: stripeProductId,
                unit_amount: unitAmount,
                currency: priceRow.currency.toLowerCase(),
                metadata: {
                    continent: priceRow.continent,
                    country_code: priceRow.country_code,
                    db_product_id: String(product.id),
                },
            });

            runD1Query(
                `update product_prices set stripe_price_id = '${esc(createdPrice.id)}' where id = ${priceRow.id}`,
            );

            console.log(
                `  ${priceLabel(priceRow)} -> ${createdPrice.id} (created)`,
            );
        }

        console.log('');
    }

    console.log('Sync complete.');
}

main().catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
});
