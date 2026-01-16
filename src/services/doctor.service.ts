import { prisma } from '../server';
import { AppError } from '../utils/AppError';

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
    const { patientId, templateId, type, findings, pharmacyOrder, labOrder, radiologyOrder } = payload;

    const assessment = await prisma.medicalrecord.create({
        data: {
            clinicId,
            patientId,
            doctorId,
            templateId,
            type,
            data: JSON.stringify({
                ...findings,
                pharmacyOrder,
                labOrder,
                radiologyOrder
            }),
            isClosed: true
        }
    });

    // Create notifications for departments
    if (pharmacyOrder) {
        await prisma.notification.create({
            data: {
                clinicId,
                department: 'pharmacy',
                message: JSON.stringify({ patientId, details: pharmacyOrder })
            }
        });
    }

    if (labOrder) {
        await prisma.notification.create({
            data: {
                clinicId,
                department: 'laboratory',
                message: JSON.stringify({ patientId, details: labOrder })
            }
        });
    }

    if (radiologyOrder) {
        await prisma.notification.create({
            data: {
                clinicId,
                department: 'radiology',
                message: JSON.stringify({ patientId, details: radiologyOrder })
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
    // Patients who have had an appt with this doctor OR are in the same clinic (for now restricted to clinic, but ideally doctor specific)
    // The requirement says "only assigned patients". Strict interpretation: Patients who have an appointment or medical record with THIS doctor.

    // 1. Find patients with appointments
    const apptPatients = await prisma.appointment.findMany({
        where: { clinicId, doctorId },
        select: { patientId: true },
        distinct: ['patientId']
    });

    // 2. Find patients with medical records
    const recordPatients = await prisma.medicalrecord.findMany({
        where: { clinicId, doctorId },
        select: { patientId: true },
        distinct: ['patientId']
    });

    const patientIds = Array.from(new Set([
        ...apptPatients.map(p => p.patientId),
        ...recordPatients.map(p => p.patientId)
    ]));

    if (patientIds.length === 0) return [];

    return await prisma.patient.findMany({
        where: {
            id: { in: patientIds }
        },
        include: {
            // Include recent medical record for context
            medicalrecord: {
                where: { clinicId, doctorId },
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: { createdAt: true, type: true }
            }
        }
    });
};

export const getDoctorOrders = async (clinicId: number, doctorId: number) => {
    // Fetch notifications which serve as orders
    // We need to parse the JSON message to filter by doctor if possible, or assume all clinic notifications?
    // STRICT: The notification table doesn't have doctorId. 
    // Plan B: Query MedicalRecords that have order data. This is more reliable for "My Orders".

    const records = await prisma.medicalrecord.findMany({
        where: {
            clinicId,
            doctorId,
            // Filter where data contains orders - Prisma doesn't support deep JSON filtering easily in all DBs
            // We'll fetch and filter in memory or rely on the type/fact it has data
        },
        include: { patient: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
    });

    const orders: any[] = [];
    records.forEach(r => {
        const data = JSON.parse(r.data as string || '{}');
        const patientName = (r as any).patient?.name || 'Unknown';

        if (data.pharmacyOrder) {
            orders.push({
                id: `RX-${r.id}`,
                recordId: r.id,
                date: r.createdAt,
                patientName,
                type: 'Pharmacy',
                details: data.pharmacyOrder,
                status: 'Ordered'
            });
        }
        if (data.labOrder) {
            orders.push({
                id: `LAB-${r.id}`,
                recordId: r.id,
                date: r.createdAt,
                patientName,
                type: 'Laboratory',
                details: data.labOrder,
                status: 'Ordered'
            });
        }
        if (data.radiologyOrder) {
            orders.push({
                id: `RAD-${r.id}`,
                recordId: r.id,
                date: r.createdAt,
                patientName,
                type: 'Radiology',
                details: data.radiologyOrder,
                status: 'Ordered'
            });
        }
    });

    return orders;
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
