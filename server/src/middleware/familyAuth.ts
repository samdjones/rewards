import type { Request, Response, NextFunction } from 'express';
import type { FamilyRole } from '@rewards/shared';
import db from '../db/wrapper.js';

interface FamilyMembershipRow {
  family_id: number;
  role: FamilyRole;
  family_name: string;
}

// Middleware to require user belongs to a family
export const requireFamily = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.familyId) {
    res.status(403).json({ error: 'You must belong to a family to perform this action' });
    return;
  }
  next();
};

// Middleware to require user is a family admin
export const requireFamilyAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.familyId) {
    res.status(403).json({ error: 'You must belong to a family to perform this action' });
    return;
  }
  if (req.familyRole !== 'admin') {
    res.status(403).json({ error: 'Only family admins can perform this action' });
    return;
  }
  next();
};

// Attach family info to the request (call after authenticateToken)
export const attachFamilyInfo = (req: Request, res: Response, next: NextFunction): void => {
  const membership = db.prepare<FamilyMembershipRow>(
    'SELECT fm.family_id, fm.role, f.name as family_name FROM family_members fm JOIN families f ON fm.family_id = f.id WHERE fm.user_id = ?'
  ).get(req.userId);

  if (membership) {
    req.familyId = membership.family_id;
    req.familyRole = membership.role;
    req.familyName = membership.family_name;
  } else {
    req.familyId = null;
    req.familyRole = null;
    req.familyName = null;
  }

  next();
};
