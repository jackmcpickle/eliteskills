import { defineCollection, z } from 'astro:content';

const skills = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string(),
        order: z.number(),
    }),
});

const reviews = defineCollection({
    type: 'content',
    schema: z.object({
        name: z.string(),
        role: z.string(),
        rating: z.number().min(1).max(5),
        order: z.number(),
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
        order: z.number(),
    }),
});

export const collections = { skills, reviews, benefits, pricing };
