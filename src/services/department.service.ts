import { prisma } from '../server';

export const getDepartments = async (clinicId: number) => {
    return await prisma.department.findMany({
        where: { clinicId },
        orderBy: { name: 'asc' }
    });
};

export const createDepartment = async (clinicId: number, data: { name: string, type?: string }) => {
    return await prisma.department.create({
        data: {
            ...data,
            clinicId
        }
    });
};

export const deleteDepartment = async (id: number) => {
    return await prisma.department.delete({
        where: { id }
    });
};

export const updateNotificationStatus = async (id: number, status: string) => {
    return await prisma.notification.update({
        where: { id },
        data: { status }
    });
};

export const getNotifications = async (clinicId: number) => {
    return await prisma.notification.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' }
    });
};
