import express from 'express';
import {
  getChildren,
  getChild,
  createChild,
  updateChild,
  deleteChild,
  adjustPoints,
} from '../controllers/childrenController.js';

const router = express.Router();

router.get('/', getChildren);
router.post('/', createChild);
router.get('/:id', getChild);
router.put('/:id', updateChild);
router.delete('/:id', deleteChild);
router.post('/:id/adjust-points', adjustPoints);

export default router;
