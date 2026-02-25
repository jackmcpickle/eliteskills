import { createInterface } from 'node:readline/promises';

export async function promptToken(): Promise<string> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stderr,
    });
    try {
        const token = await rl.question('Enter your install token: ');
        return token.trim();
    } finally {
        rl.close();
    }
}
