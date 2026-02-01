import type { RepeatSchedule } from '../enums.js';

export interface Task {
  id: number;
  family_id: number;
  created_by: number;
  name: string;
  description: string | null;
  point_value: number;
  category: string | null;
  repeat_schedule: RepeatSchedule;
  sort_order: number;
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
