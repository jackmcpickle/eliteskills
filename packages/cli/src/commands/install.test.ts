import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zipSync } from 'fflate';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../lib/prompt', () => ({
    promptToken: vi.fn().mockResolvedValue(''),
    promptField: vi.fn().mockResolvedValue(''),
    promptYesNo: vi.fn().mockResolvedValue(false),
}));

vi.mock('../lib/api', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../lib/api')>();
    return {
        ...actual,
        fetchSkillCatalog: vi.fn(),
        createPaymentSession: vi.fn(),
        createPaymentLink: vi.fn(),
    };
});

const { install } = await import('./install');

function makeZipResponse(files: Record<string, string>): Response {
    const entries: Record<string, Uint8Array> = {};
    const encoder = new TextEncoder();
    for (const [path, content] of Object.entries(files)) {
        entries[path] = encoder.encode(content);
    }
    const zipped = zipSync(entries);
    return new Response(zipped, { status: 200 });
}

describe('install command', () => {
    const originalFetch = globalThis.fetch;
    const originalCwd = process.cwd;
    const originalExit = process.exit;
    let tmpDir: string;
    let logSpy: ReturnType<typeof vi.spyOn>;
    let errSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        tmpDir = mkdtempSync(join(tmpdir(), 'cli-install-'));
        process.cwd = () => tmpDir;
        process.exit = vi.fn() as never;
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        process.cwd = originalCwd;
        process.exit = originalExit;
        rmSync(tmpDir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    it('downloads and extracts skill zip with token', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue(
            makeZipResponse({
                '.claude/skills/react/SKILL.md': '# React',
            }),
        );

        await install('react', 'valid-token');

        expect(
            readFileSync(
                join(tmpDir, '.claude/skills/react/SKILL.md'),
                'utf-8',
            ),
        ).toBe('# React');
        expect(process.exit).not.toHaveBeenCalled();

        const stdout = logSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stdout).toContain('Downloading skill "react"');
        expect(stdout).toContain('Installed react (1 files) to .claude/skills/');
    });

    it('exits on 404 with error message', async () => {
        globalThis.fetch = vi
            .fn()
            .mockResolvedValue(new Response('', { status: 404 }));

        await install('react', 'bad-token');

        expect(process.exit).toHaveBeenCalledWith(1);
        const stderr = errSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stderr).toContain('Invalid install token');
    });

    it('exits on 410 with error message', async () => {
        globalThis.fetch = vi
            .fn()
            .mockResolvedValue(new Response('', { status: 410 }));

        await install('react', 'used-token');

        expect(process.exit).toHaveBeenCalledWith(1);
        const stderr = errSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stderr).toContain('Download limit reached');
    });

    it('starts purchase flow when no token, user has token', async () => {
        const { promptYesNo, promptToken } = await import('../lib/prompt');
        (promptYesNo as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true);
        (promptToken as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            'prompted-token',
        );

        globalThis.fetch = vi.fn().mockResolvedValue(
            makeZipResponse({
                '.claude/skills/react/SKILL.md': '# React',
            }),
        );

        await install('react');

        expect(
            readFileSync(
                join(tmpDir, '.claude/skills/react/SKILL.md'),
                'utf-8',
            ),
        ).toBe('# React');

        const stdout = logSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stdout).toContain('Installed react (1 files) to .claude/skills/');
    });

    it('purchase flow prints payment url and next steps', async () => {
        const { promptYesNo, promptField } = await import('../lib/prompt');
        const { fetchSkillCatalog, createPaymentSession, createPaymentLink } =
            await import('../lib/api');

        (promptYesNo as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
        (promptField as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce('Jane Doe')
            .mockResolvedValueOnce('jane@example.com');

        (fetchSkillCatalog as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
            {
                slug: 'react',
                title: 'React',
                description: '',
                highlights: [],
                premium: true,
                productId: 1,
                instructions: 'npx @eliteskills/cli install react',
            },
        ]);
        (
            createPaymentSession as ReturnType<typeof vi.fn>
        ).mockResolvedValueOnce({
            sessionToken: 'session-abc',
            expiresAt: '2026-01-01T00:00:00Z',
        });
        (createPaymentLink as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
            paymentUrl: 'https://eliteskills.ai/pay?token=xyz',
        });

        await install('react');

        expect(createPaymentLink).toHaveBeenCalledWith('session-abc', {
            productId: 1,
            name: 'Jane Doe',
            email: 'jane@example.com',
        });

        const stdout = logSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stdout).toContain('Payment link sent to jane@example.com');
        expect(stdout).toContain('https://eliteskills.ai/pay?token=xyz');
        expect(stdout).toContain('npx @eliteskills/cli install react <token>');
    });

    it('exits with error when skill not found in catalog', async () => {
        const { promptYesNo, promptField } = await import('../lib/prompt');
        const { fetchSkillCatalog } = await import('../lib/api');

        (promptYesNo as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
        (promptField as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce('Jane')
            .mockResolvedValueOnce('jane@example.com');

        (fetchSkillCatalog as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
            [],
        );

        await install('nonexistent');

        expect(process.exit).toHaveBeenCalledWith(1);
        const stderr = errSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stderr).toContain('Skill "nonexistent" not found');
    });
});
