import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../db/wrapper.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 5;

const generateKioskCode = (): string => {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
};

const cleanupExpiredCodes = (): void => {
  db.prepare('DELETE FROM kiosk_codes WHERE expires_at < datetime("now")').run();
};

export const generateCode = (_req: Request, res: Response): void => {
  try {
    cleanupExpiredCodes();

    const sessionToken = crypto.randomUUID();
    let code = generateKioskCode();

    // Retry if code collision (unlikely)
    for (let i = 0; i < 5; i++) {
      const existing = db.prepare<{ id: number }>(
        'SELECT id FROM kiosk_codes WHERE code = ?'
      ).get(code);
      if (!existing) break;
      code = generateKioskCode();
    }

    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

    db.prepare(
      'INSERT INTO kiosk_codes (code, session_token, expires_at) VALUES (?, ?, ?)'
    ).run(code, sessionToken, expiresAt);

    res.json({ code, session_token: sessionToken, expires_at: expiresAt });
  } catch (error) {
    console.error('Generate kiosk code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const checkStatus = (req: Request, res: Response): void => {
  try {
    const { session_token } = req.query;

    if (!session_token || typeof session_token !== 'string') {
      res.status(400).json({ error: 'session_token is required' });
      return;
    }

    const session = db.prepare<{ id: number; family_id: number; family_name: string }>(
      `SELECT ks.id, ks.family_id, f.name as family_name
       FROM kiosk_sessions ks
       JOIN families f ON ks.family_id = f.id
       WHERE ks.session_token = ?`
    ).get(session_token);

    if (session) {
      // Paired - issue kiosk JWT and set cookie
      const token = jwt.sign(
        { sessionToken: session_token, type: 'kiosk' },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      );

      res.cookie('kiosk_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({ paired: true, family_name: session.family_name });
    } else {
      res.json({ paired: false });
    }
  } catch (error) {
    console.error('Check kiosk status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const pairKiosk = (req: Request, res: Response): void => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Pairing code is required' });
      return;
    }

    cleanupExpiredCodes();

    const kioskCode = db.prepare<{ id: number; session_token: string; expires_at: string }>(
      'SELECT id, session_token, expires_at FROM kiosk_codes WHERE code = ? AND expires_at > datetime("now")'
    ).get(code.toUpperCase());

    if (!kioskCode) {
      res.status(400).json({ error: 'Invalid or expired pairing code' });
      return;
    }

    // Create kiosk session
    db.prepare(
      'INSERT INTO kiosk_sessions (family_id, session_token, paired_by) VALUES (?, ?, ?)'
    ).run(req.familyId, kioskCode.session_token, req.userId);

    // Delete the used code
    db.prepare('DELETE FROM kiosk_codes WHERE id = ?').run(kioskCode.id);

    res.json({ message: 'Kiosk paired successfully' });
  } catch (error) {
    console.error('Pair kiosk error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getDashboardData = (req: Request, res: Response): void => {
  try {
    const familyId = req.familyId;
    const today = new Date().toISOString().split('T')[0];

    const family = db.prepare<{ name: string; profile_image: string | null }>(
      'SELECT name, profile_image FROM families WHERE id = ?'
    ).get(familyId);

    const children = db.prepare<Record<string, unknown>>(
      'SELECT * FROM children WHERE family_id = ? ORDER BY name'
    ).all(familyId);

    const tasks = db.prepare<Record<string, unknown>>(
      'SELECT * FROM tasks WHERE family_id = ? ORDER BY sort_order ASC'
    ).all(familyId);

    const completions = db.prepare<Record<string, unknown>>(
      `SELECT tc.task_id, tc.child_id, tc.points_earned
       FROM task_completions tc
       JOIN tasks t ON tc.task_id = t.id
       WHERE t.family_id = ? AND date(tc.completed_at) = date(?)`
    ).all(familyId, today);

    const rewards = db.prepare<Record<string, unknown>>(
      'SELECT * FROM rewards WHERE family_id = ? ORDER BY name'
    ).all(familyId);

    res.json({ family, children, tasks, completions, rewards });
  } catch (error) {
    console.error('Get kiosk dashboard data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getKioskSessions = (req: Request, res: Response): void => {
  try {
    const sessions = db.prepare<{ id: number; session_token: string; created_at: string; paired_by_name: string }>(
      `SELECT ks.id, ks.session_token, ks.created_at, u.name as paired_by_name
       FROM kiosk_sessions ks
       JOIN users u ON ks.paired_by = u.id
       WHERE ks.family_id = ?
       ORDER BY ks.created_at DESC`
    ).all(req.familyId);

    res.json({ sessions });
  } catch (error) {
    console.error('Get kiosk sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const unpairKiosk = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const session = db.prepare<{ id: number }>(
      'SELECT id FROM kiosk_sessions WHERE id = ? AND family_id = ?'
    ).get(id, req.familyId);

    if (!session) {
      res.status(404).json({ error: 'Kiosk session not found' });
      return;
    }

    db.prepare('DELETE FROM kiosk_sessions WHERE id = ?').run(id);

    res.json({ message: 'Kiosk unpaired successfully' });
  } catch (error) {
    console.error('Unpair kiosk error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
