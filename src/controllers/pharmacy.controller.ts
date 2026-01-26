import { Request, Response, NextFunction } from 'express';
import * as pharmacyService from '../services/pharmacy.service.js';

export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = Number(req.headers['x-clinic-id']);
        const inventory = await pharmacyService.getInventory(clinicId);
        res.json({ success: true, data: inventory });
    } catch (error) {
        next(error);
    }
};

export const addInventory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = Number(req.headers['x-clinic-id']);
        const item = await pharmacyService.addInventory(clinicId, req.body);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        next(error);
    }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = Number(req.headers['x-clinic-id']);
        const orders = await pharmacyService.getPharmacyOrders(clinicId);
        res.json({ success: true, data: orders });
    } catch (error) {
        next(error);
    }
};

export const processOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clinicId = Number(req.headers['x-clinic-id']);
        const { orderId, items, paid } = req.body;
        const result = await pharmacyService.processPharmacyOrder(clinicId, orderId, items, paid);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
export const directSale = async (req: any, res: Response, next: NextFunction) => {
    try {
        const clinicId = req.clinicId;
        const result = await pharmacyService.directSale(clinicId, req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};
