import { Router } from 'express';
import * as patientController from '../controllers/patient.controller';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// All routes require authentication and PATIENT role
router.use(protect);
router.use(restrictTo('PATIENT'));

router.get('/appointments', patientController.getMyAppointments);
router.get('/records', patientController.getMyMedicalRecords);
router.get('/invoices', patientController.getMyInvoices);
router.post('/book', patientController.bookAppointment);


router.get('/doctors/:clinicId', protect, restrictTo('PATIENT'), patientController.getClinicDoctors);

export default router;
