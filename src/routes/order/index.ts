import express, { NextFunction, Request, Response } from 'express';

import validateData from '../../middlewares/validation';
import { getParamSchema, postBodySchema, postPayParamSchema } from './schemas';
import prisma from '../../prisma/client';
import { ObjectStatus, PaymentStatus } from '@prisma/client';

const router = express.Router();

router
    .route('/order')
    .get(
        validateData(),
        async (_: Request, res: Response, next: NextFunction) => {
            try {
                res.send(await prisma.object.findMany());
            } catch (e) {
                next(e);
            }
        },
    )
    .post(
        validateData(null, postBodySchema),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                res.status(201).send(
                    await prisma.object.create({
                        data: {
                            name: req.body.name,
                        },
                    }),
                );
            } catch (e) {
                next(e);
            }
        },
    );

router.get(
    '/order/:id',
    validateData(getParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const order = await prisma.object.findUnique({
                where: { id: req.params.id },
                include: {
                    payments: true,
                },
            });

            if (!order) {
                res.status(404).send({
                    statusCode: 404,
                    message: `Order ${req.params.id} isn't found`,
                });
            } else {
                res.send(order);
            }
        } catch (e) {
            next(e);
        }
    },
);

router.post(
    '/order/:id/pay',
    validateData(postPayParamSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const order = await prisma.object.findUnique({
                where: {
                    id: req.params.id,
                },
                include: {
                    payments: {
                        where: {
                            status: PaymentStatus.PENDING,
                        },
                    },
                },
            });
            if (!order) {
                res.status(404).send({
                    statusCode: 404,
                    message: `Order ${req.params.id} isn't found`,
                });
            } else {
                let pendingPayment;

                switch (order.status) {
                    case ObjectStatus.NEW:
                        pendingPayment = await prisma.object.update({
                            data: {
                                cartId: crypto.randomUUID(),
                                status: ObjectStatus.PENDING_PAYMENT,
                                payments: {
                                    create: {
                                        status: PaymentStatus.PENDING,
                                    },
                                },
                            },
                            where: {
                                id: order.id,
                                updateTimestamp: order.updateTimestamp,
                                cartId: undefined,
                                status: ObjectStatus.NEW,
                            },
                            include: {
                                payments: true,
                            },
                        });
                        break;
                    case ObjectStatus.PENDING_PAYMENT:
                        if (order?.payments.length > 0) {
                            pendingPayment = order;
                        } else {
                            pendingPayment = await prisma.object.update({
                                data: {
                                    payments: {
                                        create: {
                                            status: PaymentStatus.PENDING,
                                        },
                                    },
                                },
                                where: {
                                    id: order.id,
                                    updateTimestamp: order.updateTimestamp,
                                    status: ObjectStatus.PENDING_PAYMENT,
                                },
                                include: {
                                    payments: {
                                        where: {
                                            status: PaymentStatus.PENDING,
                                        },
                                    },
                                },
                            });
                        }
                        break;
                    default:
                        break;
                }

                if (!pendingPayment) {
                    res.send({
                        statusCode: 200,
                        message: `It isn't possible to initiate a payment for Order ${req.params.id}`,
                    });
                }

                res.send(pendingPayment);
            }
        } catch (e) {
            next(e);
        }
    },
);

export default router;
