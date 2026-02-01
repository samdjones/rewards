import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  uncompleteTask,
  reorderTasks,
  getCompletionsForDate,
  completeTaskForDate,
  uncompleteTaskForDate,
} from '../controllers/tasksController.js';

const router = express.Router();

router.get('/', getTasks);
router.post('/', createTask);
router.get('/completions', getCompletionsForDate);
router.put('/reorder', reorderTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/complete', completeTask);
router.post('/:id/uncomplete', uncompleteTask);
router.post('/:id/complete-for-date', completeTaskForDate);
router.post('/:id/uncomplete-for-date', uncompleteTaskForDate);

export default router;
