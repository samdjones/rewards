import type { Request, Response } from 'express';
import type { Task, Child } from '@rewards/shared';
import db from '../db/wrapper.js';

export const getTasks = (req: Request, res: Response): void => {
  try {
    const tasks = db
      .prepare<Task>(
        'SELECT * FROM tasks WHERE family_id = ? ORDER BY created_at DESC'
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
    const { name, description, point_value, category, is_recurring } = req.body;

    if (!name || point_value === undefined) {
      res.status(400).json({ error: 'Name and point_value are required' });
      return;
    }

    if (point_value < 0) {
      res.status(400).json({ error: 'Point value must be non-negative' });
      return;
    }

    const result = db
      .prepare(
        'INSERT INTO tasks (family_id, created_by, name, description, point_value, category, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        req.familyId,
        req.userId,
        name,
        description || null,
        point_value,
        category || null,
        is_recurring ? 1 : 0
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
    const { name, description, point_value, category, is_recurring } = req.body;

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

    db.prepare(
      'UPDATE tasks SET name = ?, description = ?, point_value = ?, category = ?, is_recurring = ? WHERE id = ?'
    ).run(
      name !== undefined ? name : task.name,
      description !== undefined ? description : task.description,
      point_value !== undefined ? point_value : task.point_value,
      category !== undefined ? category : task.category,
      is_recurring !== undefined ? (is_recurring ? 1 : 0) : task.is_recurring,
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
