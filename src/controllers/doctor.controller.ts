import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as doctorService from '../services/doctor.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../server.js';

const resolveDoctorId = async (userId: number, clinicId: number) => {
    const staff = await prisma.clinicstaff.findFirst({
        where: { userId, clinicId }
    });
    return staff?.id || userId; // Fallback to userId if not found, but ideally should exist
};


export const getQueue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const doctorId = await resolveDoctorId(req.user!.id, req.user!.clinicId!);
    const queue = await doctorService.getDoctorQueue(req.user!.clinicId!, doctorId);
    res.status(200).json({ status: 'success', data: queue });
});


export const createAssessment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const doctorId = await resolveDoctorId(req.user!.id, req.user!.clinicId!);
    const assessment = await doctorService.saveAssessment(req.user!.clinicId!, doctorId, req.body);
    res.status(201).json({ status: 'success', data: assessment });
});


export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const history = await doctorService.getHistory(req.user!.clinicId!, Number(req.params.patientId));
    res.status(200).json({ status: 'success', data: history });
});

export const getAllAssessments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const doctorId = await resolveDoctorId(req.user!.id, req.user!.clinicId!);
    const assessments = await doctorService.getAllAssessments(req.user!.clinicId!, doctorId);
    res.status(200).json({ status: 'success', data: assessments });
});

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const doctorId = await resolveDoctorId(req.user!.id, req.user!.clinicId!);
    const stats = await doctorService.getDoctorStats(req.user!.clinicId!, doctorId);
    res.status(200).json({ status: 'success', data: stats });
});


export const getActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
    const doctorId = await resolveDoctorId(req.user!.id, req.user!.clinicId!);
    const activities = await doctorService.getDoctorActivities(req.user!.clinicId!, doctorId);
    res.status(200).json({ status: 'success', data: activities });
});


export const getTemplates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const templates = await doctorService.getFormTemplates(req.user!.clinicId!);
    res.status(200).json({ status: 'success', data: templates });
});

export const getPatients = asyncHandler(async (req: AuthRequest, res: Response) => {
    const doctorId = await resolveDoctorId(req.user!.id, req.user!.clinicId!);
    const patients = await doctorService.getAssignedPatients(req.user!.clinicId!, doctorId);
    res.status(200).json({ status: 'success', data: patients });
});



export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const doctorId = await resolveDoctorId(req.user!.id, req.user!.clinicId!);
    const order = await doctorService.createOrder(req.user!.clinicId!, doctorId, req.body);
    res.status(201).json({ status: 'success', data: order });
});

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const doctorId = await resolveDoctorId(req.user!.id, req.user!.clinicId!);
    const orders = await doctorService.getDoctorOrders(req.user!.clinicId!, doctorId);
    res.status(200).json({ status: 'success', data: orders });
});


export const getRevenue = asyncHandler(async (req: AuthRequest, res: Response) => {
    const doctorId = await resolveDoctorId(req.user!.id, req.user!.clinicId!);
    const revenue = await doctorService.getRevenueStats(req.user!.clinicId!, doctorId);
    res.status(200).json({ status: 'success', data: revenue });
});

