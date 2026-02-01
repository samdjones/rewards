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
    const { child_id, child_ids, notes } = req.body;

    // Support both single child_id and array of child_ids
    const childIdList: number[] = child_ids
      ? (Array.isArray(child_ids) ? child_ids : [child_ids])
      : (child_id ? [child_id] : []);

    if (childIdList.length === 0) {
      res.status(400).json({ error: 'At least one child_id is required' });
      return;
    }

    const reward = db
      .prepare<Reward>('SELECT * FROM rewards WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!reward) {
      res.status(404).json({ error: 'Reward not found' });
      return;
    }

    // Validate all children exist and have sufficient points
    const children: Child[] = [];
    for (const cid of childIdList) {
      const child = db
        .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
        .get(cid, req.familyId);

      if (!child) {
        res.status(404).json({ error: `Child with id ${cid} not found` });
        return;
      }

      if (child.current_points < reward.point_cost) {
        res.status(400).json({
          error: `${child.name} has insufficient points`,
          required: reward.point_cost,
          available: child.current_points,
        });
        return;
      }

      children.push(child);
    }

    const transaction = db.transaction(() => {
      for (const cid of childIdList) {
        db.prepare(
          'INSERT INTO redemptions (reward_id, child_id, points_spent, notes) VALUES (?, ?, ?, ?)'
        ).run(id, cid, reward.point_cost, notes || null);

        db.prepare(
          'UPDATE children SET current_points = current_points - ? WHERE id = ?'
        ).run(reward.point_cost, cid);
      }
    });

    transaction();

    // Return updated children
    const updatedChildren = childIdList.map(cid =>
      db.prepare<Child>('SELECT * FROM children WHERE id = ?').get(cid)
    );

    res.json({
      message: 'Reward redeemed successfully',
      children: updatedChildren,
      points_spent: reward.point_cost,
      total_points_spent: reward.point_cost * childIdList.length,
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
