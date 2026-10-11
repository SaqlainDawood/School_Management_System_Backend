import express from 'express';
import {
  getAdminDashboard,
  getSchoolStats,
  manageUsers,
  manageClasses,
  getRecentActivities,
  getAllUsers,
  getSettings,
  updateSettings,
  getAdminProfile,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'superadmin'));

// Dashboard
router.get('/dashboard', getAdminDashboard);
router.get('/stats', getSchoolStats);
router.get('/activities', getRecentActivities);

// Users
router.get('/users', getAllUsers);
router.post('/users', manageUsers);

// Classes
router.post('/classes', manageClasses);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Profile
router.get('/profile', getAdminProfile);

export default router;