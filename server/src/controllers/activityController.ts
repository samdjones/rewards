import type { Request, Response } from 'express';
import type { Child, ActivityType } from '@rewards/shared';
import db from '../db/wrapper.js';

interface CompletionRow {
  id: number;
  points_earned: number;
  completed_at: string;
  notes: string | null;
  task_name: string;
  task_category: string | null;
  type: ActivityType;
}

interface RedemptionRow {
  id: number;
  points_spent: number;
  redeemed_at: string;
  notes: string | null;
  reward_name: string;
  reward_category: string | null;
  type: ActivityType;
}

interface AdjustmentRow {
  id: number;
  amount: number;
  reason: string | null;
  adjusted_at: string;
  type: ActivityType;
}

interface CountRow {
  count: number;
}

interface TotalRow {
  total: number;
}

interface PointsOverTimeRow {
  date: string;
  points: number;
}

interface TasksByCategoryRow {
  category: string | null;
  count: number;
}

interface Badge {
  name: string;
  icon: string;
}

type ActivityRow = CompletionRow | RedemptionRow | AdjustmentRow;

export const getChildActivity = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    const completions = db
      .prepare<CompletionRow>(
        `
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
    `
      )
      .all(id);

    const redemptions = db
      .prepare<RedemptionRow>(
        `
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
    `
      )
      .all(id);

    const adjustments = db
      .prepare<AdjustmentRow>(
        `
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
    `
      )
      .all(id);

    const activity: ActivityRow[] = [...completions, ...redemptions, ...adjustments]
      .sort((a, b) => {
        const dateA = new Date(
          (a as CompletionRow).completed_at ||
            (a as RedemptionRow).redeemed_at ||
            (a as AdjustmentRow).adjusted_at
        );
        const dateB = new Date(
          (b as CompletionRow).completed_at ||
            (b as RedemptionRow).redeemed_at ||
            (b as AdjustmentRow).adjusted_at
        );
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 50);

    res.json({ activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getChildStats = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    const totalTasksCompleted = db
      .prepare<CountRow>(
        `
      SELECT COUNT(*) as count
      FROM task_completions
      WHERE child_id = ?
    `
      )
      .get(id)!.count;

    const totalPointsEarned = db
      .prepare<TotalRow>(
        `
      SELECT COALESCE(SUM(points_earned), 0) as total
      FROM task_completions
      WHERE child_id = ?
    `
      )
      .get(id)!.total;

    const totalRewardsRedeemed = db
      .prepare<CountRow>(
        `
      SELECT COUNT(*) as count
      FROM redemptions
      WHERE child_id = ?
    `
      )
      .get(id)!.count;

    const totalPointsSpent = db
      .prepare<TotalRow>(
        `
      SELECT COALESCE(SUM(points_spent), 0) as total
      FROM redemptions
      WHERE child_id = ?
    `
      )
      .get(id)!.total;

    const pointsOverTime = db
      .prepare<PointsOverTimeRow>(
        `
      SELECT
        DATE(completed_at) as date,
        SUM(points_earned) as points
      FROM task_completions
      WHERE child_id = ?
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
      LIMIT 30
    `
      )
      .all(id);

    const tasksByCategory = db
      .prepare<TasksByCategoryRow>(
        `
      SELECT
        t.category,
        COUNT(*) as count
      FROM task_completions tc
      JOIN tasks t ON tc.task_id = t.id
      WHERE tc.child_id = ?
      GROUP BY t.category
    `
      )
      .all(id);

    const badges: Badge[] = [];
    if (totalPointsEarned >= 100)
      badges.push({ name: 'First 100 Points', icon: '🌟' });
    if (totalPointsEarned >= 500)
      badges.push({ name: '500 Point Milestone', icon: '⭐' });
    if (totalPointsEarned >= 1000)
      badges.push({ name: '1000 Point Achiever', icon: '🏆' });
    if (totalTasksCompleted >= 10)
      badges.push({ name: '10 Tasks Complete', icon: '✅' });
    if (totalTasksCompleted >= 50)
      badges.push({ name: '50 Tasks Complete', icon: '💪' });
    if (totalTasksCompleted >= 100)
      badges.push({ name: '100 Tasks Complete', icon: '🎯' });
    if (totalRewardsRedeemed >= 5)
      badges.push({ name: '5 Rewards Redeemed', icon: '🎁' });
    if (totalRewardsRedeemed >= 10)
      badges.push({ name: '10 Rewards Redeemed', icon: '🎉' });

    res.json({
      stats: {
        totalTasksCompleted,
        totalPointsEarned,
        totalRewardsRedeemed,
        totalPointsSpent,
        currentPoints: child.current_points,
      },
      pointsOverTime,
      tasksByCategory,
      badges,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
