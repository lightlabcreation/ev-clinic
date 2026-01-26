import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';
import { prisma } from '../server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_PATH = path.join(__dirname, '../../login-debug.log');
export const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        // Otherwise check real database
        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id }
        });
        if (!currentUser) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }
        req.user = {
            id: currentUser.id,
            email: currentUser.email,
            clinicId: decoded.clinicId,
            role: decoded.role
        };
        const accessLog = `[${new Date().toISOString()}] ACCESS: ${req.user.email} | URL: ${req.url} | TokenRole: ${decoded.role}\n`;
        fs.appendFileSync(LOG_PATH, accessLog);
        next();
    }
    catch (error) {
        next(new AppError('Invalid token. Please log in again.', 401));
    }
};
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role || '')) {
            console.log(`[403 ERROR] Denied: User ${req.user?.email} | Role: ${req.user?.role} | Expected: ${roles.join(',')}`);
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
export const ensureClinicContext = async (req, res, next) => {
    try {
        // 1. If user is Super Admin, they can access any clinic
        if (req.user?.role === 'SUPER_ADMIN') {
            const headerId = req.headers['x-clinic-id'] ? Number(req.headers['x-clinic-id']) : undefined;
            req.clinicId = req.user.clinicId || headerId;
            return next();
        }
        // 2. Priority: Token-locked Clinic ID (Session locking)
        let clinicId = req.user?.clinicId;
        // 3. Fallback: Header-based ID (for multi-clinic selection phase)
        const headerId = req.headers['x-clinic-id'] ? Number(req.headers['x-clinic-id']) : undefined;
        if (!clinicId && headerId) {
            // VERIFY: Does this user actually have access to this clinic?
            const membership = await prisma.clinicstaff.findFirst({
                where: {
                    userId: req.user.id,
                    clinicId: headerId
                }
            });
            if (!membership) {
                console.warn(`[SECURITY] Unauthorized clinic access attempt by ${req.user?.email} for clinic ${headerId}`);
                return next(new AppError('Unauthorized: You do not belong to this clinic.', 403));
            }
            clinicId = headerId;
        }
        if (!clinicId) {
            return next(new AppError('No clinic context found. Please select a clinic.', 400));
        }
        req.clinicId = clinicId;
        next();
    }
    catch (error) {
        next(error);
    }
};
export const requireModule = (moduleName) => {
    return async (req, res, next) => {
        try {
            // Super admins bypass module checks
            if (req.user?.role === 'SUPER_ADMIN')
                return next();
            const clinicId = req.clinicId;
            if (!clinicId)
                return next(new AppError('No clinic context found.', 400));
            const clinic = await prisma.clinic.findUnique({
                where: { id: clinicId },
                select: { modules: true }
            });
            if (!clinic)
                return next(new AppError('Clinic not found.', 404));
            const modules = clinic.modules ? JSON.parse(clinic.modules) : {};
            // Normalize module name (e.g. 'Lab' -> 'laboratory')
            let key = moduleName.toLowerCase();
            if (key === 'lab')
                key = 'laboratory';
            if (!modules[key]) {
                return next(new AppError(`The ${moduleName} module is not enabled for this clinic.`, 403));
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
