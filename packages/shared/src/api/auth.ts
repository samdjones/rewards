import type { SafeUser } from '../entities/user.js';
import type { FamilyRole } from '../enums.js';

// Request types
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Response types
export interface UserFamily {
  id: number;
  name: string;
  role: FamilyRole;
}

export interface UserWithFamily extends SafeUser {
  family: UserFamily | null;
}

export interface AuthResponse {
  user: SafeUser;
}

export interface MeResponse {
  user: UserWithFamily;
}

export interface LogoutResponse {
  message: string;
}
