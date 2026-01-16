import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database with dummy data...');

    // 1. Create Clinics
    const husri = await prisma.clinic.upsert({
        where: { subdomain: 'husri' },
        update: {},
        create: {
            name: 'Husri Clinic',
            subdomain: 'husri',
            location: 'Downtown Medical Center',
            contact: '+1 (555) 123-4567',
            email: 'contact@husri.com',
            status: 'active',
            modules: { pharmacy: true, radiology: true, laboratory: true, billing: true }
        }
    });

    const skaf = await prisma.clinic.upsert({
        where: { subdomain: 'skaf' },
        update: {},
        create: {
            name: 'Skaf Clinic',
            subdomain: 'skaf',
            location: 'Westside Health Plaza',
            contact: '+1 (555) 234-5678',
            email: 'contact@skaf.com',
            status: 'active',
            modules: { pharmacy: true, radiology: false, laboratory: true, billing: true }
        }
    });

    // 2. Create Users
    const passwordHash = await bcrypt.hash('admin123', 12);
    const doctorHash = await bcrypt.hash('doctor123', 12);
    const receptionHash = await bcrypt.hash('reception123', 12);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@ev.com' },
        update: { password: passwordHash, name: 'Super Admin', role: 'SUPER_ADMIN', failedLoginAttempts: 0, lockoutUntil: null },
        create: { email: 'superadmin@ev.com', password: passwordHash, name: 'Super Admin', role: 'SUPER_ADMIN' }
    });

    const husriAdmin = await prisma.user.upsert({
        where: { email: 'admin@husri.com' },
        update: { password: passwordHash, name: 'Husri Admin', role: 'ADMIN', failedLoginAttempts: 0, lockoutUntil: null },
        create: { email: 'admin@husri.com', password: passwordHash, name: 'Husri Admin', role: 'ADMIN' }
    });

    const doctor = await prisma.user.upsert({
        where: { email: 'doctor@husri.com' },
        update: { password: doctorHash, name: 'Dr. Ahmed Khan', role: 'DOCTOR', failedLoginAttempts: 0, lockoutUntil: null },
        create: { email: 'doctor@husri.com', password: doctorHash, name: 'Dr. Ahmed Khan', role: 'DOCTOR' }
    });

    const reception = await prisma.user.upsert({
        where: { email: 'reception@husri.com' },
        update: { password: receptionHash, name: 'Sarah Johnson', role: 'RECEPTIONIST', failedLoginAttempts: 0, lockoutUntil: null },
        create: { email: 'reception@husri.com', password: receptionHash, name: 'Sarah Johnson', role: 'RECEPTIONIST' }
    });

    // 3. Assign Staff Roles
    await prisma.clinicStaff.upsert({
        where: { userId_clinicId_role: { userId: superAdmin.id, clinicId: husri.id, role: 'SUPER_ADMIN' } },
        update: {},
        create: { userId: superAdmin.id, clinicId: husri.id, role: 'SUPER_ADMIN' }
    });

    await prisma.clinicStaff.upsert({
        where: { userId_clinicId_role: { userId: husriAdmin.id, clinicId: husri.id, role: 'ADMIN' } },
        update: {},
        create: { userId: husriAdmin.id, clinicId: husri.id, role: 'ADMIN' }
    });

    await prisma.clinicStaff.upsert({
        where: { userId_clinicId_role: { userId: doctor.id, clinicId: husri.id, role: 'DOCTOR' } },
        update: {},
        create: { userId: doctor.id, clinicId: husri.id, role: 'DOCTOR' }
    });

    await prisma.clinicStaff.upsert({
        where: { userId_clinicId_role: { userId: reception.id, clinicId: husri.id, role: 'RECEPTIONIST' } },
        update: {},
        create: { userId: reception.id, clinicId: husri.id, role: 'RECEPTIONIST' }
    });

    // 4. Create Patients
    const patient1 = await prisma.patient.upsert({
        where: { clinicId_mrn: { clinicId: husri.id, mrn: 'MRN001' } },
        update: {},
        create: {
            clinicId: husri.id,
            mrn: 'MRN001',
            name: 'John Doe',
            age: 35,
            phone: '555-0101',
            gender: 'Male',
            status: 'Active'
        }
    });

    const patient2 = await prisma.patient.upsert({
        where: { clinicId_mrn: { clinicId: husri.id, mrn: 'MRN002' } },
        update: {},
        create: {
            clinicId: husri.id,
            mrn: 'MRN002',
            name: 'Jane Smith',
            age: 28,
            phone: '555-0102',
            gender: 'Female',
            status: 'Active'
        }
    });

    // 5. Create Appointments
    await prisma.appointment.create({
        data: {
            clinicId: husri.id,
            patientId: patient1.id,
            doctorId: doctor.id,
            date: new Date(),
            time: '10:00 AM',
            status: 'Checked In',
            source: 'Call'
        }
    });

    await prisma.appointment.create({
        data: {
            clinicId: husri.id,
            patientId: patient2.id,
            doctorId: doctor.id,
            date: new Date(),
            time: '11:30 AM',
            status: 'Pending',
            source: 'Walk-in'
        }
    });

    // 6. Create Form Templates
    const generalTemplate = await prisma.formTemplate.create({
        data: {
            name: 'General Consultation',
            clinicId: husri.id,
            specialty: 'General Medicine',
            fields: [
                { id: 'chief_complaint', label: 'Chief Complaint', type: 'text', required: true },
                { id: 'vitals_temp', label: 'Temperature (C)', type: 'number', required: false },
                { id: 'vitals_bp', label: 'Blood Pressure', type: 'text', required: false },
                { id: 'diagnosis', label: 'Working Diagnosis', type: 'text', required: true },
                { id: 'plan', label: 'Treatment Plan', type: 'text', required: true }
            ]
        }
    });

    // 7. Create Medical Records (History)
    await prisma.medicalRecord.create({
        data: {
            clinicId: husri.id,
            patientId: patient1.id,
            doctorId: doctor.id,
            templateId: generalTemplate.id,
            type: 'General Consultation',
            data: {
                chief_complaint: 'Seasonal allergies and mild headache',
                vitals_temp: '37.2',
                vitals_bp: '120/80',
                diagnosis: 'Allergic Rhinitis',
                plan: 'Claritin 10mg once daily for 7 days'
            },
            isClosed: true
        }
    });

    // 8. Create Notifications (Pending Orders)
    await prisma.notification.create({
        data: {
            clinicId: husri.id,
            department: 'pharmacy',
            message: {
                patientId: patient1.id,
                details: 'Claritin 10mg x 7 days'
            },
            status: 'pending'
        }
    });

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
