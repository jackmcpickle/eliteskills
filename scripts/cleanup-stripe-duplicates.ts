/**
 * Cleanup duplicate Stripe products created for same db_product_id metadata.
 *
 * Keeps product referenced by DB stripe_price_id rows.
 * Archives other duplicate products + deactivates their prices.
 *
 * Usage:
 *   pnpm stripe:cleanup -- --remote
 *   pnpm stripe:cleanup -- --remote --dry-run
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Stripe from 'stripe';
import { config } from 'dotenv';

config();

const ROOT = join(import.meta.dirname ?? '.', '..');
const isRemote = process.argv.includes('--remote');
const isDryRun = process.argv.includes('--dry-run');

interface WranglerD1Result {
    success: boolean;
    results: Record<string, unknown>[];
}

interface ProductRow {
    id: number;
    code: string;
}

interface ProductPriceRow {
    product_id: number;
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
        throw new Error(result.stdout || result.stderr || 'wrangler d1 execute failed');
    }

    const parsed = JSON.parse(result.stdout) as WranglerD1Result[] | WranglerD1Result;
    if (Array.isArray(parsed)) return parsed[0]?.results ?? [];
    return parsed.results ?? [];
}

async function main(): Promise<void> {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error('Set STRIPE_SECRET_KEY env var');
    const stripe = new Stripe(stripeKey);

    const dbName = readDbName();
    console.log(`Using D1 database: ${dbName} (${isRemote ? 'remote' : 'local'})`);
    if (isDryRun) console.log('Dry run enabled: no Stripe writes');

    const products = runD1Query('select id, code from products order by id') as ProductRow[];
    const priceRows = runD1Query(
        'select product_id, stripe_price_id from product_prices where stripe_price_id is not null',
    ) as ProductPriceRow[];

    const expectedPriceIdsByProduct = new Map<number, Set<string>>();
    for (const row of priceRows) {
        if (!row.stripe_price_id) continue;
        const set = expectedPriceIdsByProduct.get(row.product_id) ?? new Set<string>();
        set.add(row.stripe_price_id);
        expectedPriceIdsByProduct.set(row.product_id, set);
    }

    let archivedProducts = 0;
    let deactivatedPrices = 0;

    for (const dbProduct of products) {
        const search = await stripe.products.search({
            query: `metadata["db_product_id"]:"${dbProduct.id}"`,
            limit: 100,
        });
        const stripeProducts = search.data;

        if (stripeProducts.length <= 1) continue;

        const expectedPriceIds = expectedPriceIdsByProduct.get(dbProduct.id) ?? new Set<string>();

        // Keep product owning most DB-referenced prices.
        let keeperId = stripeProducts[0].id;
        let bestScore = -1;

        for (const candidate of stripeProducts) {
            let score = 0;
            for (const priceId of expectedPriceIds) {
                try {
                    const price = await stripe.prices.retrieve(priceId);
                    const owner =
                        typeof price.product === 'string'
                            ? price.product
                            : price.product.id;
                    if (owner === candidate.id) score += 1;
                } catch {
                    // Ignore missing prices during scoring.
                }
            }

            if (score > bestScore) {
                bestScore = score;
                keeperId = candidate.id;
            }
        }

        console.log(
            `db_product_id=${dbProduct.id} (${dbProduct.code}) duplicates=${stripeProducts.length} keeper=${keeperId}`,
        );

        for (const product of stripeProducts) {
            if (product.id === keeperId) continue;

            const prices = await stripe.prices.list({ product: product.id, limit: 100 });
            for (const price of prices.data) {
                if (price.active) {
                    if (isDryRun) {
                        console.log(`  DRY deactivate price ${price.id}`);
                    } else {
                        await stripe.prices.update(price.id, { active: false });
                    }
                    deactivatedPrices += 1;
                }
            }

            if (product.active) {
                if (isDryRun) {
                    console.log(`  DRY archive product ${product.id}`);
                } else {
                    await stripe.products.update(product.id, { active: false });
                }
                archivedProducts += 1;
            }
        }
    }

    console.log(
        `Cleanup complete. archived_products=${archivedProducts} deactivated_prices=${deactivatedPrices}`,
    );
}

main().catch((err) => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
