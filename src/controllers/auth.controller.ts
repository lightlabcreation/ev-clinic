import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';

const getClientInfo = (req: any) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const device = req.headers['user-agent'] || 'unknown';
    return { ip: Array.isArray(ip) ? ip[0] : ip, device };
};

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ip, device } = getClientInfo(req);
    const result = await authService.login(req.body, ip, device);
    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
    });
});

export const getMyClinics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const clinics = await authService.getMyClinics(req.user!.id);
    res.status(200).json({
        success: true,
        data: clinics
    });
});

export const selectClinic = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ip, device } = getClientInfo(req);
    const result = await authService.selectClinic(req.user!.id, req.body.clinicId, ip, device);
    res.status(200).json({
        success: true,
        message: 'Clinic context locked',
        data: result
    });
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json({
        success: true,
        message: result.message
    });
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.resetPassword(req.body);
    res.status(200).json({
        success: true,
        message: result.message
    });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.changePassword(req.user!.id, req.body);
    res.status(200).json({
        success: true,
        message: result.message
    });
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.refreshToken(req.user!.id);
    res.status(200).json({
        success: true,
        data: result
    });
});

export const impersonate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ip, device } = getClientInfo(req);
    const result = await authService.impersonate(req.user!.id, req.body.userId, ip, device);
    res.status(200).json({
        success: true,
        message: 'Impersonation successful',
        data: result
    });
});
