import express from 'express';
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentAttendance,
  getStudentResults,
  getStudentFees,
  getStudentDashboard,
  getStudentProfile,
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, studentValidation, idParam } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// ============================================
// ⚠️ SPECIFIC ROUTES MUST COME FIRST (BEFORE /:id)
// ============================================

// Student profile (for logged-in student)
router.get('/profile', authorize('student'), getStudentProfile);

// Student dashboard (for logged-in student)
router.get('/dashboard', authorize('student'), getStudentDashboard);

// ============================================
// MAIN CRUD ROUTES
// ============================================
router
  .route('/')
  .get(authorize('admin', 'superadmin', 'coordinator'), getStudents)
  .post(
    authorize('admin', 'superadmin'),
    validate(studentValidation.create),
    createStudent
  );

// ============================================
// PARAMETERIZED ROUTES - MUST COME AFTER SPECIFIC ROUTES
// ============================================
router
  .route('/:id')
  .get(
    idParam,
    authorize('admin', 'superadmin', 'coordinator', 'teacher', 'student'),
    getStudent
  )
  .put(idParam, authorize('admin', 'superadmin', 'student'), updateStudent)
  .delete(idParam, authorize('admin', 'superadmin'), deleteStudent);

// ============================================
// STUDENT SUB-RESOURCES (ID-based)
// ============================================
router.get(
  '/:id/attendance',
  idParam,
  authorize('admin', 'superadmin', 'teacher', 'student'),
  getStudentAttendance
);
router.get(
  '/:id/results',
  idParam,
  authorize('admin', 'superadmin', 'teacher', 'student'),
  getStudentResults
);
router.get(
  '/:id/fees',
  idParam,
  authorize('admin', 'superadmin', 'student'),
  getStudentFees
);

export default router;