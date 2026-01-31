import type { Child } from '../entities/child.js';

// Request types
export interface CreateChildRequest {
  name: string;
  age?: number;
  avatar_color?: string;
}

export interface UpdateChildRequest {
  name?: string;
  age?: number;
  avatar_color?: string;
}

export interface AdjustPointsRequest {
  amount: number;
  reason?: string;
}

// Response types
export interface ChildResponse {
  child: Child;
}

export interface ChildrenResponse {
  children: Child[];
}
