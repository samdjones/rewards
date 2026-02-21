import express from 'express';
import { upload, uploadPhoto } from '../middleware/upload.js';
import { requireFamily, requireFamilyAdmin } from '../middleware/familyAuth.js';
import {
  uploadUserProfileImage,
  deleteUserProfileImage,
  uploadChildProfileImage,
  deleteChildProfileImage,
  uploadFamilyProfileImage,
  deleteFamilyProfileImage,
} from '../controllers/uploadController.js';
import {
  uploadFamilyPhoto,
  getFamilyPhotos,
  deleteFamilyPhoto,
} from '../controllers/photoController.js';

const router = express.Router();

// User profile image
router.post('/users/me/profile-image', upload.single('image'), uploadUserProfileImage);
router.delete('/users/me/profile-image', deleteUserProfileImage);

// Child profile image (requires family)
router.post('/children/:id/profile-image', requireFamily, upload.single('image'), uploadChildProfileImage);
router.delete('/children/:id/profile-image', requireFamily, deleteChildProfileImage);

// Family profile image (requires admin)
router.post('/families/current/profile-image', requireFamilyAdmin, upload.single('image'), uploadFamilyProfileImage);
router.delete('/families/current/profile-image', requireFamilyAdmin, deleteFamilyProfileImage);

// Family photos (requires admin)
router.post('/families/current/photos', requireFamilyAdmin, uploadPhoto.single('image'), uploadFamilyPhoto);
router.get('/families/current/photos', requireFamilyAdmin, getFamilyPhotos);
router.delete('/families/current/photos/:id', requireFamilyAdmin, deleteFamilyPhoto);

export default router;
