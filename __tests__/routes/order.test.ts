import { afterAll, describe, expect } from '@jest/globals';
import { ObjectStatus, PaymentStatus } from '@prisma/client';

import { invalidAuthAnswer } from '../../src/middlewares/auth';
import prisma from '../../src/prisma/client';
import appOperations from '../../src/utilities/operations';

const convertTimesInObjectDB = <
    T extends {
        createTimestamp?: Date;
        updateTimestamp?: Date;
    },
>(
    objectDb: T | null,
) =>
    objectDb
        ? {
              ...objectDb,
              createTimestamp: objectDb.createTimestamp?.toISOString(),
              updateTimestamp: objectDb.updateTimestamp?.toISOString(),
          }
        : null;

describe('Object Endpoints', () => {
    const authHeader = {
        Authorization: `Basic ${btoa(`${process.env.BASIC_AUTH_LOGIN}:${process.env.BASIC_AUTH_PASSWORD}`)}`,
    };
    const invalidAuthHeader = {
        Authorization: 'Basic InvalidToken',
    };
    const requester = appOperations();

    describe('GET /object', () => {
        it('should return 401 error (Authentication error)', async () => {
            const res = await requester.object(invalidAuthHeader).getAll();

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual(invalidAuthAnswer);
        });

        it('should return a list of objects', async () => {
            const res = await requester.object(authHeader).getAll();

            const objectsDb = await prisma.object.findMany();

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(
                objectsDb.map((objectDb) => convertTimesInObjectDB(objectDb)),
            );
        });
    });

    describe('GET /object/:uuid', () => {
        let object: { id: string };

        beforeAll(async () => {
            object = (
                await requester.object(authHeader).post({
                    trainNumber: '123Б',
                })
            ).body;
        });

        it('should return 401 error (Authentication error)', async () => {
            const res = await requester
                .object(invalidAuthHeader)
                .get(object.id);

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual(invalidAuthAnswer);
        });

        it('should return 400 error for invalid an id', async () => {
            const res = await requester.object(authHeader).get('invalidId');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({
                details: [
                    {
                        message: 'id is Invalid uuid',
                    },
                ],
                error: 'Invalid data',
                statusCode: 400,
            });
        });

        it('should return 404 error', async () => {
            const invalidId = crypto.randomUUID();
            const res = await requester.object(authHeader).get(invalidId);

            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({
                statusCode: 404,
                message: `Object ${invalidId} isn't found`,
            });
        });

        it('should return an object', async () => {
            const res = await requester.object(authHeader).get(object.id);

            const objectDb = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
                include: {
                    payments: true,
                },
            });

            expect(res.statusCode).toEqual(200);
            expect(objectDb).not.toBeNull();
            expect(res.body).toEqual(convertTimesInObjectDB(objectDb));
        });
    });

    describe('POST /object', () => {
        it('should return 401 error (Authentication error)', async () => {
            const res = await requester.object(invalidAuthHeader).post({
                trainNumber: '123Б',
            });

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual(invalidAuthAnswer);
        });

        //TODO Некорректные входные данные

        it('should create an object', async () => {
            const res = await requester.object(authHeader).post({
                trainNumber: '123Б',
            });

            const objectDb = await prisma.object.findUnique({
                where: {
                    id: res.body.id,
                },
            });

            expect(objectDb).not.toBeNull();
            expect(res.body).toEqual(convertTimesInObjectDB(objectDb));
        });
    });

    describe('POST /object/:uuid/createPayment', () => {
        let object: { id: string; status: ObjectStatus };

        beforeEach(async () => {
            object = (
                await requester.object(authHeader).post({
                    trainNumber: '123Б',
                })
            ).body;
        });

        it('should return 401 error (Authentication error)', async () => {
            const res = await requester
                .object(invalidAuthHeader)
                .postCreatePayment(object.id);

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual(invalidAuthAnswer);
        });

        it('should return 400 error for invalid an id', async () => {
            const res = await requester
                .object(authHeader)
                .postCreatePayment('invalidId');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({
                details: [
                    {
                        message: 'id is Invalid uuid',
                    },
                ],
                error: 'Invalid data',
                statusCode: 400,
            });
        });

        it('should return 404 error', async () => {
            const invalidId = crypto.randomUUID();
            const res = await requester
                .object(authHeader)
                .postCreatePayment(invalidId);

            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({
                statusCode: 404,
                message: `Object ${invalidId} isn't found`,
            });
        });

        it('should create a new payment for an Object in a status = NEW', async () => {
            expect(object.status).toEqual(ObjectStatus.NEW);

            const res = await requester
                .object(authHeader)
                .postCreatePayment(object.id);

            const objectWithPaymentDB = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
                include: {
                    payments: true,
                },
            });

            expect(res.statusCode).toEqual(200);
            expect(objectWithPaymentDB).not.toBeNull();
            if (!objectWithPaymentDB) return;
            expect(objectWithPaymentDB?.status).toEqual(
                ObjectStatus.PENDING_PAYMENT,
            );
            expect(objectWithPaymentDB.payments).toHaveLength(1);
            expect(objectWithPaymentDB.payments[0].status).toEqual(
                PaymentStatus.NEW,
            );
            expect(res.body).toEqual(
                convertTimesInObjectDB({
                    ...objectWithPaymentDB,
                    payments: [
                        ...objectWithPaymentDB.payments.map((paymentDB) =>
                            convertTimesInObjectDB(paymentDB),
                        ),
                    ],
                }),
            );
        });

        it('should create a new payment for an Object in a status = PENDING_PAYMENT', async () => {
            await requester.object(authHeader).postCreatePayment(object.id);

            const res = await requester
                .object(authHeader)
                .postCreatePayment(object.id);

            const objectWithPaymentDB = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
                include: {
                    payments: true,
                },
            });

            expect(res.statusCode).toEqual(200);
            expect(objectWithPaymentDB).not.toBeNull();
            if (!objectWithPaymentDB) return;
            expect(objectWithPaymentDB.status).toEqual(
                ObjectStatus.PENDING_PAYMENT,
            );
            expect(objectWithPaymentDB.payments).toHaveLength(2);
            objectWithPaymentDB.payments.forEach((paymentDB) =>
                expect(paymentDB.status).toEqual(PaymentStatus.NEW),
            );
            expect(res.body).toEqual(
                convertTimesInObjectDB({
                    ...objectWithPaymentDB,
                    payments: [
                        ...objectWithPaymentDB.payments.map((paymentDB) =>
                            convertTimesInObjectDB(paymentDB),
                        ),
                    ],
                }),
            );
        });

        it('should return 422 error for an Object in a status = PAID', async () => {
            const paymentId = (
                await requester.object(authHeader).postCreatePayment(object.id)
            ).body.payments[0].id;

            await requester
                .payment(authHeader)
                .postStatus(paymentId, PaymentStatus.SUCCESS);

            const objectBefore = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(objectBefore?.status).toEqual(ObjectStatus.PAID);

            const res = await requester
                .object(authHeader)
                .postCreatePayment(object.id);

            const objectAfter = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body).toEqual({
                statusCode: 422,
                message: `It isn't possible to initiate a payment for Object ${object.id}`,
            });
            expect(objectBefore).toEqual(objectAfter);
        });

        it('should return 422 error for an Object in a status = CANCELED', async () => {
            await requester.object(authHeader).postCancel(object.id);

            const objectBefore = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(objectBefore?.status).toEqual(ObjectStatus.CANCELED);

            const res = await requester
                .object(authHeader)
                .postCreatePayment(object.id);

            const objectAfter = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body).toEqual({
                statusCode: 422,
                message: `It isn't possible to initiate a payment for Object ${object.id}`,
            });
            expect(objectBefore).toEqual(objectAfter);
        });

        it('should return 422 error for an Object in a status = ERROR', async () => {
            const firstPaymentId = (
                await requester.object(authHeader).postCreatePayment(object.id)
            ).body.payments[0].id;

            const secondPaymentId = (
                await requester.object(authHeader).postCreatePayment(object.id)
            ).body.payments[1].id;

            await requester
                .payment(authHeader)
                .postStatus(firstPaymentId, PaymentStatus.SUCCESS);

            await requester
                .payment(authHeader)
                .postStatus(secondPaymentId, PaymentStatus.SUCCESS);

            const objectBefore = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(objectBefore?.status).toEqual(ObjectStatus.ERROR);

            const res = await requester
                .object(authHeader)
                .postCreatePayment(object.id);

            const objectAfter = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body).toEqual({
                statusCode: 422,
                message: `It isn't possible to initiate a payment for Object ${object.id}`,
            });
            expect(objectBefore).toEqual(objectAfter);
        });
    });

    describe('POST /object/:uuid/cancel', () => {
        let object: { id: string; status: ObjectStatus };

        beforeEach(async () => {
            object = (
                await requester.object(authHeader).post({
                    trainNumber: '123Б',
                })
            ).body;
        });

        it('should return 401 error (Authentication error)', async () => {
            const res = await requester
                .object(invalidAuthHeader)
                .postCancel(object.id);

            expect(res.statusCode).toEqual(401);
            expect(res.body).toEqual(invalidAuthAnswer);
        });

        it('should return 400 error for invalid an id', async () => {
            const res = await requester
                .object(authHeader)
                .postCancel('invalidId');

            expect(res.statusCode).toEqual(400);
            expect(res.body).toEqual({
                details: [
                    {
                        message: 'id is Invalid uuid',
                    },
                ],
                error: 'Invalid data',
                statusCode: 400,
            });
        });

        it('should return 404 error', async () => {
            const invalidId = crypto.randomUUID();
            const res = await requester
                .object(authHeader)
                .postCancel(invalidId);

            expect(res.statusCode).toEqual(404);
            expect(res.body).toEqual({
                statusCode: 404,
                message: `Object ${invalidId} isn't found`,
            });
        });

        it('should cancel an Object in a status = NEW', async () => {
            expect(object.status).toEqual(ObjectStatus.NEW);

            const res = await requester
                .object(authHeader)
                .postCancel(object.id);

            const objectAfter = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(res.statusCode).toEqual(200);
            expect(objectAfter).not.toBeNull();
            if (!objectAfter) return;
            expect(objectAfter?.status).toEqual(ObjectStatus.CANCELED);
            expect(res.body).toEqual(convertTimesInObjectDB(objectAfter));
        });

        it('should cancel an Object in a status = PENDING_PAYMENT', async () => {
            await requester.object(authHeader).postCreatePayment(object.id);

            const objectBefore = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(objectBefore?.status).toEqual(ObjectStatus.PENDING_PAYMENT);

            const res = await requester
                .object(authHeader)
                .postCancel(object.id);

            const objectAfter = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(res.statusCode).toEqual(200);
            expect(objectAfter).not.toBeNull();
            if (!objectAfter) return;
            expect(objectAfter?.status).toEqual(ObjectStatus.CANCELED);
            expect(res.body).toEqual(convertTimesInObjectDB(objectAfter));
        });

        it('should cancel an Object in a status = PAID and refund a payment', async () => {
            const paymentId = (
                await requester.object(authHeader).postCreatePayment(object.id)
            ).body.payments[0].id;

            await requester
                .payment(authHeader)
                .postStatus(paymentId, PaymentStatus.SUCCESS);

            const objectBefore = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(objectBefore?.status).toEqual(ObjectStatus.PAID);

            const res = await requester
                .object(authHeader)
                .postCancel(object.id);

            const objectAfter = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
                include: {
                    payments: true,
                },
            });

            expect(res.statusCode).toEqual(200);
            expect(objectAfter).not.toBeNull();
            if (!objectAfter) return;
            expect(objectAfter?.status).toEqual(ObjectStatus.CANCELED);
            expect(objectAfter.payments[0].status).toEqual(
                PaymentStatus.REFUND,
            );
            expect(res.body).toEqual(
                convertTimesInObjectDB({
                    ...objectAfter,
                    payments: [
                        ...objectAfter.payments.map((paymentDB) =>
                            convertTimesInObjectDB(paymentDB),
                        ),
                    ],
                }),
            );
        });

        it('should cancel an Object in a status = ERROR and refund a payment', async () => {
            const firstPaymentId = (
                await requester.object(authHeader).postCreatePayment(object.id)
            ).body.payments[0].id;

            const secondPaymentId = (
                await requester.object(authHeader).postCreatePayment(object.id)
            ).body.payments[1].id;

            await requester
                .payment(authHeader)
                .postStatus(firstPaymentId, PaymentStatus.SUCCESS);

            await requester
                .payment(authHeader)
                .postStatus(secondPaymentId, PaymentStatus.SUCCESS);

            const objectBefore = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(objectBefore?.status).toEqual(ObjectStatus.ERROR);

            const res = await requester
                .object(authHeader)
                .postCancel(object.id);

            const objectAfter = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
                include: {
                    payments: true,
                },
            });

            expect(res.statusCode).toEqual(200);
            expect(objectAfter).not.toBeNull();
            if (!objectAfter) return;
            expect(objectAfter?.status).toEqual(ObjectStatus.CANCELED);
            expect(objectAfter.payments[0].status).toEqual(
                PaymentStatus.REFUND,
            );
            expect(res.body).toEqual(
                convertTimesInObjectDB({
                    ...objectAfter,
                    payments: [
                        ...objectAfter.payments.map((paymentDB) =>
                            convertTimesInObjectDB(paymentDB),
                        ),
                    ],
                }),
            );
        });

        it('should return 422 error for an Object in a status = CANCELED', async () => {
            await requester.object(authHeader).postCancel(object.id);

            const objectBefore = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(objectBefore?.status).toEqual(ObjectStatus.CANCELED);

            const res = await requester
                .object(authHeader)
                .postCancel(object.id);

            const objectAfter = await prisma.object.findUnique({
                where: {
                    id: object.id,
                },
            });

            expect(res.statusCode).toEqual(422);
            expect(res.body).toEqual({
                statusCode: 422,
                message: `It isn't possible to cancel an Object ${object.id}`,
            });
            expect(objectBefore).toEqual(objectAfter);
        });
    });

    afterAll(() => {
        requester.close();
    });
});
