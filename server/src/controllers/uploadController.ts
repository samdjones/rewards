import type { Request, Response } from 'express';
import type { Child } from '@rewards/shared';
import db from '../db/wrapper.js';
import { processImage } from '../utils/imageProcessor.js';

export const uploadUserProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const dataUrl = await processImage(req.file.buffer);

    db.prepare('UPDATE users SET profile_image = ? WHERE id = ?')
      .run(dataUrl, req.userId);

    res.json({ profile_image: dataUrl });
  } catch (error) {
    console.error('Upload user image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

export const deleteUserProfileImage = (req: Request, res: Response): void => {
  try {
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

    const dataUrl = await processImage(req.file.buffer);

    db.prepare('UPDATE children SET profile_image = ? WHERE id = ?')
      .run(dataUrl, id);

    res.json({ profile_image: dataUrl });
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

    db.prepare('UPDATE children SET profile_image = NULL WHERE id = ?')
      .run(id);

    res.json({ message: 'Profile image removed' });
  } catch (error) {
    console.error('Delete child image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};

export const uploadFamilyProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const dataUrl = await processImage(req.file.buffer);

    db.prepare('UPDATE families SET profile_image = ? WHERE id = ?')
      .run(dataUrl, req.familyId);

    res.json({ profile_image: dataUrl });
  } catch (error) {
    console.error('Upload family image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

export const deleteFamilyProfileImage = (req: Request, res: Response): void => {
  try {
    db.prepare('UPDATE families SET profile_image = NULL WHERE id = ?')
      .run(req.familyId);

    res.json({ message: 'Family image removed' });
  } catch (error) {
    console.error('Delete family image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
};
