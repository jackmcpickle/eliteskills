import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { CatalogSkill } from '../lib/api';

const mockCatalog: CatalogSkill[] = [
    {
        slug: 'react',
        title: 'React',
        description: 'React component patterns. Accessibility-first markup.',
        highlights: [
            'Compound components',
            'Accessibility-first',
            'Responsive layouts',
        ],
        premium: true,
        productId: 1,
        instructions: 'npx @eliteskills/cli install react',
    },
    {
        slug: 'python',
        title: 'Python',
        description: 'Python best practices and patterns.',
        highlights: ['Type hints', 'Testing patterns'],
        premium: true,
        productId: 2,
        instructions: 'npx @eliteskills/cli install python',
    },
];

vi.mock('../lib/api', () => ({
    fetchSkillCatalog: vi.fn().mockResolvedValue(mockCatalog),
}));

const { find } = await import('./find');

describe('find command', () => {
    const originalExit = process.exit;
    let logSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        process.exit = vi.fn() as never;
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        process.exit = originalExit;
        vi.restoreAllMocks();
    });

    it('filters skills by keyword', async () => {
        await find('react');
        const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(output).toContain('React');
        expect(output).not.toContain('Python');
        expect(output).toContain('1 skill found');
    });

    it('shows all skills with no keyword', async () => {
        await find();
        const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(output).toContain('React');
        expect(output).toContain('Python');
        expect(output).toContain('2 skills found');
    });

    it('shows no results message', async () => {
        await find('nonexistent');
        const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(output).toContain('No skills found');
    });

    it('matches against highlights', async () => {
        await find('accessibility');
        const output = logSpy.mock.calls.map((c) => c[0]).join('\n');
        expect(output).toContain('React');
        expect(output).toContain('1 skill found');
    });
});
