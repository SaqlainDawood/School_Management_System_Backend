import express from 'express';
import {
  getSuperAdminDashboard,
  getSchools,
  manageSchools,
  getUsers,
  manageUsers,
  manageRoles,
  getSystemAnalytics,
  manageSubscriptions,
  getActivityLogs,
} from '../controllers/superAdminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);
router.use(authorize('superadmin'));

// Dashboard
router.get('/dashboard', getSuperAdminDashboard);

// Analytics
router.get('/analytics', getSystemAnalytics);

// Activity Logs
router.get('/activity-logs', getActivityLogs);

// Schools
router.get('/schools', getSchools);
router.post('/schools', manageSchools);

// Users
router.get('/users', getUsers);
router.post('/users', manageUsers);

// Roles
router.post('/roles', manageRoles);

// Subscriptions
router.post('/subscriptions', manageSubscriptions);

export default router;