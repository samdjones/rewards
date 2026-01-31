import type { Task } from '../entities/task.js';
import type { Child } from '../entities/child.js';

// Request types
export interface CreateTaskRequest {
  name: string;
  description?: string;
  point_value: number;
  category?: string;
  is_recurring?: boolean;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  point_value?: number;
  category?: string;
  is_recurring?: boolean;
}

export interface CompleteTaskRequest {
  child_id: number;
  notes?: string;
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
