import {
    readFileSync,
    readdirSync,
    statSync,
    existsSync,
    writeFileSync,
    appendFileSync,
} from 'node:fs';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { test, expect } from '@playwright/test';
import { SKILL_SLUG_TO_DIR } from '../../src/constants/products.ts';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SKILLS_DIR = join(import.meta.dirname, '..', '..', '.claude', 'skills');
const MODEL = 'claude-sonnet-4-6';
const REPORT_PATH = join(
    import.meta.dirname,
    '..',
    '..',
    'skill-quality-report.md',
);

// Per-skill generation prompts — what to ask the skill to build
const GENERATION_TASKS: Record<string, string> = {
    react: `Build a task management feature module with:
- A form to create tasks (title, description, priority enum, due date)
- A table listing tasks with sorting and pagination
- Query and mutation hooks for CRUD operations
- Zod validation schemas
Output all files with their paths as fenced code blocks.`,

    backend: `Build a "bookmarks" domain with:
- SQLModel table for bookmarks (url, title, tags list, is_archived boolean)
- Create/Update DTOs and Detail/ListItem response DTOs
- Repository with CRUD operations returning Result types
- Service layer with validation
- FastAPI routes
Output all files with their paths as fenced code blocks.`,

    style: `Build a pricing page for a developer tools SaaS with 3 tiers (Hobby, Pro, Enterprise).
Include distinctive typography, color scheme, and micro-interactions.
Output as a single HTML file with inline CSS and JS.`,

    'agent-browser': `Write a browser automation script that:
1. Opens a login page
2. Fills email and password fields
3. Clicks submit
4. Waits for dashboard to load
5. Extracts the user's display name
6. Takes a screenshot
Output as a bash script using agent-browser commands.`,

    'react-doctor': `Given a React component with these issues:
- useState derived from props
- Missing useEffect cleanup
- Array index used as key
- Component defined inside another component
Show the problematic code and the fixed version.
Output as fenced code blocks.`,

    'product-marketing-context': `Create a product marketing context document for a fictional project management tool called "FlowBoard" targeting small dev teams.
Include all sections: product overview, target audience, personas, problems, competitive landscape, differentiation, objections, switching dynamics, customer language, brand voice, proof points, and goals.
Output as a markdown document.`,
};

interface ReviewResult {
    overallScore: number;
    categories: {
        name: string;
        score: number;
        issues: string[];
    }[];
    recommendations: string[];
    versionBumpSuggestion: 'none' | 'patch' | 'minor' | 'major';
}

function readSkillContent(skillName: string): string {
    const skillDir = join(SKILLS_DIR, skillName);
    if (!existsSync(skillDir)) return '';

    const parts: string[] = [];

    function walk(dir: string): void {
        const entries = readdirSync(dir).sort();
        for (const entry of entries) {
            const full = join(dir, entry);
            const stat = statSync(full);
            if (stat.isDirectory()) {
                walk(full);
            } else if (
                entry.endsWith('.md') ||
                entry.endsWith('.ts.md') ||
                entry.endsWith('.tsx.md')
            ) {
                const relPath = full.replace(skillDir + '/', '');
                const content = readFileSync(full, 'utf-8');
                parts.push(`--- ${relPath} ---\n${content}`);
            }
        }
    }

    walk(skillDir);
    return parts.join('\n\n');
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

// Only test skills that are sold as products
const productSkillDirs = new Set(Object.values(SKILL_SLUG_TO_DIR));
const skillDirs = readdirSync(SKILLS_DIR)
    .filter((name) => {
        const dir = join(SKILLS_DIR, name);
        return (
            productSkillDirs.has(name) &&
            statSync(dir).isDirectory() &&
            existsSync(join(dir, 'SKILL.md'))
        );
    })
    .sort();

test.describe('@llm Skill quality evaluation', () => {
    test.skip(!ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY required');
    test.setTimeout(120_000);

    test.beforeAll(() => {
        const header = `# Skill Quality Report\n\nGenerated: ${new Date().toISOString()}\nModel: ${MODEL}\n\n---\n\n`;
        writeFileSync(REPORT_PATH, header);
    });

    for (const skillName of skillDirs) {
        test(`${skillName} — generates quality output and self-review`, async () => {
            const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
            const skillContent = readSkillContent(skillName);
            const skillMd = readFileSync(
                join(SKILLS_DIR, skillName, 'SKILL.md'),
                'utf-8',
            );
            const meta = parseFrontmatter(skillMd);
            const version = meta.version ?? '0.0.0';

            const task =
                GENERATION_TASKS[skillName] ??
                `Generate a small but complete example project following this skill's patterns and guidelines. Output all files as fenced code blocks with file paths.`;

            // Step 1: Generate code using the skill
            const generationResponse = await client.messages.create({
                model: MODEL,
                max_tokens: 4096,
                system: `You are an expert developer. You have been given a skill definition that describes coding patterns, conventions, and templates. Follow the skill EXACTLY. Output production-quality code.\n\n<skill_definition>\n${skillContent}\n</skill_definition>`,
                messages: [
                    {
                        role: 'user',
                        content: task,
                    },
                ],
            });

            const generatedText =
                generationResponse.content.find((b) => b.type === 'text')
                    ?.text ?? '';
            expect(generatedText.length).toBeGreaterThan(100);

            // Step 2: Review the generated code against the skill
            const reviewResponse = await client.messages.create({
                model: MODEL,
                max_tokens: 2048,
                messages: [
                    {
                        role: 'user',
                        content: `You are a skill quality auditor. Review the generated code against the skill definition and produce a structured evaluation.

<skill_definition>
${skillContent}
</skill_definition>

<generated_code>
${generatedText}
</generated_code>

<current_version>${version}</current_version>

Evaluate on these categories:
1. **pattern_adherence**: Does the code follow the skill's patterns, conventions, and templates?
2. **completeness**: Does the code include all required elements the skill specifies?
3. **quality**: Is the code production-grade, well-structured, and free of issues?
4. **clarity**: Would a developer understand the skill's intent from the generated output?

For each category, score 0-100 and list specific issues found.

Also provide:
- recommendations: actionable improvements to the SKILL DEFINITION (not the generated code) that would produce better output next time
- versionBumpSuggestion: "none" if skill is fine, "patch" for minor clarifications, "minor" for new patterns/templates needed, "major" for fundamental restructuring needed

Return ONLY valid JSON matching this schema:
{
  "overallScore": number,
  "categories": [
    { "name": string, "score": number, "issues": [string] }
  ],
  "recommendations": [string],
  "versionBumpSuggestion": "none" | "patch" | "minor" | "major"
}`,
                    },
                ],
            });

            const reviewText =
                reviewResponse.content.find((b) => b.type === 'text')?.text ??
                '';
            const jsonMatch = reviewText.match(/\{[\s\S]*\}/);
            expect(jsonMatch).toBeTruthy();

            const review: ReviewResult = JSON.parse(jsonMatch![0]);

            // Validate review structure
            expect(review.overallScore).toBeGreaterThanOrEqual(0);
            expect(review.overallScore).toBeLessThanOrEqual(100);
            expect(review.categories.length).toBeGreaterThanOrEqual(4);
            expect(review.recommendations).toBeDefined();
            expect(['none', 'patch', 'minor', 'major']).toContain(
                review.versionBumpSuggestion,
            );

            // Quality gate: skill should produce >= 60 score
            expect(review.overallScore).toBeGreaterThanOrEqual(60);

            // Log results for visibility
            console.log(`\n=== ${skillName} v${version} ===`);
            console.log(`Overall score: ${review.overallScore}/100`);
            for (const cat of review.categories) {
                console.log(`  ${cat.name}: ${cat.score}/100`);
                for (const issue of cat.issues) {
                    console.log(`    - ${issue}`);
                }
            }
            if (review.recommendations.length > 0) {
                console.log(`Recommendations:`);
                for (const rec of review.recommendations) {
                    console.log(`  - ${rec}`);
                }
            }
            console.log(
                `Version bump suggestion: ${review.versionBumpSuggestion}`,
            );

            // Append to report file
            const catLines = review.categories
                .map((c) => {
                    const issues =
                        c.issues.length > 0
                            ? c.issues.map((i) => `  - ${i}`).join('\n')
                            : '  (none)';
                    return `- **${c.name}**: ${c.score}/100\n${issues}`;
                })
                .join('\n');
            const recLines =
                review.recommendations.length > 0
                    ? review.recommendations.map((r) => `- ${r}`).join('\n')
                    : '(none)';
            const section = [
                `## ${skillName} v${version}`,
                '',
                `**Overall: ${review.overallScore}/100** | Bump: \`${review.versionBumpSuggestion}\``,
                '',
                '### Categories',
                catLines,
                '',
                '### Recommendations',
                recLines,
                '',
                '---',
                '',
            ].join('\n');
            appendFileSync(REPORT_PATH, section);
        });
    }
});
