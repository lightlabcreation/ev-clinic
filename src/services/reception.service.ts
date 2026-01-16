import { prisma } from '../server';
import { AppError } from '../utils/AppError';

export const getPatientsByClinic = async (clinicId: number, search?: string) => {
    return await prisma.patient.findMany({
        where: {
            clinicId,
            OR: search ? [
                { name: { contains: search } },
                { phone: { contains: search } },
                { mrn: { contains: search } }
            ] : undefined
        }
    });
};

export const registerPatient = async (clinicId: number, data: any) => {
    const {
        name, phone, email, dob, gender, address,
        medicalHistory, doctorId, visitTime, fees
    } = data;

    // Generate MRN (Medical Record Number) - simplified
    const mrn = `MRN-${Date.now().toString().slice(-6)}`;

    const patient = await prisma.patient.create({
        data: {
            clinicId,
            name,
            phone,
            email: email || null,
            gender,
            address,
            medicalHistory,
            mrn,
            createdYear: new Date().getFullYear(),
            status: doctorId ? 'Pending Payment' : 'Active'
        }
    });

    // If it's a walk-in, create an appointment and a pending invoice
    if (doctorId && fees) {
        const today = new Date();
        await prisma.appointment.create({
            data: {
                clinicId,
                patientId: patient.id,
                doctorId: Number(doctorId),
                date: today,
                time: visitTime || today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'Checked In',
                source: 'Walk-in',
                fees: Number(fees)
            }
        });

        await prisma.invoice.create({
            data: {
                id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                clinicId,
                patientId: patient.id,
                doctorId: Number(doctorId),
                service: 'Walk-in Consultation',
                amount: Number(fees),
                status: 'Pending'
            }
        });
    }

    return patient;
};

export const getBookings = async (clinicId: number, date?: string) => {
    return await prisma.appointment.findMany({
        where: {
            clinicId,
            date: date ? {
                gte: new Date(date),
                lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
            } : undefined
        },
        include: { patient: true }
    });
};

export const updateBookingStatus = async (clinicId: number, id: number, status: string) => {
    // First verify the appointment belongs to this clinic
    const appointment = await prisma.appointment.findUnique({
        where: { id }
    });

    if (!appointment) {
        throw new Error('Appointment not found');
    }

    if (appointment.clinicId !== clinicId) {
        throw new Error('Unauthorized: Appointment does not belong to your clinic');
    }

    return await prisma.appointment.update({
        where: { id },
        data: { status }
    });
};

export const approveBooking = async (bookingId: number) => {
    const booking = await prisma.appointment.findUnique({
        where: { id: bookingId },
        include: { patient: true }
    });

    if (!booking) throw new AppError('Booking not found', 404);

    return await prisma.appointment.update({
        where: { id: bookingId },
        data: { status: 'Approved' }
    });
};

export const getReceptionStats = async (clinicId: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayAppts, totalPatients, pendingApprovals, checkedIn] = await Promise.all([
        prisma.appointment.count({
            where: { clinicId, date: { gte: today, lte: new Date(new Date().setHours(23, 59, 59, 999)) } }
        }),
        prisma.patient.count({ where: { clinicId } }),
        prisma.appointment.count({
            where: { clinicId, status: 'Pending' }
        }),
        prisma.appointment.count({
            where: { clinicId, status: 'Checked In', date: { gte: today } }
        })
    ]);

    return {
        todayAppointments: todayAppts,
        totalPatients,
        pendingApprovals,
        currentlyCheckedIn: checkedIn
    };
};

export const getReceptionActivities = async (clinicId: number) => {
    const appts = await prisma.appointment.findMany({
        where: { clinicId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { patient: { select: { name: true } } }
    });

    return appts.map(a => ({
        id: a.id,
        action: `Booked Appointment for ${a.patient.name}`,
        time: a.createdAt,
        status: a.status
    }));
};

export const createBooking = async (clinicId: number, data: any) => {
    const { patientId, doctorId, date, time, fees, notes, service } = data;

    const appointment = await prisma.appointment.create({
        data: {
            clinicId,
            patientId: Number(patientId),
            doctorId: Number(doctorId),
            date: date ? new Date(date) : new Date(),
            time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'Checked In',
            source: 'Walk-in',
            fees: fees ? Number(fees) : undefined,
            notes: notes || null
        },
        include: { patient: true }
    });

    if (fees) {
        await prisma.invoice.create({
            data: {
                id: `INV-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`,
                clinicId,
                patientId: Number(patientId),
                doctorId: Number(doctorId),
                service: service || 'Patient Consultation',
                amount: Number(fees),
                status: 'Pending'
            }
        });
    }

    return appointment;
};
