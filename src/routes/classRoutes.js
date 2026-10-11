import express from 'express';
import {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents,
  getClassSubjects,
  assignTeacher,
  assignSubject,
  archiveClass,
  restoreClass,
  removeStudentFromClass,
  removeAllStudentsFromClass,
  removeSubjectFromClass,
  removeAllSubjectsFromClass,
  cleanDeleteClass,
  forceDeleteClass,
} from '../controllers/classController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, classValidation, idParam } from '../middleware/validation.js';

const router = express.Router();

router.use(protect);

// ============================================
// MAIN CLASS ROUTES
// ============================================
router
  .route('/')
  .get(authorize('admin', 'superadmin', 'coordinator', 'teacher'), getClasses)
  .post(
    authorize('admin', 'superadmin'),
    validate(classValidation.create),
    createClass
  );

router
  .route('/:id')
  .get(
    idParam,
    authorize('admin', 'superadmin', 'coordinator', 'teacher', 'student'),
    getClass
  )
  .put(idParam, authorize('admin', 'superadmin'), updateClass)
  .delete(idParam, authorize('admin', 'superadmin'), deleteClass);

// ============================================
// STUDENT ROUTES
// ============================================
router.get(
  '/:id/students',
  idParam,
  authorize('admin', 'superadmin', 'teacher'),
  getClassStudents
);

router.delete(
  '/:classId/students/:studentId',
  authorize('admin', 'superadmin'),
  removeStudentFromClass
);

router.delete(
  '/:classId/students',
  authorize('admin', 'superadmin'),
  removeAllStudentsFromClass
);

// ============================================
// SUBJECT ROUTES
// ============================================
router.get(
  '/:id/subjects',
  idParam,
  authorize('admin', 'superadmin', 'coordinator', 'teacher'),
  getClassSubjects
);

router.delete(
  '/:classId/subjects/:subjectId',
  authorize('admin', 'superadmin'),
  removeSubjectFromClass
);

router.delete(
  '/:classId/subjects',
  authorize('admin', 'superadmin'),
  removeAllSubjectsFromClass
);

// ============================================
// ASSIGNMENT ROUTES
// ============================================
router.put(
  '/:id/assign-teacher',
  idParam,
  authorize('admin', 'superadmin'),
  assignTeacher
);

router.put(
  '/:id/assign-subject',
  idParam,
  authorize('admin', 'superadmin'),
  assignSubject
);

// ============================================
// ARCHIVE / RESTORE ROUTES
// ============================================
router.put(
  '/:id/archive',
  idParam,
  authorize('admin', 'superadmin'),
  archiveClass
);

router.put(
  '/:id/restore',
  idParam,
  authorize('admin', 'superadmin'),
  restoreClass
);

// ============================================
// DELETE OPTIONS
// ============================================
router.delete(
  '/:id/clean-delete',
  idParam,
  authorize('admin', 'superadmin'),
  cleanDeleteClass
);

router.delete(
  '/:id/force-delete',
  idParam,
  authorize('admin', 'superadmin'),
  forceDeleteClass
);

export default router;