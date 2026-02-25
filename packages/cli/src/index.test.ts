import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { main } from './index';

vi.mock('./commands/install', () => ({
    install: vi.fn(),
}));

vi.mock('./commands/find', () => ({
    find: vi.fn(),
}));

describe('CLI arg parsing', () => {
    const originalExit = process.exit;
    let logSpy: ReturnType<typeof vi.spyOn>;
    let errSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        process.exit = vi.fn() as never;
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        process.exit = originalExit;
        vi.restoreAllMocks();
    });

    it('prints usage with --help', async () => {
        await main(['node', 'cli', '--help']);
        const stdout = logSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stdout).toContain('Usage: eliteskills');
        expect(stdout).toContain('install');
        expect(stdout).toContain('find');
        expect(process.exit).not.toHaveBeenCalled();
    });

    it('prints usage with no args', async () => {
        await main(['node', 'cli']);
        const stdout = logSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stdout).toContain('Usage: eliteskills');
        expect(process.exit).not.toHaveBeenCalled();
    });

    it('calls install with skill and token', async () => {
        const { install } = await import('./commands/install');
        await main(['node', 'cli', 'install', 'react', 'token123']);
        expect(install).toHaveBeenCalledWith('react', 'token123');
    });

    it('calls install with skill only', async () => {
        const { install } = await import('./commands/install');
        await main(['node', 'cli', 'install', 'react']);
        expect(install).toHaveBeenCalledWith('react', undefined);
    });

    it('add is alias for install', async () => {
        const { install } = await import('./commands/install');
        await main(['node', 'cli', 'add', 'react', 'token123']);
        expect(install).toHaveBeenCalledWith('react', 'token123');
    });

    it('buy is alias for install', async () => {
        const { install } = await import('./commands/install');
        await main(['node', 'cli', 'buy', 'react']);
        expect(install).toHaveBeenCalledWith('react', undefined);
    });

    it('calls find with keyword', async () => {
        const { find } = await import('./commands/find');
        await main(['node', 'cli', 'find', 'react']);
        expect(find).toHaveBeenCalledWith('react');
    });

    it('calls find without keyword', async () => {
        const { find } = await import('./commands/find');
        await main(['node', 'cli', 'find']);
        expect(find).toHaveBeenCalledWith(undefined);
    });

    it('prints error and usage on install without skill', async () => {
        await main(['node', 'cli', 'install']);
        expect(process.exit).toHaveBeenCalledWith(1);
        const stderr = errSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stderr).toContain('Missing skill name');
        const stdout = logSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stdout).toContain('Usage: eliteskills');
    });

    it('prints error and usage on unknown command', async () => {
        await main(['node', 'cli', 'unknown']);
        expect(process.exit).toHaveBeenCalledWith(1);
        const stderr = errSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stderr).toContain('Unknown command: unknown');
        const stdout = logSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(stdout).toContain('Usage: eliteskills');
    });
});
