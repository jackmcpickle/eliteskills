const API_BASE = 'https://eliteskills.ai';

const ERROR_MESSAGES: Record<number, string> = {
    400: 'Missing skill or token.',
    403: "Token doesn't grant access to this skill.",
    404: 'Invalid install token.',
    410: 'Download limit reached. Generate a new install key from your account page.',
};

export interface CatalogSkill {
    slug: string;
    title: string;
    description: string;
    highlights: string[];
    premium: boolean;
    productId: number | null;
    instructions: string;
}

export async function fetchSkillZip(
    token: string,
    skill: string,
): Promise<ArrayBuffer> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}/api/cli/install`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, skill }),
        });
    } catch {
        throw new Error('Network error — check your internet connection.');
    }

    if (!res.ok) {
        const msg =
            ERROR_MESSAGES[res.status] ?? `Server error (${res.status}).`;
        throw new Error(msg);
    }

    return res.arrayBuffer();
}

export async function fetchSkillCatalog(): Promise<CatalogSkill[]> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}/api/cli/skills`);
    } catch {
        throw new Error('Network error — check your internet connection.');
    }

    if (!res.ok) {
        throw new Error(`Failed to fetch skill catalog (${res.status}).`);
    }

    const data = (await res.json()) as { skills: CatalogSkill[] };
    return data.skills;
}

export async function createPaymentSession(): Promise<{
    sessionToken: string;
    expiresAt: string;
}> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}/api/cli/payment-session`, {
            method: 'POST',
        });
    } catch {
        throw new Error('Network error — check your internet connection.');
    }

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        if (res.status === 429)
            throw new Error('Too many requests. Try later.');
        throw new Error(
            `Failed to create payment session (${res.status}). ${body}`,
        );
    }

    return res.json() as Promise<{ sessionToken: string; expiresAt: string }>;
}

export async function createPaymentLink(
    sessionToken: string,
    body: { productId: number; name: string; email: string },
): Promise<{ paymentUrl: string }> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}/api/payment-link`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify(body),
        });
    } catch {
        throw new Error('Network error — check your internet connection.');
    }

    if (!res.ok) {
        const errBody = (await res
            .json()
            .catch(() => ({ error: `Error (${res.status})` }))) as {
            error: string;
        };
        throw new Error(errBody.error ?? `Error (${res.status})`);
    }

    return res.json() as Promise<{ paymentUrl: string }>;
}
