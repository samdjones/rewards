import type { Reward } from '../entities/reward.js';
import type { Child } from '../entities/child.js';

// Request types
export interface CreateRewardRequest {
  name: string;
  description?: string;
  point_cost: number;
  category?: string;
}

export interface UpdateRewardRequest {
  name?: string;
  description?: string;
  point_cost?: number;
  category?: string;
}

export interface RedeemRewardRequest {
  child_id: number;
  notes?: string;
}

// Response types
export interface RewardResponse {
  reward: Reward;
}

export interface RewardsResponse {
  rewards: Reward[];
}

export interface RedeemRewardResponse {
  message: string;
  child: Child;
  points_spent: number;
}

export interface InsufficientPointsError {
  error: string;
  required: number;
  available: number;
}
