import type { FamilyRole } from '@rewards/shared';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      familyId?: number | null;
      familyRole?: FamilyRole | null;
      familyName?: string | null;
    }
  }
}

export {};
