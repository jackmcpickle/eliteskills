# System Diagram

## Database Schema

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│    users     │       │   products   │       │  productPrices   │
├──────────────┤       ├──────────────┤       ├──────────────────┤
│ id (PK)      │       │ id (PK, auto)│◄──────│ productId (FK)   │
│ email (UQ)   │       │ code (UQ)    │       │ continent        │
│ name         │       │ name         │       │ countryCode      │
│ accountKey   │       │ version      │       │ price            │
│  (UQ, 32hex) │       │ lifetime     │       │ currency         │
│ createdAt    │       │ skillSlug    │       │ stripePriceId    │
│ updatedAt    │       │ createdAt    │       │ UQ(prod,cont,cc) │
└──────┬───────┘       └──────┬───────┘       └──────────────────┘
       │                      │
       │ 1:N                  │ 1:N
       ▼                      ▼
┌──────────────────┐          │
│   purchases      │──────────┘
├──────────────────┤
│ id (PK)          │
│ userId (FK)      │
│ productId (FK)   │
│ stripeSessionId  │
│  (UQ)            │
│ stripeCustomer   │
│  Email           │
│ amountTotal      │
│ currency         │
│ paymentStatus    │
│ pricingContinent │
│ priceSnapshot    │
│ metadataJson     │
│ createdAt        │
└──────┬───────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐
│  installKeys     │
├──────────────────┤
│ id (PK)          │
│ purchaseId (FK)  │
│ key (UQ, 32hex)  │
│ downloadCount    │
│ maxDownloads     │
│ createdAt        │
└──────────────────┘
```

## Purchase Flow (Website)

```
 User                   Website                  Stripe              Webhook
  │                       │                        │                    │
  │  Fill checkout form   │                        │                    │
  │──────────────────────►│                        │                    │
  │                       │  Create session        │                    │
  │                       │───────────────────────►│                    │
  │                       │◄───── paymentUrl ──────│                    │
  │◄── redirect to Stripe │                        │                    │
  │                       │                        │                    │
  │  Complete payment ────────────────────────────►│                    │
  │                       │                        │  checkout.session  │
  │                       │                        │  .completed        │
  │                       │                        │───────────────────►│
  │                       │                        │                    │
  │                       │              ┌─────────────────────────┐    │
  │                       │              │ 1. upsertUser(email)    │    │
  │                       │              │    (ACCOUNT CREATED)    │    │
  │                       │              │ 2. createPurchase()     │    │
  │                       │              │ 3. sendConfirmEmails()  │    │
  │                       │              └─────────────────────────┘    │
  │                       │                        │                    │
  │◄── /checkout/success ─│                        │                    │
  │    (sets account_key  │                        │                    │
  │     cookie)           │                        │                    │
```

## Login Flow

```
 User              /api/send-login-link       /api/verify-login
  │                       │                        │
  │  POST email           │                        │
  │──────────────────────►│                        │
  │                       │── lookup user by email  │
  │                       │   NOT found? ──► return │
  │                       │   200 silently (no send)│
  │                       │                        │
  │                       │   Found? ──► create    │
  │                       │   HMAC token (15min)   │
  │                       │   + send email         │
  │◄── "Check email" ────│                        │
  │                       │                        │
  │  Click magic link ────────────────────────────►│
  │                       │                        │── verify token
  │                       │                        │── lookup user
  │                       │                        │── set account_key
  │◄──────────── redirect /account/{accountKey} ───│
```

## Agent Payment Link Flow

```
 Agent                /api/payment-session     /api/payment-link        Buyer
  │                       │                        │                      │
  │  POST (Bearer key)    │                        │                      │
  │──────────────────────►│                        │                      │
  │◄── session token ─────│                        │                      │
  │                       │                        │                      │
  │  POST (Bearer token) ─────────────────────────►│                      │
  │                       │                        │── create Stripe sess  │
  │                       │                        │── create pay token    │
  │                       │                        │── send email ────────►│
  │◄── /pay?token={t} ────────────────────────────│                      │
  │                       │                        │                      │
  │                       │                        │    Click link ───────►│
  │                       │                        │    Stripe checkout    │
  │                       │                        │    Webhook creates    │
  │                       │                        │    account+purchase   │
```

## Key Points

- **Accounts created on first purchase** (webhook `upsertUser`), not on login
- **Login only works for existing users** — unknown email silently returns 200 but sends nothing
- **Auth = `account_key` cookie** (32-char hex, HttpOnly, 30-day sliding window)
- **No password** — magic link only, stateless HMAC tokens
- **Geo-pricing** — `productPrices` resolves country > continent fallback
- **Install keys** — generated per purchase, tracks download count, fetches from R2
