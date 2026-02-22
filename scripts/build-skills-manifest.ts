// Reads SKILL.md frontmatter from each skill dir, extracts version + hash,
// writes skills-lock.json with version tracking.
// Run: node --import tsx scripts/build-skills-manifest.ts
import { createHash } from 'node:crypto';
import {
    readFileSync,
    writeFileSync,
    readdirSync,
    statSync,
    existsSync,
} from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname ?? '.', '..');
const SKILLS_DIR = join(ROOT, '.claude', 'skills');
const LOCK_PATH = join(ROOT, 'skills-lock.json');

interface SkillEntry {
    version: string;
    contentHash: string;
    files: number;
    source?: string;
    sourceType?: string;
}

interface SkillsLock {
    lockVersion: 2;
    generatedAt: string;
    skills: Record<string, SkillEntry>;
}

function parseFrontmatter(content: string): Record<string, string> {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    const meta: Record<string, string> = {};
    for (const line of match[1].split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();
        // strip quotes
        if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
        ) {
            val = val.slice(1, -1);
        }
        meta[key] = val;
    }
    return meta;
}

function hashDirectory(dir: string): { hash: string; fileCount: number } {
    const hasher = createHash('sha256');
    let fileCount = 0;

    function walk(d: string): void {
        const entries = readdirSync(d).sort();
        for (const entry of entries) {
            const full = join(d, entry);
            const stat = statSync(full);
            if (stat.isDirectory()) {
                walk(full);
            } else {
                hasher.update(readFileSync(full));
                fileCount++;
            }
        }
    }

    walk(dir);
    return { hash: hasher.digest('hex'), fileCount };
}

// Read existing lock for preserving source info
let existingLock: { skills?: Record<string, Partial<SkillEntry>> } = {};
if (existsSync(LOCK_PATH)) {
    try {
        existingLock = JSON.parse(readFileSync(LOCK_PATH, 'utf-8'));
    } catch {
        // ignore parse errors
    }
}

const skills: Record<string, SkillEntry> = {};
const dirs = readdirSync(SKILLS_DIR).sort();

for (const name of dirs) {
    const skillDir = join(SKILLS_DIR, name);
    if (!statSync(skillDir).isDirectory()) continue;

    const skillMd = join(skillDir, 'SKILL.md');
    if (!existsSync(skillMd)) continue;

    const content = readFileSync(skillMd, 'utf-8');
    const meta = parseFrontmatter(content);
    const version = meta.version ?? '0.0.0';
    const { hash, fileCount } = hashDirectory(skillDir);

    const entry: SkillEntry = {
        version,
        contentHash: hash,
        files: fileCount,
    };

    // preserve source info from existing lock
    const existing = existingLock.skills?.[name];
    if (existing?.source) entry.source = existing.source;
    if (existing?.sourceType) entry.sourceType = existing.sourceType;

    skills[name] = entry;
}

const lock: SkillsLock = {
    lockVersion: 2,
    generatedAt: new Date().toISOString(),
    skills,
};

writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 4) + '\n');

console.log(`Updated skills-lock.json (${Object.keys(skills).length} skills)`);
for (const [name, entry] of Object.entries(skills)) {
    console.log(
        `  ${name} v${entry.version} (${entry.files} files, ${entry.contentHash.slice(0, 8)}...)`,
    );
}
