import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updateAvatar,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getStudentProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate, userValidation } from '../middleware/validation.js';
import { uploadSingle } from '../config/multer.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================
router.post('/register', validate(userValidation.register), register);
router.post('/login', validate(userValidation.login), login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/refresh-token', refreshToken);

// ============================================
// PROTECTED ROUTES
// ============================================
router.get('/me', protect, getMe);
router.get('/student-profile', protect, getStudentProfile);
router.put(
  '/update-profile',
  protect,
  validate(userValidation.updateProfile),
  updateProfile
);
router.put('/update-avatar', protect, uploadSingle('avatar'), updateAvatar);
router.put(
  '/change-password',
  protect,
  validate(userValidation.changePassword),
  changePassword
);
router.post('/logout', protect, logout);

export default router;