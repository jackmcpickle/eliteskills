import {
    fetchSkillZip,
    fetchSkillCatalog,
    createPaymentSession,
    createPaymentLink,
} from '../lib/api.js';
import { extractZip } from '../lib/extract.js';
import * as log from '../lib/log.js';
import { promptToken, promptField, promptYesNo } from '../lib/prompt.js';

async function downloadAndExtract(skill: string, token: string): Promise<void> {
    log.dim(`Downloading skill "${skill}"...`);

    let zipData: ArrayBuffer;
    try {
        zipData = await fetchSkillZip(token, skill);
    } catch (err) {
        log.error((err as Error).message);
        process.exit(1);
        return;
    }

    try {
        const { fileCount, dirs } = extractZip(zipData, process.cwd());
        const dirList = dirs.length > 0 ? dirs.join(', ') : skill;
        log.success(
            `Installed ${dirList} (${fileCount} files) to .claude/skills/`,
        );
    } catch (err) {
        log.error((err as Error).message);
        process.exit(1);
    }
}

async function purchaseFlow(skill: string): Promise<void> {
    const hasToken = await promptYesNo('Do you have an install token?');

    if (hasToken) {
        const token = await promptToken();
        if (!token) {
            log.error('No token provided.');
            process.exit(1);
            return;
        }
        await downloadAndExtract(skill, token);
        return;
    }

    // Resolve slug → productId from catalog
    let catalog;
    try {
        catalog = await fetchSkillCatalog();
    } catch (err) {
        log.error((err as Error).message);
        process.exit(1);
        return;
    }

    const match = catalog.find((s) => s.slug === skill);
    if (!match) {
        log.error(
            `Skill "${skill}" not found. Run: npx @eliteskills/cli find ${skill}`,
        );
        process.exit(1);
        return;
    }

    if (!match.productId) {
        log.error(`Skill "${skill}" is not available for purchase.`);
        process.exit(1);
        return;
    }

    const name = await promptField('Enter your name');
    if (!name) {
        log.error('Name is required.');
        process.exit(1);
        return;
    }

    const email = await promptField('Enter your email');
    if (!email) {
        log.error('Email is required.');
        process.exit(1);
        return;
    }

    // Create session token
    let sessionToken: string;
    try {
        const session = await createPaymentSession();
        sessionToken = session.sessionToken;
    } catch (err) {
        log.error((err as Error).message);
        process.exit(1);
        return;
    }

    // Create payment link
    let paymentUrl: string;
    try {
        const result = await createPaymentLink(sessionToken, {
            productId: match.productId,
            name,
            email,
        });
        paymentUrl = result.paymentUrl;
    } catch (err) {
        log.error((err as Error).message);
        process.exit(1);
        return;
    }

    log.success(`Payment link sent to ${email}`);
    log.success(`Open: ${paymentUrl}`);
    console.log(
        `\n  After payment, run: npx @eliteskills/cli install ${skill} <token>`,
    );
    console.log();
}

export async function install(skill: string, token?: string): Promise<void> {
    if (token) {
        await downloadAndExtract(skill, token);
        return;
    }

    await purchaseFlow(skill);
}
