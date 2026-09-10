// Pure helpers for release-time skill version bumps (see bump-skill-versions.ts).
export type Bump = 'major' | 'minor' | 'patch';

const RANK: Record<Bump, number> = { patch: 0, minor: 1, major: 2 };
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m;
const BREAKING_SUBJECT = /^\w+(\([^)]*\))?!:/;
const FEAT_SUBJECT = /^feat(\([^)]*\))?:/;
const VERSION_LINE = /^[-+]version:/m;

/** Classify one conventional commit by subject + body. */
export function bumpFor(subject: string, body: string): Bump {
    if (BREAKING_FOOTER.test(body) || BREAKING_SUBJECT.test(subject))
        return 'major';
    if (FEAT_SUBJECT.test(subject)) return 'minor';
    return 'patch';
}

/** Highest bump across a set of commits (defaults to patch). */
export function highestBump(commits: readonly [string, string][]): Bump {
    return commits
        .map(([s, b]) => bumpFor(s, b))
        .reduce<Bump>((a, b) => (RANK[b] > RANK[a] ? b : a), 'patch');
}

/** Apply a bump to a semver string. */
export function applyBump(version: string, bump: Bump): string {
    const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number);
    if (bump === 'major') return `${major + 1}.0.0`;
    if (bump === 'minor') return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
}

/** True if a `git diff` of SKILL.md already changed the version line. */
export function versionChangedInDiff(diff: string): boolean {
    return VERSION_LINE.test(diff);
}
