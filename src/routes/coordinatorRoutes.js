import express from 'express';
import {
  getCoordinatorDashboard,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  verifyFee,
  reviewResult,
  manageNotices,
  generateReports,
  getAttendanceOverview,
} from '../controllers/coordinatorController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);
router.use(authorize('coordinator', 'admin', 'superadmin'));

// Dashboard
router.get('/dashboard', getCoordinatorDashboard);

// Departments
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', validate(idParam), updateDepartment);
router.delete('/departments/:id', validate(idParam), deleteDepartment);

// Fees
router.put('/verify-fee/:feeId', validate(idParam), verifyFee);

// Results
router.put('/review-result/:resultId', validate(idParam), reviewResult);

// Notices
router.post('/notices', manageNotices);

// Reports
router.get('/reports', generateReports);

// Attendance
router.get('/attendance', getAttendanceOverview);

export default router;