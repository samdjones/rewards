import db from '../db/wrapper.js';

export const getRewards = (req, res) => {
  try {
    const rewards = db.prepare('SELECT * FROM rewards WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
    res.json({ rewards });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getReward = (req, res) => {
  try {
    const { id } = req.params;
    const reward = db.prepare('SELECT * FROM rewards WHERE id = ? AND user_id = ?').get(id, req.userId);

    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    res.json({ reward });
  } catch (error) {
    console.error('Get reward error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createReward = (req, res) => {
  try {
    const { name, description, point_cost, category } = req.body;

    if (!name || point_cost === undefined) {
      return res.status(400).json({ error: 'Name and point_cost are required' });
    }

    if (point_cost <= 0) {
      return res.status(400).json({ error: 'Point cost must be positive' });
    }

    const result = db.prepare(
      'INSERT INTO rewards (user_id, name, description, point_cost, category) VALUES (?, ?, ?, ?, ?)'
    ).run(req.userId, name, description || null, point_cost, category || null);

    const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ reward });
  } catch (error) {
    console.error('Create reward error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateReward = (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, point_cost, category } = req.body;

    const reward = db.prepare('SELECT * FROM rewards WHERE id = ? AND user_id = ?').get(id, req.userId);

    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    if (point_cost !== undefined && point_cost <= 0) {
      return res.status(400).json({ error: 'Point cost must be positive' });
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

    const updatedReward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(id);

    res.json({ reward: updatedReward });
  } catch (error) {
    console.error('Update reward error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteReward = (req, res) => {
  try {
    const { id } = req.params;

    const reward = db.prepare('SELECT * FROM rewards WHERE id = ? AND user_id = ?').get(id, req.userId);

    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    db.prepare('DELETE FROM rewards WHERE id = ?').run(id);

    res.json({ message: 'Reward deleted successfully' });
  } catch (error) {
    console.error('Delete reward error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const redeemReward = (req, res) => {
  try {
    const { id } = req.params;
    const { child_id, notes } = req.body;

    if (!child_id) {
      return res.status(400).json({ error: 'child_id is required' });
    }

    const reward = db.prepare('SELECT * FROM rewards WHERE id = ? AND user_id = ?').get(id, req.userId);

    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    const child = db.prepare('SELECT * FROM children WHERE id = ? AND user_id = ?').get(child_id, req.userId);

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    if (child.current_points < reward.point_cost) {
      return res.status(400).json({
        error: 'Insufficient points',
        required: reward.point_cost,
        available: child.current_points
      });
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

    const updatedChild = db.prepare('SELECT * FROM children WHERE id = ?').get(child_id);

    res.json({
      message: 'Reward redeemed successfully',
      child: updatedChild,
      points_spent: reward.point_cost
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
