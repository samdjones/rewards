import express from 'express';
import { upload } from '../middleware/upload.js';
import { requireFamily } from '../middleware/familyAuth.js';
import {
  uploadUserProfileImage,
  deleteUserProfileImage,
  uploadChildProfileImage,
  deleteChildProfileImage,
} from '../controllers/uploadController.js';

const router = express.Router();

// User profile image
router.post('/users/me/profile-image', upload.single('image'), uploadUserProfileImage);
router.delete('/users/me/profile-image', deleteUserProfileImage);

// Child profile image (requires family)
router.post('/children/:id/profile-image', requireFamily, upload.single('image'), uploadChildProfileImage);
router.delete('/children/:id/profile-image', requireFamily, deleteChildProfileImage);

export default router;
