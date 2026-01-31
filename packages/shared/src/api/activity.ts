// Activity types
export interface CompletionActivity {
  id: number;
  points_earned: number;
  completed_at: string;
  notes: string | null;
  task_name: string;
  task_category: string | null;
  type: 'completion';
}

export interface RedemptionActivity {
  id: number;
  points_spent: number;
  redeemed_at: string;
  notes: string | null;
  reward_name: string;
  reward_category: string | null;
  type: 'redemption';
}

export interface AdjustmentActivity {
  id: number;
  amount: number;
  reason: string | null;
  adjusted_at: string;
  type: 'adjustment';
}

export type Activity = CompletionActivity | RedemptionActivity | AdjustmentActivity;

// Response types
export interface ActivityResponse {
  activity: Activity[];
}

export interface Badge {
  name: string;
  icon: string;
}

export interface ChildStats {
  totalTasksCompleted: number;
  totalPointsEarned: number;
  totalRewardsRedeemed: number;
  totalPointsSpent: number;
  currentPoints: number;
}

export interface PointsOverTime {
  date: string;
  points: number;
}

export interface TasksByCategory {
  category: string | null;
  count: number;
}

export interface StatsResponse {
  stats: ChildStats;
  pointsOverTime: PointsOverTime[];
  tasksByCategory: TasksByCategory[];
  badges: Badge[];
}
