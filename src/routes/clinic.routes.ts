import { Router } from 'express';
import * as clinicController from '../controllers/clinic.controller';
import { protect, restrictTo, ensureClinicContext } from '../middlewares/auth';

const router = Router();

// Base protection for all routes
router.use(protect, ensureClinicContext);

// Routes accessible by ADMIN and RECEPTIONIST
router.get('/staff', restrictTo('ADMIN', 'RECEPTIONIST'), clinicController.getClinicStaff);
router.get('/booking-config', restrictTo('ADMIN', 'RECEPTIONIST'), clinicController.getBookingConfig);

// Admin-only routes
router.use(restrictTo('ADMIN'));

router.get('/stats', clinicController.getClinicStats);
router.get('/activities', clinicController.getActivities);
router.post('/staff', clinicController.createStaff);
router.patch('/staff/:id', clinicController.updateStaff);
router.delete('/staff/:id', clinicController.deleteStaff);

// Form Templates
router.get('/templates', clinicController.getFormTemplates); // Admin manages templates
router.post('/templates', clinicController.createFormTemplate);
router.delete('/templates/:id', clinicController.deleteFormTemplate);

// Booking Config Update (Read is above)
router.post('/booking-config', clinicController.updateBookingConfig);

export default router;
