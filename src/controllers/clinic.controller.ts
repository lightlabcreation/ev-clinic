import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as clinicService from '../services/clinic.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getClinicStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await clinicService.getClinicStats(req.clinicId!);
    res.status(200).json({ success: true, data: stats });
});

export const getClinicStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
    const staff = await clinicService.getClinicStaff(req.clinicId!);
    res.status(200).json({ success: true, data: staff });
});

export const createStaff = asyncHandler(async (req: AuthRequest, res: Response) => {
    const staff = await clinicService.addStaff(req.clinicId!, req.body);
    res.status(201).json({ success: true, message: 'Staff added successfully', data: staff });
});

export const updateStaff = async (req: AuthRequest, res: Response) => {
    const staff = await clinicService.updateStaff(req.clinicId!, Number(req.params.id), req.body);
    res.status(200).json({ success: true, message: 'Staff updated successfully', data: staff });
};

export const deleteStaff = async (req: AuthRequest, res: Response) => {
    await clinicService.deleteClinicStaff(req.clinicId!, Number(req.params.id));
    res.status(200).json({ success: true, message: 'Staff deleted successfully' });
};

export const getActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
    const activities = await clinicService.getClinicActivities(req.clinicId!);
    res.status(200).json({ success: true, data: activities });
});

export const getFormTemplates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const templates = await clinicService.getFormTemplates(req.clinicId!);
    res.status(200).json({ success: true, data: templates });
});

export const createFormTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const template = await clinicService.createFormTemplate(req.clinicId!, req.body);
    res.status(201).json({ success: true, message: 'Template created successfully', data: template });
});

export const deleteFormTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    await clinicService.deleteFormTemplate(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Template deleted successfully' });
});

export const getBookingConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const config = await clinicService.getBookingConfig(req.clinicId!);
    res.status(200).json({ success: true, data: config });
});

export const updateBookingConfig = asyncHandler(async (req: AuthRequest, res: Response) => {
    const config = await clinicService.updateBookingConfig(req.clinicId!, req.body.config);
    res.status(200).json({ success: true, message: 'Booking configuration updated successfully', data: config });
});
