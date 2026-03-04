import { BUNDLE_PRODUCT_IDS } from './products';

export interface ProductDisplay {
    id: number;
    code: string;
    name: string;
    price: number;
    currency: string;
    lifetime: number;
    skillSlug: string | null;
}

/** Default NA/USD prices used at build time for prerendered pages. */
export const DEFAULT_PRODUCTS: ProductDisplay[] = [
    {
        id: 1,
        code: 'skill-react',
        name: 'Elite Skill — React',
        price: 9,
        currency: 'usd',
        lifetime: 0,
        skillSlug: 'react',
    },
    {
        id: 2,
        code: 'skill-python',
        name: 'Elite Skill — Python',
        price: 9,
        currency: 'usd',
        lifetime: 0,
        skillSlug: 'python',
    },
    {
        id: 3,
        code: 'skill-style',
        name: 'Elite Skill — Style',
        price: 9,
        currency: 'usd',
        lifetime: 0,
        skillSlug: 'style',
    },
    {
        id: 4,
        code: 'skill-architecture-review',
        name: 'Elite Skill — Architecture Review',
        price: 9,
        currency: 'usd',
        lifetime: 0,
        skillSlug: 'architecture-review',
    },
    {
        id: 5,
        code: 'skill-feature-enhancer',
        name: 'Elite Skill — Feature Enhancer',
        price: 9,
        currency: 'usd',
        lifetime: 0,
        skillSlug: 'feature-enhancer',
    },
    {
        id: 6,
        code: 'skill-app-bootstrap',
        name: 'Elite Skill — App Bootstrap',
        price: 9,
        currency: 'usd',
        lifetime: 0,
        skillSlug: 'app-bootstrap',
    },
    {
        id: 10,
        code: 'skill-testing',
        name: 'Elite Skill — Testing',
        price: 9,
        currency: 'usd',
        lifetime: 0,
        skillSlug: 'testing',
    },
    {
        id: 11,
        code: 'skill-deploy',
        name: 'Elite Skill — Deploy',
        price: 9,
        currency: 'usd',
        lifetime: 0,
        skillSlug: 'deploy',
    },
    {
        id: BUNDLE_PRODUCT_IDS.allSkills,
        code: 'bundle-once',
        name: 'Elite AI Skills — All Skills',
        price: 29,
        currency: 'usd',
        lifetime: 0,
        skillSlug: null,
    },
    {
        id: BUNDLE_PRODUCT_IDS.lifetime,
        code: 'bundle-lifetime',
        name: 'Elite AI Skills — Lifetime Access',
        price: 99,
        currency: 'usd',
        lifetime: 1,
        skillSlug: null,
    },
    {
        id: BUNDLE_PRODUCT_IDS.teams,
        code: 'bundle-teams',
        name: 'Elite AI Skills — Teams',
        price: 299,
        currency: 'usd',
        lifetime: 1,
        skillSlug: null,
    },
];

export const DEFAULT_SKILL_PRODUCTS = DEFAULT_PRODUCTS.filter(
    (p) => p.skillSlug,
);
export const DEFAULT_BUNDLE_PRODUCTS = DEFAULT_PRODUCTS.filter(
    (p) => !p.skillSlug,
);

export const DEFAULT_LOCALE = 'en-US';
