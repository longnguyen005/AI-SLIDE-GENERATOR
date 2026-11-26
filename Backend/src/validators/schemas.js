import { z } from 'zod';

const toneEnum = z.enum(['professional', 'academic', 'simple', 'persuasive']);
const themeEnum = z.enum(['indigo', 'emerald', 'amber', 'coral']);
const languageEnum = z.enum(['English', 'en']);
const layoutEnum = z.enum(['title', 'content', 'two_column', 'section', 'summary']);
const objectIdString = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const slideCountField = z
    .union([z.number(), z.string().trim().regex(/^\d+$/, 'Slide count must be an integer between 1 and 10')])
    .transform((val) => Number(val))
    .pipe(
        z
            .number()
            .int('Slide count must be an integer between 1 and 10')
            .min(1, 'Slide count must be between 1 and 10')
            .max(10, 'Slide count must be between 1 and 10')
    );

export const registerSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(1, 'Full name is required')
        .max(100, 'Full name must be at most 100 characters'),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email('Please provide a valid email address')
        .max(254, 'Email is too long'),
    password: z
        .string()
        .min(8, 'Password must contain at least 8 characters')
        .max(72, 'Password must contain at most 72 characters')
});

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email('Please provide a valid email address')
        .max(254, 'Email is too long'),
    password: z
        .string()
        .min(1, 'Password is required')
        .max(72, 'Password must contain at most 72 characters')
});

export const createDeckSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    topic: z
        .string()
        .trim()
        .min(1, 'Topic is required')
        .max(300, 'Topic must be at most 300 characters'),
    description: z.string().trim().max(2000).optional().default(''),
    language: languageEnum.optional().default('English'),
    tone: toneEnum,
    theme: themeEnum.optional().default('indigo'),
    slideCount: slideCountField
});

export const updateDeckSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    topic: z.string().trim().min(1).max(300).optional(),
    description: z.string().trim().max(2000).optional(),
    language: languageEnum.optional(),
    tone: toneEnum.optional(),
    theme: themeEnum.optional(),
    slideCount: slideCountField.optional()
});

export const outlineSchema = z.object({
    sections: z
        .array(
            z.object({
                id: z.string().trim().optional(),
                title: z
                    .string()
                    .trim()
                    .min(1, 'Outline section title is required')
                    .max(200, 'Outline section title must be at most 200 characters'),
                summary: z.string().trim().max(1000).optional().default(''),
                order: z.number().int().min(1).max(10).optional()
            })
        )
        .min(1, 'Outline must contain between 1 and 10 sections')
        .max(10, 'Outline must contain between 1 and 10 sections')
});

export const slideCreateSchema = z.object({
    title: z.string().trim().max(200).optional(),
    content: z.array(z.string().max(500)).max(12).optional(),
    speakerNotes: z.string().max(3000).optional(),
    layout: layoutEnum.optional()
});

export const slideUpdateSchema = z.object({
    title: z.string().trim().min(1, 'Slide title cannot be empty').max(200).optional(),
    content: z.array(z.string().max(500)).max(12).optional(),
    speakerNotes: z.string().max(3000).optional(),
    layout: layoutEnum.optional()
});

export const reorderSchema = z.object({
    slideIds: z
        .array(objectIdString)
        .min(1, 'slideIds must include at least one slide ID')
        .max(10, 'A deck can contain at most 10 slides')
});

export const regenerateSchema = z.object({
    instruction: z.string().trim().max(1000, 'Instruction must be at most 1000 characters').optional()
});
