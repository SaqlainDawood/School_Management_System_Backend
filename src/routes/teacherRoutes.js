import express from 'express';
import {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherClasses,
  getTeacherDashboard,
} from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, teacherValidation, idParam } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// ============================================
// SPECIFIC ROUTES (must come before /:id)
// ============================================

// Teacher dashboard (for logged-in teacher)
router.get('/dashboard', authorize('teacher'), getTeacherDashboard);

// Teacher classes (for logged-in teacher)
router.get('/classes', authorize('teacher'), getTeacherClasses);

// ============================================
// MAIN CRUD ROUTES
// ============================================
router
  .route('/')
  .get(authorize('admin', 'superadmin', 'coordinator'), getTeachers)
  .post(
    authorize('admin', 'superadmin'),
    validate(teacherValidation.create),
    createTeacher
  );

// ============================================
// PARAMETERIZED ROUTES (must come after specific)
// ============================================
router
  .route('/:id')
  .get(
    validate(idParam),
    authorize('admin', 'superadmin', 'coordinator', 'teacher'),
    getTeacher
  )
  .put(validate(idParam), authorize('admin', 'superadmin'), updateTeacher)
  .delete(validate(idParam), authorize('admin', 'superadmin'), deleteTeacher);

// Get teacher's classes by ID (for admin viewing)
router.get(
  '/:id/classes',
  validate(idParam),
  authorize('admin', 'superadmin', 'teacher'),
  getTeacherClasses
);

export default router;