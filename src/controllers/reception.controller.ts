import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as receptionService from '../services/reception.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getPatients = asyncHandler(async (req: AuthRequest, res: Response) => {
    const patients = await receptionService.getPatientsByClinic(req.user!.clinicId!, req.query.search as string);
    res.status(200).json({ status: 'success', data: patients });
});

export const createPatient = asyncHandler(async (req: AuthRequest, res: Response) => {
    const patient = await receptionService.registerPatient(req.user!.clinicId!, req.body);
    res.status(201).json({ status: 'success', data: patient });
});

export const getAppointments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const appointments = await receptionService.getBookings(req.user!.clinicId!, req.query.date as string);
    res.status(200).json({ status: 'success', data: appointments });
});

export const createAppointment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const appointment = await receptionService.createBooking(req.user!.clinicId!, req.body);
    res.status(201).json({ status: 'success', data: appointment });
});

export const updateApptStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const appt = await receptionService.updateBookingStatus(req.user!.clinicId!, Number(req.params.id), req.body.status);
    res.status(200).json({ status: 'success', data: appt });
});

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await receptionService.getReceptionStats(req.user!.clinicId!);
    res.status(200).json({ status: 'success', data: stats });
});

export const getActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
    const activities = await receptionService.getReceptionActivities(req.user!.clinicId!);
    res.status(200).json({ status: 'success', data: activities });
});
