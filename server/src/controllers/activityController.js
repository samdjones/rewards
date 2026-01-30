import db from '../db/wrapper.js';

export const getChildActivity = (req, res) => {
  try {
    const { id } = req.params;

    const child = db.prepare('SELECT * FROM children WHERE id = ? AND user_id = ?').get(id, req.userId);

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const completions = db.prepare(`
      SELECT
        tc.id,
        tc.points_earned,
        tc.completed_at,
        tc.notes,
        t.name as task_name,
        t.category as task_category,
        'completion' as type
      FROM task_completions tc
      JOIN tasks t ON tc.task_id = t.id
      WHERE tc.child_id = ?
      ORDER BY tc.completed_at DESC
      LIMIT 50
    `).all(id);

    const redemptions = db.prepare(`
      SELECT
        r.id,
        r.points_spent,
        r.redeemed_at,
        r.notes,
        rw.name as reward_name,
        rw.category as reward_category,
        'redemption' as type
      FROM redemptions r
      JOIN rewards rw ON r.reward_id = rw.id
      WHERE r.child_id = ?
      ORDER BY r.redeemed_at DESC
      LIMIT 50
    `).all(id);

    const adjustments = db.prepare(`
      SELECT
        id,
        amount,
        reason,
        adjusted_at,
        'adjustment' as type
      FROM point_adjustments
      WHERE child_id = ?
      ORDER BY adjusted_at DESC
      LIMIT 50
    `).all(id);

    const activity = [...completions, ...redemptions, ...adjustments].sort((a, b) => {
      const dateA = new Date(a.completed_at || a.redeemed_at || a.adjusted_at);
      const dateB = new Date(b.completed_at || b.redeemed_at || b.adjusted_at);
      return dateB - dateA;
    }).slice(0, 50);

    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getChildStats = (req, res) => {
  try {
    const { id } = req.params;

    const child = db.prepare('SELECT * FROM children WHERE id = ? AND user_id = ?').get(id, req.userId);

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const totalTasksCompleted = db.prepare(`
      SELECT COUNT(*) as count
      FROM task_completions
      WHERE child_id = ?
    `).get(id).count;

    const totalPointsEarned = db.prepare(`
      SELECT COALESCE(SUM(points_earned), 0) as total
      FROM task_completions
      WHERE child_id = ?
    `).get(id).total;

    const totalRewardsRedeemed = db.prepare(`
      SELECT COUNT(*) as count
      FROM redemptions
      WHERE child_id = ?
    `).get(id).count;

    const totalPointsSpent = db.prepare(`
      SELECT COALESCE(SUM(points_spent), 0) as total
      FROM redemptions
      WHERE child_id = ?
    `).get(id).total;

    const pointsOverTime = db.prepare(`
      SELECT
        DATE(completed_at) as date,
        SUM(points_earned) as points
      FROM task_completions
      WHERE child_id = ?
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
      LIMIT 30
    `).all(id);

    const tasksByCategory = db.prepare(`
      SELECT
        t.category,
        COUNT(*) as count
      FROM task_completions tc
      JOIN tasks t ON tc.task_id = t.id
      WHERE tc.child_id = ?
      GROUP BY t.category
    `).all(id);

    const badges = [];
    if (totalPointsEarned >= 100) badges.push({ name: 'First 100 Points', icon: '🌟' });
    if (totalPointsEarned >= 500) badges.push({ name: '500 Point Milestone', icon: '⭐' });
    if (totalPointsEarned >= 1000) badges.push({ name: '1000 Point Achiever', icon: '🏆' });
    if (totalTasksCompleted >= 10) badges.push({ name: '10 Tasks Complete', icon: '✅' });
    if (totalTasksCompleted >= 50) badges.push({ name: '50 Tasks Complete', icon: '💪' });
    if (totalTasksCompleted >= 100) badges.push({ name: '100 Tasks Complete', icon: '🎯' });
    if (totalRewardsRedeemed >= 5) badges.push({ name: '5 Rewards Redeemed', icon: '🎁' });
    if (totalRewardsRedeemed >= 10) badges.push({ name: '10 Rewards Redeemed', icon: '🎉' });

    res.json({
      stats: {
        totalTasksCompleted,
        totalPointsEarned,
        totalRewardsRedeemed,
        totalPointsSpent,
        currentPoints: child.current_points
      },
      pointsOverTime,
      tasksByCategory,
      badges
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
