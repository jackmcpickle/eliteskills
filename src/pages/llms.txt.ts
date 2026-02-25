export const prerender = false;

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { createDb } from '@/libs/db/client';
import {
    listBundleProducts,
    listSkillProducts,
    getProductPrice,
} from '@/libs/db/repo';
import { resolveContinent, resolveCountryCode } from '@/libs/geo';
import { formatMoney } from '@/utils/format-money';

interface SkillEntry {
    id: string;
    data: { title: string; description: string; order: number };
}
interface PricingEntry {
    data: { period: string; description: string };
}

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

    const [bundles, skills] = await Promise.all([
        listBundleProducts(db),
        listSkillProducts(db),
    ]);
    const skillsCollection = (await getCollection(
        'skills',
    )) as unknown as SkillEntry[];
    const pricingCollection = (await getCollection(
        'pricing',
    )) as unknown as PricingEntry[];

    const pricingMap = new Map<string, PricingEntry>(
        pricingCollection.map((p) => [p.data.period, p]),
    );

    const bundlePrices = await Promise.all(
        bundles.map(async (b) =>
            getProductPrice(db, b.id, continent, countryCode),
        ),
    );
    const bundleLines = bundles.map((b, i) => {
        const priceRow = bundlePrices[i];
        const price = priceRow
            ? formatMoney(priceRow.price, priceRow.currency)
            : 'N/A';
        const period = b.lifetime ? 'lifetime' : 'once';
        const content = pricingMap.get(period);
        const desc = content?.data.description ?? '';
        return `- **${b.name} — ${price}** (productId: ${b.id}): ${desc}`;
    });

    const sortedSkills = [...skillsCollection].sort(
        (a, b) => a.data.order - b.data.order,
    );
    const skillDbMap = new Map(
        skills.filter((p) => p.skillSlug).map((p) => [p.skillSlug, p]),
    );
    const skillPrices = await Promise.all(
        sortedSkills.map(async (s) => {
            const dbSkill = skillDbMap.get(s.id);
            return dbSkill
                ? getProductPrice(db, dbSkill.id, continent, countryCode)
                : Promise.resolve(undefined);
        }),
    );
    const skillLines = sortedSkills.map((s, i) => {
        const dbSkill = skillDbMap.get(s.id);
        if (!dbSkill) {
            return `- **${s.data.title}** — ${s.data.description}`;
        }
        const priceRow = skillPrices[i];
        const price = priceRow
            ? formatMoney(priceRow.price, priceRow.currency)
            : 'N/A';
        return `- **${s.data.title} — ${price}** (productId: ${dbSkill.id}): ${s.data.description}`;
    });

    const idTable = [
        ...bundles.map((b) => `| ${b.id} | ${b.code} | ${b.name} |`),
        ...skills.map((s) => `| ${s.id} | ${s.code} | ${s.name} |`),
    ];

    const text = `# Elite Skills

> Elite Skills sells precision-crafted AI instruction sets (skills) for programmers and vibe coders. Each skill is built from 20 years of production engineering experience by Jack McNicol. Skills work with any AI coding tool (Claude, Cursor, Copilot, etc.) and ship as downloadable instruction files. Payment is handled via Stripe (one-time, no subscriptions).

## Products

There are two bundle purchase options. Neither is a subscription. Both are one-time payments processed via Stripe.

${bundleLines.join('\n')}

Individual skills can also be purchased separately:

${skillLines.join('\n')}

## Product ID mapping

| productId | code | name |
|-----------|------|------|
${idTable.join('\n')}

## FAQ

**Q: What are Elite Skills?**
A: Downloadable AI instruction sets that plug into any AI coding tool. They tell the AI *how* to write code — architecture patterns, conventions, edge-case handling — distilled from 20 years of shipping production software.

**Q: Which AI tools do these work with?**
A: Any tool that accepts custom instructions or system prompts: Claude, ChatGPT, Cursor, GitHub Copilot, Windsurf, Cline, etc.

**Q: Do I get updates?**
A: With the Lifetime Access plan, yes — all future updates and new skills forever. The One-Time Purchase is a snapshot of the current version.

**Q: Is there a subscription?**
A: No. Both options are one-time payments. No recurring charges.

**Q: Is there a refund policy?**
A: Yes. 30-day money-back guarantee on all plans.

**Q: How do I get the skills after purchase?**
A: After Stripe payment completes you receive an install token via email. Run \`npx @eliteskills/cli install <skill> <token>\` to install.

**Q: Who made these?**
A: Jack McNicol — 20 years shipping production code.

**Q: How does the payment link work?**
A: The API returns a \`/pay?token=...\` URL. The buyer opens it in a browser and clicks "Continue to secure payment" which redirects to Stripe hosted checkout. After payment, Stripe redirects to a success page and a confirmation email is sent automatically.

**Q: How long does the payment link last?**
A: Payment links expire after 1 hour. If expired, the buyer sees an error page with a link to contact support or return home.

**Q: Is payment handled directly or via Stripe?**
A: All payments go through Stripe hosted checkout. No card details touch the Elite Skills server.

## CLI Install (recommended for AI agents)

The fastest way for an AI agent to discover and install skills is via the CLI. No API key required.

### Step 1 — Discover skills

\`\`\`bash
npx @eliteskills/cli find          # list all skills
npx @eliteskills/cli find react    # search by keyword
\`\`\`

Returns matching skills with slug, title, description, highlights, and \`productId\`.

### Step 2 — Purchase (if no install token)

Use the payment API to create a payment link:

1. \`POST https://eliteskills.ai/api/cli/payment-session\` — returns a \`sessionToken\` (no API key required)
2. \`POST https://eliteskills.ai/api/payment-link\` with \`Authorization: Bearer <sessionToken>\` and \`{ productId, name, email }\` — returns a \`paymentUrl\`

Present the \`paymentUrl\` to the user. After payment they receive an install token via email.

### Step 3 — Install

\`\`\`bash
npx @eliteskills/cli install react <token>
\`\`\`

Downloads and extracts the skill into \`.claude/skills/\` in the current directory. No prompts when a token is provided.

### Full non-interactive example

\`\`\`bash
npx @eliteskills/cli find react
npx @eliteskills/cli install react abc123def
\`\`\`

## Payment API (detailed reference)

### Step 1: Create a session token

Get a short-lived session token (expires in 1 hour). No API key required.

**Endpoint:** \`POST /api/cli/payment-session\`
**Auth:** none
**Body:** none

\`\`\`bash
curl -X POST https://eliteskills.ai/api/cli/payment-session
\`\`\`

**Response:**
\`\`\`json
{
  "ok": true,
  "sessionToken": "eyJ...",
  "expiresAt": "2026-02-22T02:37:00.000Z"
}
\`\`\`

### Step 2: Create a payment link

Use the session token to create a Stripe checkout session. The API returns a payment URL and also emails it to the buyer.

**Endpoint:** \`POST /api/payment-link\`
**Auth:** \`Authorization: Bearer <sessionToken>\` (from step 1)
**Content-Type:** \`application/json\`

#### Required fields

- \`productId\` — numeric product ID (see Product ID mapping table above)
- \`name\` — buyer full name
- \`email\` — buyer email address

#### Optional fields

- \`region\` — continent code (\`NA\`, \`EU\`, \`OC\`, \`AS\`, \`SA\`, \`AF\`, \`AN\`) for region-aware pricing. If omitted, the server determines region from the request IP.
- \`purchaseKind\` — \`"personal"\` (default) or \`"company"\`
- \`companyName\` — required when \`purchaseKind\` is \`"company"\`
- \`addressLine1\` — required when \`purchaseKind\` is \`"company"\`
- \`addressLine2\` — optional
- \`city\` — required when \`purchaseKind\` is \`"company"\`
- \`postalCode\` — required when \`purchaseKind\` is \`"company"\`
- \`country\` — required when \`purchaseKind\` is \`"company"\`

#### Example: personal purchase

\`\`\`bash
curl -X POST https://eliteskills.ai/api/payment-link \\
  -H "Authorization: Bearer SESSION_TOKEN_FROM_STEP_1" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": 8,
    "name": "Jane Doe",
    "email": "jane@example.com"
  }'
\`\`\`

#### Example: company purchase with receipt

\`\`\`bash
curl -X POST https://eliteskills.ai/api/payment-link \\
  -H "Authorization: Bearer SESSION_TOKEN_FROM_STEP_1" \\
  -H "Content-Type: application/json" \\
  -d '{
    "productId": 7,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "purchaseKind": "company",
    "companyName": "Acme Corp",
    "addressLine1": "123 Main St",
    "city": "Melbourne",
    "postalCode": "3000",
    "country": "Australia"
  }'
\`\`\`

#### Response

\`\`\`json
{
  "ok": true,
  "paymentUrl": "https://eliteskills.ai/pay?token=eyJ..."
}
\`\`\`

The \`paymentUrl\` is a one-time-use link (1 hour expiry) that takes the buyer to an order summary page with a "Continue to secure payment" button that redirects to Stripe hosted checkout.

The same link is also emailed to the buyer automatically.

### Error responses

All error responses follow the format \`{"error": "..."}\` with appropriate HTTP status codes:

- \`400\` — invalid input (bad product id, missing fields, invalid email). Zod validation errors include field-level details.
- \`401\` — unauthorized (bad API key or expired session token)
- \`429\` — rate limited (too many requests)
- \`500\` — server error (Stripe or mail not configured)

### Rate limits

- \`/api/cli/payment-session\`: 5 requests per 5 minutes per IP
- \`/api/payment-link\`: 20 per 10 minutes per IP, 10 per hour per session, 5 per hour per email

## Pages

- [Home](https://eliteskills.ai/): Landing page with skills overview, reviews, pricing, and purchase links
- [Contact](https://eliteskills.ai/contact): Contact form for support questions
`;

    return new Response(text, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
};
