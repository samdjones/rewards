import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachFamilyInfo, requireFamilyAdmin } from '../middleware/familyAuth.js';
import { authenticateKiosk } from '../middleware/kioskAuth.js';
import {
  generateCode,
  checkStatus,
  pairKiosk,
  getDashboardData,
  getWeather,
  getBusTimes,
  getKioskSessions,
  unpairKiosk
} from '../controllers/kioskController.js';
import { getKioskPhotos } from '../controllers/photoController.js';

const router = Router();

// No auth - called by kiosk display
router.post('/code', generateCode);
router.get('/status', checkStatus);

// Requires kiosk auth - called by paired kiosk
router.get('/dashboard', authenticateKiosk, getDashboardData);
router.get('/weather', authenticateKiosk, getWeather);
router.get('/bus-times', authenticateKiosk, getBusTimes);
router.get('/photos', authenticateKiosk, getKioskPhotos);

// Requires family admin - called from family settings
router.post('/pair', authenticateToken, attachFamilyInfo, requireFamilyAdmin, pairKiosk);
router.get('/sessions', authenticateToken, attachFamilyInfo, requireFamilyAdmin, getKioskSessions);
router.delete('/sessions/:id', authenticateToken, attachFamilyInfo, requireFamilyAdmin, unpairKiosk);

export default router;
