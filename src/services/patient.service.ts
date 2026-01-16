import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError';

const prisma = new PrismaClient();

interface CreateAppointmentData {
    clinicId: number;
    doctorId: number;
    date: Date;
    time: string;
    service: string;
    notes?: string;
}

export const getMyAppointments = async (userId: number, email: string) => {
    // Patients are linked to users via email or ID. 
    // We first find the patient records associated with this user across all clinics.
    const patientRecords = await prisma.patient.findMany({
        where: {
            OR: [
                { email: email },
                // If we had a direct userId link in patient model, we'd use it. 
                // Currently relying on email which is unique per user but per-clinic in patient table.
            ]
        },
        select: { id: true, clinicId: true }
    });

    const patientIds = patientRecords.map(p => p.id);

    if (patientIds.length === 0) {
        return [];
    }

    const appointments = await prisma.appointment.findMany({
        where: {
            patientId: { in: patientIds }
        },
        include: {
            clinic: { select: { name: true } },
            // We can't include doctor name directly as it's linked via ID to clinicstaff/user
            // But we can fetch it if needed or rely on ID.
        },
        orderBy: {
            date: 'desc'
        }
    });

    return appointments;
};

export const getMyMedicalRecords = async (userId: number, email: string) => {
    const patientRecords = await prisma.patient.findMany({
        where: { email: email },
        select: { id: true }
    });

    const patientIds = patientRecords.map(p => p.id);

    if (patientIds.length === 0) return [];

    const records = await prisma.medicalrecord.findMany({
        where: {
            patientId: { in: patientIds }
        },
        include: {
            clinic: { select: { name: true } },
            formtemplate: { select: { name: true } }
        },
        orderBy: {
            visitDate: 'desc'
        }
    });

    // Parse the JSON data field
    return records.map(record => ({
        ...record,
        data: record.data ? JSON.parse(record.data) : {}
    }));
};

export const getMyInvoices = async (userId: number, email: string) => {
    const patientRecords = await prisma.patient.findMany({
        where: { email: email },
        select: { id: true }
    });

    const patientIds = patientRecords.map(p => p.id);

    if (patientIds.length === 0) return [];

    const invoices = await prisma.invoice.findMany({
        where: {
            patientId: { in: patientIds }
        },
        include: {
            clinic: { select: { name: true } }
        },
        orderBy: {
            date: 'desc'
        }
    });

    return invoices;
};

export const bookAppointment = async (userId: number, email: string, data: CreateAppointmentData) => {
    // 1. Find the patient record for this specific clinic
    const patient = await prisma.patient.findFirst({
        where: {
            email: email,
            clinicId: data.clinicId
        }
    });

    if (!patient) {
        throw new AppError('Patient record not found in this clinic. Please contact reception.', 404);
    }

    // 2. Create appointment
    const appointment = await prisma.appointment.create({
        data: {
            clinicId: data.clinicId,
            patientId: patient.id,
            doctorId: data.doctorId,
            date: new Date(data.date),
            time: data.time,
            status: 'Pending', // Defaults to Pending for patient bookings
            source: 'Patient Portal',
            notes: data.notes
        }
    });

    const clinic = await prisma.clinic.findUnique({ where: { id: data.clinicId } });
    if (clinic && clinic.bookingConfig) {
        // Here we could handle auto-approval logic if defined in bookingConfig
    }

    return appointment;
};

export const getClinicDoctors = async (clinicId: number) => {
    const doctors = await prisma.clinicstaff.findMany({
        where: {
            clinicId,
            role: 'DOCTOR'
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    return doctors.map(d => ({
        id: d.user.id,
        name: d.user.name,
        specialty: 'General Practitioner'
    }));
};
