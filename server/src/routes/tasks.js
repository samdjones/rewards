import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask
} from '../controllers/tasksController.js';

const router = express.Router();

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/complete', completeTask);

export default router;
