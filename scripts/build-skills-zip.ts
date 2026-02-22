/**
 * Build script: zips .claude/skills/ into public/skills-bundle.zip
 * and per-skill zips into public/skills-{slug}.zip
 *
 * Run before astro build: node --import tsx scripts/build-skills-zip.ts
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { zipSync } from 'fflate';

const ROOT = join(import.meta.dirname ?? '.', '..');
const SKILLS_DIR = join(ROOT, '.claude', 'skills');
const OUTPUT_DIR = join(ROOT, 'public');

/** Map DB skill_slug → .claude/skills/ directory name */
const SKILL_SLUG_TO_DIR: Record<string, string> = {
    frontend: 'frontend-coder',
    backend: 'backend',
    style: 'frontend-design',
    'code-review': 'review',
    'feature-enhancer': 'feature',
    'app-bootstrap': 'bootstrap',
};

/** Dirs excluded from all zips (internal / not sold) */
const IGNORED_DIRS = new Set(['agent-browser', 'product-marketing-context', 'react-doctor']);

function collectFiles(
    dir: string,
    base: string,
    ignoreDirs?: Set<string>,
): Record<string, Uint8Array> {
    const files: Record<string, Uint8Array> = {};
    const entries = readdirSync(dir);

    for (const entry of entries) {
        const fullPath = join(dir, entry);
        const relPath = join(base, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            if (ignoreDirs?.has(entry)) continue;
            Object.assign(files, collectFiles(fullPath, relPath));
        } else {
            files[relPath] = new Uint8Array(readFileSync(fullPath));
        }
    }

    return files;
}

// ── Full bundle zip ────────────────────────────────────────────────
const allFiles = collectFiles(SKILLS_DIR, '.claude/skills', IGNORED_DIRS);
const bundleZipped = zipSync(allFiles);
const bundlePath = join(OUTPUT_DIR, 'skills-bundle.zip');
writeFileSync(bundlePath, bundleZipped);

const bundleSizeKb = (bundleZipped.length / 1024).toFixed(1);
console.log(
    `Built skills-bundle.zip (${bundleSizeKb} KB, ${Object.keys(allFiles).length} files)`,
);

// ── Per-skill zips ─────────────────────────────────────────────────
for (const [slug, dirName] of Object.entries(SKILL_SLUG_TO_DIR)) {
    const skillDir = join(SKILLS_DIR, dirName);

    try {
        statSync(skillDir);
    } catch {
        console.warn(`WARN: skill dir missing for "${slug}" → ${dirName}`);
        continue;
    }

    const skillFiles = collectFiles(
        skillDir,
        `.claude/skills/${dirName}`,
    );
    const zipped = zipSync(skillFiles);
    const outPath = join(OUTPUT_DIR, `skills-${slug}.zip`);
    writeFileSync(outPath, zipped);

    const sizeKb = (zipped.length / 1024).toFixed(1);
    console.log(
        `Built skills-${slug}.zip (${sizeKb} KB, ${Object.keys(skillFiles).length} files)`,
    );
}
