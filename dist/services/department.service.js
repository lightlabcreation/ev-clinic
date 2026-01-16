import { prisma } from '../server';
export const getDepartments = async (clinicId) => {
    return await prisma.department.findMany({
        where: { clinicId },
        orderBy: { name: 'asc' }
    });
};
export const createDepartment = async (clinicId, data) => {
    return await prisma.department.create({
        data: {
            ...data,
            clinicId
        }
    });
};
export const deleteDepartment = async (id) => {
    return await prisma.department.delete({
        where: { id }
    });
};
export const updateNotificationStatus = async (id, status) => {
    return await prisma.notification.update({
        where: { id },
        data: { status }
    });
};
export const getNotifications = async (clinicId) => {
    return await prisma.notification.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' }
    });
};
