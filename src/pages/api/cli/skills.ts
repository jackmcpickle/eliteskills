export const prerender = false;

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { createDb } from '@/libs/db/client';
import { listSkillProducts } from '@/libs/db/repo';

interface SkillEntry {
    id: string;
    data: {
        title: string;
        description: string;
        order: number;
        highlights: string[];
    };
}

export const GET: APIRoute = async ({ locals }) => {
    const d1 = locals.runtime.env.DB;
    const db = createDb(d1);

    const [skillProducts, skillsCollection] = await Promise.all([
        listSkillProducts(db),
        getCollection('skills') as unknown as Promise<SkillEntry[]>,
    ]);

    const dbMap = new Map(
        skillProducts.filter((p) => p.skillSlug).map((p) => [p.skillSlug, p]),
    );

    const skills = [...skillsCollection]
        .sort((a, b) => a.data.order - b.data.order)
        .map((s) => {
            const dbSkill = dbMap.get(s.id);
            return {
                slug: s.id,
                title: s.data.title,
                description: s.data.description,
                highlights: s.data.highlights,
                premium: !!dbSkill,
                productId: dbSkill?.id ?? null,
                instructions: `npx @eliteskills/cli install ${s.id}`,
            };
        });

    return new Response(JSON.stringify({ skills }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
};
