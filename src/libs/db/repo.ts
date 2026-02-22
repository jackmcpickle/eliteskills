import { eq, and } from 'drizzle-orm';
import type { AppDb } from './client';
import {
    users,
    purchases,
    installKeys,
    products,
    productPrices,
} from './schema';

function generateId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function now(): string {
    return new Date().toISOString();
}

// ── Users ──────────────────────────────────────────────────────────

/** Upsert user by email. Returns user row. */
export async function upsertUserByEmail(
    db: AppDb,
    email: string,
    name?: string | null,
): Promise<typeof users.$inferSelect> {
    const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .get();

    if (existing) {
        if (name && name !== existing.name) {
            await db
                .update(users)
                .set({ name, updatedAt: now() })
                .where(eq(users.id, existing.id));
            return { ...existing, name, updatedAt: now() };
        }
        return existing;
    }

    const id = generateId();
    const accountKey = generateId();
    const timestamp = now();
    const row = {
        id,
        email: email.toLowerCase(),
        name: name ?? null,
        accountKey,
        createdAt: timestamp,
        updatedAt: timestamp,
    } satisfies typeof users.$inferInsert;

    await db.insert(users).values(row);
    return row;
}

/** Get user by account key. */
export async function getUserByAccountKey(
    db: AppDb,
    accountKey: string,
): Promise<typeof users.$inferSelect | undefined> {
    return db
        .select()
        .from(users)
        .where(eq(users.accountKey, accountKey))
        .get();
}

/** Get user by email. */
export async function getUserByEmail(
    db: AppDb,
    email: string,
): Promise<typeof users.$inferSelect | undefined> {
    return db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .get();
}

// ── Products ───────────────────────────────────────────────────────

/** Get product by id. */
export async function getProductById(
    db: AppDb,
    id: number,
): Promise<typeof products.$inferSelect | undefined> {
    return db.select().from(products).where(eq(products.id, id)).get();
}

/** Get product by code. */
export async function getProductByCode(
    db: AppDb,
    code: string,
): Promise<typeof products.$inferSelect | undefined> {
    return db.select().from(products).where(eq(products.code, code)).get();
}

/** List all products. */
export async function listProducts(
    db: AppDb,
): Promise<Array<typeof products.$inferSelect>> {
    return db.select().from(products).all();
}

/** List skill products (skill_slug not null). */
export async function listSkillProducts(
    db: AppDb,
): Promise<Array<typeof products.$inferSelect>> {
    const all = await db.select().from(products).all();
    return all.filter((p) => p.skillSlug !== null);
}

/** List bundle products (skill_slug is null). */
export async function listBundleProducts(
    db: AppDb,
): Promise<Array<typeof products.$inferSelect>> {
    const all = await db.select().from(products).all();
    return all.filter((p) => p.skillSlug === null);
}

// ── Product Prices ─────────────────────────────────────────────────

/** Get price for product + continent. */
export async function getProductPrice(
    db: AppDb,
    productId: number,
    continent: string,
): Promise<typeof productPrices.$inferSelect | undefined> {
    return db
        .select()
        .from(productPrices)
        .where(
            and(
                eq(productPrices.productId, productId),
                eq(productPrices.continent, continent),
            ),
        )
        .get();
}

/** Get all prices for a product. */
export async function getProductPrices(
    db: AppDb,
    productId: number,
): Promise<Array<typeof productPrices.$inferSelect>> {
    return db
        .select()
        .from(productPrices)
        .where(eq(productPrices.productId, productId))
        .all();
}

/** Update stripe_price_id on a product_prices row. */
export async function updateStripePriceId(
    db: AppDb,
    priceRowId: number,
    stripePriceId: string,
): Promise<void> {
    await db
        .update(productPrices)
        .set({ stripePriceId })
        .where(eq(productPrices.id, priceRowId));
}

// ── Purchases ──────────────────────────────────────────────────────

/** Create purchase from Stripe session data. Idempotent by stripe_session_id. */
export async function createPurchase(
    db: AppDb,
    data: {
        userId: string;
        stripeSessionId: string;
        stripeCustomerEmail?: string | null;
        productId: number;
        amountTotal?: number | null;
        currency?: string;
        paymentStatus: string;
        pricingContinent?: string | null;
        priceSnapshot?: number | null;
        metadata?: Record<string, string>;
    },
): Promise<typeof purchases.$inferSelect> {
    const existing = await db
        .select()
        .from(purchases)
        .where(eq(purchases.stripeSessionId, data.stripeSessionId))
        .get();

    if (existing) return existing;

    const id = generateId();
    const row = {
        id,
        userId: data.userId,
        stripeSessionId: data.stripeSessionId,
        stripeCustomerEmail: data.stripeCustomerEmail ?? null,
        productId: data.productId,
        amountTotal: data.amountTotal ?? null,
        currency: data.currency ?? 'usd',
        paymentStatus: data.paymentStatus,
        pricingContinent: data.pricingContinent ?? null,
        priceSnapshot: data.priceSnapshot ?? null,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
        createdAt: now(),
    } satisfies typeof purchases.$inferInsert;

    await db.insert(purchases).values(row);
    return row;
}

/** Get purchases for a user. */
export async function getPurchasesByUserId(
    db: AppDb,
    userId: string,
): Promise<Array<typeof purchases.$inferSelect>> {
    return db
        .select()
        .from(purchases)
        .where(eq(purchases.userId, userId))
        .all();
}

/** Get purchase by id. */
export async function getPurchaseById(
    db: AppDb,
    id: string,
): Promise<typeof purchases.$inferSelect | undefined> {
    return db.select().from(purchases).where(eq(purchases.id, id)).get();
}

/** Get purchase by stripe session id. */
export async function getPurchaseByStripeSessionId(
    db: AppDb,
    stripeSessionId: string,
): Promise<typeof purchases.$inferSelect | undefined> {
    return db
        .select()
        .from(purchases)
        .where(eq(purchases.stripeSessionId, stripeSessionId))
        .get();
}

// ── Install Keys ───────────────────────────────────────────────────

/** Create install key for a purchase. */
export async function createInstallKey(
    db: AppDb,
    purchaseId: string,
): Promise<typeof installKeys.$inferSelect> {
    const id = generateId();
    const key = generateId();
    const row = {
        id,
        purchaseId,
        key,
        downloadCount: 0,
        maxDownloads: null,
        createdAt: now(),
    } satisfies typeof installKeys.$inferInsert;

    await db.insert(installKeys).values(row);
    return row;
}

/** Get install key row by key string. */
export async function getInstallKeyByKey(
    db: AppDb,
    key: string,
): Promise<typeof installKeys.$inferSelect | undefined> {
    return db.select().from(installKeys).where(eq(installKeys.key, key)).get();
}

/** Increment download count on install key. */
export async function incrementDownloadCount(
    db: AppDb,
    keyId: string,
    currentCount: number,
): Promise<void> {
    await db
        .update(installKeys)
        .set({ downloadCount: currentCount + 1 })
        .where(eq(installKeys.id, keyId));
}

/** Get install keys for a purchase. */
export async function getInstallKeysByPurchaseId(
    db: AppDb,
    purchaseId: string,
): Promise<Array<typeof installKeys.$inferSelect>> {
    return db
        .select()
        .from(installKeys)
        .where(eq(installKeys.purchaseId, purchaseId))
        .all();
}
