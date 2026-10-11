// routes/attendanceRoutes.js
import express from 'express';
import {
  markAttendance,
  getAttendance,
  updateAttendance,
  getClassAttendance,
  getStudentAttendance,
  getAttendanceReport,
  getMyAttendance,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// ============================================
// STUDENT ROUTES (must come before /:id)
// ============================================
router.get('/my-attendance', authorize('student'), getMyAttendance);

// ============================================
// MAIN ROUTES
// ============================================
router
  .route('/')
  .post(authorize('admin', 'superadmin', 'teacher'), markAttendance)
  .get(
    authorize('admin', 'superadmin', 'coordinator', 'teacher'),
    getAttendance
  );

router
  .route('/:id')
  .get(
    idParam,
    authorize('admin', 'superadmin', 'teacher', 'student'),
    getAttendance
  )
  .put(idParam, authorize('admin', 'superadmin', 'teacher'), updateAttendance);

router.get(
  '/student/:studentId',
  idParam,
  authorize('admin', 'superadmin', 'teacher', 'student'),
  getStudentAttendance
);

router.get(
  '/class/:classId',
  idParam,
  authorize('admin', 'superadmin', 'coordinator', 'teacher'),
  getClassAttendance
);

router.get(
  '/report',
  authorize('admin', 'superadmin', 'coordinator'),
  getAttendanceReport
);

export default router;