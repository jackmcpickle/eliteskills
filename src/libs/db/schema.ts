import {
    sqliteTable,
    text,
    integer,
    real,
    uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name'),
    accountKey: text('account_key').notNull().unique(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
});

export const products = sqliteTable('products', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    version: text('version').notNull(),
    lifetime: integer('lifetime').notNull().default(0),
    skillSlug: text('skill_slug'),
    createdAt: text('created_at').notNull(),
});

export const productPrices = sqliteTable(
    'product_prices',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        productId: integer('product_id')
            .notNull()
            .references(() => products.id),
        continent: text('continent').notNull(),
        price: real('price').notNull(),
        stripePriceId: text('stripe_price_id'),
    },
    (table) => [
        uniqueIndex('product_prices_product_continent_idx').on(
            table.productId,
            table.continent,
        ),
    ],
);

export const purchases = sqliteTable('purchases', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    stripeSessionId: text('stripe_session_id').notNull().unique(),
    stripeCustomerEmail: text('stripe_customer_email'),
    productId: integer('product_id')
        .notNull()
        .references(() => products.id),
    amountTotal: integer('amount_total'),
    currency: text('currency').default('usd'),
    paymentStatus: text('payment_status').notNull(),
    pricingContinent: text('pricing_continent'),
    priceSnapshot: real('price_snapshot'),
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
