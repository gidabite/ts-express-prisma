import express, { NextFunction, Request, Response } from 'express';

import validateData from '../../middlewares/validation';
import { objectIdSchema, postBodySchema } from './schemas';
import prisma from '../../prisma/client';
import { ObjectStatus, PaymentStatus } from '@prisma/client';

const router = express.Router();

router
    .route('/object')
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
                            trainNumber: req.body.trainNumber,
                        },
                    }),
                );
            } catch (e) {
                next(e);
            }
        },
    );

router.get(
    '/object/:id',
    validateData(objectIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const object = await prisma.object.findUnique({
                where: { id: req.params.id },
                include: {
                    payments: true,
                },
            });

            if (!object) {
                next({
                    statusCode: 404,
                    message: `Object ${req.params.id} isn't found`,
                });
            } else {
                res.send(object);
            }
        } catch (e) {
            next(e);
        }
    },
);

router.post(
    '/object/:id/createPayment',
    validateData(objectIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const object = await prisma.object.findUnique({
                where: {
                    id: req.params.id,
                },
            });
            if (!object) {
                next({
                    statusCode: 404,
                    message: `Object ${req.params.id} isn't found`,
                });
            } else {
                let pendingPayment;

                switch (object.status) {
                    case ObjectStatus.NEW:
                    case ObjectStatus.PENDING_PAYMENT:
                        pendingPayment = await prisma.object.update({
                            data: {
                                status: ObjectStatus.PENDING_PAYMENT,
                                payments: {
                                    create: {
                                        status: PaymentStatus.NEW,
                                    },
                                },
                            },
                            where: {
                                id: object.id,
                                updateTimestamp: object.updateTimestamp,
                            },
                            include: {
                                payments: true,
                            },
                        });
                        break;
                    default:
                        break;
                }

                if (!pendingPayment) {
                    next({
                        statusCode: 200,
                        message: `It isn't possible to initiate a payment for Object ${req.params.id}`,
                    });
                } else {
                    res.send(pendingPayment);
                }
            }
        } catch (e) {
            next(e);
        }
    },
);

router.post(
    '/object/:id/cancel',
    validateData(objectIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const object = await prisma.object.findUnique({
                where: {
                    id: req.params.id,
                },
            });
            if (!object) {
                next({
                    statusCode: 404,
                    message: `Object ${req.params.id} isn't found`,
                });
            } else {
                let pendingPayment;

                switch (object.status) {
                    case ObjectStatus.NEW:
                    case ObjectStatus.PENDING_PAYMENT:
                        pendingPayment = await prisma.object.update({
                            data: {
                                status: ObjectStatus.CANCELED,
                            },
                            where: {
                                id: object.id,
                                updateTimestamp: object.updateTimestamp,
                            },
                        });
                        break;

                    case ObjectStatus.PAID:
                        pendingPayment = await prisma.object.update({
                            data: {
                                status: ObjectStatus.CANCELED,
                                payments: {
                                    updateMany: {
                                        where: {
                                            status: PaymentStatus.SUCCESS,
                                        },
                                        data: {
                                            status: PaymentStatus.REFUND,
                                        },
                                    },
                                },
                            },
                            where: {
                                id: object.id,
                                updateTimestamp: object.updateTimestamp,
                            },
                            include: {
                                payments: true,
                            },
                        });
                        break;
                    default:
                        break;
                }

                if (!pendingPayment) {
                    next({
                        statusCode: 200,
                        message: `It isn't possible to initiate a payment for Object ${req.params.id}`,
                    });
                } else {
                    res.send(pendingPayment);
                }
            }
        } catch (e) {
            next(e);
        }
    },
);

export default router;
