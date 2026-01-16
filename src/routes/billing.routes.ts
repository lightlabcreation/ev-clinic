import { Router } from 'express';
import * as billingController from '../controllers/billing.controller';
import { protect, restrictTo, ensureClinicContext } from '../middlewares/auth';

const router = Router();

router.use(protect, restrictTo('RECEPTIONIST', 'ADMIN'), ensureClinicContext);

router.get('/invoices', billingController.getInvoices);
router.post('/', billingController.createInvoice);
router.patch('/invoices/:id', billingController.updateInvoice);

export default router;
