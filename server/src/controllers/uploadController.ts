import type { Request, Response } from 'express';
import type { Child } from '@rewards/shared';
import db from '../db/wrapper.js';
import { processAndSaveImage, deleteImage } from '../utils/imageProcessor.js';

interface ProfileImageRow {
  profile_image: string | null;
}

export const uploadUserProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    // Get old image to delete
    const existing = db
      .prepare<ProfileImageRow>('SELECT profile_image FROM users WHERE id = ?')
      .get(req.userId);

    const filename = await processAndSaveImage(req.file.buffer, 'user', req.userId!);

    db.prepare('UPDATE users SET profile_image = ? WHERE id = ?')
      .run(filename, req.userId);

    // Delete old image
    if (existing?.profile_image) {
      deleteImage(existing.profile_image);
    }

    res.json({ profile_image: filename });
  } catch (error) {
    console.error('Upload user image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

export const deleteUserProfileImage = (req: Request, res: Response): void => {
  try {
    const existing = db
      .prepare<ProfileImageRow>('SELECT profile_image FROM users WHERE id = ?')
      .get(req.userId);

    if (existing?.profile_image) {
      deleteImage(existing.profile_image);
    }

    db.prepare('UPDATE users SET profile_image = NULL WHERE id = ?')
      .run(req.userId);

    res.json({ message: 'Profile image removed' });
  } catch (error) {
    console.error('Delete user image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

export const uploadChildProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    const filename = await processAndSaveImage(req.file.buffer, 'child', child.id);

    db.prepare('UPDATE children SET profile_image = ? WHERE id = ?')
      .run(filename, id);

    // Delete old image
    if (child.profile_image) {
      deleteImage(child.profile_image);
    }

    res.json({ profile_image: filename });
  } catch (error) {
    console.error('Upload child image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

export const deleteChildProfileImage = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const child = db
      .prepare<Child>('SELECT * FROM children WHERE id = ? AND family_id = ?')
      .get(id, req.familyId);

    if (!child) {
      res.status(404).json({ error: 'Child not found' });
      return;
    }

    if (child.profile_image) {
      deleteImage(child.profile_image);
    }

    db.prepare('UPDATE children SET profile_image = NULL WHERE id = ?')
      .run(id);

    res.json({ message: 'Profile image removed' });
  } catch (error) {
    console.error('Delete child image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};
