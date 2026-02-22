# Per-Region Currency Support

## Overview

Products can now have per-region currencies. Each `product_prices` row carries its own `currency` and optional `country_code` override. Stripe Prices are created per-row (immutable currency per Price object).

## DB Schema

`product_prices` gained two columns:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `currency` | text NOT NULL | `'usd'` | ISO 4217 lowercase currency code |
| `country_code` | text NOT NULL | `''` | ISO 3166-1 alpha-2 country code. Empty = continent default row |

Unique index: `(product_id, continent, country_code)`

## Currency Map

| Region | Currency | Source |
|---|---|---|
| EU | `eur` | Continent default |
| OC | `aud` | Continent default |
| AS/JP | `jpy` | Country override |
| Everything else | `usd` | Fallback |

## JPY Pricing

Converted from USD AS prices using pinned rate `1 USD = 150 JPY`.

Formula: `ceil((usd * 150) / 100) * 100 - 1` (charm pricing ending in 99).

| Product | USD (AS) | JPY |
|---|---|---|
| Single skill | $5 | 799 |
| Bundle once | $15 | 2,299 |
| Lifetime | $49 | 7,399 |
| Teams | $149 | 22,399 |

## Price Resolution

Priority order:
1. Exact match: `(product_id, continent, country_code)` e.g. `(1, 'AS', 'JP')`
2. Continent default: `(product_id, continent, '')` e.g. `(1, 'AS', '')`

Inputs sourced from Cloudflare managed transform headers:
- `cf-ipcontinent` -> continent
- `cf-ipcountry` -> country code

## Display Formatting

All prices rendered via `formatMoney(amount, currency, locale)` using `Intl.NumberFormat`.

Locale derived from country code via `resolveLocale()`:
- `JP` -> `ja-JP`, `DE` -> `de-DE`, `AU` -> `en-AU`, etc.
- Fallback: `en-US`

Zero-decimal currencies (JPY, KRW, etc.) handled automatically -- no fractional digits, no `* 100` for Stripe `unit_amount`.

## Stripe Integration

- Each DB row maps to one Stripe Price (currency is immutable on Stripe Prices)
- `pnpm stripe:sync` reads row `currency` and creates Prices accordingly
- If existing `stripe_price_id` has a currency mismatch or is inactive, sync creates a new Price and updates the DB
- Checkout session metadata includes `priceCurrency` and `countryCode` for downstream use

## Key Files

| Area | Files |
|---|---|
| Schema | `src/libs/db/schema.ts` |
| Migration | `drizzle/0002_currency.sql` |
| Formatter | `src/utils/format-money.ts` |
| Geo/locale | `src/libs/geo.ts` |
| Price resolver | `src/libs/db/repo.ts` (`getProductPrice`) |
| Stripe sync | `scripts/sync-stripe-products.ts` |
| Checkout APIs | `src/pages/api/create-checkout.ts`, `src/pages/api/payment-link.ts` |
| Webhook | `src/pages/api/stripe-webhook.ts` |

## Deployment

```bash
# 1. Run migration
pnpm wrangler d1 execute <db-name> --remote --file drizzle/0002_currency.sql

# 2. Sync Stripe Prices (creates new Price objects for EUR/AUD/JPY rows)
pnpm stripe:sync -- --remote

# 3. Deploy
pnpm deploy
```

## Adding New Currencies

1. Insert rows into `product_prices` with desired `continent`, `country_code`, `currency`, `price`
2. Run `pnpm stripe:sync -- --remote` to create Stripe Prices
3. Add locale mapping in `src/libs/geo.ts` `COUNTRY_LOCALE` if needed
4. Deploy
