/**
 * Build script: zips .claude/skills/ into public/skills-bundle.zip
 * Run before astro build: node --import tsx scripts/build-skills-zip.ts
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { zipSync } from 'fflate';

const SKILLS_DIR = join(import.meta.dirname ?? '.', '..', '.claude', 'skills');
const OUTPUT = join(
    import.meta.dirname ?? '.',
    '..',
    'public',
    'skills-bundle.zip',
);

function collectFiles(dir: string, base: string): Record<string, Uint8Array> {
    const files: Record<string, Uint8Array> = {};
    const entries = readdirSync(dir);

    for (const entry of entries) {
        const fullPath = join(dir, entry);
        const relPath = join(base, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            Object.assign(files, collectFiles(fullPath, relPath));
        } else {
            files[relPath] = new Uint8Array(readFileSync(fullPath));
        }
    }

    return files;
}

const files = collectFiles(SKILLS_DIR, '.claude/skills');
const zipped = zipSync(files);
writeFileSync(OUTPUT, zipped);

const sizeKb = (zipped.length / 1024).toFixed(1);
console.log(
    `Built skills-bundle.zip (${sizeKb} KB, ${Object.keys(files).length} files)`,
);
