import { prisma } from '../server.js';
import { AppError } from '../utils/AppError.js';
import * as auditService from './audit.service.js';

export const getInventory = async (clinicId: number) => {
    return await prisma.inventory.findMany({
        where: { clinicId },
        orderBy: { name: 'asc' }
    });
};

export const addInventory = async (clinicId: number, data: any) => {
    const { name, sku, quantity, unitPrice, expiryDate } = data;

    return await prisma.inventory.create({
        data: {
            clinicId,
            name,
            sku,
            quantity: Number(quantity),
            unitPrice: Number(unitPrice),
            expiryDate: expiryDate ? new Date(expiryDate) : null
        }
    });
};

export const updateInventory = async (id: number, data: any) => {
    return await prisma.inventory.update({
        where: { id },
        data: {
            name: data.name,
            sku: data.sku,
            quantity: Number(data.quantity),
            unitPrice: Number(data.unitPrice),
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null
        }
    });
};

export const getPharmacyOrders = async (clinicId: number) => {
    return await prisma.service_order.findMany({
        where: {
            clinicId,
            type: 'PHARMACY'
        },
        include: {
            patient: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const processPharmacyOrder = async (clinicId: number, orderId: number, items: any[], paid: boolean = false) => {
    // items: array of { inventoryId, quantity, price }

    return await prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        let serviceDetails = [];

        for (const item of items) {
            const product = await tx.inventory.findUnique({
                where: { id: item.inventoryId }
            });

            if (!product || product.quantity < item.quantity) {
                throw new AppError(`Insufficient stock for ${product?.name || 'Item'}`, 400);
            }

            // Deduct stock
            await tx.inventory.update({
                where: { id: item.inventoryId },
                data: { quantity: product.quantity - item.quantity }
            });

            totalAmount += Number(item.price) * item.quantity;
            serviceDetails.push(`${product.name} x${item.quantity}`);
        }

        // Update Order Status
        const order = await tx.service_order.update({
            where: { id: orderId },
            data: { status: 'Completed' }
        });

        // Create Invoice
        const invoice = await tx.invoice.create({
            data: {
                id: `RX-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`,
                clinicId,
                patientId: order.patientId,
                doctorId: order.doctorId,
                service: `Pharmacy: ${serviceDetails.join(', ')}`,
                amount: totalAmount,
                status: paid ? 'Paid' : 'Pending'
            }
        });

        return { order, invoice };
    });
};

export const directSale = async (clinicId: number, data: any) => {
    const { patientId, items, paid } = data;

    return await prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        let serviceDetails = [];

        for (const item of items) {
            const product = await tx.inventory.findUnique({
                where: { id: item.inventoryId }
            });

            if (!product || product.quantity < item.quantity) {
                throw new AppError(`Insufficient stock for ${product?.name || 'Item'}`, 400);
            }

            // Deduct stock
            await tx.inventory.update({
                where: { id: item.inventoryId },
                data: { quantity: product.quantity - item.quantity }
            });

            totalAmount += Number(item.price || product.unitPrice) * item.quantity;
            serviceDetails.push(`${product.name} x${item.quantity}`);
        }

        // Create Invoice
        const invoice = await tx.invoice.create({
            data: {
                id: `RX-POS-${Math.floor(1000 + Math.random() * 9000)}`,
                clinicId,
                patientId: Number(patientId),
                service: `Direct Sale: ${serviceDetails.join(', ')}`,
                amount: totalAmount,
                status: paid ? 'Paid' : 'Pending'
            }
        });

        return { invoice };
    });
};
