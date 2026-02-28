/** Maps content slug (src/content/skills/*.md) → .claude/skills/ dir name */
export const SKILL_SLUG_TO_DIR: Record<string, string> = {
    react: 'elite-react',
    python: 'elite-backend',
    style: 'elite-style',
    'architecture-review': 'elite-review',
    'feature-enhancer': 'elite-feature',
    'app-bootstrap': 'elite-bootstrap',
};

export const SKILL_SLUG_TO_PRODUCT_ID = {
    react: 1,
    python: 2,
    style: 3,
    'architecture-review': 4,
    'feature-enhancer': 5,
    'app-bootstrap': 6,
} as const satisfies Record<string, number>;

export const BUNDLE_PRODUCT_IDS = {
    allSkills: 7,
    lifetime: 8,
    teams: 9,
} as const;
