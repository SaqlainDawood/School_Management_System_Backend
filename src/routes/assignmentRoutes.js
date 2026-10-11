import express from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeAssignment,
  getStudentAssignments,
  getMyAssignments,
} from '../controllers/assignmentController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, idParam } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

// ============================================
// STUDENT ROUTES (must come before /:id)
// ============================================
router.get('/my-assignments', authorize('student'), getMyAssignments);

router.get(
  '/student/:studentId',
  validate(idParam),
  authorize('admin', 'superadmin', 'teacher', 'student'),
  getStudentAssignments
);

// ============================================
// MAIN CRUD ROUTES
// ============================================
router
  .route('/')
  .post(authorize('admin', 'superadmin', 'teacher'), createAssignment)
  .get(
    authorize('admin', 'superadmin', 'teacher', 'student'),
    getAssignments
  );

router
  .route('/:id')
  .get(
    validate(idParam),
    authorize('admin', 'superadmin', 'teacher', 'student'),
    getAssignment
  )
  .put(
    validate(idParam),
    authorize('admin', 'superadmin', 'teacher'),
    updateAssignment
  )
  .delete(
    validate(idParam),
    authorize('admin', 'superadmin', 'teacher'),
    deleteAssignment
  );

// Student submission routes
router.post(
  '/:id/submit',
  validate(idParam),
  authorize('student'),
  submitAssignment
);

router.put(
  '/:id/grade',
  validate(idParam),
  authorize('admin', 'superadmin', 'teacher'),
  gradeAssignment
);

export default router;