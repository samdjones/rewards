import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import db from '../db/wrapper.js';

interface KioskJwtPayload {
  sessionToken: string;
  type: 'kiosk';
}

interface KioskSessionRow {
  id: number;
  family_id: number;
  session_token: string;
}

export const authenticateKiosk = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.kiosk_token;

  if (!token) {
    res.status(401).json({ error: 'Kiosk authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as KioskJwtPayload;

    if (decoded.type !== 'kiosk') {
      res.status(403).json({ error: 'Invalid kiosk token' });
      return;
    }

    const session = db.prepare<KioskSessionRow>(
      'SELECT id, family_id, session_token FROM kiosk_sessions WHERE session_token = ?'
    ).get(decoded.sessionToken);

    if (!session) {
      res.status(403).json({ error: 'Kiosk session not found or revoked' });
      return;
    }

    req.familyId = session.family_id;
    next();
  } catch (_error) {
    res.status(403).json({ error: 'Invalid or expired kiosk token' });
  }
};
