import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { main } from './index';

vi.mock('./commands/add', () => ({
    add: vi.fn(),
}));

describe('CLI arg parsing', () => {
    const originalExit = process.exit;
    let logSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        process.exit = vi.fn() as never;
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        process.exit = originalExit;
        vi.restoreAllMocks();
    });

    it('prints usage with --help', async () => {
        await main(['node', 'cli', '--help']);
        expect(logSpy).toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });

    it('prints usage with no args', async () => {
        await main(['node', 'cli']);
        expect(logSpy).toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });

    it('calls add with skill and token', async () => {
        const { add } = await import('./commands/add');
        await main(['node', 'cli', 'add', 'react', 'token123']);
        expect(add).toHaveBeenCalledWith('react', 'token123');
    });

    it('calls add with skill only', async () => {
        const { add } = await import('./commands/add');
        await main(['node', 'cli', 'add', 'react']);
        expect(add).toHaveBeenCalledWith('react', undefined);
    });

    it('exits on add without skill', async () => {
        await main(['node', 'cli', 'add']);
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('exits on unknown command', async () => {
        await main(['node', 'cli', 'unknown']);
        expect(process.exit).toHaveBeenCalledWith(1);
    });
});
