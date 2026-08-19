import { execFileSync } from 'node:child_process';
// Builds /.well-known/agent-skills for domain installs:
//   npx skills add https://eliteskills.ai
// Run: pnpm exec vite-node scripts/build-well-known-skills.ts
import { createHash } from 'node:crypto';
import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    rmSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { parseFrontmatter } from './parse-frontmatter.ts';

const ROOT = join(import.meta.dirname ?? '.', '..');
const SKILLS_DIR = join(ROOT, 'skills');
const OUT_DIR = join(ROOT, 'public', '.well-known', 'agent-skills');
const SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface DiscoverySkill {
    name: string;
    type: 'archive';
    description: string;
    url: string;
    digest: string;
}

function listSkillDirs(): string[] {
    return readdirSync(SKILLS_DIR)
        .filter((name) => {
            const full = join(SKILLS_DIR, name);
            return (
                statSync(full).isDirectory() &&
                existsSync(join(full, 'SKILL.md'))
            );
        })
        .sort();
}

function sha256Hex(bytes: Buffer): string {
    return createHash('sha256').update(bytes).digest('hex');
}

function listRelativeFiles(dir: string, prefix = ''): string[] {
    const entries = readdirSync(dir).sort();
    const files: string[] = [];
    for (const entry of entries) {
        const full = join(dir, entry);
        const rel = prefix ? `${prefix}/${entry}` : entry;
        if (statSync(full).isDirectory()) {
            files.push(...listRelativeFiles(full, rel));
        } else {
            files.push(rel);
        }
    }
    return files;
}

function buildArchive(skillDir: string, archivePath: string): void {
    // Paths must be SKILL.md (not ./SKILL.md) — the skills CLI rejects "." path segments.
    const files = listRelativeFiles(skillDir);
    if (!files.some((f) => f === 'SKILL.md')) {
        throw new Error(`Missing SKILL.md in ${skillDir}`);
    }
    execFileSync('tar', ['-czf', archivePath, '-C', skillDir, ...files], {
        stdio: 'pipe',
    });
}

function main(): void {
    if (!existsSync(SKILLS_DIR)) {
        throw new Error(`Missing skills directory: ${SKILLS_DIR}`);
    }

    rmSync(OUT_DIR, { recursive: true, force: true });
    mkdirSync(OUT_DIR, { recursive: true });

    const skills: DiscoverySkill[] = [];
    const staging = join(tmpdir(), `eliteskills-well-known-${process.pid}`);
    rmSync(staging, { recursive: true, force: true });
    mkdirSync(staging, { recursive: true });

    try {
        for (const name of listSkillDirs()) {
            if (!SKILL_NAME_RE.test(name)) {
                throw new Error(`Invalid skill directory name: ${name}`);
            }

            const skillDir = join(SKILLS_DIR, name);
            const skillMd = readFileSync(join(skillDir, 'SKILL.md'), 'utf-8');
            const meta = parseFrontmatter(skillMd);
            const description = meta.description?.trim();
            const skillName = meta.name?.trim() || name;

            if (!description) {
                throw new Error(`${name}: SKILL.md missing description`);
            }
            if (description.length > 1024) {
                throw new Error(
                    `${name}: description exceeds 1024 chars (${description.length})`,
                );
            }
            if (!SKILL_NAME_RE.test(skillName)) {
                throw new Error(
                    `${name}: invalid frontmatter name ${skillName}`,
                );
            }

            const archiveName = `${name}.tar.gz`;
            const archivePath = join(staging, archiveName);
            buildArchive(skillDir, archivePath);
            const bytes = readFileSync(archivePath);
            const digest = `sha256:${sha256Hex(bytes)}`;

            cpSync(archivePath, join(OUT_DIR, archiveName));

            skills.push({
                name: skillName,
                type: 'archive',
                description,
                url: `/.well-known/agent-skills/${archiveName}`,
                digest,
            });

            console.log(
                `  ${skillName} (${relative(ROOT, skillDir)}) → ${archiveName} ${digest.slice(0, 23)}…`,
            );
        }
    } finally {
        rmSync(staging, { recursive: true, force: true });
    }

    const index = {
        $schema: SCHEMA,
        skills,
    };

    writeFileSync(
        join(OUT_DIR, 'index.json'),
        JSON.stringify(index, null, 4) + '\n',
    );

    console.log(
        `Wrote ${skills.length} skills to public/.well-known/agent-skills/`,
    );
}

main();
