export interface Task {
  id: number;
  family_id: number;
  created_by: number;
  name: string;
  description: string | null;
  point_value: number;
  category: string | null;
  is_recurring: number; // SQLite boolean (0 or 1)
  created_at: string;
}

export interface TaskCompletion {
  id: number;
  task_id: number;
  child_id: number;
  points_earned: number;
  completed_at: string;
  notes: string | null;
}
