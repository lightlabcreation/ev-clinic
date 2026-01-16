import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middlewares/auth';

const router = Router();

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/clinics/my', protect, authController.getMyClinics);
router.post('/select-clinic', protect, authController.selectClinic);
router.post('/change-password', protect, authController.changePassword);
router.get('/refresh-token', protect, authController.refreshToken);

export default router;
