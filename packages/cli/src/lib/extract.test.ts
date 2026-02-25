import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { extractZip } from './extract';
import { zipSync } from 'fflate';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeZip(files: Record<string, string | Uint8Array>): ArrayBuffer {
    const entries: Record<string, Uint8Array> = {};
    const encoder = new TextEncoder();
    for (const [path, content] of Object.entries(files)) {
        entries[path] =
            typeof content === 'string' ? encoder.encode(content) : content;
    }
    const zipped = zipSync(entries);
    return zipped.buffer.slice(
        zipped.byteOffset,
        zipped.byteOffset + zipped.byteLength,
    );
}

describe('extractZip', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = mkdtempSync(join(tmpdir(), 'cli-test-'));
    });

    afterEach(() => {
        rmSync(tmpDir, { recursive: true, force: true });
    });

    it('extracts valid zip to dest dir', () => {
        const zip = makeZip({
            '.claude/skills/react/SKILL.md': '# React Skill',
            '.claude/skills/react/prompt.md': 'Be a React expert',
        });

        const result = extractZip(zip, tmpDir);

        expect(result.fileCount).toBe(2);
        expect(result.dirs).toContain('react');
        expect(
            readFileSync(
                join(tmpDir, '.claude/skills/react/SKILL.md'),
                'utf-8',
            ),
        ).toBe('# React Skill');
    });

    it('throws on paths outside .claude/skills/', () => {
        const zip = makeZip({
            'etc/passwd': 'hacked',
        });

        expect(() => extractZip(zip, tmpDir)).toThrow('Unsafe path in zip');
    });

    it('throws on path traversal', () => {
        const zip = makeZip({
            '../../../etc/passwd': 'hacked',
        });

        expect(() => extractZip(zip, tmpDir)).toThrow('Unsafe path in zip');
    });

    it('skips .DS_Store', () => {
        const zip = makeZip({
            '.claude/skills/react/SKILL.md': '# React',
            '.claude/skills/react/.DS_Store': 'junk',
        });

        const result = extractZip(zip, tmpDir);

        expect(result.fileCount).toBe(1);
        expect(
            existsSync(join(tmpDir, '.claude/skills/react/.DS_Store')),
        ).toBe(false);
    });

    it('skips __MACOSX entries', () => {
        const zip = makeZip({
            '.claude/skills/react/SKILL.md': '# React',
            '__MACOSX/.claude/skills/react/._SKILL.md': 'junk',
        });

        const result = extractZip(zip, tmpDir);
        expect(result.fileCount).toBe(1);
    });

    it('returns 0 files for empty zip', () => {
        const zip = makeZip({});
        const result = extractZip(zip, tmpDir);
        expect(result.fileCount).toBe(0);
        expect(result.dirs).toEqual([]);
    });

    it('extracts bundle with multiple skill dirs', () => {
        const zip = makeZip({
            '.claude/skills/react/SKILL.md': '# React',
            '.claude/skills/backend/SKILL.md': '# Backend',
            '.claude/skills/testing/SKILL.md': '# Testing',
        });

        const result = extractZip(zip, tmpDir);

        expect(result.fileCount).toBe(3);
        expect(result.dirs).toContain('react');
        expect(result.dirs).toContain('backend');
        expect(result.dirs).toContain('testing');
    });
});
