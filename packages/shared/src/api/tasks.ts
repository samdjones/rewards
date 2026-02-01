import type { Task } from '../entities/task.js';
import type { Child } from '../entities/child.js';
import type { RepeatSchedule } from '../enums.js';

// Request types
export interface CreateTaskRequest {
  name: string;
  description?: string;
  point_value: number;
  category?: string;
  repeat_schedule?: RepeatSchedule;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  point_value?: number;
  category?: string;
  repeat_schedule?: RepeatSchedule;
}

export interface CompleteTaskRequest {
  child_id: number;
  notes?: string;
}

export interface ReorderTasksRequest {
  task_ids: number[];
}

// Response types
export interface TaskResponse {
  task: Task;
}

export interface TasksResponse {
  tasks: Task[];
}

export interface CompleteTaskResponse {
  message: string;
  child: Child;
  points_earned: number;
}
