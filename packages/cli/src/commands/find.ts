import { fetchSkillCatalog } from '../lib/api.js';
import type { CatalogSkill } from '../lib/api.js';
import * as log from '../lib/log.js';

const DIM = '\x1b[2m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function matchesKeyword(skill: CatalogSkill, keyword: string): boolean {
    const kw = keyword.toLowerCase();
    return (
        skill.slug.toLowerCase().includes(kw) ||
        skill.title.toLowerCase().includes(kw) ||
        skill.description.toLowerCase().includes(kw) ||
        skill.highlights.some((h) => h.toLowerCase().includes(kw))
    );
}

function printSkill(skill: CatalogSkill): void {
    const tag = skill.premium ? `  ${YELLOW}[PREMIUM]${RESET}` : '';
    console.log(`  ${skill.title}${tag}`);
    console.log(`  ${DIM}${skill.description}${RESET}`);
    if (skill.highlights.length > 0) {
        console.log(
            `  ${DIM}Highlights: ${skill.highlights.join(', ')}${RESET}`,
        );
    }
    console.log();
}

export async function find(keyword?: string): Promise<void> {
    let skills: CatalogSkill[];
    try {
        skills = await fetchSkillCatalog();
    } catch (err) {
        log.error((err as Error).message);
        process.exit(1);
    }

    const matches = keyword
        ? skills.filter((s) => matchesKeyword(s, keyword))
        : skills;

    if (matches.length === 0) {
        console.log('  No skills found.');
        return;
    }

    console.log();
    for (const skill of matches) {
        printSkill(skill);
    }

    const count = matches.length;
    const noun = count === 1 ? 'skill' : 'skills';
    console.log(`  ${count} ${noun} found.`);
    if (matches.length === 1) {
        console.log(
            `\n  To install: npx @eliteskills/cli install ${matches[0]!.slug}`,
        );
    }
    console.log();
}
