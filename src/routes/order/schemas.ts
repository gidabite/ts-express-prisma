import { z } from 'zod';

export const postBodySchema = z
    .object({
        name: z.string().min(1),
    })
    .strict();

export const getParamSchema = z
    .object({
        id: z.string().uuid(),
    })
    .strict();

export const postPayParamSchema = z
    .object({
        id: z.string().uuid(),
    })
    .strict();
