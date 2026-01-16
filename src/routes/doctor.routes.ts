import { Router } from 'express';
import * as doctorController from '../controllers/doctor.controller';
import { protect, restrictTo, ensureClinicContext } from '../middlewares/auth';

const router = Router();

router.use(protect, restrictTo('DOCTOR'), ensureClinicContext);

router.get('/stats', doctorController.getStats);
router.get('/activities', doctorController.getActivities);
router.get('/queue', doctorController.getQueue);
router.post('/assessments', doctorController.createAssessment);
router.get('/history/:patientId', doctorController.getHistory);
router.get('/templates', doctorController.getTemplates);
router.get('/patients', doctorController.getPatients);
router.get('/orders', doctorController.getOrders);
router.get('/revenue', doctorController.getRevenue);

export default router;
