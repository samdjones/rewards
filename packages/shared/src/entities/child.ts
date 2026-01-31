export interface Child {
  id: number;
  family_id: number;
  created_by: number;
  name: string;
  age: number | null;
  avatar_color: string;
  current_points: number;
  created_at: string;
}

export interface PointAdjustment {
  id: number;
  child_id: number;
  amount: number;
  reason: string | null;
  adjusted_at: string;
}
