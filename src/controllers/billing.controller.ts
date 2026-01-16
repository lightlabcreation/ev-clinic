import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as billingService from '../services/billing.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
    const invoices = await billingService.getInvoices(req.clinicId!);
    res.status(200).json({ status: 'success', data: invoices });
});

export const createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const invoice = await billingService.createInvoice(req.clinicId!, req.body);
    res.status(201).json({ status: 'success', data: invoice });
});

export const updateInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const invoice = await billingService.updateInvoiceStatus(req.params.id as string, req.body.status);
    res.status(200).json({ status: 'success', data: invoice });
});
