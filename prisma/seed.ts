import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Clean Seed...');

    // 1. Clean Database (Delete in order of dependencies)
    console.log('🧹 Cleaning existing data...');
    await prisma.service_order.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.medicalrecord.deleteMany();
    await prisma.formresponse.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.clinicstaff.deleteMany();
    await prisma.department.deleteMany();
    await prisma.formtemplate.deleteMany();
    await prisma.auditlog.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.clinic.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Database cleaned.');

    // 2. Create Global Password
    const passwordHash = await bcrypt.hash('password123', 12);
    // Specific password for super admin to match user request if needed, but 'password123' is standard for dev. 
    // User asked for "admin123" in previous context, check login: 'superadmin@ev.com' / 'admin123'
    const adminPasswordHash = await bcrypt.hash('admin123', 12);

    // 3. Create Super Admin User
    console.log('👤 Creating Super Admin...');
    const superAdminUser = await prisma.user.create({
        data: {
            email: 'superadmin@ev.com',
            password: adminPasswordHash,
            name: 'Super Admin',
            role: 'SUPER_ADMIN',
            status: 'active'
        }
    });

    // 4. Create The ONE Clinic
    console.log('🏥 Creating Exclusive Vision Clinic...');
    // Subscription details: Monthly plan, active, starts now, ends in 1 month
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const clinic = await prisma.clinic.create({
        data: {
            name: 'Exclusive Vision Clinic',
            subdomain: 'ev-clinic',
            location: 'Main Health Hub, New York',
            contact: '+1 (555) 000-0001',
            email: 'admin@ev-clinic.com',
            status: 'active',
            modules: JSON.stringify({
                pharmacy: true,
                radiology: true,
                laboratory: true,
                billing: true
            }),
            subscriptionPlan: 'Monthly',
            subscriptionStart: startDate,
            subscriptionEnd: endDate,
            isActive: true,
            bookingConfig: JSON.stringify({
                slotDuration: 30,
                startHour: 9,
                endHour: 17,
                days: [1, 2, 3, 4, 5] // Mon-Fri
            })
        }
    });

    // 5. Create Departments
    console.log('🏢 Creating Departments...');
    const depts = ['General Practice', 'Pharmacy', 'Laboratory', 'Radiology', 'Accounts', 'Reception'];
    for (const d of depts) {
        await prisma.department.create({
            data: {
                clinicId: clinic.id,
                name: d,
                type: d === 'General Practice' ? 'CLINICAL' : 'ADMINISTRATIVE'
            }
        });
    }

    // 6. Create Clinic Staff Users
    console.log('👥 Creating Clinic Staff...');

    // Clinic Admin
    const clinicAdminUser = await prisma.user.create({
        data: {
            email: 'admin@ev-clinic.com',
            password: adminPasswordHash, // Use same standard password
            name: 'Clinic Admin',
            role: 'ADMIN',
            status: 'active'
        }
    });
    await prisma.clinicstaff.create({
        data: {
            userId: clinicAdminUser.id,
            clinicId: clinic.id,
            role: 'ADMIN',
            department: 'Administration'
        }
    });

    // Doctor
    const doctorUser = await prisma.user.create({
        data: {
            email: 'doctor@ev-clinic.com',
            password: adminPasswordHash,
            name: 'Dr. John Smith',
            role: 'DOCTOR',
            status: 'active'
        }
    });
    await prisma.clinicstaff.create({
        data: {
            userId: doctorUser.id,
            clinicId: clinic.id,
            role: 'DOCTOR',
            department: 'General Practice',
            specialty: 'Cardiology'
        }
    });

    // Receptionist
    const receptionUser = await prisma.user.create({
        data: {
            email: 'reception@ev-clinic.com',
            password: adminPasswordHash,
            name: 'Sarah Receptionist',
            role: 'RECEPTIONIST',
            status: 'active'
        }
    });
    await prisma.clinicstaff.create({
        data: {
            userId: receptionUser.id,
            clinicId: clinic.id,
            role: 'RECEPTIONIST',
            department: 'Reception'
        }
    });

    // Pharmacist
    const pharmacyUser = await prisma.user.create({
        data: {
            email: 'pharmacy@ev-clinic.com',
            password: adminPasswordHash,
            name: 'Paul Pharmacist',
            role: 'PHARMACY',
            status: 'active'
        }
    });
    await prisma.clinicstaff.create({
        data: {
            userId: pharmacyUser.id,
            clinicId: clinic.id,
            role: 'PHARMACY',
            department: 'Pharmacy'
        }
    });

    // Lab Technician
    const labUser = await prisma.user.create({
        data: {
            email: 'lab@ev-clinic.com',
            password: adminPasswordHash,
            name: 'Lisa LabTech',
            role: 'LAB',
            status: 'active'
        }
    });
    await prisma.clinicstaff.create({
        data: {
            userId: labUser.id,
            clinicId: clinic.id,
            role: 'LAB',
            department: 'Laboratory'
        }
    });

    // Radiologist
    const radiologyUser = await prisma.user.create({
        data: {
            email: 'radiology@ev-clinic.com',
            password: adminPasswordHash,
            name: 'Ray Radiologist',
            role: 'RADIOLOGY',
            status: 'active'
        }
    });
    await prisma.clinicstaff.create({
        data: {
            userId: radiologyUser.id,
            clinicId: clinic.id,
            role: 'RADIOLOGY',
            department: 'Radiology'
        }
    });

    // Accountant
    const accountantUser = await prisma.user.create({
        data: {
            email: 'accounts@ev-clinic.com',
            password: adminPasswordHash,
            name: 'Alex Accountant',
            role: 'ACCOUNTANT',
            status: 'active'
        }
    });
    await prisma.clinicstaff.create({
        data: {
            userId: accountantUser.id,
            clinicId: clinic.id,
            role: 'ACCOUNTANT',
            department: 'Accounts'
        }
    });

    // 7. Create Dummy Patients - SKIPPED FOR ZERO DUMMY DATA REQUEST
    console.log('🧑‍🤝‍🧑 Skipping Patient Creation (Clean State for Workflow Testing)...');

    // 8. Create Inventory Items - SKIPPED
    console.log('💊 Skipping Inventory Creation...');

    // 9. Create Appointments - SKIPPED
    console.log('📅 Skipping Appointment Creation...');

    // 10. Create Service Orders - SKIPPED
    console.log('🔬 Skipping Service Order Creation...');

    console.log('✅ Seeding Complete! System Ready with Zero Transactional Data.');
    console.log('👉 Super Admin: superadmin@ev.com / admin123');
    console.log('👉 Clinic Admin: admin@ev-clinic.com / admin123');
    console.log('👉 Doctor: doctor@ev-clinic.com / admin123');
    console.log('👉 Reception: reception@ev-clinic.com / admin123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
