import { prisma } from '../server.js';
import { AppError } from '../utils/AppError.js';

export const getLabOrders = async (clinicId: number, type: 'LAB' | 'RADIOLOGY') => {
    return await prisma.service_order.findMany({
        where: {
            clinicId,
            type
        },
        include: {
            patient: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const completeLabOrder = async (clinicId: number, orderId: number, data: any) => {
    const { result, price, paid } = data;

    return await prisma.$transaction(async (tx) => {
        const order = await tx.service_order.update({
            where: { id: orderId },
            data: {
                status: 'Completed',
                result: result // Can be JSON string or URL to report
            }
        });

        // Create Invoice for the test
        await tx.invoice.create({
            data: {
                id: `${order.type === 'LAB' ? 'LAB' : 'RAD'}-${Math.floor(1000 + Math.random() * 9000)}`,
                clinicId,
                patientId: order.patientId,
                doctorId: order.doctorId,
                service: `${order.type}: ${order.testName}`,
                amount: Number(price),
                status: paid ? 'Paid' : 'Pending'
            }
        });

        return order;
    });
};

export const rejectLabOrder = async (clinicId: number, orderId: number) => {
    return await prisma.service_order.update({
        where: { id: orderId, clinicId },
        data: { status: 'Rejected' }
    });
};
