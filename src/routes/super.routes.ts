import { Router } from 'express';
import * as superController from '../controllers/super.controller';
import { protect, restrictTo } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createClinicSchema, createStaffSchema } from '../validations/super.validation';

const router = Router();

router.use(protect, restrictTo('SUPER_ADMIN'));

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', superController.getDashboardStats);
router.get('/alerts', superController.getSystemAlerts);

// ==================== CLINICS ====================
router.get('/clinics', superController.getClinics);
router.post('/clinics', validate(createClinicSchema), superController.createClinic);
router.patch('/clinics/:id', superController.updateClinic);
router.patch('/clinics/:id/status', superController.toggleClinicStatus);
router.delete('/clinics/:id', superController.deleteClinic);
router.patch('/clinics/:id/modules', superController.updateModules);
router.post('/impersonate/clinic', superController.impersonateClinic);
router.post('/impersonate/user', superController.impersonateUser);

// ==================== STAFF ====================
router.get('/staff', superController.getStaff);
router.post('/clinics/:id/admin', validate(createStaffSchema), superController.createAdmin);
router.patch('/staff/:id', superController.updateStaff);
router.patch('/staff/:id/status', superController.toggleStaffStatus);
router.delete('/staff/:id', superController.deleteStaff);

// ==================== AUDIT LOGS ====================
router.get('/audit-logs', superController.getAuditLogs);

// ==================== SETTINGS ====================
router.get('/settings', superController.getSettings);
router.patch('/settings/security', superController.updateSecuritySettings);
router.get('/system/storage', superController.getStorageStats);
router.post('/system/backup', superController.triggerBackup);

export default router;
