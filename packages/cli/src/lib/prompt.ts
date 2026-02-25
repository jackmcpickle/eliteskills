import { createInterface } from 'node:readline/promises';

function createRl() {
    return createInterface({
        input: process.stdin,
        output: process.stderr,
    });
}

export async function promptToken(): Promise<string> {
    const rl = createRl();
    try {
        const token = await rl.question('Enter your install token: ');
        return token.trim();
    } finally {
        rl.close();
    }
}

export async function promptField(label: string): Promise<string> {
    const rl = createRl();
    try {
        const value = await rl.question(`${label}: `);
        return value.trim();
    } finally {
        rl.close();
    }
}

export async function promptYesNo(question: string): Promise<boolean> {
    const rl = createRl();
    try {
        const answer = await rl.question(`${question} (y/n): `);
        return answer.trim().toLowerCase().startsWith('y');
    } finally {
        rl.close();
    }
}
