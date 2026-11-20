import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tratamientos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tratamientos' }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string(),
    description: z.string(),
    summary: z.string(),
    order: z.number(),
    bookingSlug: z.string(),
    duration: z.number(),
    image: z.string(),
    imageAlt: z.string(),
    gallery: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
        }),
      )
      .default([]),
    faqs: z
      .array(z.object({ question: z.string(), answer: z.string() }))
      .default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    readingMinutes: z.number().default(4),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

export const collections = { tratamientos, blog };
