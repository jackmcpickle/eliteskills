export const SKILL_SLUG_TO_PRODUCT_ID = {
    frontend: 1,
    backend: 2,
    style: 3,
    'code-review': 4,
    'feature-enhancer': 5,
    'app-bootstrap': 6,
} as const satisfies Record<string, number>;

export const BUNDLE_PRODUCT_IDS = {
    allSkills: 7,
    lifetime: 8,
    teams: 9,
} as const;
