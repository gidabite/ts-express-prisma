import { PaymentStatus } from '@prisma/client';
import { z } from 'zod';

export const patchBodySchema = z
    .object({
        status: z.nativeEnum(PaymentStatus),
    })
    .strict();

export const objectIdSchema = z
    .object({
        id: z.string().uuid(),
    })
    .strict();
