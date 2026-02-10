import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import type { User, SafeUser, FamilyRole } from '@rewards/shared';
import db from '../db/wrapper.js';

interface FamilyMembershipRow {
  family_id: number;
  role: FamilyRole;
  family_name: string;
  family_profile_image: string | null;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const existingUser = db
      .prepare<User>('SELECT * FROM users WHERE email = ?')
      .get(email);
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = db
      .prepare(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
      )
      .run(email, passwordHash, name);

    const token = jwt.sign(
      { userId: result.lastInsertRowid },
      process.env.JWT_SECRET!,
      {
        expiresIn: '7d',
      }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: result.lastInsertRowid,
        email,
        name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = db.prepare<User>('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};

export const me = (req: Request, res: Response): void => {
  try {
    const user = db
      .prepare<SafeUser>('SELECT id, email, name, profile_image FROM users WHERE id = ?')
      .get(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get family info if user belongs to a family
    const membership = db
      .prepare<FamilyMembershipRow>(
        `
      SELECT fm.family_id, fm.role, f.name as family_name, f.profile_image as family_profile_image
      FROM family_members fm
      JOIN families f ON fm.family_id = f.id
      WHERE fm.user_id = ?
    `
      )
      .get(req.userId);

    const response = {
      user: {
        ...user,
        family: membership
          ? {
              id: membership.family_id,
              name: membership.family_name,
              role: membership.role,
              profile_image: membership.family_profile_image,
            }
          : null,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
