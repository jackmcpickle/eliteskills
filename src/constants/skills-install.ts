/** Canonical install sources for Elite Skills. */
export const SKILLS_DOMAIN_SOURCE = 'https://eliteskills.ai';
export const SKILLS_GITHUB_SOURCE = 'jackmcpickle/eliteskills';

export function skillsAddCommand(options?: {
    source?: 'domain' | 'github';
    skill?: string;
}): string {
    const source =
        options?.source === 'github'
            ? SKILLS_GITHUB_SOURCE
            : SKILLS_DOMAIN_SOURCE;
    const skillFlag = options?.skill ? ` --skill ${options.skill}` : '';
    return `npx skills add ${source}${skillFlag}`;
}
