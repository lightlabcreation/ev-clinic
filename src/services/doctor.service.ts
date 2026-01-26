import { prisma } from '../server.js';
import { AppError } from '../utils/AppError.js';

export const getDoctorQueue = async (clinicId: number, doctorId: number) => {
    return await prisma.appointment.findMany({
        where: {
            clinicId,
            doctorId,
            // status: 'Checked In', // Show all appointments for today
            date: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lte: new Date(new Date().setHours(23, 59, 59, 999))
            }
        },
        include: { patient: true }
    });
};

export const saveAssessment = async (clinicId: number, doctorId: number, payload: any) => {
    const { patientId, templateId, type, findings, orders = [] } = payload;

    // Save exact copy of orders in the medical record data for viewing later
    const recordData = { ...findings, ordersSnapshot: orders || [] };

    const assessment = await prisma.medicalrecord.create({
        data: {
            clinicId,
            patientId,
            doctorId,
            templateId,
            type,
            data: JSON.stringify(recordData),
            isClosed: true
        }
    });

    // Create Service Orders and Notifications
    for (const order of orders) {
        const { type: orderType, testName, details } = order;

        const createdOrder = await prisma.service_order.create({
            data: {
                clinicId,
                patientId,
                doctorId,
                type: orderType,
                testName,
                status: 'Pending',
                result: details // Store instructions here for now
            }
        });

        // Notify Department
        let dept = 'laboratory';
        if (orderType === 'RADIOLOGY') dept = 'radiology';
        if (orderType === 'PHARMACY') dept = 'pharmacy';

        await prisma.notification.create({
            data: {
                clinicId,
                department: dept,
                message: JSON.stringify({
                    patientId,
                    orderId: createdOrder.id,
                    type: orderType,
                    details: `${testName} - ${details}`
                })
            }
        });
    }

    // Mark appointment as Completed if exists for today
    await prisma.appointment.updateMany({
        where: {
            clinicId,
            patientId,
            doctorId,
            status: 'Checked In'
        },
        data: { status: 'Completed' }
    });

    return assessment;
};

export const getHistory = async (clinicId: number, patientId: number) => {
    const records = await prisma.medicalrecord.findMany({
        where: { clinicId, patientId },
        include: {
            formtemplate: true,
            patient: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return records.map(r => ({
        ...r,
        patientName: (r as any).patient?.name || 'Unknown'
    }));
};


export const getDoctorStats = async (clinicId: number, doctorId: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayAppts, totalPatientsCount, completedAppts, pendingAppts] = await Promise.all([
        prisma.appointment.count({
            where: {
                clinicId,
                doctorId,
                date: { gte: today, lte: new Date(new Date().setHours(23, 59, 59, 999)) }
            }
        }),
        prisma.medicalrecord.findMany({
            where: { clinicId, doctorId },
            distinct: ['patientId']
        }).then(res => res.length),
        prisma.appointment.count({
            where: { clinicId, doctorId, status: 'Completed', date: { gte: today } }
        }),
        prisma.appointment.count({
            where: { clinicId, doctorId, status: 'Checked In', date: { gte: today } }
        })
    ]);

    return {
        todayPatients: todayAppts,
        totalTreated: totalPatientsCount,
        completedAppointments: completedAppts,
        pendingAppointments: pendingAppts
    };
};

export const getDoctorActivities = async (clinicId: number, doctorId: number) => {
    const records = await prisma.medicalrecord.findMany({
        where: { clinicId, doctorId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { patient: { select: { name: true } } }
    });

    return records.map(r => ({
        id: r.id,
        action: `Completed Assessment for ${(r as any).patient.name}`,
        time: r.createdAt
    }));
};

export const getFormTemplates = async (clinicId: number) => {
    return await prisma.formtemplate.findMany({
        where: {
            OR: [
                { clinicId: clinicId },
                { clinicId: null }
            ],
            status: 'published'
        },
        orderBy: { name: 'asc' }
    });
};

export const getAssignedPatients = async (clinicId: number, doctorId: number) => {
    // Return ALL patients in the clinic to ensure doctors can find anyone registered
    // detailed filtering can be added later if strict assignment is needed.

    return await prisma.patient.findMany({
        where: {
            clinicId
        },
        include: {
            // Include recent medical record for context
            medicalrecord: {
                where: { clinicId },
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true, type: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const getDoctorOrders = async (clinicId: number, doctorId: number) => {
    const orders = await prisma.service_order.findMany({
        where: {
            clinicId,
            doctorId
        },
        include: {
            patient: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return orders.map(o => ({
        id: o.id,
        // recordId: o.id, 
        date: o.createdAt,
        patientName: o.patient?.name || 'Unknown',
        type: o.type,
        details: o.testName,
        status: o.status
    }));
};

export const createOrder = async (clinicId: number, doctorId: number, data: any) => {
    const { patientId, type, items, priority, notes, date } = data;

    // Normalize type
    let orderType = 'LAB';
    if (type.toLowerCase().includes('rad')) orderType = 'RADIOLOGY';
    if (type.toLowerCase().includes('presc') || type.toLowerCase().includes('pharm')) orderType = 'PHARMACY';

    const order = await prisma.service_order.create({
        data: {
            clinicId,
            patientId: Number(patientId),
            doctorId,
            type: orderType,
            testName: items,
            status: 'Pending',
            result: JSON.stringify({ priority, notes, date })
        }
    });

    // Notify Department
    let dept = 'laboratory';
    if (orderType === 'RADIOLOGY') dept = 'radiology';
    if (orderType === 'PHARMACY') dept = 'pharmacy';

    await prisma.notification.create({
        data: {
            clinicId,
            department: dept,
            message: JSON.stringify({ patientId, orderId: order.id, type: orderType, items, priority, notes })
        }
    });

    return order;
};

export const getRevenueStats = async (clinicId: number, doctorId: number) => {
    // 1. Get all completed appointments
    const completedAppts = await prisma.appointment.findMany({
        where: {
            clinicId,
            doctorId,
            status: 'Completed'
        },
        select: { date: true } // Assuming standard fee
    });

    const FEE = 350; // Hardcoded for now as per frontend logic
    const totalEarnings = completedAppts.length * FEE;
    const totalConsultations = completedAppts.length;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const todayStr = today.toISOString().split('T')[0];

    let thisMonth = 0;
    let todayEarned = 0;

    // Daily buckets for chart
    const dailyMap = new Map<string, number>();

    completedAppts.forEach(appt => {
        const d = new Date(appt.date);
        const dateStr = d.toISOString().split('T')[0];

        // Chart data
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);

        // Stats
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            thisMonth += FEE;
        }
        if (dateStr === todayStr) {
            todayEarned += FEE;
        }
    });

    // Format chart data (last 7 active days or just map entries)
    const chartData = Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, visits: count, earnings: count * FEE }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        totalEarnings,
        thisMonth,
        today: todayEarned,
        totalConsultations,
        chartData
    };
};
