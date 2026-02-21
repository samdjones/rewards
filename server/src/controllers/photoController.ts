import type { Request, Response } from 'express';
import db from '../db/wrapper.js';
import { processPhotoImage } from '../utils/imageProcessor.js';

const MAX_PHOTOS_PER_FAMILY = 20;

interface CountRow {
  count: number;
}

interface PhotoRow {
  id: number;
  family_id: number;
  uploaded_by: number;
  image_data: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export const uploadFamilyPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const photoCount = db.prepare<CountRow>(
      'SELECT COUNT(*) as count FROM family_photos WHERE family_id = ?'
    ).get(req.familyId);

    if (photoCount && photoCount.count >= MAX_PHOTOS_PER_FAMILY) {
      res.status(400).json({ error: `Maximum ${MAX_PHOTOS_PER_FAMILY} photos allowed per family` });
      return;
    }

    const imageData = await processPhotoImage(req.file.buffer);
    const caption = (req.body.caption as string) || null;

    const result = db.prepare(
      'INSERT INTO family_photos (family_id, uploaded_by, image_data, caption, sort_order) VALUES (?, ?, ?, ?, ?)'
    ).run(req.familyId, req.userId, imageData, caption, photoCount ? photoCount.count : 0);

    const photo = db.prepare<PhotoRow>(
      'SELECT * FROM family_photos WHERE id = ?'
    ).get(result.lastInsertRowid);

    res.status(201).json({ photo });
  } catch (error) {
    console.error('Upload family photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getFamilyPhotos = (req: Request, res: Response): void => {
  try {
    const photos = db.prepare<PhotoRow>(
      'SELECT * FROM family_photos WHERE family_id = ? ORDER BY sort_order ASC, created_at ASC'
    ).all(req.familyId);

    res.json({ photos });
  } catch (error) {
    console.error('Get family photos error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteFamilyPhoto = (req: Request, res: Response): void => {
  try {
    const { id } = req.params;

    const photo = db.prepare<PhotoRow>(
      'SELECT * FROM family_photos WHERE id = ? AND family_id = ?'
    ).get(id, req.familyId);

    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    db.prepare('DELETE FROM family_photos WHERE id = ?').run(id);

    res.json({ message: 'Photo deleted' });
  } catch (error) {
    console.error('Delete family photo error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getKioskPhotos = (req: Request, res: Response): void => {
  try {
    const photos: { id: number; image_data: string; caption: string | null }[] = db.prepare<{ id: number; image_data: string; caption: string | null }>(
      'SELECT id, image_data, caption FROM family_photos WHERE family_id = ? ORDER BY sort_order ASC, created_at ASC'
    ).all(req.familyId);

    // Check if avatars should be included
    const family = db.prepare<{ slideshow_include_avatars: number }>(
      'SELECT slideshow_include_avatars FROM families WHERE id = ?'
    ).get(req.familyId);

    if (family && family.slideshow_include_avatars) {
      // Get user profile images from family members
      const userAvatars = db.prepare<{ user_id: number; name: string; profile_image: string }>(
        `SELECT u.id as user_id, u.name, u.profile_image
         FROM users u
         JOIN family_members fm ON fm.user_id = u.id
         WHERE fm.family_id = ? AND u.profile_image IS NOT NULL`
      ).all(req.familyId);

      for (const avatar of userAvatars) {
        photos.push({
          id: -avatar.user_id,
          image_data: avatar.profile_image,
          caption: avatar.name,
        });
      }

      // Get children profile images
      const childAvatars = db.prepare<{ id: number; name: string; profile_image: string }>(
        `SELECT id, name, profile_image
         FROM children
         WHERE family_id = ? AND profile_image IS NOT NULL`
      ).all(req.familyId);

      for (const avatar of childAvatars) {
        photos.push({
          id: -(1000 + avatar.id),
          image_data: avatar.profile_image,
          caption: avatar.name,
        });
      }
    }

    res.json({ photos });
  } catch (error) {
    console.error('Get kiosk photos error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
