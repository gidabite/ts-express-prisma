import { z } from 'zod';

export const postBodySchema = z
    .object({
        name: z.string().min(1),
    })
    .strict();
