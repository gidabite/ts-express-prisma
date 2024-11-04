import { z } from 'zod';

export const orderCreateSchema = z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    depth: z.number(),
});
