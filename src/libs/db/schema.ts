import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name'),
    accountKey: text('account_key').notNull().unique(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
});

export const purchases = sqliteTable('purchases', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    stripeSessionId: text('stripe_session_id').notNull().unique(),
    stripeCustomerEmail: text('stripe_customer_email'),
    productId: text('product_id').notNull(),
    amountTotal: integer('amount_total'),
    currency: text('currency').default('usd'),
    paymentStatus: text('payment_status').notNull(),
    metadataJson: text('metadata_json'),
    createdAt: text('created_at').notNull(),
});

export const installKeys = sqliteTable('install_keys', {
    id: text('id').primaryKey(),
    purchaseId: text('purchase_id')
        .notNull()
        .references(() => purchases.id),
    key: text('key').notNull().unique(),
    downloadCount: integer('download_count').notNull().default(0),
    maxDownloads: integer('max_downloads'),
    createdAt: text('created_at').notNull(),
});
