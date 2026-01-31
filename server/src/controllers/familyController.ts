import type { Request, Response } from 'express';
import type { Family, FamilyMember, FamilyRole } from '@rewards/shared';
import db from '../db/wrapper.js';
import { generateInviteCode, isValidInviteCodeFormat } from '../utils/inviteCode.js';

interface CountRow {
  count: number;
}

interface MemberRow {
  id: number;
  name: string;
  email: string;
  role: FamilyRole;
  joined_at: string;
}

interface InviteCodeRow {
  invite_code: string;
}

// Create a new family (user becomes admin)
export const createFamily = (req: Request, res: Response): void => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Family name is required' });
    return;
  }

  // Check if user already belongs to a family
  const existingMembership = db
    .prepare<FamilyMember>('SELECT * FROM family_members WHERE user_id = ?')
    .get(req.userId);

  if (existingMembership) {
    res.status(400).json({ error: 'You already belong to a family' });
    return;
  }

  // Generate unique invite code
  let inviteCode: string;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    const existing = db
      .prepare<{ id: number }>('SELECT id FROM families WHERE invite_code = ?')
      .get(inviteCode);
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    res.status(500).json({ error: 'Failed to generate invite code. Please try again.' });
    return;
  }

  // Create family
  const familyResult = db
    .prepare('INSERT INTO families (name, invite_code) VALUES (?, ?)')
    .run(name.trim(), inviteCode);

  const familyId = familyResult.lastInsertRowid;

  // Add user as admin
  db.prepare(
    'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)'
  ).run(familyId, req.userId, 'admin');

  const family = db.prepare<Family>('SELECT * FROM families WHERE id = ?').get(familyId);

  res.status(201).json({
    family: {
      id: family!.id,
      name: family!.name,
      invite_code: family!.invite_code,
      created_at: family!.created_at,
    },
    role: 'admin',
  });
};

// Get current user's family
export const getCurrentFamily = (req: Request, res: Response): void => {
  if (!req.familyId) {
    res.json({ family: null });
    return;
  }

  const family = db.prepare<Family>('SELECT * FROM families WHERE id = ?').get(req.familyId);

  if (!family) {
    res.json({ family: null });
    return;
  }

  // Get member count
  const memberCount = db
    .prepare<CountRow>('SELECT COUNT(*) as count FROM family_members WHERE family_id = ?')
    .get(req.familyId);

  res.json({
    family: {
      id: family.id,
      name: family.name,
      created_at: family.created_at,
      member_count: memberCount!.count,
    },
    role: req.familyRole,
  });
};

// Update family settings (admin only)
export const updateFamily = (req: Request, res: Response): void => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Family name is required' });
    return;
  }

  db.prepare('UPDATE families SET name = ? WHERE id = ?').run(name.trim(), req.familyId);

  const family = db.prepare<Family>('SELECT * FROM families WHERE id = ?').get(req.familyId);

  res.json({ family });
};

// Delete family (admin only)
export const deleteFamily = (req: Request, res: Response): void => {
  // Delete family (cascade will remove members, and related data via family_id)
  db.prepare('DELETE FROM families WHERE id = ?').run(req.familyId);

  res.json({ message: 'Family deleted successfully' });
};

// Join a family via invite code
export const joinFamily = (req: Request, res: Response): void => {
  const { invite_code } = req.body;

  if (!invite_code) {
    res.status(400).json({ error: 'Invite code is required' });
    return;
  }

  const code = (invite_code as string).toUpperCase().trim();

  if (!isValidInviteCodeFormat(code)) {
    res.status(400).json({ error: 'Invalid invite code format' });
    return;
  }

  // Check if user already belongs to a family
  const existingMembership = db
    .prepare<FamilyMember>('SELECT * FROM family_members WHERE user_id = ?')
    .get(req.userId);

  if (existingMembership) {
    res.status(400).json({ error: 'You already belong to a family' });
    return;
  }

  // Find family by invite code
  const family = db.prepare<Family>('SELECT * FROM families WHERE invite_code = ?').get(code);

  if (!family) {
    res.status(404).json({ error: 'Invalid invite code' });
    return;
  }

  // Add user as member
  db.prepare(
    'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)'
  ).run(family.id, req.userId, 'member');

  res.json({
    family: {
      id: family.id,
      name: family.name,
      created_at: family.created_at,
    },
    role: 'member',
  });
};

// Leave current family
export const leaveFamily = (req: Request, res: Response): void => {
  if (!req.familyId) {
    res.status(400).json({ error: 'You do not belong to a family' });
    return;
  }

  // Check if user is the last admin
  if (req.familyRole === 'admin') {
    const adminCount = db
      .prepare<CountRow>(
        "SELECT COUNT(*) as count FROM family_members WHERE family_id = ? AND role = 'admin'"
      )
      .get(req.familyId);

    if (adminCount!.count <= 1) {
      // Check if there are other members
      const memberCount = db
        .prepare<CountRow>('SELECT COUNT(*) as count FROM family_members WHERE family_id = ?')
        .get(req.familyId);

      if (memberCount!.count > 1) {
        res.status(400).json({
          error:
            'You are the last admin. Promote another member to admin before leaving, or delete the family.',
        });
        return;
      }
      // If user is the only member, delete the family
      db.prepare('DELETE FROM families WHERE id = ?').run(req.familyId);
      res.json({ message: 'You left and the family was deleted (no other members)' });
      return;
    }
  }

  // Remove user from family
  db.prepare('DELETE FROM family_members WHERE user_id = ?').run(req.userId);

  res.json({ message: 'You have left the family' });
};

// Get family members
export const getMembers = (req: Request, res: Response): void => {
  const members = db
    .prepare<MemberRow>(
      `
    SELECT u.id, u.name, u.email, fm.role, fm.joined_at
    FROM family_members fm
    JOIN users u ON fm.user_id = u.id
    WHERE fm.family_id = ?
    ORDER BY fm.joined_at ASC
  `
    )
    .all(req.familyId);

  res.json({ members });
};

// Update member role (admin only)
export const updateMemberRole = (req: Request, res: Response): void => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!role || !['admin', 'member'].includes(role)) {
    res.status(400).json({ error: 'Role must be "admin" or "member"' });
    return;
  }

  // Check if target user is in the same family
  const membership = db
    .prepare<FamilyMember>(
      'SELECT * FROM family_members WHERE user_id = ? AND family_id = ?'
    )
    .get(userId, req.familyId);

  if (!membership) {
    res.status(404).json({ error: 'Member not found in your family' });
    return;
  }

  // Prevent demoting self if last admin
  if (Number(userId) === req.userId && role === 'member') {
    const adminCount = db
      .prepare<CountRow>(
        "SELECT COUNT(*) as count FROM family_members WHERE family_id = ? AND role = 'admin'"
      )
      .get(req.familyId);

    if (adminCount!.count <= 1) {
      res.status(400).json({ error: 'Cannot demote yourself. You are the only admin.' });
      return;
    }
  }

  db.prepare('UPDATE family_members SET role = ? WHERE user_id = ? AND family_id = ?').run(
    role,
    userId,
    req.familyId
  );

  res.json({ message: 'Member role updated', userId: parseInt(userId), role });
};

// Remove member from family (admin only)
export const removeMember = (req: Request, res: Response): void => {
  const { userId } = req.params;

  // Cannot remove yourself
  if (Number(userId) === req.userId) {
    res.status(400).json({ error: 'Cannot remove yourself. Use leave family instead.' });
    return;
  }

  // Check if target user is in the same family
  const membership = db
    .prepare<FamilyMember>(
      'SELECT * FROM family_members WHERE user_id = ? AND family_id = ?'
    )
    .get(userId, req.familyId);

  if (!membership) {
    res.status(404).json({ error: 'Member not found in your family' });
    return;
  }

  db.prepare('DELETE FROM family_members WHERE user_id = ? AND family_id = ?').run(
    userId,
    req.familyId
  );

  res.json({ message: 'Member removed from family' });
};

// Get invite code (admin only)
export const getInviteCode = (req: Request, res: Response): void => {
  const family = db
    .prepare<InviteCodeRow>('SELECT invite_code FROM families WHERE id = ?')
    .get(req.familyId);

  if (!family) {
    res.status(404).json({ error: 'Family not found' });
    return;
  }

  res.json({ invite_code: family.invite_code });
};

// Regenerate invite code (admin only)
export const regenerateInviteCode = (req: Request, res: Response): void => {
  let inviteCode: string;
  let attempts = 0;
  do {
    inviteCode = generateInviteCode();
    const existing = db
      .prepare<{ id: number }>('SELECT id FROM families WHERE invite_code = ?')
      .get(inviteCode);
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    res.status(500).json({ error: 'Failed to generate invite code. Please try again.' });
    return;
  }

  db.prepare('UPDATE families SET invite_code = ? WHERE id = ?').run(inviteCode, req.familyId);

  res.json({ invite_code: inviteCode });
};
