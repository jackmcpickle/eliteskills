// Bumps `version:` in skills/*/SKILL.md for skills changed since the last
// release tag, inferring the bump from conventional commit subjects:
//   BREAKING CHANGE / `type!:` -> major, feat -> minor, anything else -> patch
// Skills whose version line was already changed by hand are left alone.
// Run: pnpm exec vite-node scripts/bump-skill-versions.ts [--dry-run] [--since=<ref>]
import { execFileSync } from 'node:child_process';
import {
    existsSync,
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { parseFrontmatter } from './parse-frontmatter.ts';

const ROOT = join(import.meta.dirname ?? '.', '..');
const SKILLS_DIR = join(ROOT, 'skills');
const DRY_RUN = process.argv.includes('--dry-run');
const SINCE = process.argv.find((a) => a.startsWith('--since='))?.slice(8);

type Bump = 'major' | 'minor' | 'patch';
const RANK: Record<Bump, number> = { patch: 0, minor: 1, major: 2 };

function git(...args: string[]): string {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' }).trim();
}

function lastTag(): string | null {
    try {
        return git('describe', '--tags', '--abbrev=0', '--match', 'v*');
    } catch {
        return null;
    }
}

function bumpFor(subject: string, body: string): Bump {
    if (/BREAKING CHANGE/.test(body) || /^\w+(\([^)]*\))?!:/.test(subject))
        return 'major';
    if (/^feat(\([^)]*\))?:/.test(subject)) return 'minor';
    return 'patch';
}

function apply(version: string, bump: Bump): string {
    const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number);
    if (bump === 'major') return `${major + 1}.0.0`;
    if (bump === 'minor') return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
}

const tag = SINCE ?? lastTag();
const range = tag ? `${tag}..HEAD` : 'HEAD';
console.log(
    `Skill version bump (range: ${range})${DRY_RUN ? ' [dry run]' : ''}`,
);

for (const name of readdirSync(SKILLS_DIR).sort()) {
    const dir = join(SKILLS_DIR, name);
    const skillMd = join(dir, 'SKILL.md');
    if (!statSync(dir).isDirectory() || !existsSync(skillMd)) continue;

    const rel = `skills/${name}`;
    const log = git('log', '--format=%s%x00%b%x01', range, '--', rel);
    const commits = log
        .split('\x01')
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => c.split('\x00'));
    if (commits.length === 0) continue;

    if (
        tag &&
        /^[-+]version:/m.test(git('diff', range, '--', `${rel}/SKILL.md`))
    ) {
        console.log(`  ${name}: version already bumped manually, skipping`);
        continue;
    }

    const bump = commits
        .map(([s = '', b = '']) => bumpFor(s, b))
        .reduce<Bump>((a, b) => (RANK[b] > RANK[a] ? b : a), 'patch');

    const content = readFileSync(skillMd, 'utf-8');
    const current = parseFrontmatter(content).version ?? '0.0.0';
    const next = apply(current, bump);
    console.log(
        `  ${name}: ${current} -> ${next} (${bump}, ${commits.length} commit(s))`,
    );

    if (DRY_RUN) continue;
    if (!/^version:.*$/m.test(content))
        throw new Error(`${rel}/SKILL.md has no version field`);
    writeFileSync(
        skillMd,
        content.replace(/^version:.*$/m, `version: ${next}`),
    );
}
