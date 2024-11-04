import express, { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import { validateData } from '../../middlewares/validation';
import { orderCreateSchema } from './schema';

const router = express.Router();
const prisma = new PrismaClient();

router
    .route('/order')
    .get(async (_: Request, res: Response, next: NextFunction) => {
        try {
            res.send({
                orders: await prisma.object.findMany(),
            });
        } catch (e) {
            next(e);
        }
    })
    .post(
        validateData(orderCreateSchema),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const order = await prisma.object.create({
                    data: {
                        id: crypto.randomUUID(),
                        name: req.body.name,
                        type: req.body.type,
                        depth: req.body.depth,
                    },
                });

                res.status(201).send(order);
            } catch (e) {
                next(e);
            }
        },
    );

router.get(
    '/order/:id',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const order = await prisma.object.findUnique({
                where: { id: req.params.id },
            });

            res.send(order);
        } catch (e) {
            next(e);
        }
    },
);

export default router;
