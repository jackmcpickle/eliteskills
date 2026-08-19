// Reads .claude/skills/{slug}/ dirs, generates file tree arrays,
// updates `structure` frontmatter in src/content/skills/*.md.
// Run: pnpm exec vite-node scripts/update-skill-structure.ts
import {
    readFileSync,
    writeFileSync,
    readdirSync,
    statSync,
    existsSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { SKILL_SLUG_TO_DIR } from '../src/constants/products.ts';

const ROOT = join(import.meta.dirname ?? '.', '..');
const SKILLS_SRC = join(ROOT, '.claude', 'skills');
const CONTENT_DIR = join(ROOT, 'src', 'content', 'skills');

/** skill dir name → content slug (elite-react → react) */
const DIR_TO_SLUG: Record<string, string> = Object.fromEntries(
    Object.entries(SKILL_SLUG_TO_DIR).map(([slug, dir]) => [dir, slug]),
);

function walkDir(dir: string, base: string): string[] {
    const entries: string[] = [];
    for (const entry of readdirSync(dir).sort()) {
        const fullPath = join(dir, entry);
        const relPath = relative(base, fullPath);
        if (statSync(fullPath).isDirectory()) {
            entries.push(relPath + '/');
            entries.push(...walkDir(fullPath, base));
        } else {
            entries.push(relPath);
        }
    }
    return entries;
}

function updateFrontmatter(content: string, structure: string[]): string {
    const yamlArray = structure.map((s) => `  - ${s}`).join('\n');
    const structureBlock = `structure:\n${yamlArray}`;

    if (/^structure:/m.test(content)) {
        // Replace existing structure block
        return content.replace(
            /structure:\n(?:\s+-[^\n]*\n?)*/m,
            structureBlock + '\n',
        );
    }

    // Insert before closing ---
    const parts = content.split('---');
    if (parts.length >= 3) {
        const frontmatter = parts[1].trimEnd();
        parts[1] = frontmatter + '\n' + structureBlock + '\n';
        return parts.join('---');
    }

    return content;
}

// Main
if (!existsSync(SKILLS_SRC)) {
    console.log('No .claude/skills/ directory found. Skipping.');
    process.exit(0);
}

const slugs = readdirSync(SKILLS_SRC).filter((s) =>
    statSync(join(SKILLS_SRC, s)).isDirectory(),
);

for (const dir of slugs) {
    const contentSlug = DIR_TO_SLUG[dir];
    if (!contentSlug) {
        continue;
    }

    const contentPath = join(CONTENT_DIR, `${contentSlug}.md`);
    if (!existsSync(contentPath)) {
        console.log(
            `No content file for "${dir}" → "${contentSlug}", skipping.`,
        );
        continue;
    }

    const skillDir = join(SKILLS_SRC, dir);
    const structure = walkDir(skillDir, skillDir);

    const content = readFileSync(contentPath, 'utf-8');
    const updated = updateFrontmatter(content, structure);
    writeFileSync(contentPath, updated);

    console.log(
        `Updated structure for "${dir}" → "${contentSlug}": ${structure.length} entries`,
    );
}

console.log('Done.');
