export const prerender = true;

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
    SKILLS_DOMAIN_SOURCE,
    SKILLS_GITHUB_SOURCE,
    skillsAddCommand,
} from '@/constants/skills-install';

export const GET: APIRoute = async () => {
    const skillsCollection = await getCollection('skills');

    const sortedSkills = [...skillsCollection].sort(
        (a, b) => a.data.order - b.data.order,
    );

    const skillLines = sortedSkills.map((s) => {
        const status = s.data.released ? '' : ' (Coming Soon)';
        return `- **${s.data.title}${status}** — ${s.data.description}`;
    });

    const text = `# Elite Skills

> Elite Skills provides high-quality agent skills for AI coding assistants. Open source and available via the Vercel Skills CLI. Each skill is built from 20 years of production engineering experience by Jack McNicol.

## Installation

### Install all skills (domain)
\`\`\`bash
${skillsAddCommand()}
\`\`\`

### Install all skills (GitHub)
\`\`\`bash
${skillsAddCommand({ source: 'github' })}
\`\`\`

### Install specific skills
\`\`\`bash
${skillsAddCommand({ skill: 'elite-react' })}
${skillsAddCommand({ skill: 'elite-testing' })}
${skillsAddCommand({ skill: 'elite-deploy' })}
${skillsAddCommand({ skill: 'elite-merge' })}
\`\`\`

## Available Skills

${skillLines.join('\n')}

## How it works

Elite Skills work with any AI coding assistant that supports skill files or custom instructions:
- Claude Code
- Cursor  
- Codex
- OpenCode
- And 40+ more agents

Skills are distributed as \`SKILL.md\` files that contain precision-engineered instruction sets covering:
- React patterns and performance optimization
- Backend domains with DTO boundaries, layers, and Result errors 
- CSS design systems and accessibility
- Architecture review with DDD principles
- Feature enhancement strategies
- Application scaffolding and bootstrapping
- Comprehensive testing strategies
- Deployment and CI/CD patterns
- PR babysitting — reviews, green CI, then merge (never on HITL)

## FAQ

**Q: What are Elite Skills?**
A: Downloadable AI instruction sets that plug into any AI coding tool. They tell the AI *how* to write code — architecture patterns, conventions, edge-case handling — distilled from 20 years of shipping production software.

**Q: Which AI tools do these work with?**
A: Any tool that accepts custom instructions or supports skill files: Claude Code, Cursor, Windsurf, Cline, ChatGPT, GitHub Copilot, etc.

**Q: How do I install skills?**
A: Use the Vercel Skills CLI: \`${skillsAddCommand()}\` (first-party domain) or \`${skillsAddCommand({ source: 'github' })}\`. For specific skills, use the \`--skill\` flag.

**Q: Are these really open source?**
A: Yes! MIT licensed. The skills are hosted on GitHub and distributed via the standard Vercel Skills CLI.

**Q: Who made these?**
A: Jack McNicol — 20 years shipping production code at scale.

**Q: Do I need an API key?**
A: No. Installation and usage are completely open.

## Repository

Source code: https://github.com/${SKILLS_GITHUB_SOURCE}
Well-known discovery: ${SKILLS_DOMAIN_SOURCE}/.well-known/agent-skills/index.json
License: MIT

## Pages

- [Home](https://eliteskills.ai/): Skills overview and installation instructions
- [Skills](https://eliteskills.ai/skills): Detailed skill descriptions and examples  
- [Contact](https://eliteskills.ai/contact): Support and questions
- [skills.sh](https://skills.sh/${SKILLS_GITHUB_SOURCE}): Install leaderboard page
`;

    return new Response(text, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    });
};
