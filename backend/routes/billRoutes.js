import { Router } from 'express';
import {
  createBill,
  deleteBill,
  getAllBills,
  getBillById,
  healthCheck,
  updateParticipantStatus,
} from '../controllers/billController.js';

const router = Router();

router.get('/health', healthCheck);
router.get('/bills', getAllBills);
router.post('/bills', createBill);
router.get('/bills/:id', getBillById);
router.patch('/participants/:id/status', updateParticipantStatus);
router.delete('/bills/:id', deleteBill);

export default router;
