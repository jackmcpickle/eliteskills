import {
    describe,
    expect,
    it,
    vi,
    beforeEach,
    afterEach,
} from 'vitest';
import { zipSync } from 'fflate';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

vi.mock('../lib/prompt', () => ({
    promptToken: vi.fn().mockResolvedValue(''),
}));

const { add } = await import('./add');

function makeZipResponse(files: Record<string, string>): Response {
    const entries: Record<string, Uint8Array> = {};
    const encoder = new TextEncoder();
    for (const [path, content] of Object.entries(files)) {
        entries[path] = encoder.encode(content);
    }
    const zipped = zipSync(entries);
    return new Response(zipped, { status: 200 });
}

describe('add command', () => {
    const originalFetch = globalThis.fetch;
    const originalCwd = process.cwd;
    const originalExit = process.exit;
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = mkdtempSync(join(tmpdir(), 'cli-add-'));
        process.cwd = () => tmpDir;
        process.exit = vi.fn() as never;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        process.cwd = originalCwd;
        process.exit = originalExit;
        rmSync(tmpDir, { recursive: true, force: true });
    });

    it('downloads and extracts skill zip', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue(
            makeZipResponse({
                '.claude/skills/react/SKILL.md': '# React',
            }),
        );

        await add('react', 'valid-token');

        expect(
            readFileSync(
                join(tmpDir, '.claude/skills/react/SKILL.md'),
                'utf-8',
            ),
        ).toBe('# React');
        expect(process.exit).not.toHaveBeenCalled();
    });

    it('exits on 404', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue(
            new Response('', { status: 404 }),
        );

        await add('react', 'bad-token');
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('exits on 410', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue(
            new Response('', { status: 410 }),
        );

        await add('react', 'used-token');
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('exits when no token provided', async () => {
        await add('react', '');
        expect(process.exit).toHaveBeenCalledWith(1);
    });
});
