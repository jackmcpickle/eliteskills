import { eq } from 'drizzle-orm';
import type { AppDb } from './client';
import { users, purchases, installKeys } from './schema';

function generateId(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function now(): string {
    return new Date().toISOString();
}

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

/** Create purchase from Stripe session data. Idempotent by stripe_session_id. */
export async function createPurchase(
    db: AppDb,
    data: {
        userId: string;
        stripeSessionId: string;
        stripeCustomerEmail?: string | null;
        productId: string;
        amountTotal?: number | null;
        currency?: string;
        paymentStatus: string;
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
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
        createdAt: now(),
    } satisfies typeof purchases.$inferInsert;

    await db.insert(purchases).values(row);
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
    return db
        .select()
        .from(installKeys)
        .where(eq(installKeys.key, key))
        .get();
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
