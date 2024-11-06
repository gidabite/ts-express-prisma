import { z } from 'zod';

export const postBodySchema = z
    .object({
        trainNumber: z.string().regex(/^\d{3}[А-Я]$/),
    })
    .strict();

export const objectIdSchema = z
    .object({
        id: z.string().uuid(),
    })
    .strict();
