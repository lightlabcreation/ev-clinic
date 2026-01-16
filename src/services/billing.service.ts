import { prisma } from '../server';

export const getInvoices = async (clinicId: number) => {
    return await prisma.invoice.findMany({
        where: { clinicId },
        include: { patient: true },
        orderBy: { createdAt: 'desc' }
    });
};

export const updateInvoiceStatus = async (id: string, status: string) => {
    return await prisma.invoice.update({
        where: { id },
        data: { status }
    });
};

export const createInvoice = async (clinicId: number, data: any) => {
    const { patientId, doctorId, service, amount, status } = data;

    return await prisma.invoice.create({
        data: {
            id: `INV-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`,
            clinicId,
            patientId: Number(patientId),
            doctorId: doctorId ? Number(doctorId) : undefined,
            service,
            amount: Number(amount),
            status: status || 'Pending'
        }
    });
};
