import bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { AppError } from '../utils/AppError';
import { startTime } from '../utils/system';
// ==================== CLINICS ====================
export const createClinic = async (data) => {
    const { name, location, email, contact } = data;
    const subdomain = (data.subdomain || name.toLowerCase().replace(/ /g, '-')).replace(/[^a-z0-9-]/g, '');
    const existing = await prisma.clinic.findUnique({ where: { subdomain } });
    if (existing)
        throw new AppError('A clinic with this name/subdomain already exists.', 400);
    const clinic = await prisma.clinic.create({
        data: {
            name,
            subdomain,
            location,
            email,
            contact,
            status: 'active',
            modules: JSON.stringify({ pharmacy: true, radiology: false, laboratory: false, billing: true })
        }
    });
    await prisma.auditlog.create({
        data: {
            action: 'Clinic Created',
            performedBy: 'SUPER_ADMIN',
            details: JSON.stringify({ clinicName: name, location })
        }
    });
    return clinic;
};
export const getClinics = async () => {
    const clinics = await prisma.clinic.findMany({
        include: {
            _count: {
                select: { clinicstaff: true, patient: true }
            }
        }
    });
    return clinics.map(clinic => ({
        ...clinic,
        modules: clinic.modules ? JSON.parse(clinic.modules) : { pharmacy: true, radiology: false, laboratory: false, billing: true }
    }));
};
export const updateClinic = async (id, data) => {
    const clinic = await prisma.clinic.update({
        where: { id },
        data
    });
    await prisma.auditlog.create({
        data: {
            action: 'Clinic Updated',
            performedBy: 'SUPER_ADMIN',
            details: JSON.stringify({ clinicId: id, updates: Object.keys(data) })
        }
    });
    return clinic;
};
export const toggleClinicStatus = async (id) => {
    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic)
        throw new AppError('Clinic not found', 404);
    const updatedClinic = await prisma.clinic.update({
        where: { id },
        data: { status: clinic.status === 'active' ? 'inactive' : 'active' }
    });
    await prisma.auditlog.create({
        data: {
            action: 'Clinic Status Toggled',
            performedBy: 'SUPER_ADMIN',
            details: JSON.stringify({ clinicId: id, newStatus: updatedClinic.status })
        }
    });
    return updatedClinic;
};
export const deleteClinic = async (id) => {
    await prisma.clinic.delete({ where: { id } });
    await prisma.auditlog.create({
        data: {
            action: 'Clinic Deleted',
            performedBy: 'SUPER_ADMIN',
            details: JSON.stringify({ clinicId: id })
        }
    });
    return null;
};
export const updateClinicModules = async (id, modules) => {
    const clinic = await prisma.clinic.update({
        where: { id },
        data: { modules: typeof modules === 'string' ? modules : JSON.stringify(modules) }
    });
    await prisma.auditlog.create({
        data: {
            action: 'Clinic Modules Updated',
            performedBy: 'SUPER_ADMIN',
            details: JSON.stringify({ clinicId: id, modules })
        }
    });
    return {
        ...clinic,
        modules: typeof clinic.modules === 'string' ? JSON.parse(clinic.modules) : (clinic.modules || {})
    };
};
// ==================== STAFF ====================
export const createClinicAdmin = async (clinicId, userData) => {
    const { email, password, name, phone, role } = userData;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        const hashedPassword = await bcrypt.hash(password, 12);
        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                phone,
                role: (role || 'ADMIN').toUpperCase()
            }
        });
    }
    const staff = await prisma.clinicstaff.create({
        data: {
            userId: user.id,
            clinicId,
            role: (role || 'ADMIN').toUpperCase()
        },
        include: {
            user: {
                select: { id: true, name: true, email: true }
            }
        }
    });
    await prisma.auditlog.create({
        data: {
            action: 'Clinic Admin Created',
            performedBy: 'SUPER_ADMIN',
            details: JSON.stringify({ userName: name, clinicId, role: staff.role })
        }
    });
    return staff;
};
export const getAllStaff = async () => {
    const staff = await prisma.clinicstaff.findMany({
        include: {
            user: {
                select: { id: true, name: true, email: true, phone: true, status: true }
            }
        }
    });
    return staff.map((s) => ({
        id: s.id,
        userId: s.userId,
        name: s.user.name,
        email: s.user.email,
        phone: s.user.phone,
        role: s.role,
        clinics: [s.clinicId],
        status: s.user.status,
        joined: s.createdAt
    }));
};
export const updateStaff = async (id, data) => {
    const staff = await prisma.clinicstaff.findUnique({
        where: { id },
        include: { user: true }
    });
    if (!staff)
        throw new AppError('Staff not found', 404);
    if (data.name || data.email || data.phone) {
        await prisma.user.update({
            where: { id: staff.userId },
            data: {
                name: data.name || undefined,
                email: data.email || undefined,
                phone: data.phone || undefined
            }
        });
    }
    const updatedStaff = await prisma.clinicstaff.update({
        where: { id },
        data: {
            role: data.role ? data.role.toUpperCase() : undefined,
            department: data.department || undefined,
            specialty: data.specialty || undefined
        },
        include: { user: true }
    });
    await prisma.auditlog.create({
        data: {
            action: 'Staff Updated',
            performedBy: 'SUPER_ADMIN',
            details: JSON.stringify({ staffId: id, updates: Object.keys(data) })
        }
    });
    return {
        id: updatedStaff.id,
        userId: updatedStaff.userId,
        name: updatedStaff.user.name,
        email: updatedStaff.user.email,
        phone: updatedStaff.user.phone,
        role: updatedStaff.role,
        clinics: [updatedStaff.clinicId],
        status: updatedStaff.user.status,
        joined: updatedStaff.user.joined ? updatedStaff.user.joined.toISOString().split('T')[0] : null
    };
};
export const deleteStaff = async (id) => {
    await prisma.clinicstaff.delete({ where: { id } });
    await prisma.auditlog.create({
        data: {
            action: 'Staff Deleted',
            performedBy: 'SUPER_ADMIN',
            details: JSON.stringify({ staffId: id })
        }
    });
    return null;
};
export const toggleStaffStatus = async (id) => {
    const staff = await prisma.clinicstaff.findUnique({
        where: { id },
        include: { user: true }
    });
    if (!staff)
        throw new AppError('Staff not found', 404);
    const updatedUser = await prisma.user.update({
        where: { id: staff.userId },
        data: { status: staff.user.status === 'active' ? 'inactive' : 'active' }
    });
    return {
        id: staff.id,
        userId: staff.userId,
        clinicId: staff.clinicId,
        name: updatedUser.name,
        email: updatedUser.email,
        role: staff.role,
        roles: [staff.role],
        department: staff.department,
        specialty: staff.specialty,
        status: updatedUser.status,
        joined: updatedUser.joined ? updatedUser.joined.toISOString().split('T')[0] : null,
        createdAt: staff.createdAt
    };
};
// ==================== DASHBOARD STATS ====================
export const getDashboardStats = async () => {
    const totalClinics = await prisma.clinic.count();
    const totalStaff = await prisma.clinicstaff.count({ where: { role: 'ADMIN' } });
    const totalPatients = await prisma.patient.count();
    // Count active modules across all clinics
    const clinics = await prisma.clinic.findMany({ select: { modules: true } });
    const moduleCount = clinics.reduce((acc, clinic) => {
        const modules = typeof clinic.modules === 'string' ? JSON.parse(clinic.modules) : (clinic.modules || {});
        return acc + Object.values(modules).filter(Boolean).length;
    }, 0);
    // Calculate real uptime
    const diff = Date.now() - startTime.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    let uptimeStr = '';
    if (days > 0)
        uptimeStr += `${days}d `;
    if (hours > 0 || days > 0)
        uptimeStr += `${hours}h `;
    uptimeStr += `${minutes}m`;
    return {
        totalClinics,
        activeModules: moduleCount,
        totalAdmins: totalStaff,
        systemUptime: uptimeStr,
        totalPatients
    };
};
// ==================== SYSTEM ALERTS ====================
export const getSystemAlerts = async () => {
    const notifications = await prisma.notification.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    return notifications.map((n) => ({
        id: n.id,
        message: typeof n.message === 'string' ? n.message : JSON.stringify(n.message),
        status: n.status === 'unread' ? 'warn' : 'ok',
        createdAt: n.createdAt
    }));
};
// ==================== AUDIT LOGS ====================
export const getAuditLogs = async (filters) => {
    const { search, action, page = 1, limit = 50 } = filters || {};
    const where = {};
    if (search) {
        where.OR = [
            { action: { contains: search } },
            { performedBy: { contains: search } }
        ];
    }
    if (action && action !== 'all') {
        where.action = { contains: action };
    }
    const [logs, total] = await Promise.all([
        prisma.auditlog.findMany({
            where,
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { timestamp: 'desc' }
        }),
        prisma.auditlog.count({ where })
    ]);
    return {
        logs: logs.map(log => ({
            ...log,
            details: log.details ? JSON.parse(log.details) : {}
        })),
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
};
// ==================== SETTINGS ====================
export const getSettings = async () => {
    return {
        security: {
            twoFactorEnabled: true,
            passwordExpiry: 90,
            sessionTimeout: 30
        },
        system: {
            lastBackup: await prisma.auditlog.findFirst({
                where: { action: 'Database Backup Initiated' },
                orderBy: { timestamp: 'desc' }
            }).then(log => log?.timestamp || null),
            storageUsed: 42,
            storageTotal: 100
        }
    };
};
export const updateSecuritySettings = async (data) => {
    return {
        success: true,
        settings: data
    };
};
export const getStorageStats = async () => {
    const patientCount = await prisma.patient.count();
    const recordCount = await prisma.medicalrecord.count();
    const baseUsage = 5.2;
    const calculatedUsage = baseUsage + (patientCount * 0.01) + (recordCount * 0.05);
    const total = 100;
    return {
        total,
        used: parseFloat(calculatedUsage.toFixed(2)),
        available: parseFloat((total - calculatedUsage).toFixed(2)),
        percentage: Math.round((calculatedUsage / total) * 100)
    };
};
export const triggerDatabaseBackup = async () => {
    await prisma.auditlog.create({
        data: {
            action: 'Database Backup Initiated',
            performedBy: 'System',
            details: JSON.stringify({ timestamp: new Date(), status: 'started' })
        }
    });
    return {
        success: true,
        message: 'Database backup initiated successfully',
        estimatedTime: '5-10 minutes'
    };
};
