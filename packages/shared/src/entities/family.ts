import type { FamilyRole } from '../enums.js';

export interface Family {
  id: number;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface FamilyMember {
  id: number;
  family_id: number;
  user_id: number;
  role: FamilyRole;
  joined_at: string;
}
