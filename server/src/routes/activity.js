import express from 'express';
import { getChildActivity, getChildStats } from '../controllers/activityController.js';

const router = express.Router();

router.get('/:id/activity', getChildActivity);
router.get('/:id/stats', getChildStats);

export default router;
