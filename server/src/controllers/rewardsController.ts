import type { Request, Response } from 'express';
import type { Reward, Child } from '@rewards/shared';
import db from '../db/wrapper.js';

export const getRewards = (req: Request, res: Response): void => {
  try {
    const rewards = db
      .prepare<Reward>(
        'SELECT * FROM rewards WHERE family_id = ? ORDER BY created_at DESC'
      )
      .all(req.familyId);
    res.json({ rewards });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getReward = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const reward = db
      .prepare<Reward>('SELECT * FROM rewards WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!reward) {
      res.status(404).json({ error: 'Reward not found' });
      return;
    }

    res.json({ reward });
  } catch (error) {
    console.error('Get reward error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createReward = (req: Request, res: Response): void => {
  try {
    const { name, description, point_cost, category } = req.body;

    if (!name || point_cost === undefined) {
      res.status(400).json({ error: 'Name and point_cost are required' });
      return;
    }

    if (point_cost <= 0) {
      res.status(400).json({ error: 'Point cost must be positive' });
      return;
    }

    const result = db
      .prepare(
        'INSERT INTO rewards (family_id, created_by, name, description, point_cost, category) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(
        req.familyId,
        req.userId,
        name,
        description || null,
        point_cost,
        category || null
      );

    const reward = db
      .prepare<Reward>('SELECT * FROM rewards WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json({ reward });
  } catch (error) {
    console.error('Create reward error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateReward = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { name, description, point_cost, category } = req.body;

    const reward = db
      .prepare<Reward>('SELECT * FROM rewards WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!reward) {
      res.status(404).json({ error: 'Reward not found' });
      return;
    }

    if (point_cost !== undefined && point_cost <= 0) {
      res.status(400).json({ error: 'Point cost must be positive' });
      return;
    }

    db.prepare(
      'UPDATE rewards SET name = ?, description = ?, point_cost = ?, category = ? WHERE id = ?'
    ).run(
      name !== undefined ? name : reward.name,
      description !== undefined ? description : reward.description,
      point_cost !== undefined ? point_cost : reward.point_cost,
      category !== undefined ? category : reward.category,
      id
    );

    const updatedReward = db
      .prepare<Reward>('SELECT * FROM rewards WHERE id = ?')
      .get(id);

    res.json({ reward: updatedReward });
  } catch (error) {
    console.error('Update reward error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteReward = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const reward = db
      .prepare<Reward>('SELECT * FROM rewards WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!reward) {
      res.status(404).json({ error: 'Reward not found' });
      return;
    }

    db.prepare('DELETE FROM rewards WHERE id = ?').run(id);

    res.json({ message: 'Reward deleted successfully' });
  } catch (error) {
    console.error('Delete reward error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const redeemReward = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { child_id, notes } = req.body;

    if (!child_id) {
      res.status(400).json({ error: 'child_id is required' });
      return;
    }

    const reward = db
      .prepare<Reward>('SELECT * FROM rewards WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!reward) {
      res.status(404).json({ error: 'Reward not found' });
      return;
    }

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(child_id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    if (child.current_points < reward.point_cost) {
      res.status(400).json({
        error: 'Insufficient points',
        required: reward.point_cost,
        available: child.current_points,
      });
      return;
    }

    const transaction = db.transaction(() => {
      db.prepare(
        'INSERT INTO redemptions (reward_id, child_id, points_spent, notes) VALUES (?, ?, ?, ?)'
      ).run(id, child_id, reward.point_cost, notes || null);

      db.prepare(
        'UPDATE children SET current_points = current_points - ? WHERE id = ?'
      ).run(reward.point_cost, child_id);
    });

    transaction();

    const updatedChild = db
      .prepare<Child>('SELECT * FROM children WHERE id = ?')
      .get(child_id);

    res.json({
      message: 'Reward redeemed successfully',
      child: updatedChild,
      points_spent: reward.point_cost,
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
