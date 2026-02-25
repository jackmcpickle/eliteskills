const API_BASE = 'https://eliteskill.ai';

const ERROR_MESSAGES: Record<number, string> = {
    400: 'Missing skill or token.',
    403: "Token doesn't grant access to this skill.",
    404: 'Invalid install token.',
    410: 'Download limit reached. Generate a new install key from your account page.',
};

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
