import Anthropic from '@anthropic-ai/sdk';
import { test, expect } from '@playwright/test';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

test.describe('@llm LLM purchase flow — Sonnet discovers and navigates purchase', () => {
    test.skip(!ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY required');

    let homepageHtml: string;
    let llmsTxt: string;

    test.beforeAll(async ({ request }) => {
        const [homeRes, llmsRes] = await Promise.all([
            request.get('/'),
            request.get('/llms.txt'),
        ]);
        homepageHtml = await homeRes.text();
        llmsTxt = await llmsRes.text();
    });

    test('Sonnet extracts correct purchase steps from site content', async () => {
        const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

        const response = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            messages: [
                {
                    role: 'user',
                    content: `You are an AI agent that wants to purchase Elite AI Skills on behalf of a user.

You have access to the following site content:

<llms_txt>
${llmsTxt}
</llms_txt>

<homepage_html>
${homepageHtml.slice(0, 8000)}
</homepage_html>

Based on this content, output the exact steps an AI agent must follow to complete a purchase via the API (not the website checkout form). Return ONLY valid JSON matching this exact schema, no other text:

{
  "humanCheckoutUrls": [string],
  "agentApiFlow": {
    "steps": [
      {
        "stepNumber": number,
        "endpoint": string,
        "method": string,
        "auth": { "type": string, "value": string },
        "body": { "required": [string], "optional": [string] } | null,
        "responseFields": [string]
      }
    ]
  },
  "products": [
    {
      "productId": string,
      "name": string,
      "price": number
    }
  ]
}`,
                },
            ],
        });

        const textBlock = response.content.find((b) => b.type === 'text');
        expect(textBlock).toBeTruthy();

        // Extract JSON from response (may be wrapped in markdown code block)
        const rawText = textBlock!.text;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        expect(jsonMatch).toBeTruthy();

        const result = JSON.parse(jsonMatch![0]);

        // === Human checkout URLs (may be full or relative) ===
        const urls = result.humanCheckoutUrls as string[];
        expect(urls.some((u: string) => u.includes('/checkout/once'))).toBe(
            true,
        );
        expect(urls.some((u: string) => u.includes('/checkout/lifetime'))).toBe(
            true,
        );

        // === Agent API flow ===
        const steps = result.agentApiFlow.steps;
        expect(steps.length).toBe(2);

        // Step 1: payment-session
        const step1 = steps[0];
        expect(step1.stepNumber).toBe(1);
        expect(step1.endpoint).toContain('/api/payment-session');
        expect(step1.method).toBe('POST');
        expect(step1.auth.type).toMatch(/bearer/i);
        expect(step1.auth.value).toMatch(/AGENT_API_KEY/i);
        expect(step1.responseFields).toContain('sessionToken');

        // Step 2: payment-link
        const step2 = steps[1];
        expect(step2.stepNumber).toBe(2);
        expect(step2.endpoint).toContain('/api/payment-link');
        expect(step2.method).toBe('POST');
        expect(step2.auth.type).toMatch(/bearer/i);
        expect(step2.auth.value).toMatch(/session/i);
        expect(step2.body).toBeTruthy();
        expect(step2.body.required).toContain('productId');
        expect(step2.body.required).toContain('name');
        expect(step2.body.required).toContain('email');
        expect(step2.responseFields).toContain('paymentUrl');

        // === Products ===
        expect(result.products.length).toBe(2);

        const once = result.products.find(
            (p: { productId: string }) => p.productId === 'once',
        );
        const lifetime = result.products.find(
            (p: { productId: string }) => p.productId === 'lifetime',
        );

        expect(once).toBeTruthy();
        expect(once.price).toBe(29);

        expect(lifetime).toBeTruthy();
        expect(lifetime.price).toBe(99);
    });

    test('Sonnet identifies company purchase requirements', async () => {
        const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

        const response = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: `Given this API documentation:

<llms_txt>
${llmsTxt}
</llms_txt>

What additional fields are required when making a company purchase via /api/payment-link? Return ONLY valid JSON:

{
  "purchaseKind": string,
  "requiredFields": [string],
  "optionalFields": [string]
}`,
                },
            ],
        });

        const textBlock = response.content.find((b) => b.type === 'text');
        expect(textBlock).toBeTruthy();

        const jsonMatch = textBlock!.text.match(/\{[\s\S]*\}/);
        expect(jsonMatch).toBeTruthy();

        const result = JSON.parse(jsonMatch![0]);

        expect(result.purchaseKind).toBe('company');
        expect(result.requiredFields).toContain('companyName');
        expect(result.requiredFields).toContain('addressLine1');
        expect(result.requiredFields).toContain('city');
        expect(result.requiredFields).toContain('postalCode');
        expect(result.requiredFields).toContain('country');
        expect(result.optionalFields).toContain('addressLine2');
    });

    test('Sonnet identifies rate limits', async () => {
        const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

        const response = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: `Given this API documentation:

<llms_txt>
${llmsTxt}
</llms_txt>

What are the rate limits for each payment API endpoint? Return ONLY valid JSON:

{
  "endpoints": [
    {
      "path": string,
      "limits": [{ "scope": string, "max": number, "window": string }]
    }
  ]
}`,
                },
            ],
        });

        const textBlock = response.content.find((b) => b.type === 'text');
        expect(textBlock).toBeTruthy();

        const jsonMatch = textBlock!.text.match(/\{[\s\S]*\}/);
        expect(jsonMatch).toBeTruthy();

        const result = JSON.parse(jsonMatch![0]);

        expect(result.endpoints.length).toBeGreaterThanOrEqual(2);

        const sessionEndpoint = result.endpoints.find((e: { path: string }) =>
            e.path.includes('payment-session'),
        );
        expect(sessionEndpoint).toBeTruthy();
        expect(sessionEndpoint.limits.length).toBeGreaterThanOrEqual(1);

        const linkEndpoint = result.endpoints.find((e: { path: string }) =>
            e.path.includes('payment-link'),
        );
        expect(linkEndpoint).toBeTruthy();
        expect(linkEndpoint.limits.length).toBeGreaterThanOrEqual(1);
    });
});
