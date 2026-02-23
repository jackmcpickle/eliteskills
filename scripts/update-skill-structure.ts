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

const ROOT = join(import.meta.dirname ?? '.', '..');
const SKILLS_SRC = join(ROOT, '.claude', 'skills');
const CONTENT_DIR = join(ROOT, 'src', 'content', 'skills');

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

for (const slug of slugs) {
    const contentPath = join(CONTENT_DIR, `${slug}.md`);
    if (!existsSync(contentPath)) {
        console.log(`No content file for "${slug}", skipping.`);
        continue;
    }

    const skillDir = join(SKILLS_SRC, slug);
    const structure = walkDir(skillDir, skillDir);

    const content = readFileSync(contentPath, 'utf-8');
    const updated = updateFrontmatter(content, structure);
    writeFileSync(contentPath, updated);

    console.log(`Updated structure for "${slug}": ${structure.length} entries`);
}

console.log('Done.');
