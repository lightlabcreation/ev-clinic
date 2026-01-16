import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { prisma } from '../server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_PATH = path.join(__dirname, '../../login-debug.log');

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        clinicId?: number;
        role?: string;
    };
    clinicId?: number;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in! Please log in to get access.', 401));
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

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
    } catch (error) {
        next(new AppError('Invalid token. Please log in again.', 401));
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role || '')) {
            console.log(`[403 ERROR] Denied: User ${req.user?.email} | Role: ${req.user?.role} | Expected: ${roles.join(',')}`);
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};

export const ensureClinicContext = (req: AuthRequest, res: Response, next: NextFunction) => {
    const clinicId = req.user?.clinicId || (req.headers['x-clinic-id'] ? Number(req.headers['x-clinic-id']) : undefined);

    if (!clinicId && req.user?.role !== 'SUPER_ADMIN') {
        return next(new AppError('No clinic context found. Please select a clinic.', 400));
    }

    req.clinicId = clinicId;
    next();
};
