import type { Family } from '../entities/family.js';
import type { FamilyRole } from '../enums.js';

// Request types
export interface CreateFamilyRequest {
  name: string;
}

export interface JoinFamilyRequest {
  invite_code: string;
}

export interface UpdateFamilyRequest {
  name: string;
}

export interface UpdateMemberRoleRequest {
  role: FamilyRole;
}

// Response types
export interface FamilyWithInviteCode extends Family {}

export interface FamilyInfo {
  id: number;
  name: string;
  created_at: string;
  member_count: number;
}

export interface CreateFamilyResponse {
  family: FamilyWithInviteCode;
  role: FamilyRole;
}

export interface GetCurrentFamilyResponse {
  family: FamilyInfo | null;
  role: FamilyRole | null;
}

export interface JoinFamilyResponse {
  family: Omit<Family, 'invite_code'>;
  role: FamilyRole;
}

export interface FamilyMemberInfo {
  id: number;
  name: string;
  email: string;
  role: FamilyRole;
  joined_at: string;
}

export interface GetMembersResponse {
  members: FamilyMemberInfo[];
}

export interface UpdateMemberRoleResponse {
  message: string;
  userId: number;
  role: FamilyRole;
}

export interface InviteCodeResponse {
  invite_code: string;
}

export interface FamilyResponse {
  family: Family;
}
