import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachFamilyInfo, requireFamilyAdmin } from '../middleware/familyAuth.js';
import { authenticateKiosk } from '../middleware/kioskAuth.js';
import {
  generateCode,
  checkStatus,
  pairKiosk,
  getDashboardData,
  getKioskSessions,
  unpairKiosk
} from '../controllers/kioskController.js';

const router = Router();

// No auth - called by kiosk display
router.post('/code', generateCode);
router.get('/status', checkStatus);

// Requires kiosk auth - called by paired kiosk
router.get('/dashboard', authenticateKiosk, getDashboardData);

// Requires family admin - called from family settings
router.post('/pair', authenticateToken, attachFamilyInfo, requireFamilyAdmin, pairKiosk);
router.get('/sessions', authenticateToken, attachFamilyInfo, requireFamilyAdmin, getKioskSessions);
router.delete('/sessions/:id', authenticateToken, attachFamilyInfo, requireFamilyAdmin, unpairKiosk);

export default router;
