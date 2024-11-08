import { PaymentStatus } from '@prisma/client';
import { IncomingHttpHeaders } from 'http';
import request from 'supertest';

import server from '../index';

const appOperations = () => {
    const requester = request(server);

    return {
        object: (authHeader: IncomingHttpHeaders) => ({
            getAll: () => requester.get('/object').set(authHeader).send(),
            get: (id: string) =>
                requester.get(`/object/${id}`).set(authHeader).send(),
            post: (object: object) =>
                requester.post('/object').set(authHeader).send(object),
            postCreatePayment: (id: string) =>
                requester
                    .post(`/object/${id}/createPayment`)
                    .set(authHeader)
                    .send(),
            postCancel: (id: string) =>
                requester.post(`/object/${id}/cancel`).set(authHeader).send(),
        }),
        payment: (authHeader: IncomingHttpHeaders) => ({
            getAll: () => requester.get('/payment').set(authHeader).send(),
            get: (id: string) =>
                requester.get(`/payment/${id}`).set(authHeader).send(),

            postStatus: (id: string, status: PaymentStatus) =>
                requester.patch(`/payment/${id}/status`).set(authHeader).send({
                    status: status,
                }),
        }),
        close: () => server.close(),
    };
};

export default appOperations;
