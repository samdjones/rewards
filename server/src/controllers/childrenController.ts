import type { Request, Response } from 'express';
import type { Child } from '@rewards/shared';
import db from '../db/wrapper.js';

export const getChildren = (req: Request, res: Response): void => {
  try {
    const children = db
      .prepare<Child>(
        'SELECT * FROM children WHERE family_id = ? ORDER BY created_at DESC'
      )
      .all(req.familyId);
    res.json({ children });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getChild = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    res.json({ child });
  } catch (error) {
    console.error('Get child error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createChild = (req: Request, res: Response): void => {
  try {
    const { name, age, avatar_color } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const result = db
      .prepare(
        'INSERT INTO children (family_id, created_by, name, age, avatar_color) VALUES (?, ?, ?, ?, ?)'
      )
      .run(
        req.familyId,
        req.userId,
        name,
        age || null,
        avatar_color || '#3B82F6'
      );

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({ child });
  } catch (error) {
    console.error('Create child error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateChild = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { name, age, avatar_color } = req.body;

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    db.prepare(
      'UPDATE children SET name = ?, age = ?, avatar_color = ? WHERE id = ?'
    ).run(
      name || child.name,
      age !== undefined ? age : child.age,
      avatar_color || child.avatar_color,
      id
    );

    const updatedChild = db
      .prepare<Child>('SELECT * FROM children WHERE id = ?')
      .get(id);

    res.json({ child: updatedChild });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteChild = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    db.prepare('DELETE FROM children WHERE id = ?').run(id);

    res.json({ message: 'Child deleted successfully' });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const adjustPoints = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    if (amount === undefined || amount === 0) {
      res
        .status(400)
        .json({ error: 'Amount is required and must be non-zero' });
      return;
    }

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    const transaction = db.transaction(() => {
      db.prepare(
        'INSERT INTO point_adjustments (child_id, amount, reason) VALUES (?, ?, ?)'
      ).run(id, amount, reason || null);

      db.prepare(
        'UPDATE children SET current_points = current_points + ? WHERE id = ?'
      ).run(amount, id);
    });

    transaction();

    const updatedChild = db
      .prepare<Child>('SELECT * FROM children WHERE id = ?')
      .get(id);

    res.json({ child: updatedChild });
  } catch (error) {
    console.error('Adjust points error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
