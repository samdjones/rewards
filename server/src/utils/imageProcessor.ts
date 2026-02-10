import sharp from 'sharp';

export const processImage = async (buffer: Buffer): Promise<string> => {
  const processed = await sharp(buffer)
    .resize(256, 256, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  const base64 = processed.toString('base64');
  return `data:image/webp;base64,${base64}`;
};
