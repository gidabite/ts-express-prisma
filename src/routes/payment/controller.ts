import { ObjectStatus, PaymentStatus } from '@prisma/client';
import prisma from '../../prisma/client';

export const updatePaymentStatus = async (
    id: string,
    newStatus: PaymentStatus,
) => {
    const payment = await prisma.payment.findFirst({
        where: {
            id,
        },
        include: {
            object: true,
        },
    });

    if (!payment) return;

    let updatedPayment;

    switch (payment.status) {
        case PaymentStatus.NEW:
            switch (newStatus) {
                case PaymentStatus.REJECTED:
                    updatedPayment = await prisma.payment.update({
                        data: {
                            status: newStatus,
                        },
                        where: {
                            id: payment.id,
                            updateTimestamp: payment.updateTimestamp,
                        },
                    });
                    console.log(updatedPayment);
                    break;
                case PaymentStatus.SUCCESS:
                    updatedPayment = await prisma.payment.update({
                        data: {
                            status: newStatus,
                            object: {
                                update: {
                                    data: {
                                        status: ObjectStatus.PAID,
                                    },
                                },
                            },
                        },
                        where: {
                            id: payment.id,
                            updateTimestamp: payment.updateTimestamp,
                            object: {
                                status: ObjectStatus.PENDING_PAYMENT,
                                updateTimestamp: payment.object.updateTimestamp,
                            },
                        },
                    });
                    break;
                default:
                    break;
            }
            break;
        case PaymentStatus.SUCCESS:
            switch (newStatus) {
                case PaymentStatus.REFUND:
                    updatedPayment = await prisma.payment.update({
                        data: {
                            status: newStatus,
                        },
                        where: {
                            id: payment.id,
                            updateTimestamp: payment.updateTimestamp,
                        },
                    });
                    break;
                default:
                    break;
            }
            break;
        default:
            break;
    }
    console.log(updatedPayment);
    return updatedPayment;
};
