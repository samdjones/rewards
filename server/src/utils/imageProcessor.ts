import sharp from 'sharp';
import path from 'path';
import { existsSync, unlinkSync } from 'fs';
import { UPLOADS_DIR } from '../middleware/upload.js';

export const processAndSaveImage = async (
  buffer: Buffer,
  prefix: string,
  id: number
): Promise<string> => {
  const filename = `${prefix}_${id}_${Date.now()}.webp`;
  const filepath = path.join(UPLOADS_DIR, filename);

  await sharp(buffer)
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(filepath);

  return filename;
};

export const deleteImage = (filename: string): void => {
  const filepath = path.join(UPLOADS_DIR, filename);
  if (existsSync(filepath)) {
    unlinkSync(filepath);
  }
};
