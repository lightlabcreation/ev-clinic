import { Router } from 'express';
import * as receptionController from '../controllers/reception.controller';
import { protect, restrictTo, ensureClinicContext } from '../middlewares/auth';

const router = Router();

router.use(protect, ensureClinicContext);

router.get('/stats', restrictTo('RECEPTIONIST', 'ADMIN'), receptionController.getStats);
router.get('/activities', restrictTo('RECEPTIONIST', 'ADMIN'), receptionController.getActivities);

router.get('/patients', restrictTo('RECEPTIONIST', 'ADMIN', 'DOCTOR'), receptionController.getPatients);
router.post('/patients', restrictTo('RECEPTIONIST', 'ADMIN'), receptionController.createPatient);

router.get('/appointments', restrictTo('RECEPTIONIST', 'ADMIN', 'DOCTOR'), receptionController.getAppointments);
router.post('/appointments', restrictTo('RECEPTIONIST', 'ADMIN'), receptionController.createAppointment);

router.patch('/appointments/:id/status', restrictTo('RECEPTIONIST', 'ADMIN'), receptionController.updateApptStatus);

export default router;
