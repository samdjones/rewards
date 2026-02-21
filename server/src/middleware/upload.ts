import multer from 'multer';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const PHOTO_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PHOTO_MAX_FILE_SIZE },
  fileFilter,
});
