import express from 'express';
import {
  getRewards,
  getReward,
  createReward,
  updateReward,
  deleteReward,
  redeemReward,
} from '../controllers/rewardsController.js';

const router = express.Router();

router.get('/', getRewards);
router.post('/', createReward);
router.get('/:id', getReward);
router.put('/:id', updateReward);
router.delete('/:id', deleteReward);
router.post('/:id/redeem', redeemReward);

export default router;
