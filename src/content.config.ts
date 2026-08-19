import { defineCollection, z } from 'astro:content';

const skills = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string(),
        order: z.number(),
        highlights: z.array(z.string()).default([]),
        released: z.boolean().default(false),
        examples: z
            .array(
                z.object({
                    label: z.string(),
                    command: z.string(),
                }),
            )
            .default([]),
        bestPractices: z.array(z.string()).default([]),
        structure: z.array(z.string()).default([]),
        isNew: z.boolean().default(false),
    }),
});

const benefits = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string(),
        order: z.number(),
    }),
});

const pricing = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        price: z.number(),
        period: z.string(),
        description: z.string(),
        features: z.array(z.string()),
        highlighted: z.boolean().default(false),
        size: z.enum(['sm', 'default']).default('default'),
        order: z.number(),
    }),
});

export const collections = { skills, benefits, pricing };
