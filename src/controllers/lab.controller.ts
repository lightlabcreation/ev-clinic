import { Request, Response, NextFunction } from 'express';
import * as labService from '../services/lab.service.js';

export const getOrders = async (req: any, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.clinicId;
        const type = req.query.type as 'LAB' | 'RADIOLOGY' || 'LAB';
        const orders = await labService.getLabOrders(clinicId, type);
        res.json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

export const completeOrder = async (req: any, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.clinicId;
        const { orderId, result, price, paid } = req.body;
        const data = await labService.completeLabOrder(clinicId, orderId, { result, price, paid });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const rejectOrder = async (req: any, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.clinicId;
        const { orderId } = req.body;
        const data = await labService.rejectLabOrder(clinicId, orderId);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
