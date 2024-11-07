import express, { NextFunction, Request, Response } from 'express';

import validateData from '../../middlewares/validation';
import prisma from '../../prisma/client';
import { updatePaymentStatus } from './controller';
import { objectIdSchema, patchBodySchema } from './schemas';

const router = express.Router();

router
    .route('/payment')
    .get(
        validateData(),
        async (_: Request, res: Response, next: NextFunction) => {
            try {
                res.send(await prisma.payment.findMany());
            } catch (e) {
                next(e);
            }
        },
    );

router.get(
    '/payment/:id',
    validateData(objectIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payment = await prisma.payment.findUnique({
                where: { id: req.params.id },
            });

            if (!payment) {
                next({
                    statusCode: 404,
                    message: `Payment ${req.params.id} isn't found`,
                });
            } else {
                res.send(payment);
            }
        } catch (e) {
            next(e);
        }
    },
);

router.patch(
    '/payment/:id/status',
    validateData(objectIdSchema, patchBodySchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const updatedPayment = await updatePaymentStatus(
                req.params.id,
                req.body.status,
            );
            console.log(updatedPayment);
            if (!updatedPayment) {
                next({
                    statusCode: 422,
                    message: `It isn't possible to update a status for Payment ${req.params.id}`,
                });
            } else {
                res.send(updatedPayment);
            }
        } catch (e) {
            next(e);
        }
    },
);

export default router;
