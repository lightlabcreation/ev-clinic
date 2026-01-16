import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as superService from '../services/super.service';
import { asyncHandler } from '../utils/asyncHandler';

// ==================== CLINICS ====================
export const createClinic = asyncHandler(async (req: AuthRequest, res: Response) => {
    const clinic = await superService.createClinic(req.body);
    res.status(201).json({ success: true, message: 'Clinic created successfully', data: clinic });
});

export const getClinics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const clinics = await superService.getClinics();
    res.status(200).json({ success: true, data: clinics });
});

export const updateClinic = asyncHandler(async (req: AuthRequest, res: Response) => {
    const clinic = await superService.updateClinic(Number(req.params.id), req.body);
    res.status(200).json({ success: true, message: 'Clinic updated successfully', data: clinic });
});

export const toggleClinicStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const clinic = await superService.toggleClinicStatus(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Clinic status updated', data: clinic });
});

export const deleteClinic = asyncHandler(async (req: AuthRequest, res: Response) => {
    await superService.deleteClinic(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Clinic deleted successfully', data: null });
});

export const updateModules = asyncHandler(async (req: AuthRequest, res: Response) => {
    const clinic = await superService.updateClinicModules(Number(req.params.id), req.body);
    res.status(200).json({ success: true, message: 'Modules updated successfully', data: clinic });
});

// ==================== STAFF ====================
export const createAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const staff = await superService.createClinicAdmin(Number(req.params.id), req.body);
    res.status(201).json({ success: true, message: 'Admin created successfully', data: staff });
});

export const getStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
    const staff = await superService.getAllStaff();
    res.status(200).json({ success: true, data: staff });
});

export const updateStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
    const staff = await superService.updateStaff(Number(req.params.id), req.body);
    res.status(200).json({ success: true, message: 'Staff updated successfully', data: staff });
});

export const toggleStaffStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const staff = await superService.toggleStaffStatus(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Staff status updated', data: staff });
});

export const deleteStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
    await superService.deleteStaff(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Staff deleted successfully', data: null });
});

// ==================== DASHBOARD ====================
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await superService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
});

export const getSystemAlerts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const alerts = await superService.getSystemAlerts();
    res.status(200).json({ success: true, data: alerts });
});

// ==================== AUDIT LOGS ====================
export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const filters = {
        search: req.query.search as string,
        action: req.query.action as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 50
    };
    const result = await superService.getAuditLogs(filters);
    res.status(200).json({ success: true, data: result });
});

// ==================== SETTINGS ====================
export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const settings = await superService.getSettings();
    res.status(200).json({ success: true, data: settings });
});

export const updateSecuritySettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await superService.updateSecuritySettings(req.body);
    res.status(200).json({ success: true, message: 'Security settings updated', data: result });
});

export const getStorageStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await superService.getStorageStats();
    res.status(200).json({ success: true, data: stats });
});

export const triggerBackup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await superService.triggerDatabaseBackup();
    res.status(200).json(result);
});

export const impersonateClinic = asyncHandler(async (req: AuthRequest, res: Response) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const clientDevice = req.headers['user-agent'] || 'unknown';

    const result = await import('../services/auth.service').then(m => m.impersonateClinic(
        req.user!.id,
        req.body.clinicId,
        String(clientIp),
        String(clientDevice)
    ));

    res.status(200).json({
        success: true,
        message: 'Clinic impersonation successful',
        data: result
    });
});

export const impersonateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const clientDevice = req.headers['user-agent'] || 'unknown';

    const result = await import('../services/auth.service').then(m => m.impersonate(
        req.user!.id,
        req.body.userId,
        String(clientIp),
        String(clientDevice)
    ));

    res.status(200).json({
        success: true,
        message: 'User impersonation successful',
        data: result
    });
});
