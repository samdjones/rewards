export interface Reward {
  id: number;
  family_id: number;
  created_by: number;
  name: string;
  description: string | null;
  point_cost: number;
  category: string | null;
  created_at: string;
}

export interface Redemption {
  id: number;
  reward_id: number;
  child_id: number;
  points_spent: number;
  redeemed_at: string;
  notes: string | null;
}
