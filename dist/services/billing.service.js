import { prisma } from '../server.js';
export const getInvoices = async (clinicId) => {
    return await prisma.invoice.findMany({
        where: { clinicId },
        include: { patient: true },
        orderBy: { createdAt: 'desc' }
    });
};
export const updateInvoiceStatus = async (clinicId, id, status) => {
    return await prisma.invoice.update({
        where: { id, clinicId },
        data: { status }
    });
};
export const createInvoice = async (clinicId, data) => {
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
