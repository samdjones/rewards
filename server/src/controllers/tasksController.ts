import type { Request, Response } from 'express';
import type { Task, Child, RepeatSchedule } from '@rewards/shared';
import db from '../db/wrapper.js';

const VALID_SCHEDULES: RepeatSchedule[] = ['none', 'daily', 'weekdays', 'weekends'];

export const getTasks = (req: Request, res: Response): void => {
  try {
    const tasks = db
      .prepare<Task>(
        'SELECT * FROM tasks WHERE family_id = ? ORDER BY sort_order ASC'
      )
      .all(req.familyId);
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getTask = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const task = db
      .prepare<Task>('SELECT * FROM tasks WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createTask = (req: Request, res: Response): void => {
  try {
    const { name, description, point_value, category, repeat_schedule } = req.body;

    if (!name || point_value === undefined) {
      res.status(400).json({ error: 'Name and point_value are required' });
      return;
    }

    if (point_value < 0) {
      res.status(400).json({ error: 'Point value must be non-negative' });
      return;
    }

    const schedule: RepeatSchedule =
      repeat_schedule && VALID_SCHEDULES.includes(repeat_schedule)
        ? repeat_schedule
        : 'none';

    // Get max sort_order for this family to put new task at the end
    const maxOrderResult = db
      .prepare<{ max_order: number | null }>(
        'SELECT MAX(sort_order) as max_order FROM tasks WHERE family_id = ?'
      )
      .get(req.familyId);
    const nextSortOrder = (maxOrderResult?.max_order ?? -1) + 1;

    const result = db
      .prepare(
        'INSERT INTO tasks (family_id, created_by, name, description, point_value, category, repeat_schedule, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        req.familyId,
        req.userId,
        name,
        description || null,
        point_value,
        category || null,
        schedule,
        nextSortOrder
      );

    const task = db
      .prepare<Task>('SELECT * FROM tasks WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateTask = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { name, description, point_value, category, repeat_schedule } = req.body;

    const task = db
      .prepare<Task>('SELECT * FROM tasks WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (point_value !== undefined && point_value < 0) {
      res.status(400).json({ error: 'Point value must be non-negative' });
      return;
    }

    const schedule: RepeatSchedule =
      repeat_schedule !== undefined
        ? (VALID_SCHEDULES.includes(repeat_schedule) ? repeat_schedule : task.repeat_schedule)
        : task.repeat_schedule;

    db.prepare(
      'UPDATE tasks SET name = ?, description = ?, point_value = ?, category = ?, repeat_schedule = ? WHERE id = ?'
    ).run(
      name !== undefined ? name : task.name,
      description !== undefined ? description : task.description,
      point_value !== undefined ? point_value : task.point_value,
      category !== undefined ? category : task.category,
      schedule,
      id
    );

    const updatedTask = db.prepare<Task>('SELECT * FROM tasks WHERE id = ?').get(id);

    res.json({ task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteTask = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const task = db
      .prepare<Task>('SELECT * FROM tasks WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const completeTask = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { child_id, notes } = req.body;

    if (!child_id) {
      res.status(400).json({ error: 'child_id is required' });
      return;
    }

    const task = db
      .prepare<Task>('SELECT * FROM tasks WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(child_id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    // Check if already completed today for repeating tasks
    if (task.repeat_schedule !== 'none') {
      const today = new Date().toISOString().split('T')[0];
      const existingCompletion = db
        .prepare<{ id: number }>(
          `SELECT id FROM task_completions
           WHERE task_id = ? AND child_id = ? AND date(completed_at) = date(?)`
        )
        .get(id, child_id, today);

      if (existingCompletion) {
        res.status(400).json({ error: 'Task already completed for today' });
        return;
      }
    }

    const transaction = db.transaction(() => {
      db.prepare(
        'INSERT INTO task_completions (task_id, child_id, points_earned, notes) VALUES (?, ?, ?, ?)'
      ).run(id, child_id, task.point_value, notes || null);

      db.prepare(
        'UPDATE children SET current_points = current_points + ? WHERE id = ?'
      ).run(task.point_value, child_id);
    });

    transaction();

    const updatedChild = db
      .prepare<Child>('SELECT * FROM children WHERE id = ?')
      .get(child_id);

    res.json({
      message: 'Task completed successfully',
      child: updatedChild,
      points_earned: task.point_value,
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const uncompleteTask = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { child_id } = req.body;

    if (!child_id) {
      res.status(400).json({ error: 'child_id is required' });
      return;
    }

    // Verify task and child belong to this family
    const task = db
      .prepare<Task>('SELECT * FROM tasks WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(child_id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    // Find the most recent completion for this task/child today
    const today = new Date().toISOString().split('T')[0];
    const completion = db
      .prepare<{ id: number; points_earned: number }>(
        `SELECT id, points_earned FROM task_completions
         WHERE task_id = ? AND child_id = ? AND date(completed_at) = date(?)
         ORDER BY completed_at DESC LIMIT 1`
      )
      .get(id, child_id, today);

    if (!completion) {
      res.status(404).json({ error: 'No completion found for today' });
      return;
    }

    const transaction = db.transaction(() => {
      // Delete the completion
      db.prepare('DELETE FROM task_completions WHERE id = ?').run(completion.id);
      // Deduct points from child
      db.prepare('UPDATE children SET current_points = current_points - ? WHERE id = ?')
        .run(completion.points_earned, child_id);
    });

    transaction();

    const updatedChild = db
      .prepare<Child>('SELECT * FROM children WHERE id = ?')
      .get(child_id);

    res.json({ message: 'Task completion removed', child: updatedChild });
  } catch (error) {
    console.error('Uncomplete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCompletionsForDate = (req: Request, res: Response): void => {
  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
      return;
    }

    // Get all completions for the specified date for this family's tasks
    const completions = db
      .prepare<{ task_id: number; child_id: number; id: number; points_earned: number; completed_at: string }>(
        `SELECT tc.id, tc.task_id, tc.child_id, tc.points_earned, tc.completed_at
         FROM task_completions tc
         JOIN tasks t ON tc.task_id = t.id
         WHERE t.family_id = ? AND date(tc.completed_at) = date(?)`
      )
      .all(req.familyId, date);

    res.json({ completions });
  } catch (error) {
    console.error('Get completions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const completeTaskForDate = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { child_id, date } = req.body;

    if (!child_id) {
      res.status(400).json({ error: 'child_id is required' });
      return;
    }

    if (!date) {
      res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
      return;
    }

    const task = db
      .prepare<Task>('SELECT * FROM tasks WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(child_id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    // Check if already completed today for repeating tasks
    if (task.repeat_schedule !== 'none') {
      const existingCompletion = db
        .prepare<{ id: number }>(
          `SELECT id FROM task_completions
           WHERE task_id = ? AND child_id = ? AND date(completed_at) = date(?)`
        )
        .get(id, child_id, date);

      if (existingCompletion) {
        res.status(400).json({ error: 'Task already completed for this day' });
        return;
      }
    }

    const transaction = db.transaction(() => {
      // Insert completion with specified date (at noon to avoid timezone issues)
      db.prepare(
        `INSERT INTO task_completions (task_id, child_id, points_earned, completed_at)
         VALUES (?, ?, ?, datetime(?, '+12 hours'))`
      ).run(id, child_id, task.point_value, date);

      db.prepare(
        'UPDATE children SET current_points = current_points + ? WHERE id = ?'
      ).run(task.point_value, child_id);
    });

    transaction();

    const updatedChild = db
      .prepare<Child>('SELECT * FROM children WHERE id = ?')
      .get(child_id);

    res.json({
      message: 'Task completed successfully',
      child: updatedChild,
      points_earned: task.point_value,
    });
  } catch (error) {
    console.error('Complete task for date error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const uncompleteTaskForDate = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { child_id, date } = req.body;

    if (!child_id) {
      res.status(400).json({ error: 'child_id is required' });
      return;
    }

    if (!date) {
      res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
      return;
    }

    const task = db
      .prepare<Task>('SELECT * FROM tasks WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(child_id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    // Find the completion for this task/child on specified date
    const completion = db
      .prepare<{ id: number; points_earned: number }>(
        `SELECT id, points_earned FROM task_completions
         WHERE task_id = ? AND child_id = ? AND date(completed_at) = date(?)
         ORDER BY completed_at DESC LIMIT 1`
      )
      .get(id, child_id, date);

    if (!completion) {
      res.status(404).json({ error: 'No completion found for this date' });
      return;
    }

    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM task_completions WHERE id = ?').run(completion.id);
      db.prepare('UPDATE children SET current_points = current_points - ? WHERE id = ?')
        .run(completion.points_earned, child_id);
    });

    transaction();

    const updatedChild = db
      .prepare<Child>('SELECT * FROM children WHERE id = ?')
      .get(child_id);

    res.json({ message: 'Task completion removed', child: updatedChild });
  } catch (error) {
    console.error('Uncomplete task for date error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const reorderTasks = (req: Request, res: Response): void => {
  try {
    const { task_ids } = req.body;

    if (!Array.isArray(task_ids) || task_ids.length === 0) {
      res.status(400).json({ error: 'task_ids array is required' });
      return;
    }

    // Verify all tasks belong to this family
    const placeholders = task_ids.map(() => '?').join(',');
    const tasks = db
      .prepare<Task>(
        `SELECT id FROM tasks WHERE id IN (${placeholders}) AND family_id = ?`
      )
      .all(...task_ids, req.familyId);

    if (tasks.length !== task_ids.length) {
      res.status(400).json({ error: 'Invalid task IDs or tasks not in your family' });
      return;
    }

    // Update sort_order for each task in a transaction
    const transaction = db.transaction(() => {
      task_ids.forEach((taskId: number, index: number) => {
        db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ? AND family_id = ?').run(
          index,
          taskId,
          req.familyId
        );
      });
    });

    transaction();

    // Return updated tasks in new order
    const updatedTasks = db
      .prepare<Task>(
        'SELECT * FROM tasks WHERE family_id = ? ORDER BY sort_order ASC'
      )
      .all(req.familyId);

    res.json({ tasks: updatedTasks });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
