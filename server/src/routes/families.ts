import express from 'express';
import { requireFamily, requireFamilyAdmin } from '../middleware/familyAuth.js';
import {
  createFamily,
  getCurrentFamily,
  updateFamily,
  deleteFamily,
  joinFamily,
  leaveFamily,
  getMembers,
  updateMemberRole,
  removeMember,
  getInviteCode,
  regenerateInviteCode,
} from '../controllers/familyController.js';

const router = express.Router();

// Family CRUD
router.post('/', createFamily);
router.get('/current', getCurrentFamily);
router.put('/current', requireFamilyAdmin, updateFamily);
router.delete('/current', requireFamilyAdmin, deleteFamily);

// Join/Leave
router.post('/join', joinFamily);
router.post('/leave', requireFamily, leaveFamily);

// Members management
router.get('/current/members', requireFamily, getMembers);
router.put('/current/members/:userId/role', requireFamilyAdmin, updateMemberRole);
router.delete('/current/members/:userId', requireFamilyAdmin, removeMember);

// Invite code management
router.get('/current/invite-code', requireFamilyAdmin, getInviteCode);
router.post('/current/invite-code/regenerate', requireFamilyAdmin, regenerateInviteCode);

export default router;
