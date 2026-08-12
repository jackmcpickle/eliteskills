import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
    SKILLS_DOMAIN_SOURCE,
    SKILLS_GITHUB_SOURCE,
    skillsAddCommand,
} from '@/constants/skills-install';

const ROOT = join(import.meta.dirname ?? '.', '../..');
const OUT_DIR = join(ROOT, 'public', '.well-known', 'agent-skills');

describe('skills install helpers', () => {
    it('defaults to domain well-known source', () => {
        expect(skillsAddCommand()).toBe(
            `npx skills add ${SKILLS_DOMAIN_SOURCE}`,
        );
        expect(skillsAddCommand({ skill: 'elite-react' })).toBe(
            `npx skills add ${SKILLS_DOMAIN_SOURCE} --skill elite-react`,
        );
    });

    it('supports github source', () => {
        expect(skillsAddCommand({ source: 'github' })).toBe(
            `npx skills add ${SKILLS_GITHUB_SOURCE}`,
        );
    });
});

describe('well-known agent-skills manifest', () => {
    beforeAll(() => {
        execFileSync(
            'pnpm',
            ['exec', 'vite-node', 'scripts/build-well-known-skills.ts'],
            { cwd: ROOT, stdio: 'pipe' },
        );
    });

    afterAll(() => {
        // leave artifacts for local inspection; gitignored
    });

    it('writes a valid discovery index', () => {
        const indexPath = join(OUT_DIR, 'index.json');
        expect(existsSync(indexPath)).toBe(true);

        const index = JSON.parse(readFileSync(indexPath, 'utf-8')) as {
            $schema: string;
            skills: Array<{
                name: string;
                type: string;
                description: string;
                url: string;
                digest: string;
            }>;
        };

        expect(index.$schema).toBe(
            'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
        );
        expect(index.skills.length).toBeGreaterThanOrEqual(8);

        for (const skill of index.skills) {
            expect(skill.type).toBe('archive');
            expect(skill.description.length).toBeGreaterThan(0);
            expect(skill.description.length).toBeLessThanOrEqual(1024);
            expect(skill.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
            expect(skill.url).toMatch(
                /^\/\.well-known\/agent-skills\/[a-z0-9-]+\.tar\.gz$/,
            );

            const archiveFile = skill.url.split('/').pop();
            expect(archiveFile).toBeTruthy();
            const archivePath = join(OUT_DIR, archiveFile ?? '');
            expect(existsSync(archivePath)).toBe(true);
            const bytes = readFileSync(archivePath);
            const digest = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
            expect(digest).toBe(skill.digest);
        }

        const published = readdirSync(join(ROOT, 'skills')).filter((name) =>
            existsSync(join(ROOT, 'skills', name, 'SKILL.md')),
        );
        expect(index.skills.map((s) => s.name).sort()).toEqual(
            published.sort(),
        );
    });
});
